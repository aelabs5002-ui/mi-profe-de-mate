import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requirePadre } from '~/server/utils/auth'

const updateSchema = z.object({
  activo: z.boolean().optional(),
  prioridad: z.number().int().min(1).max(5).optional()
})

export default defineEventHandler(async (event) => {
  const { padre } = await requirePadre(event)
  const id = getRouterParam(event, 'id')
  const doc = await prisma.documentoBiblioteca.findFirst({
    where: { id, alumno: { padreId: padre.id } }
  })
  if (!doc) throw createError({ statusCode: 404, statusMessage: 'Documento no encontrado.' })

  const body = await readBody(event)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Datos inválidos.' })

  const updated = await prisma.documentoBiblioteca.update({
    where: { id: doc.id },
    data: parsed.data
  })
  return { documento: updated }
})
