import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { createSessionToken, sanitizePadre, setActiveStudentCookie, setAuthCookie } from '~/server/utils/auth'

const loginSchema = z.object({
  correo: z.string().trim().email('Ingresa un correo electrónico válido').optional(),
  password: z.string().min(4, 'Ingresa tu contraseña').optional(),
  demo: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Datos de acceso inválidos.'
    })
  }

  const config = useRuntimeConfig()
  let padre: any = null

  if (parsed.data.demo && config.public.demoMode) {
    padre = await prisma.padre.findUnique({
      where: { correo: 'familia@miprofedemate.edu' },
      include: { alumnos: { orderBy: { creadoEn: 'asc' } } }
    })
    if (!padre) {
      throw createError({ statusCode: 404, statusMessage: 'Cuenta demo no inicializada. Ejecuta npm run db:seed.' })
    }
  } else {
    if (!parsed.data.correo || !parsed.data.password) {
      throw createError({ statusCode: 400, statusMessage: 'Ingresa tu correo y contraseña.' })
    }
    const correoNorm = parsed.data.correo.trim().toLowerCase()
    padre = await prisma.padre.findUnique({
      where: { correo: correoNorm },
      include: { alumnos: { orderBy: { creadoEn: 'asc' } } }
    })
    if (!padre) {
      throw createError({ statusCode: 401, statusMessage: 'Credenciales incorrectas. Verifica tu correo y contraseña.' })
    }
    const ok = await bcrypt.compare(parsed.data.password, padre.passwordHash)
    if (!ok) {
      throw createError({ statusCode: 401, statusMessage: 'Credenciales incorrectas. Verifica tu correo y contraseña.' })
    }
  }

  await prisma.padre.update({
    where: { id: padre.id },
    data: { ultimoAcceso: new Date() }
  })

  const token = await createSessionToken({
    padreId: padre.id,
    correo: padre.correo,
    nombre: padre.nombre
  })
  setAuthCookie(event, token)

  const alumnoActivo = padre.alumnos?.[0] || null
  if (alumnoActivo) {
    setActiveStudentCookie(event, alumnoActivo.id)
  }

  return {
    padre: sanitizePadre(padre),
    alumnoActivo
  }
})
