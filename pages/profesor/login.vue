<script setup lang="ts">
import { GraduationCap, Mail, Lock, Sparkles, ArrowRight, ArrowLeft } from 'lucide-vue-next'

definePageMeta({ layout: false })

const { setProfesor, fetchProfesorMe } = useProfesorSession()
const { data: catalogo } = await useFetch<{ paises: Array<{ pais: string }> }>('/api/catalogo')
const paises = computed(() => catalogo.value?.paises || [])

const tab = ref<'login' | 'register'>('login')
const loading = ref(false)
const demoLoading = ref(false)
const err = ref('')

const loginForm = reactive({ correo: '', password: '' })
const regForm = reactive({
  nombre: '',
  correo: '',
  password: '',
  pais: 'Venezuela',
  institucion: ''
})

const entrar = async () => {
  err.value = ''
  loading.value = true
  try {
    const res = await $fetch<{ profesor: any }>('/api/profesor/login', {
      method: 'POST',
      body: { correo: loginForm.correo.trim(), password: loginForm.password }
    })
    setProfesor(res.profesor)
    await fetchProfesorMe(true)
    await navigateTo('/profesor')
  } catch (e: any) {
    err.value = e?.data?.statusMessage || 'No se pudo iniciar sesión.'
  } finally {
    loading.value = false
  }
}

const registrar = async () => {
  err.value = ''
  loading.value = true
  try {
    const res = await $fetch<{ profesor: any }>('/api/profesor/register', {
      method: 'POST',
      body: regForm
    })
    setProfesor(res.profesor)
    await fetchProfesorMe(true)
    await navigateTo('/profesor')
  } catch (e: any) {
    err.value = e?.data?.statusMessage || 'No se pudo crear tu cuenta docente.'
  } finally {
    loading.value = false
  }
}

const entrarDemo = async () => {
  err.value = ''
  demoLoading.value = true
  try {
    const res = await $fetch<{ profesor: any }>('/api/profesor/login', {
      method: 'POST',
      body: { demo: true }
    })
    setProfesor(res.profesor)
    await fetchProfesorMe(true)
    await navigateTo('/profesor')
  } catch (e: any) {
    err.value = e?.data?.statusMessage || 'No se pudo abrir la demo docente.'
  } finally {
    demoLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-indigo-50/70 via-[#F7FAFC] to-blue-50/40 flex items-center justify-center p-4 py-8">
    <div class="w-full max-w-md space-y-5">
      <div class="flex items-center justify-between gap-2">
        <NuxtLink to="/login" class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#2563EB]">
          <ArrowLeft class="w-4 h-4" /> Volver a Familias / Alumnos
        </NuxtLink>
        <NuxtLink to="/ayuda" class="text-xs font-extrabold text-indigo-600 hover:underline">
          Ver tutorial de uso
        </NuxtLink>
      </div>

      <div class="text-center space-y-2">
        <div class="w-16 h-16 mx-auto rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-soft">
          <GraduationCap class="w-8 h-8" />
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Portal para Profesores</h1>
        <p class="text-sm text-slate-600">
          Monitorea el progreso real de tus alumnos, detecta sus errores frecuentes y asigna misiones guiadas por IA socrática.
        </p>
      </div>

      <!-- Demo 1 clic -->
      <div class="card-surface border-indigo-200 bg-white space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-extrabold uppercase tracking-wider text-indigo-600 inline-flex items-center gap-1.5">
            <Sparkles class="w-3.5 h-3.5" /> Prueba rápida Docente
          </span>
          <span class="pill-mastery">1 clic</span>
        </div>
        <p class="text-xs text-slate-600">
          Explora el panel de <strong>Prof. Elena Vargas</strong> con estudiantes de ejemplo vinculados, mapa de errores CCA y asignación de misiones.
        </p>
        <button
          type="button"
          class="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm py-3 px-4 inline-flex items-center justify-between transition"
          :disabled="demoLoading"
          @click="entrarDemo"
        >
          <span>{{ demoLoading ? 'Preparando panel docente...' : 'Entrar en Modo Demostración Docente' }}</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>

      <!-- Login / Registro -->
      <div class="card-surface space-y-4">
        <div class="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            class="py-2 rounded-lg text-xs font-extrabold transition"
            :class="tab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'"
            @click="tab = 'login'; err = ''"
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            class="py-2 rounded-lg text-xs font-extrabold transition"
            :class="tab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'"
            @click="tab = 'register'; err = ''"
          >
            Crear cuenta gratis
          </button>
        </div>

        <div v-if="err" class="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
          {{ err }}
        </div>

        <form v-if="tab === 'login'" class="space-y-3.5" @submit.prevent="entrar">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Correo del profesor</label>
            <div class="relative">
              <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input v-model="loginForm.correo" type="email" required class="input-field pl-10" placeholder="profe@colegio.edu" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Contraseña</label>
            <div class="relative">
              <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input v-model="loginForm.password" type="password" required class="input-field pl-10" placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" class="btn-primary w-full" :disabled="loading">
            {{ loading ? 'Ingresando...' : 'Entrar al Portal Docente' }}
          </button>
        </form>

        <form v-else class="space-y-3" @submit.prevent="registrar">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Tu nombre completo</label>
            <input v-model="regForm.nombre" required class="input-field" placeholder="Ej. Prof. Carlos Méndez" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">País</label>
              <select v-model="regForm.pais" class="input-field">
                <option v-for="p in paises" :key="p.pais" :value="p.pais">{{ p.pais }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Colegio / Particular (opc.)</label>
              <input v-model="regForm.institucion" class="input-field" placeholder="Ej. U.E. Bolívar" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Correo electrónico</label>
            <input v-model="regForm.correo" type="email" required class="input-field" placeholder="profe@correo.com" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Contraseña (mín. 6 caracteres)</label>
            <input v-model="regForm.password" type="password" minlength="6" required class="input-field" placeholder="••••••••" />
          </div>
          <button type="submit" class="btn-primary w-full" :disabled="loading">
            {{ loading ? 'Creando cuenta...' : 'Crear cuenta de Profesor' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
