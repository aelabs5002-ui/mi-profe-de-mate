import { SignJWT, jwtVerify } from 'jose'
import type { H3Event } from 'h3'
import { prisma } from './prisma'

export const AUTH_COOKIE = 'mpm_session'
export const ACTIVE_STUDENT_COOKIE = 'mpm_student'

export interface SessionPayload {
  padreId: string
  correo: string
  nombre: string
}

function getSecretKey() {
  const config = useRuntimeConfig()
  const secret = process.env.JWT_SECRET || config.jwtSecret
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(getSecretKey())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return {
      padreId: String(payload.padreId),
      correo: String(payload.correo),
      nombre: String(payload.nombre)
    }
  } catch {
    return null
  }
}

export function setAuthCookie(event: H3Event, token: string) {
  setCookie(event, AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14
  })
}

export function setActiveStudentCookie(event: H3Event, alumnoId: string) {
  setCookie(event, ACTIVE_STUDENT_COOKIE, alumnoId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14
  })
}

export function clearAuthCookies(event: H3Event) {
  const opts = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  }
  deleteCookie(event, AUTH_COOKIE, opts)
  deleteCookie(event, ACTIVE_STUDENT_COOKIE, opts)
}

export async function getSessionContext(event: H3Event) {
  const token = getCookie(event, AUTH_COOKIE)
  if (!token) return { padre: null, alumnoActivo: null }

  const payload = await verifySessionToken(token)
  if (!payload) return { padre: null, alumnoActivo: null }

  const padre = await prisma.padre.findUnique({
    where: { id: payload.padreId },
    include: {
      alumnos: {
        orderBy: { creadoEn: 'asc' }
      }
    }
  })

  if (!padre) return { padre: null, alumnoActivo: null }

  const activeId = getCookie(event, ACTIVE_STUDENT_COOKIE)
  let alumnoActivo = padre.alumnos.find((a) => a.id === activeId) || null
  if (!alumnoActivo && padre.alumnos.length === 1) {
    alumnoActivo = padre.alumnos[0]
  }

  return { padre, alumnoActivo }
}

export async function requirePadre(event: H3Event) {
  const { padre, alumnoActivo } = await getSessionContext(event)
  if (!padre) {
    throw createError({ statusCode: 401, statusMessage: 'Inicia sesión para continuar.' })
  }
  return { padre, alumnoActivo }
}

export async function requireAlumnoActivo(event: H3Event, explicitAlumnoId?: string) {
  const { padre, alumnoActivo } = await requirePadre(event)
  const target = explicitAlumnoId
    ? padre.alumnos.find((a) => a.id === explicitAlumnoId)
    : alumnoActivo || padre.alumnos[0]

  if (!target) {
    throw createError({ statusCode: 400, statusMessage: 'Selecciona o crea un perfil de alumno primero.' })
  }

  return { padre, alumno: target }
}

export function sanitizePadre(padre: any) {
  if (!padre) return null
  const { passwordHash, pinParental, ...safe } = padre
  return {
    ...safe,
    tienePin: Boolean(pinParental)
  }
}
