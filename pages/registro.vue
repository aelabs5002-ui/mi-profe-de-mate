<script setup lang="ts">
import { ArrowLeft, Eye, EyeOff, GraduationCap } from 'lucide-vue-next'

definePageMeta({ layout: false })

const route = useRoute()
const { setSession, fetchMe } = useSession()
const { data: catalogo } = await useFetch<{
  paises: Array<{ pais: string; grados: string[] }>
  avatares: string[]
}>('/api/catalogo')

// Si viene desde un enlace de invitación de un profesor (/registro?profe=CODIGO)
const codigoProfesor = computed(() => (route.query.profe ? String(route.query.profe).trim().toUpperCase() : ''))
const invitacionProfe = ref<{
  codigo: string
  mensajeBienvenida: string
  profesor: { nombre: string; institucion: string; pais: string }
} | null>(null)

if (codigoProfesor.value) {
  try {
    invitacionProfe.value = await $fetch(`/api/profesor/invitacion/${encodeURIComponent(codigoProfesor.value)}`)
  } catch {
    invitacionProfe.value = null
  }
}

const paises = computed(() => catalogo.value?.paises || [])
const avatares = computed(() => catalogo.value?.avatares || ['🦊', '🦁', '🦉', '🐼'])

const form = reactive({
  nombrePadre: '',
  correo: '',
  password: '',
  confirmPassword: '',
  pais: 'Venezuela',
  paisLibre: '',
  pinParental: '1234',
  nombreAlumno: '',
  gradoAlumno: '1er Año (Secundaria)',
  avatarAlumno: '🦊'
})

const esOpcionLibre = computed(() => form.pais === 'Libre / Internacional')

const gradosPais = computed(() => {
  const found = paises.value.find((p) => p.pais === form.pais)
  const fallback = paises.value.find((p) => p.pais === 'Libre / Internacional')
  return found?.grados || fallback?.grados || ['Nivel Básico (9–10 años)', 'Secundaria Inicial (12–13 años)', 'Práctica Libre (Todos los niveles)']
})

watch(
  () => form.pais,
  () => {
    if (!gradosPais.value.includes(form.gradoAlumno)) {
      form.gradoAlumno = gradosPais.value[Math.min(3, gradosPais.value.length - 1)] || gradosPais.value[0]
    }
  }
)

