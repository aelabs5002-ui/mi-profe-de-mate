import { prisma } from '~/server/utils/prisma'
import { requirePadre } from '~/server/utils/auth'
import { ensureFeedbackTable } from '~/server/utils/feedbackTable'

export default defineEventHandler(async (event) => {
  const { padre } = await requirePadre(event)
  await ensureFeedbackTable()
  const items = await prisma.feedbackPrueba.findMany({
    where: { padreId: padre.id },
    orderBy: { creadoEn: 'desc' },
    take: 25
  })
  return { items }
})
