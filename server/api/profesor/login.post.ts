import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { ensureProfesorTables } from '~/server/utils/profesorTables'
import { createProfesorToken, sanitizeProfesor, setProfesorCookie } from '~/server/utils/profesorAuth'

const schema = z.object({
  correo: z.string().trim().email().optional(),
  password: z.string().min(4).optional(),
  demo: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  await ensureProfesorTables()
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Datos de acceso inválidos.' })
  }

  const config = useRuntimeConfig()
  let profesor: any = null

  if (parsed.data.demo && config.public.demoMode) {
    profesor = await prisma.profesor.findUnique({ where: { correo: 'profe@miprofedemate.edu' } })
    if (!profesor) {
      const hash = await bcrypt.hash('Profe123*', 10)
      profesor = await prisma.profesor.create({
        data: {
          nombre: 'Prof. Elena Vargas',
          correo: 'profe@miprofedemate.edu',
          passwordHash: hash,
          pais: 'Venezuela',
          institucion: 'Colegio Demo — Matemáticas',
          ultimoAcceso: new Date()
        }
      })
    }
    // Asegurar que el profesor demo esté vinculado a los alumnos de la familia demo
    const padreDemo = await prisma.padre.findUnique({
      where: { correo: 'familia@miprofedemate.edu' },
      include: { alumnos: true }
    })
    if (padreDemo?.alumnos?.length) {
      for (const al of padreDemo.alumnos) {
        await prisma.vinculoProfesor.upsert({
          where: { profesorId_alumnoId: { profesorId: profesor.id, alumnoId: al.id } },
          update: { activo: true },
          create: {
            profesorId: profesor.id,
            alumnoId: al.id,
            codigoUsado: 'DEMO',
            notaPedagogica: 'Reforzar ley de signos y pasos de despeje con paciencia.'
          }
        })
      }
    }
  } else {
    if (!parsed.data.correo || !parsed.data.password) {
      throw createError({ statusCode: 400, statusMessage: 'Ingresa tu correo y contraseña.' })
    }
    const correoNorm = parsed.data.correo.trim().toLowerCase()
    profesor = await prisma.profesor.findUnique({ where: { correo: correoNorm } })
    if (!profesor) {
      throw createError({ statusCode: 401, statusMessage: 'Credenciales incorrectas.' })
    }
    const ok = await bcrypt.compare(parsed.data.password, profesor.passwordHash)
    if (!ok) {
      throw createError({ statusCode: 401, statusMessage: 'Credenciales incorrectas.' })
    }
  }

  await prisma.profesor.update({
    where: { id: profesor.id },
    data: { ultimoAcceso: new Date() }
  })

  const token = await createProfesorToken({
    profesorId: profesor.id,
    correo: profesor.correo,
    nombre: profesor.nombre
  })
  setProfesorCookie(event, token)

  return { profesor: sanitizeProfesor(profesor) }
})