const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const registrar = async () => {
  errorMsg.value = ''
  if (form.password !== form.confirmPassword) {
    errorMsg.value = 'Las contraseñas no coinciden.'
    return
  }
  loading.value = true
  try {
    const paisFinal = esOpcionLibre.value && form.paisLibre.trim() ? form.paisLibre.trim() : form.pais
    const res = await $fetch<{ padre: any; alumnoActivo: any }>('/api/auth/register', {
      method: 'POST',
      body: {
        nombrePadre: form.nombrePadre,
        correo: form.correo.trim(),
        password: form.password,
        pais: paisFinal,
        pinParental: form.pinParental,
        nombreAlumno: form.nombreAlumno,
        gradoAlumno: form.gradoAlumno,
        avatarAlumno: form.avatarAlumno,
        ...(codigoProfesor.value ? { codigoProfesor: codigoProfesor.value } : {})
      }
    })
    setSession(res.padre, res.alumnoActivo)
    await fetchMe(true)
    await navigateTo('/alumno')
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'No se pudo completar el registro.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-blue-50/70 via-[#F7FAFC] to-emerald-50/40 flex items-center justify-center p-4 py-8">
    <div class="w-full max-w-lg space-y-4">
      <NuxtLink to="/login" class="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563EB] hover:underline">
        <ArrowLeft class="w-4 h-4" /> Volver al inicio de sesión
      </NuxtLink>

      <div v-if="invitacionProfe" class="rounded-2xl bg-indigo-600 text-white p-4 shadow-soft flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <GraduationCap class="w-5 h-5" />
        </div>
        <div class="space-y-0.5 text-xs">
          <div class="font-extrabold uppercase tracking-wider text-indigo-200">Invitación de tu Profesor</div>
          <div class="font-display font-extrabold text-sm">
            {{ invitacionProfe.profesor.nombre }}
            <span v-if="invitacionProfe.profesor.institucion" class="font-normal text-indigo-100">
              · {{ invitacionProfe.profesor.institucion }}
            </span>
          </div>
          <p v-if="invitacionProfe.mensajeBienvenida" class="text-indigo-100 leading-relaxed">
            "{{ invitacionProfe.mensajeBienvenida }}"
          </p>
          <p class="text-[11px] text-emerald-200 font-bold pt-0.5">
            ✓ Al crear tu cuenta, tu hijo/a quedará vinculado automáticamente con su profesor.
          </p>
        </div>
      </div>

      <div class="card-surface space-y-5">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900">Crea tu cuenta familiar</h1>
          <p class="text-xs text-slate-600 mt-1">
            Configura tu perfil de representante y el primer estudiante en menos de 1 minuto.
          </p>
        </div>

        <div v-if="errorMsg" class="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
          {{ errorMsg }}
        </div>

        <form class="space-y-4" @submit.prevent="registrar">
          <div class="space-y-3">
            <div class="text-xs font-extrabold uppercase tracking-wider text-[#2563EB]">1. Datos del Representante</div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Tu nombre</label>
                <input v-model="form.nombrePadre" required class="input-field" placeholder="Ej. María Contreras" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">País / Currículo</label>
                <select v-model="form.pais" class="input-field">
                  <option v-for="p in paises" :key="p.pais" :value="p.pais">{{ p.pais }}</option>
                </select>
              </div>
            </div>

            <div v-if="esOpcionLibre">
              <label class="block text-xs font-bold text-slate-700 mb-1">
                País o modalidad personalizada (opcional)
              </label>
              <input
                v-model="form.paisLibre"
                type="text"
                class="input-field"
                placeholder="Ej. Educación en casa, Brasil, Internacional..."
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="block text-xs font-bold text-slate-700 mb-1">Correo electrónico</label>
                <input
                  v-model="form.correo"
                  type="email"
                  required
                  autocapitalize="none"
                  autocorrect="off"
                  spellcheck="false"
                  class="input-field"
                  placeholder="familia@correo.com"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">PIN Padres (4 díg.)</label>
                <input
                  v-model="form.pinParental"
                  type="text"
                  inputmode="numeric"
                  maxlength="4"
                  pattern="\d{4}"
                  required
                  class="input-field text-center font-bold tracking-widest"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Contraseña (mín. 6)</label>
                <div class="relative">
                  <input
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    minlength="6"
                    required
                    class="input-field pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                    @click="showPassword = !showPassword"
                  >
                    <EyeOff v-if="showPassword" class="w-4 h-4" />
                    <Eye v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Confirmar contraseña</label>
                <input
                  v-model="form.confirmPassword"
                  :type="showPassword ? 'text' : 'password'"
                  minlength="6"
                  required
                  class="input-field"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 space-y-3">
            <div class="text-xs font-extrabold uppercase tracking-wider text-emerald-600">2. Perfil del Estudiante</div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Nombre del alumno</label>
                <input v-model="form.nombreAlumno" required class="input-field" placeholder="Ej. Sofía" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Grado escolar</label>
                <select v-model="form.gradoAlumno" class="input-field">
                  <option v-for="g in gradosPais" :key="g" :value="g">{{ g }}</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">Elige su avatar</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="av in avatares"
                  :key="av"
                  type="button"
                  class="w-11 h-11 rounded-xl border-2 text-xl flex items-center justify-center transition"
                  :class="form.avatarAlumno === av ? 'border-[#2563EB] bg-blue-50 scale-105' : 'border-slate-200 bg-white hover:bg-slate-50'"
                  @click="form.avatarAlumno = av"
                >
                  {{ av }}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" class="btn-primary w-full" :disabled="loading">
            {{ loading ? 'Creando cuenta...' : 'Crear cuenta y empezar a aprender' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
