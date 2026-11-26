import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requirePadre, setActiveStudentCookie } from '~/server/utils/auth'

const schema = z.object({
  nombre: z.string().trim().min(2, 'Ingresa el nombre del estudiante'),
  grado: z.string().trim().min(2, 'Selecciona un grado escolar'),
  avatar: z.string().trim().default('🦊')
})

export default defineEventHandler(async (event) => {
  const { padre } = await requirePadre(event)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message || 'Datos inválidos.' })
  }

  const alumno = await prisma.alumno.create({
    data: {
      padreId: padre.id,
      nombre: parsed.data.nombre,
      grado: parsed.data.grado,
      avatar: parsed.data.avatar || '🦊'
    }
  })

  setActiveStudentCookie(event, alumno.id)
  return { alumno }
})
