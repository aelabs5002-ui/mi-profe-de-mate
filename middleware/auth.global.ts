export default defineNuxtRouteMiddleware(async (to) => {
  // Página de ayuda/tutorial accesible libremente para cualquier rol o visitante
  if (to.path === '/ayuda') {
    return
  }

  // Rutas del Portal Profesor (autenticación independiente de familias)
  if (to.path.startsWith('/profesor')) {
    const { fetchProfesorMe } = useProfesorSession()
    const profesor = await fetchProfesorMe()
    if (to.path === '/profesor/login') {
      if (profesor) return navigateTo('/profesor')
      return
    }
    if (!profesor) {
      return navigateTo('/profesor/login')
    }
    return
  }

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
      if (to.path === '/registro' && to.query.profe) {
        return navigateTo(`/padres/profesores?profe=${encodeURIComponent(String(to.query.profe))}`)
      }
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
