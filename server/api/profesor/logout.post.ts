import { clearProfesorCookie } from '~/server/utils/profesorAuth'

export default defineEventHandler((event) => {
  clearProfesorCookie(event)
  return { ok: true }
})
