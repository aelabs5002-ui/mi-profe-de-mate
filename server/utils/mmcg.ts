import { prisma } from './prisma'
import { BANCO_EJERCICIOS, getCompetenciaForTopic } from './curriculum'
import { generateAdaptiveExercisesWithGemini } from './ai'

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function calcLevel(xp: number): number {
  return Math.max(1, Math.floor(xp / 100) + 1)
}

/**
 * Verifica si los controles parentales permiten practicar hoy.
 */
export function checkParentalAccess(alumno: {
  limiteMinutosDiario: number
  minutosUsadosHoy: number
  fechaUsoHoy: string | null
  diasPermitidosJson: string
}) {
  const hoy = todayKey()
  const dayOfWeek = new Date().getDay()
  let allowedDays: number[] = [0, 1, 2, 3, 4, 5, 6]
  try {
    const parsed = JSON.parse(alumno.diasPermitidosJson)
    if (Array.isArray(parsed)) allowedDays = parsed
  } catch {}

  if (!allowedDays.includes(dayOfWeek)) {
    return {
      permitido: false,
      motivo: 'Hoy está configurado como día de descanso en el Portal Padres. ¡Disfruta tu día libre!'
    }
  }

  const minutosHoy = alumno.fechaUsoHoy === hoy ? alumno.minutosUsadosHoy : 0
  if (alumno.limiteMinutosDiario > 0 && minutosHoy >= alumno.limiteMinutosDiario) {
    return {
      permitido: false,
      motivo: `Ya completaste tu meta diaria de ${alumno.limiteMinutosDiario} minutos. ¡Excelente disciplina, volvemos mañana!`
    }
  }

  return {
    permitido: true,
    minutosRestantes: Math.max(0, alumno.limiteMinutosDiario - minutosHoy)
  }
}

/**
 * Motor de Misiones Cognitivas Generativas (MMCG):
 * Prioridad: 1) Tema explícito o Biblioteca del Padre (PARENT_LIBRARY_FIRST),
 * 2) Errores frecuentes activos en CCA (Refuerzo antes de avance),
 * 3) Progresión curricular adaptativa.
 */
