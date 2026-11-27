export interface AlumnoProfile {
  id: string
  padreId: string
  nombre: string
  grado: string
  avatar: string
  xp: number
  nivel: number
  rachaActual: number
  mejorRacha: number
  limiteMinutosDiario: number
  minutosUsadosHoy: number
  maxPistasPorPaso: number
  vozPermitida?: boolean
  instruccionesPadre: string
}

export interface PadreProfile {
  id: string
  nombre: string
  correo: string
  pais: string
  tienePin: boolean
  alumnos: AlumnoProfile[]
}

export const useSession = () => {
  const padre = useState<PadreProfile | null>('mpm_padre', () => null)
  const alumnoActivo = useState<AlumnoProfile | null>('mpm_alumno', () => null)
  const demoMode = useState<boolean>('mpm_demo', () => true)
  const loaded = useState<boolean>('mpm_loaded', () => false)
  const padresDesbloqueado = useState<boolean>('mpm_padres_ok', () => false)

  const fetchMe = async (force = false) => {
    if (loaded.value && !force) return { padre: padre.value, alumnoActivo: alumnoActivo.value }
    try {
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
      const data = await $fetch<{
        padre: PadreProfile | null
        alumnoActivo: AlumnoProfile | null
        demoMode: boolean
      }>('/api/auth/me', { headers })
      padre.value = data.padre
      alumnoActivo.value = data.alumnoActivo
      demoMode.value = data.demoMode
    } catch {
      padre.value = null
      alumnoActivo.value = null
    } finally {
      loaded.value = true
    }
    return { padre: padre.value, alumnoActivo: alumnoActivo.value }
  }

  const setSession = (p: PadreProfile | null, a: AlumnoProfile | null) => {
    padre.value = p
    alumnoActivo.value = a
    loaded.value = true
  }

  const selectAlumno = async (alumnoId: string) => {
    const res = await $fetch<{ alumno: AlumnoProfile }>(`/api/alumnos/${alumnoId}/seleccionar`, {
      method: 'POST'
    })
    alumnoActivo.value = res.alumno
    return res.alumno
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      padre.value = null
      alumnoActivo.value = null
      padresDesbloqueado.value = false
      loaded.value = false
      await navigateTo('/login')
    }
  }

  return {
    padre,
    alumnoActivo,
    demoMode,
    loaded,
    padresDesbloqueado,
    fetchMe,
    setSession,
    selectAlumno,
    logout
  }
}
