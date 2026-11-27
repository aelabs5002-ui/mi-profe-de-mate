import { prisma } from '~/server/utils/prisma'
import { requireAlumnoActivo } from '~/server/utils/auth'
import { ensureProfesorTables } from '~/server/utils/profesorTables'

export default defineEventHandler(async (event) => {
  await ensureProfesorTables()
  const query = getQuery(event)
  const explicitId = query.alumnoId ? String(query.alumnoId) : undefined
  const { padre, alumno } = await requireAlumnoActivo(event, explicitId)

  const [codigoRec, vinculos] = await Promise.all([
    prisma.codigoVinculacionAlumno.findUnique({ where: { alumnoId: alumno.id } }),
    prisma.vinculoProfesor.findMany({
      where: { alumnoId: alumno.id, activo: true },
      include: {
        profesor: {
          select: { id: true, nombre: true, correo: true, institucion: true, pais: true }
        }
      },
      orderBy: { creadoEn: 'desc' }
    })
  ])

  return {
    alumnos: padre.alumnos,
    alumno: { id: alumno.id, nombre: alumno.nombre, grado: alumno.grado, avatar: alumno.avatar },
    codigo: codigoRec?.codigo || null,
    vinculos
  }
})
