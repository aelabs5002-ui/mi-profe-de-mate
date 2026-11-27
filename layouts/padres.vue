<script setup lang="ts">
import { BarChart3, BookOpen, SlidersHorizontal, GraduationCap, ArrowLeft, LogOut, Lock } from 'lucide-vue-next'

const route = useRoute()
const { padre, padresDesbloqueado, logout } = useSession()

const pinInput = ref('')
const pinError = ref('')
const checking = ref(false)

const navItems = [
  { to: '/padres', label: 'Resumen Semanal', icon: BarChart3 },
  { to: '/padres/biblioteca', label: 'Biblioteca Tutor', icon: BookOpen },
  { to: '/padres/profesores', label: 'Profesores', icon: GraduationCap },
  { to: '/padres/controles', label: 'Controles y Familia', icon: SlidersHorizontal }
]

const isActive = (path: string) => {
  if (path === '/padres') return route.path === '/padres'
  return route.path.startsWith(path)
}

const verificarPin = async () => {
  pinError.value = ''
  checking.value = true
  try {
    await $fetch('/api/auth/pin', { method: 'POST', body: { pin: pinInput.value } })
    padresDesbloqueado.value = true
    pinInput.value = ''
  } catch (err: any) {
    pinError.value = err?.data?.statusMessage || 'PIN incorrecto.'
  } finally {
    checking.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F7FAFC] flex flex-col">
    <!-- Puerta PIN Parental -->
    <div v-if="!padresDesbloqueado" class="flex-1 flex items-center justify-center p-4">
      <div class="card-surface w-full max-w-sm space-y-5 text-center">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
          <Lock class="w-7 h-7" />
        </div>
        <div>
          <h1 class="text-xl font-extrabold text-slate-900">Portal Padres</h1>
          <p class="text-xs text-slate-500 mt-1">
            Ingresa el PIN de 4 dígitos para acceder a reportes, biblioteca y controles parentales.
          </p>
        </div>

        <div v-if="pinError" class="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">
          {{ pinError }}
        </div>

        <form class="space-y-3" @submit.prevent="verificarPin">
          <input
            v-model="pinInput"
            type="password"
            inputmode="numeric"
            maxlength="4"
            required
            placeholder="••••"
            class="input-field text-center text-2xl tracking-[0.5em] font-bold"
          />
          <button type="submit" class="btn-primary w-full" :disabled="checking">
            {{ checking ? 'Verificando...' : 'Desbloquear Portal Padres' }}
          </button>
        </form>

        <p class="text-[11px] text-slate-400">
          En cuenta demo el PIN por defecto es <strong class="text-slate-600">1234</strong>.
        </p>

        <NuxtLink to="/alumno" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline">
          <ArrowLeft class="w-3.5 h-3.5" /> Volver a la vista del alumno
        </NuxtLink>
      </div>
    </div>

    <!-- Layout Portal Padres desbloqueado -->
    <div v-else class="flex-1 flex flex-col lg:flex-row">
      <aside class="hidden lg:flex lg:flex-col lg:w-64 bg-slate-900 text-white shrink-0">
        <div class="p-5 border-b border-white/10">
          <div class="text-xs font-bold uppercase tracking-wider text-blue-300">Portal Padres</div>
          <div class="font-display font-extrabold text-lg mt-0.5">Mi Profe de Mate</div>
          <div class="text-xs text-slate-400 mt-1 truncate">{{ padre?.nombre }}</div>
        </div>

        <nav class="flex-1 p-3 space-y-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition"
            :class="isActive(item.to) ? 'bg-[#2563EB] text-white' : 'text-slate-300 hover:bg-white/10'"
          >
            <component :is="item.icon" class="w-4 h-4 shrink-0" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </nav>

        <div class="p-4 border-t border-white/10 space-y-2">
          <NuxtLink
            to="/alumno"
            class="w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 py-2 text-xs font-bold text-white transition"
          >
            <ArrowLeft class="w-4 h-4" /> Volver al Alumno
          </NuxtLink>
          <button
            class="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 py-2 text-xs font-bold text-rose-200 transition"
            @click="logout"
          >
            <LogOut class="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div class="flex-1 flex flex-col min-w-0">
        <header class="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-8 h-14 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <NuxtLink to="/alumno" class="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600">
              <ArrowLeft class="w-5 h-5" />
            </NuxtLink>
            <span class="font-display font-extrabold text-slate-900">Portal de Padres · {{ padre?.pais }}</span>
          </div>
          <div class="flex items-center gap-2">
            <NuxtLink to="/alumno" class="hidden sm:inline-flex btn-secondary text-xs py-1.5 px-3">
              Modo Alumno
            </NuxtLink>
          </div>
        </header>

        <!-- Pestañas móviles -->
        <div class="lg:hidden bg-white border-b border-slate-200 px-3 py-2 flex gap-2 overflow-x-auto">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition"
            :class="isActive(item.to) ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-600'"
          >
            {{ item.label }}
          </NuxtLink>
        </div>

        <main class="flex-1 w-full max-w-5xl mx-auto p-4 lg:p-8">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
