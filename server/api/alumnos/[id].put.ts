import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requirePadre } from '~/server/utils/auth'

const schema = z.object({
  nombre: z.string().trim().min(2).optional(),
  grado: z.string().trim().min(2).optional(),
  avatar: z.string().trim().min(1).optional()
})

export default defineEventHandler(async (event) => {
  const { padre } = await requirePadre(event)
  const id = getRouterParam(event, 'id')
  const belongs = padre.alumnos.find((a) => a.id === id)
  if (!belongs) {
    throw createError({ statusCode: 404, statusMessage: 'Estudiante no encontrado.' })
  }

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Datos inválidos.' })
  }

  const updated = await prisma.alumno.update({
    where: { id: belongs.id },
    data: parsed.data
  })

  return { alumno: updated }
})
