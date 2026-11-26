import { prisma } from '~/server/utils/prisma'
import { requireAlumnoActivo } from '~/server/utils/auth'
import { generateParentWeeklyPdf } from '~/server/utils/seccPdf'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const explicitId = query.alumnoId ? String(query.alumnoId) : undefined
  const { padre, alumno } = await requireAlumnoActivo(event, explicitId)

  const [competencias, erroresActivos, misionesCompletadas] = await Promise.all([
    prisma.competenciaCCA.findMany({ where: { alumnoId: alumno.id }, orderBy: { nivelDominio: 'desc' } }),
    prisma.errorFrecuenteCCA.findMany({ where: { alumnoId: alumno.id, superado: false }, orderBy: { conteo: 'desc' } }),
    prisma.mision.count({ where: { alumnoId: alumno.id, estado: 'completada' } })
  ])

  const pdfBytes = await generateParentWeeklyPdf({
    padreNombre: padre.nombre,
    pais: padre.pais,
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
  setHeader(event, 'Content-Disposition', `attachment; filename="reporte-semanal-${alumno.nombre.toLowerCase()}.pdf"`)
  return Buffer.from(pdfBytes)
})
