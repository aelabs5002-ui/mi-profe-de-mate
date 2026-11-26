import { getSessionContext, sanitizePadre } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')
  const { padre, alumnoActivo } = await getSessionContext(event)
  const config = useRuntimeConfig()

  return {
    padre: sanitizePadre(padre),
    alumnoActivo,
    demoMode: config.public.demoMode
  }
})
