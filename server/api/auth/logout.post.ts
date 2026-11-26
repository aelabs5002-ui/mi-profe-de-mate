import { clearAuthCookies } from '~/server/utils/auth'

export default defineEventHandler((event) => {
  clearAuthCookies(event)
  return { ok: true }
})
