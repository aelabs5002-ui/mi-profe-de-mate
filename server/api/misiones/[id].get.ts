import { prisma } from '~/server/utils/prisma'
import { requireAlumnoActivo } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { alumno } = await requireAlumnoActivo(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID de misión requerido.' })

  const mision = await prisma.mision.findFirst({
    where: { id, alumnoId: alumno.id },
    include: {
      pasos: {
        orderBy: { orden: 'asc' },
        include: {
          intentos: { orderBy: { creadoEn: 'asc' } }
        }
      },
      tareaSubida: {
        select: { id: true, nombreArchivo: true, textoExtraido: true, archivoDataUrl: true }
      }
    }
  })

  if (!mision) {
    throw createError({ statusCode: 404, statusMessage: 'Misión no encontrada.' })
  }

  return {
    mision,
    maxPistasPorPaso: alumno.maxPistasPorPaso
  }
})
