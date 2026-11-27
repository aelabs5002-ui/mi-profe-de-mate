import { prisma } from '~/server/utils/prisma'
import { requirePadre } from '~/server/utils/auth'
import { ensureProfesorTables } from '~/server/utils/profesorTables'

export default defineEventHandler(async (event) => {
  await ensureProfesorTables()
  const { padre } = await requirePadre(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Vínculo no especificado.' })

  const alumnoIds = padre.alumnos.map((a) => a.id)
  const vinculo = await prisma.vinculoProfesor.findFirst({
    where: { id, alumnoId: { in: alumnoIds } }
  })
  if (!vinculo) {
    throw createError({ statusCode: 404, statusMessage: 'Vínculo no encontrado.' })
  }

  await prisma.vinculoProfesor.delete({ where: { id: vinculo.id } })
  return { ok: true }
})
