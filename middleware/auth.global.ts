export default defineNuxtRouteMiddleware(async (to) => {
  const { fetchMe } = useSession()
  const { padre, alumnoActivo } = await fetchMe()

  const publicRoutes = ['/', '/login', '/registro']

  if (to.path === '/') {
    if (!padre) return navigateTo('/login')
    if (!alumnoActivo) return navigateTo('/seleccionar-alumno')
    return navigateTo('/alumno')
  }

  if (publicRoutes.includes(to.path)) {
    if (padre) {
      return navigateTo(alumnoActivo ? '/alumno' : '/seleccionar-alumno')
    }
    return
  }

  if (!padre) {
    return navigateTo('/login')
  }

  if (to.path.startsWith('/alumno') && !alumnoActivo) {
    return navigateTo('/seleccionar-alumno')
  }
})
