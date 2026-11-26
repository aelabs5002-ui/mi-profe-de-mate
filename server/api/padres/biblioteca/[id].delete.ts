import { prisma } from '~/server/utils/prisma'
import { requirePadre } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { padre } = await requirePadre(event)
  const id = getRouterParam(event, 'id')
  const doc = await prisma.documentoBiblioteca.findFirst({
    where: { id, alumno: { padreId: padre.id } }
  })
  if (!doc) throw createError({ statusCode: 404, statusMessage: 'Documento no encontrado.' })

  await prisma.documentoBiblioteca.delete({ where: { id: doc.id } })
  return { ok: true }
})
