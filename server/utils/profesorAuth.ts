import { SignJWT, jwtVerify } from 'jose'
import type { H3Event } from 'h3'
import { prisma } from './prisma'
import { ensureProfesorTables } from './profesorTables'

export const PROFESOR_COOKIE = 'mpm_profesor'

export interface ProfesorTokenPayload {
  profesorId: string
  correo: string
  nombre: string
  role: 'profesor'
}

function getSecretKey() {
  const config = useRuntimeConfig()
  const secret = process.env.JWT_SECRET || config.jwtSecret
  return new TextEncoder().encode(secret)
}

export async function createProfesorToken(payload: Omit<ProfesorTokenPayload, 'role'>): Promise<string> {
  return await new SignJWT({ ...payload, role: 'profesor' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(getSecretKey())
}

export async function verifyProfesorToken(token: string): Promise<ProfesorTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    if (payload.role !== 'profesor') return null
    return {
      profesorId: String(payload.profesorId),
      correo: String(payload.correo),
      nombre: String(payload.nombre),
      role: 'profesor'
    }
  } catch {
    return null
  }
}

export function setProfesorCookie(event: H3Event, token: string) {
  setCookie(event, PROFESOR_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14
  })
}

export function clearProfesorCookie(event: H3Event) {
  deleteCookie(event, PROFESOR_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })
}

export function sanitizeProfesor(p: any) {
  if (!p) return null
  const { passwordHash, ...safe } = p
  return safe
}

export async function getProfesorContext(event: H3Event) {
  const token = getCookie(event, PROFESOR_COOKIE)
  if (!token) return null

  const payload = await verifyProfesorToken(token)
  if (!payload) return null

  await ensureProfesorTables()
  const profesor = await prisma.profesor.findUnique({
    where: { id: payload.profesorId }
  })
  return profesor
}

export async function requireProfesor(event: H3Event) {
  const profesor = await getProfesorContext(event)
  if (!profesor) {
    throw createError({ statusCode: 401, statusMessage: 'Inicia sesión en el Portal Profesor para continuar.' })
  }
  return profesor
}

export async function requireAlumnoVinculado(event: H3Event, alumnoId: string) {
  const profesor = await requireProfesor(event)
  const vinculo = await prisma.vinculoProfesor.findFirst({
    where: { profesorId: profesor.id, alumnoId, activo: true },
    include: {
      alumno: {
        include: {
          padre: { select: { nombre: true, pais: true } }
        }
      }
    }
  })
  if (!vinculo) {
    throw createError({ statusCode: 403, statusMessage: 'Este estudiante no está vinculado a tu cuenta docente.' })
  }
  return { profesor, vinculo, alumno: vinculo.alumno }
}
