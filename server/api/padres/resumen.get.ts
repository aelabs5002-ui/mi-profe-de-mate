import { prisma } from '~/server/utils/prisma'
import { requireAlumnoActivo } from '~/server/utils/auth'
import { ERROR_TAG_LABELS, type ErrorTag } from '~/server/utils/errorTagger'
import { todayKey } from '~/server/utils/mmcg'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const explicitId = query.alumnoId ? String(query.alumnoId) : undefined
  const { padre, alumno } = await requireAlumnoActivo(event, explicitId)

  const [competencias, erroresActivos, misionesSemana, documentos, sesionesJuego] = await Promise.all([
    prisma.competenciaCCA.findMany({ where: { alumnoId: alumno.id }, orderBy: { nivelDominio: 'desc' } }),
    prisma.errorFrecuenteCCA.findMany({
      where: { alumnoId: alumno.id, superado: false },
      orderBy: { conteo: 'desc' },
      take: 5
    }),
    prisma.mision.findMany({
      where: {
        alumnoId: alumno.id,
        creadoEn: { gte: new Date(Date.now() - 86400000 * 7) }
      },
      orderBy: { creadoEn: 'desc' }
    }),
    prisma.documentoBiblioteca.findMany({
      where: { alumnoId: alumno.id },
      orderBy: [{ prioridad: 'asc' }, { creadoEn: 'desc' }]
    }),
    prisma.sesionJuego.findMany({
      where: {
        alumnoId: alumno.id,
        creadoEn: { gte: new Date(Date.now() - 86400000 * 7) }
      },
      orderBy: { creadoEn: 'desc' }
    })
  ])

  const hoy = todayKey()
  const minutosHoy = alumno.fechaUsoHoy === hoy ? alumno.minutosUsadosHoy : 0
  const misionesCompletadas = misionesSemana.filter((m) => m.estado === 'completada').length

  // Recomendaciones pedagógicas accionables para los padres
  const recomendaciones: string[] = []
  if (erroresActivos.length > 0) {
    const top = erroresActivos[0]
    const label = ERROR_TAG_LABELS[top.errorTag as ErrorTag] || top.errorTag
    recomendaciones.push(
      `Refuerzo sugerido: ${alumno.nombre} presenta tropiezos frecuentes en "${label}" dentro de ${top.tema}. Celebra sus intentos y deja que use 10 min del Motor F o Misión de Refuerzo.`
    )
  } else {
    recomendaciones.push(
      `¡Excelente semana! ${alumno.nombre} no registra errores recurrentes bloqueantes. Puedes subir guías del próximo tema escolar en la Biblioteca del Tutor.`
    )
  }

  const casiCertificada = competencias.find((c) => !c.certificada && c.sesionesExitosasSinAyuda >= 2)
  if (casiCertificada) {
    recomendaciones.push(
      `¡A 1 sesión de certificar! "${casiCertificada.tema}" ya tiene ${casiCertificada.sesionesExitosasSinAyuda}/3 sesiones SECC sin ayuda.`
    )
  }

  return {
    padre: { id: padre.id, nombre: padre.nombre, pais: padre.pais, correo: padre.correo },
    alumnos: padre.alumnos,
    alumno: {
      ...alumno,
      minutosHoy,
      diasPermitidos: JSON.parse(alumno.diasPermitidosJson || '[0,1,2,3,4,5,6]')
    },
    metricas: {
      misionesCompletadasSemana: misionesCompletadas,
      juegosSemana: sesionesJuego.length,
      competenciasCertificadas: competencias.filter((c) => c.certificada).length,
      minutosHoy,
      limiteMinutosDiario: alumno.limiteMinutosDiario
    },
    competencias,
    erroresActivos: erroresActivos.map((e) => ({
      ...e,
      etiquetaLegible: ERROR_TAG_LABELS[e.errorTag as ErrorTag] || e.errorTag
    })),
    documentos: documentos.map((d) => ({
      ...d,
      temas: JSON.parse(d.temasJson || '[]')
    })),
    recomendaciones
  }
})