export async function crearMisionAdaptativa(params: {
  alumnoId: string
  temaForzado?: string
  origen?: 'practica_ia' | 'refuerzo_cca' | 'tarea'
  tareaSubidaId?: string
  ejerciciosPersonalizados?: Array<{
    enunciado: string
    respuestaEsperada: string
    pistas: string[]
    tema: string
  }>
  tituloPersonalizado?: string
  descripcionPersonalizada?: string
}) {
  const alumno = await prisma.alumno.findUnique({
    where: { id: params.alumnoId },
    include: {
      padre: true,
      erroresFrecuentes: { where: { superado: false }, orderBy: { conteo: 'desc' }, take: 3 },
      competencias: true,
      documentosBiblioteca: { where: { activo: true }, orderBy: { prioridad: 'asc' }, take: 3 }
    }
  })

  if (!alumno) {
    throw createError({ statusCode: 404, statusMessage: 'Alumno no encontrado.' })
  }

  const fechaClave = todayKey()

  // Si viene de una tarea subida con ejercicios extraídos por Gemini Vision
  if (params.ejerciciosPersonalizados && params.ejerciciosPersonalizados.length > 0) {
    const tema = params.temaForzado || params.ejerciciosPersonalizados[0].tema || 'Tarea Escolar'
    const comp = getCompetenciaForTopic(tema)

    return await prisma.mision.create({
      data: {
        alumnoId: alumno.id,
        tareaSubidaId: params.tareaSubidaId || null,
        fechaClave,
        origen: 'tarea',
        motorId: comp.motorRecomendado,
        titulo: params.tituloPersonalizado || `Misión desde tu Tarea: ${tema}`,
        descripcion: params.descripcionPersonalizada || 'Resolveremos tu tarea paso a paso con guía socrática.',
        tema,
        dificultad: 2,
        estado: 'en_progreso',
        contextoJson: JSON.stringify({ fuente: 'tarea_vision', bibliotecaActiva: alumno.documentosBiblioteca.length }),
        pasos: {
          create: params.ejerciciosPersonalizados.map((ej, idx) => ({
            orden: idx + 1,
            tema: ej.tema || tema,
            enunciado: ej.enunciado,
            respuestaEsperada: ej.respuestaEsperada,
            pistasJson: JSON.stringify(ej.pistas || []),
            explicacionBase: ej.pistas?.[ej.pistas.length - 1] || ''
          }))
        }
      },
      include: { pasos: { orderBy: { orden: 'asc' } } }
    })
  }

  // Decidir tema y origen según Leyes del MMCG
  let temaSeleccionado = params.temaForzado || ''
  let origen: 'practica_ia' | 'refuerzo_cca' = params.origen === 'refuerzo_cca' ? 'refuerzo_cca' : 'practica_ia'
  let razonMmcg = 'Práctica adaptativa según tu nivel actual'

  if (!temaSeleccionado && alumno.erroresFrecuentes.length > 0) {
    temaSeleccionado = alumno.erroresFrecuentes[0].tema
    origen = 'refuerzo_cca'
    razonMmcg = `Refuerzo prioritario CCA (foco en ${alumno.erroresFrecuentes[0].errorTag.replace('_', ' ')})`
  }

  if (!temaSeleccionado && alumno.documentosBiblioteca.length > 0) {
    try {
      const temasDoc = JSON.parse(alumno.documentosBiblioteca[0].temasJson)
      if (Array.isArray(temasDoc) && temasDoc[0]) {
        temaSeleccionado = getCompetenciaForTopic(String(temasDoc[0])).tema
        razonMmcg = `Prioridad Biblioteca Padres: ${alumno.documentosBiblioteca[0].titulo}`
      }
    } catch {}
  }

  if (!temaSeleccionado) {
    temaSeleccionado = 'Ecuaciones Lineales'
  }

  const compMeta = getCompetenciaForTopic(temaSeleccionado)
  const compActual = alumno.competencias.find((c) => c.codigo === compMeta.codigo)

  // Dificultad adaptativa basada en dominio CCA
  let dificultad = 2
  if (compActual) {
    if (compActual.nivelDominio >= 85) dificultad = 3
    else if (compActual.nivelDominio < 50) dificultad = 1
  }

  // Evitar repetir ejercicios recientes del alumno
  const pasosRecientes = await prisma.pasoMision.findMany({
    where: { mision: { alumnoId: alumno.id } },
    orderBy: { id: 'desc' },
    take: 10,
    select: { enunciado: true }
  })
  const ejerciciosEvitar = pasosRecientes.map((p) => p.enunciado)

  const bibliotecaResumen = alumno.documentosBiblioteca
    .map((d) => `${d.titulo}: ${d.resumenExtraido}`)
    .join(' | ')

  // Intentar generar ejercicios adaptados a la edad/grado/país con Gemini
  const generadosIa = await generateAdaptiveExercisesWithGemini({
    grado: alumno.grado,
    pais: alumno.padre?.pais || 'Internacional',
    tema: compMeta.tema,
    dificultad,
    cantidad: 4,
    bibliotecaResumen: bibliotecaResumen || undefined,
    instruccionesPadre: alumno.instruccionesPadre || undefined,
    erroresRecientes: alumno.erroresFrecuentes.map((e) => `${e.tema} (${e.errorTag})`),
    ejerciciosEvitar
  })

  let pasosData: Array<{
    orden: number
    tema: string
    enunciado: string
    respuestaEsperada: string
    pistasJson: string
    explicacionBase: string
  }>
  let fuenteEjercicios = 'banco_local'

  if (generadosIa && generadosIa.length >= 3) {
    fuenteEjercicios = 'gemini_adaptativo'
    pasosData = generadosIa.map((ej, idx) => ({
      orden: idx + 1,
      tema: ej.tema || compMeta.tema,
      enunciado: ej.enunciado,
      respuestaEsperada: ej.respuestaEsperada,
      pistasJson: JSON.stringify(ej.pistas),
      explicacionBase: ej.explicacionBase
    }))
  } else {
    const delTema = BANCO_EJERCICIOS.filter((e) => e.tema === compMeta.tema)
    const pool = delTema.length >= 4 ? delTema : BANCO_EJERCICIOS
    const noRepetidos = pool.filter((e) => !ejerciciosEvitar.includes(e.enunciado))
    const candidatos = noRepetidos.length >= 4 ? noRepetidos : pool
    const seleccionados = candidatos
      .slice()
      .sort((a, b) => Math.abs(a.dificultad - dificultad) - Math.abs(b.dificultad - dificultad) + (Math.random() - 0.5) * 0.6)
      .slice(0, 4)

    pasosData = seleccionados.map((ej, idx) => ({
      orden: idx + 1,
      tema: ej.tema,
      enunciado: ej.enunciado,
      respuestaEsperada: ej.respuestaEsperada,
      pistasJson: JSON.stringify(ej.pistas),
      explicacionBase: ej.explicacionBase
    }))
  }

  return await prisma.mision.create({
    data: {
      alumnoId: alumno.id,
      fechaClave,
      origen,
      motorId: compMeta.motorRecomendado,
      titulo:
        origen === 'refuerzo_cca'
          ? `Refuerzo Inteligente: ${compMeta.tema}`
          : `Misión del Día: ${compMeta.tema}`,
      descripcion: razonMmcg,
      tema: compMeta.tema,
      dificultad,
      estado: 'en_progreso',
      contextoJson: JSON.stringify({
        razonMmcg,
        fuenteEjercicios,
        grado: alumno.grado,
        bibliotecaPrioritaria: alumno.documentosBiblioteca.map((d) => d.titulo)
      }),
      pasos: {
        create: pasosData
      }
    },
    include: { pasos: { orderBy: { orden: 'asc' } } }
  })
}

