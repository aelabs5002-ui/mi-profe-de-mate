import { prisma } from '~/server/utils/prisma'
import { requireAlumnoVinculado } from '~/server/utils/profesorAuth'
import { ERROR_TAG_LABELS, type ErrorTag } from '~/server/utils/errorTagger'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Estudiante no especificado.' })

  const { profesor, vinculo, alumno } = await requireAlumnoVinculado(event, id)

  const [competencias, errores, misiones, sesionesJuego, documentos] = await Promise.all([
    prisma.competenciaCCA.findMany({ where: { alumnoId: alumno.id }, orderBy: { nivelDominio: 'desc' } }),
    prisma.errorFrecuenteCCA.findMany({ where: { alumnoId: alumno.id }, orderBy: [{ superado: 'asc' }, { conteo: 'desc' }] }),
    prisma.mision.findMany({
      where: { alumnoId: alumno.id },
      orderBy: { creadoEn: 'desc' },
      take: 10,
      include: {
        pasos: {
          orderBy: { orden: 'asc' },
          select: { id: true, orden: true, enunciado: true, estado: true, intentosCount: true, pistasUsadas: true }
        }
      }
    }),
    prisma.sesionJuego.findMany({ where: { alumnoId: alumno.id }, orderBy: { creadoEn: 'desc' }, take: 8 }),
    prisma.documentoBiblioteca.findMany({
      where: { alumnoId: alumno.id, activo: true },
      orderBy: { prioridad: 'asc' }
    })
  ])

  const promedioDominio = competencias.length
    ? Math.round(competencias.reduce((acc, c) => acc + c.nivelDominio, 0) / competencias.length)
    : 0

  return {
    profesor: { id: profesor.id, nombre: profesor.nombre },
    vinculo: { id: vinculo.id, notaPedagogica: vinculo.notaPedagogica },
    alumno: {
      id: alumno.id,
      nombre: alumno.nombre,
      grado: alumno.grado,
      avatar: alumno.avatar,
      xp: alumno.xp,
      nivel: alumno.nivel,
      rachaActual: alumno.rachaActual,
      mejorRacha: alumno.mejorRacha,
      ultimaActividad: alumno.ultimaActividad,
      pais: alumno.padre?.pais || profesor.pais,
      representante: alumno.padre?.nombre || ''
    },
    resumen: {
      promedioDominio,
      certificadas: competencias.filter((c) => c.certificada).length,
      misionesCompletadas: misiones.filter((m) => m.estado === 'completada').length,
      juegosJugados: sesionesJuego.length
    },
    competencias,
    errores: errores.map((e) => ({
      ...e,
      etiquetaLegible: ERROR_TAG_LABELS[e.errorTag as ErrorTag] || e.errorTag
    })),
    misiones,
    sesionesJuego,
    documentos: documentos.map((d) => ({
      ...d,
      temas: JSON.parse(d.temasJson || '[]')
    }))
  }
})
