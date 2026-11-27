import { getProfesorContext, sanitizeProfesor } from '~/server/utils/profesorAuth'

export default defineEventHandler(async (event) => {
  const profesor = await getProfesorContext(event)
  const config = useRuntimeConfig()
  return {
    profesor: sanitizeProfesor(profesor),
    demoMode: Boolean(config.public.demoMode)
  }
})
