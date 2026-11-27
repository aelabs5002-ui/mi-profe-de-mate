export interface ProfesorProfile {
  id: string
  nombre: string
  correo: string
  pais: string
  institucion: string
}

export const useProfesorSession = () => {
  const profesor = useState<ProfesorProfile | null>('mpm_profesor_state', () => null)
  const loaded = useState<boolean>('mpm_profesor_loaded', () => false)

  const fetchProfesorMe = async (force = false) => {
    if (loaded.value && !force) return profesor.value
    try {
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
      const data = await $fetch<{ profesor: ProfesorProfile | null }>('/api/profesor/me', { headers })
      profesor.value = data.profesor
    } catch {
      profesor.value = null
    } finally {
      loaded.value = true
    }
    return profesor.value
  }

  const setProfesor = (p: ProfesorProfile | null) => {
    profesor.value = p
    loaded.value = true
  }

  const logoutProfesor = async () => {
    try {
      await $fetch('/api/profesor/logout', { method: 'POST' })
    } finally {
      profesor.value = null
      loaded.value = false
      await navigateTo('/profesor/login')
    }
  }

  return {
    profesor,
    loaded,
    fetchProfesorMe,
    setProfesor,
    logoutProfesor
  }
}
