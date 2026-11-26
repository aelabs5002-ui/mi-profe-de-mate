import { prisma } from '~/server/utils/prisma'
import { requireAlumnoActivo } from '~/server/utils/auth'
import { ERROR_TAG_LABELS, type ErrorTag } from '~/server/utils/errorTagger'

export default defineEventHandler(async (event) => {
  const { padre, alumno } = await requireAlumnoActivo(event)

  const [competencias, errores, misiones, juegos] = await Promise.all([
    prisma.competenciaCCA.findMany({
      where: { alumnoId: alumno.id },
      orderBy: [{ certificada: 'desc' }, { nivelDominio: 'desc' }]
    }),
    prisma.errorFrecuenteCCA.findMany({
      where: { alumnoId: alumno.id },
      orderBy: [{ superado: 'asc' }, { conteo: 'desc' }]
    }),
    prisma.mision.findMany({
      where: { alumnoId: alumno.id },
      orderBy: { creadoEn: 'desc' },
      take: 12
    }),
    prisma.sesionJuego.findMany({
      where: { alumnoId: alumno.id },
      orderBy: { creadoEn: 'desc' },
      take: 10
    })
  ])

  const promedioDominio =
    competencias.length > 0
      ? Math.round(competencias.reduce((acc, c) => acc + c.nivelDominio, 0) / competencias.length)
      : 0

  return {
    pais: padre.pais,
    alumno,
    resumen: {
      promedioDominio,
      certificadas: competencias.filter((c) => c.certificada).length,
      totalCompetencias: competencias.length,
      misionesCompletadas: misiones.filter((m) => m.estado === 'completada').length,
      partidasJugadas: juegos.length
    },
    competencias: competencias.map((c) => ({
      ...c,
      motoresUsados: JSON.parse(c.motoresUsadosJson || '[]')
    })),
    errores: errores.map((e) => ({
      ...e,
      etiquetaLegible: ERROR_TAG_LABELS[e.errorTag as ErrorTag] || e.errorTag
    })),
    misiones,
    juegos
  }
})
