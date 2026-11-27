import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAlumnoActivo } from '~/server/utils/auth'
import { evaluateMathAnswer } from '~/server/utils/curriculum'
import { generateSocraticFeedback } from '~/server/utils/ai'
import { actualizarCcaYSecc } from '~/server/utils/mmcg'

const schema = z.object({
  pasoId: z.string().min(1),
  respuesta: z.string().trim().min(1, 'Escribe tu respuesta antes de comprobar.')
})

export default defineEventHandler(async (event) => {
  const { padre, alumno } = await requireAlumnoActivo(event)
  const misionId = getRouterParam(event, 'id')
  if (!misionId) throw createError({ statusCode: 400, statusMessage: 'Misión no especificada.' })

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message || 'Respuesta inválida.' })
  }

  const mision = await prisma.mision.findFirst({
    where: { id: misionId, alumnoId: alumno.id },
    include: { pasos: { orderBy: { orden: 'asc' } } }
  })
  if (!mision) throw createError({ statusCode: 404, statusMessage: 'Misión no encontrada.' })

  const paso = mision.pasos.find((p) => p.id === parsed.data.pasoId)
  if (!paso) throw createError({ statusCode: 404, statusMessage: 'Ejercicio no encontrado.' })

  const esCorrecta = evaluateMathAnswer(parsed.data.respuesta, paso.respuestaEsperada)
  const intentoNumero = paso.intentosCount + 1

  let pistas: string[] = []
  try {
    pistas = JSON.parse(paso.pistasJson || '[]')
  } catch {}

  const docsActivos = await prisma.documentoBiblioteca.findMany({
    where: { alumnoId: alumno.id, activo: true },
    orderBy: { prioridad: 'asc' },
    take: 2
  })
  const bibliotecaResumen = docsActivos.map((d) => `${d.titulo}: ${d.resumenExtraido}`).join(' | ')

  const ai = await generateSocraticFeedback({
    alumnoNombre: alumno.nombre,
    grado: alumno.grado,
    pais: padre.pais,
    tema: paso.tema,
    enunciado: paso.enunciado,
    respuestaEsperada: paso.respuestaEsperada,
    respuestaAlumno: parsed.data.respuesta,
    esCorrecta,
    intentoNumero,
    pistasDisponibles: pistas,
    pistasUsadas: paso.pistasUsadas,
    instruccionesPadre: alumno.instruccionesPadre,
    bibliotecaResumen
  })

  await prisma.intento.create({
    data: {
      pasoId: paso.id,
      alumnoId: alumno.id,
      respuesta: parsed.data.respuesta,
      esCorrecta,
      errorTag: ai.evento.errorTag,
      feedbackIa: ai.mensaje,
      turnType: ai.evento.turnType,
      moodDetectado: ai.evento.moodGuess
    }
  })

  await prisma.pasoMision.update({
    where: { id: paso.id },
    data: {
      intentosCount: intentoNumero,
      estado: esCorrecta ? 'completado' : paso.estado
    }
  })

  // Registrar error frecuente en CCA si falló
  if (!esCorrecta && ai.evento.errorTag) {
    await prisma.errorFrecuenteCCA.upsert({
      where: {
        alumnoId_tema_errorTag: {
          alumnoId: alumno.id,
          tema: paso.tema,
          errorTag: ai.evento.errorTag
        }
      },
      update: {
        conteo: { increment: 1 },
        superado: false,
        ultimoEvento: new Date()
      },
      create: {
        alumnoId: alumno.id,
        tema: paso.tema,
        errorTag: ai.evento.errorTag,
        conteo: 1,
        superado: false
      }
    })
  }

  // Verificar si toda la misión se completó
  let resumenFinal: any = null
  if (esCorrecta) {
    const pasosActualizados = await prisma.pasoMision.findMany({
      where: { misionId: mision.id },
      include: { intentos: { select: { esCorrecta: true } } }
    })
    const pendientes = pasosActualizados.filter((p) => p.estado !== 'completado')
    if (pendientes.length === 0) {
      const totalPasos = pasosActualizados.length
      const resueltosCorrectamente = pasosActualizados.filter((p) => p.intentos.some((i) => i.esCorrecta)).length
      const aciertosPrimerIntento = pasosActualizados.filter(
        (p) => p.intentosCount === 1 && p.intentos.some((i) => i.esCorrecta)
      ).length
      const pasosConAyudaGuiada = totalPasos - resueltosCorrectamente
      const totalPistas = pasosActualizados.reduce((acc, p) => acc + p.pistasUsadas, 0) + pasosConAyudaGuiada
      const duracionSeg = Math.min(900, Math.max(60, Math.round((Date.now() - mision.creadoEn.getTime()) / 1000)))

      const aciertosEfectivos =
        resueltosCorrectamente === totalPasos
          ? Math.max(aciertosPrimerIntento, Math.round(totalPasos * 0.75))
          : resueltosCorrectamente

      const ccaResult = await actualizarCcaYSecc({
        alumnoId: alumno.id,
        tema: mision.tema,
        motorId: mision.motorId,
        dificultad: mision.dificultad,
        aciertos: aciertosEfectivos,
        total: totalPasos,
        pistasUsadas: totalPistas,
        duracionSeg
      })

      await prisma.mision.update({
        where: { id: mision.id },
        data: {
          estado: 'completada',
          xpGanado: ccaResult?.xpGanado || 50,
          precisionPct: ccaResult?.precisionPct || 85,
          pistasUsadas: totalPistas,
          duracionSeg,
          completadaEn: new Date()
        }
      })

      resumenFinal = {
        completada: true,
        xpGanado: ccaResult?.xpGanado || 50,
        precisionPct: ccaResult?.precisionPct || 85,
        nuevaRacha: ccaResult?.nuevaRacha || 1,
        recienCertificada: ccaResult?.recienCertificada || false,
        competenciaTema: ccaResult?.competencia?.tema || mision.tema
      }
    }
  }

  return {
    esCorrecta,
    intentosCount: intentoNumero,
    feedback: ai.mensaje,
    evento: ai.evento,
    usedGemini: ai.usedGemini,
    resumenFinal
  }
})
