import { z } from 'zod'
import { requirePadre } from '~/server/utils/auth'

const pinSchema = z.object({
  pin: z.string().trim().min(4)
})

export default defineEventHandler(async (event) => {
  const { padre } = await requirePadre(event)
  const body = await readBody(event)
  const parsed = pinSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ingresa el PIN de 4 dígitos.' })
  }

  if (parsed.data.pin !== padre.pinParental) {
    throw createError({ statusCode: 403, statusMessage: 'PIN parental incorrecto.' })
  }

  return { ok: true }
})
