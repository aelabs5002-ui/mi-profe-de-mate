import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAlumnoVinculado } from '~/server/utils/profesorAuth'

const schema = z.object({
  notaPedagogica: z.string().trim().max(800)
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Estudiante no especificado.' })

  const { vinculo } = await requireAlumnoVinculado(event, id)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Nota pedagógica inválida.' })
  }

  const updated = await prisma.vinculoProfesor.update({
    where: { id: vinculo.id },
    data: { notaPedagogica: parsed.data.notaPedagogica }
  })

  return { ok: true, notaPedagogica: updated.notaPedagogica }
})
