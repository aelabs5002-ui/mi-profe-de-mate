import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { ensureProfesorTables } from '~/server/utils/profesorTables'
import { createProfesorToken, sanitizeProfesor, setProfesorCookie } from '~/server/utils/profesorAuth'

const schema = z.object({
  nombre: z.string().trim().min(2, 'Ingresa tu nombre completo'),
  correo: z.string().trim().email('Ingresa un correo válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  pais: z.string().trim().min(2).default('Venezuela'),
  institucion: z.string().trim().max(120).default('')
})

export default defineEventHandler(async (event) => {
  await ensureProfesorTables()
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Datos de registro inválidos.'
    })
  }

  const d = parsed.data
  const correoNorm = d.correo.trim().toLowerCase()

  const exists = await prisma.profesor.findUnique({ where: { correo: correoNorm } })
  if (exists) {
    throw createError({ statusCode: 409, statusMessage: 'Ya existe una cuenta de profesor con ese correo.' })
  }

  const passwordHash = await bcrypt.hash(d.password, 10)
  const profesor = await prisma.profesor.create({
    data: {
      nombre: d.nombre,
      correo: correoNorm,
      passwordHash,
      pais: d.pais,
      institucion: d.institucion,
      ultimoAcceso: new Date()
    }
  })

  const token = await createProfesorToken({
    profesorId: profesor.id,
    correo: profesor.correo,
    nombre: profesor.nombre
  })
  setProfesorCookie(event, token)

  return { profesor: sanitizeProfesor(profesor) }
})
