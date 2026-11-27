import { prisma } from '~/server/utils/prisma'
import { requireAlumnoVinculado } from '~/server/utils/profesorAuth'
import { generateParentWeeklyPdf } from '~/server/utils/seccPdf'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Estudiante no especificado.' })

  const { profesor, alumno } = await requireAlumnoVinculado(event, id)

  const [competencias, erroresActivos, misionesCompletadas] = await Promise.all([
    prisma.competenciaCCA.findMany({ where: { alumnoId: alumno.id }, orderBy: { nivelDominio: 'desc' } }),
    prisma.errorFrecuenteCCA.findMany({
      where: { alumnoId: alumno.id, superado: false },
      orderBy: { conteo: 'desc' },
      take: 8
    }),
    prisma.mision.count({ where: { alumnoId: alumno.id, estado: 'completada' } })
  ])

  const bytes = await generateParentWeeklyPdf({
    padreNombre: `${alumno.padre?.nombre || 'Familia'} (Docente: ${profesor.nombre})`,
    pais: alumno.padre?.pais || profesor.pais,
    alumnoNombre: alumno.nombre,
    grado: alumno.grado,
    nivel: alumno.nivel,
    xp: alumno.xp,
    racha: alumno.rachaActual,
    competencias,
    erroresActivos,
    misionesCompletadas
  })

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(
    event,
    'Content-Disposition',
    `inline; filename="Reporte-Docente-${alumno.nombre.replace(/\s+/g, '-')}.pdf"`
  )
  return bytes
})
