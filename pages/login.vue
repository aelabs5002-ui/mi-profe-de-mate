<script setup lang="ts">
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-vue-next'

definePageMeta({ layout: false })

const { demoMode, setSession, fetchMe } = useSession()
const correo = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const demoLoading = ref(false)
const errorMsg = ref('')

const entrar = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    const res = await $fetch<{ padre: any; alumnoActivo: any }>('/api/auth/login', {
      method: 'POST',
      body: { correo: correo.value.trim(), password: password.value }
    })
    setSession(res.padre, res.alumnoActivo)
    await fetchMe(true)
    await navigateTo(res.padre.alumnos?.length > 1 ? '/seleccionar-alumno' : '/alumno')
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'No se pudo iniciar sesión.'
  } finally {
    loading.value = false
  }
}

const entrarDemo = async () => {
  errorMsg.value = ''
  demoLoading.value = true
  try {
    const res = await $fetch<{ padre: any; alumnoActivo: any }>('/api/auth/login', {
      method: 'POST',
      body: { demo: true }
    })
    setSession(res.padre, res.alumnoActivo)
    await fetchMe(true)
    await navigateTo('/seleccionar-alumno')
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'Error iniciando demostración.'
  } finally {
    demoLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-blue-50/70 via-[#F7FAFC] to-emerald-50/40 flex items-center justify-center p-4 py-8">
    <div class="w-full max-w-md space-y-5">
      <!-- Marca -->
      <div class="text-center space-y-2">
        <div class="w-16 h-16 mx-auto rounded-3xl bg-[#2563EB] text-white flex items-center justify-center text-3xl shadow-soft">
          🧮
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Mi Profe de Mate</h1>
        <p class="text-sm text-slate-600">
          Tutor matemático con IA socrática · Aprende paso a paso sin memorizar sin sentido
        </p>
      </div>

      <!-- Acceso rápido Demo 1 clic -->
      <div v-if="demoMode" class="card-surface border-blue-200 bg-white space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-extrabold uppercase tracking-wider text-[#2563EB] inline-flex items-center gap-1.5">
            <Sparkles class="w-3.5 h-3.5" /> Prueba rápida sin registro
          </span>
          <span class="pill-mastery">1 clic</span>
        </div>
        <p class="text-xs text-slate-600">
          Explora una familia de ejemplo con 2 hijos (Sofía y Mateo), Carta Cognitiva activa, Certificado SECC PDF y Portal Padres (PIN: <strong>1234</strong>).
        </p>
        <button type="button" class="btn-success w-full justify-between" :disabled="demoLoading" @click="entrarDemo">
          <span>{{ demoLoading ? 'Preparando experiencia...' : 'Entrar en Modo Demostración' }}</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>

      <!-- Login familiar -->
      <div class="card-surface space-y-4">
        <h2 class="text-base font-extrabold text-slate-900">Iniciar sesión familiar</h2>

        <div v-if="errorMsg" class="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
          {{ errorMsg }}
        </div>

        <form class="space-y-3.5" @submit.prevent="entrar">
          <div>
            <label for="correo" class="block text-xs font-bold text-slate-700 mb-1">Correo del representante</label>
            <div class="relative">
              <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                id="correo"
                v-model="correo"
                type="email"
                required
                autocomplete="username"
                autocapitalize="none"
                autocorrect="off"
                spellcheck="false"
                placeholder="familia@correo.com"
                class="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-xs font-bold text-slate-700 mb-1">Contraseña</label>
            <div class="relative">
              <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                placeholder="••••••••"
                class="input-field pl-10 pr-10"
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

          <button type="submit" class="btn-primary w-full" :disabled="loading">
            {{ loading ? 'Ingresando...' : 'Iniciar sesión' }}
          </button>
        </form>

        <div class="pt-3 border-t border-slate-100 text-center text-sm text-slate-600">
          ¿Primera vez aquí?
          <NuxtLink to="/registro" class="font-extrabold text-[#2563EB] hover:underline ml-1">
            Crear cuenta familiar gratis
          </NuxtLink>
        </div>
      </div>

      <!-- Acceso Portal Profesor -->
      <NuxtLink
        to="/profesor/login"
        class="card-surface p-4 border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 transition flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg shrink-0">
            👩‍🏫
          </div>
          <div>
            <div class="font-display font-extrabold text-sm text-slate-900">¿Eres profesor de matemáticas?</div>
            <div class="text-xs text-slate-600">Entra al Portal Docente para monitorear y asignar misiones</div>
          </div>
        </div>
        <ArrowRight class="w-4 h-4 text-indigo-600 shrink-0" />
      </NuxtLink>

      <p class="text-center text-xs text-slate-500">
        🧠 Constitución Pedagógica: el error es útil y parte del aprendizaje.
      </p>
    </div>
  </div>
</template>
