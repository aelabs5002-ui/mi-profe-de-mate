import { prisma } from '~/server/utils/prisma'
import { requirePadre } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { padre } = await requirePadre(event)
  const items = await prisma.feedbackPrueba.findMany({
    where: { padreId: padre.id },
    orderBy: { creadoEn: 'desc' },
    take: 25
  })
  return { items }
})
