import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireProfesor } from '~/server/utils/profesorAuth'
import { ensureProfesorInviteCode, generarCodigoProfesor } from '~/server/utils/profesorTables'

const schema = z.object({
  mensajeBienvenida: z.string().trim().max(300).optional(),
  regenerar: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const profesor = await requireProfesor(event)
  const body = (await readBody(event).catch(() => ({}))) || {}
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Datos de invitación inválidos.' })
  }

  const current = await ensureProfesorInviteCode(profesor)
  let nuevoCodigo = current.codigo

  if (parsed.data.regenerar) {
    nuevoCodigo = generarCodigoProfesor(profesor.nombre)
    for (let i = 0; i < 5; i++) {
      const clash = await prisma.codigoInvitacionProfesor.findUnique({ where: { codigo: nuevoCodigo } })
      if (!clash) break
      nuevoCodigo = generarCodigoProfesor(profesor.nombre)
    }
  }

  const updated = await prisma.codigoInvitacionProfesor.update({
    where: { id: current.id },
    data: {
      codigo: nuevoCodigo,
      ...(parsed.data.mensajeBienvenida !== undefined
        ? { mensajeBienvenida: parsed.data.mensajeBienvenida }
        : {})
    }
  })

  return {
    codigo: updated.codigo,
    mensajeBienvenida: updated.mensajeBienvenida
  }
})