/**
 * Actualiza la Carta Cognitiva del Alumno (CCA), XP, racha y reglas de certificación SECC
 * al completar una misión o una sesión de Motor de Juego.
 */
export async function actualizarCcaYSecc(params: {
  alumnoId: string
  tema: string
  motorId: string
  dificultad: number
  aciertos: number
  total: number
  pistasUsadas: number
  duracionSeg: number
}) {
  const alumno = await prisma.alumno.findUnique({ where: { id: params.alumnoId } })
  if (!alumno) return null

  const compMeta = getCompetenciaForTopic(params.tema)
  const precisionPct = params.total > 0 ? Math.round((params.aciertos / params.total) * 100) : 0
  const xpGanado = Math.max(20, params.aciertos * 15 + (precisionPct >= 90 ? 25 : 0))

  // Calcular racha diaria
  const hoy = todayKey()
  const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const ultimaFecha = alumno.ultimaActividad ? alumno.ultimaActividad.toISOString().slice(0, 10) : null

  let nuevaRacha = alumno.rachaActual
  if (ultimaFecha === hoy) {
    nuevaRacha = Math.max(1, alumno.rachaActual)
  } else if (ultimaFecha === ayer) {
    nuevaRacha = alumno.rachaActual + 1
  } else {
    nuevaRacha = 1
  }

  // Tope razonable de 15 min por sesión para que pausar la pestaña no bloquee el límite diario
  const duracionAcotada = Math.min(900, Math.max(30, params.duracionSeg))
  const minutosSumados = Math.max(1, Math.round(duracionAcotada / 60))
  const minutosHoy = alumno.fechaUsoHoy === hoy ? alumno.minutosUsadosHoy + minutosSumados : minutosSumados
  const nuevoXp = alumno.xp + xpGanado

  await prisma.alumno.update({
    where: { id: alumno.id },
    data: {
      xp: nuevoXp,
      nivel: calcLevel(nuevoXp),
      rachaActual: nuevaRacha,
      mejorRacha: Math.max(alumno.mejorRacha, nuevaRacha),
      ultimaActividad: new Date(),
      minutosUsadosHoy: minutosHoy,
      fechaUsoHoy: hoy
    }
  })

  // Actualizar Competencia CCA + Regla SECC (90%+ aciertos, dificultad >= 2, sin pistas, 3 sesiones)
  const existing = await prisma.competenciaCCA.findUnique({
    where: { alumnoId_codigo: { alumnoId: alumno.id, codigo: compMeta.codigo } }
  })

  const cumpleSesionSecc = precisionPct >= 90 && params.dificultad >= 2 && params.pistasUsadas === 0
  const motoresPrevios: string[] = existing ? JSON.parse(existing.motoresUsadosJson || '[]') : []
  if (!motoresPrevios.includes(params.motorId)) motoresPrevios.push(params.motorId)

  const totalEj = (existing?.totalEjercicios || 0) + params.total
  const totalOk = (existing?.correctos || 0) + params.aciertos
  const nuevoDominio = Math.min(100, Math.round((totalOk / Math.max(1, totalEj)) * 100))
  const sesionesSecc = (existing?.sesionesExitosasSinAyuda || 0) + (cumpleSesionSecc ? 1 : 0)
  const certificada = existing?.certificada || sesionesSecc >= 3

  const competencia = await prisma.competenciaCCA.upsert({
    where: { alumnoId_codigo: { alumnoId: alumno.id, codigo: compMeta.codigo } },
    update: {
      nivelDominio: nuevoDominio,
      totalEjercicios: totalEj,
      correctos: totalOk,
      sesionesExitosasSinAyuda: sesionesSecc,
      certificada,
      certificadaEn: certificada ? existing?.certificadaEn || new Date() : null,
      motoresUsadosJson: JSON.stringify(motoresPrevios)
    },
    create: {
      alumnoId: alumno.id,
      codigo: compMeta.codigo,
      tema: compMeta.tema,
      grado: alumno.grado,
      nivelDominio: nuevoDominio,
      totalEjercicios: totalEj,
      correctos: totalOk,
      sesionesExitosasSinAyuda: sesionesSecc,
      certificada,
      certificadaEn: certificada ? new Date() : null,
      motoresUsadosJson: JSON.stringify(motoresPrevios)
    }
  })

  // Si alcanzó >= 90% en este tema, marcar errores frecuentes de este tema como superados
  if (precisionPct >= 90) {
    await prisma.errorFrecuenteCCA.updateMany({
      where: { alumnoId: alumno.id, tema: compMeta.tema, superado: false },
      data: { superado: true }
    })
  }

  return {
    xpGanado,
    precisionPct,
    nuevaRacha,
    cumpleSesionSecc,
    recienCertificada: !existing?.certificada && certificada,
    competencia
  }
}
