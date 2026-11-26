<script setup lang="ts">
import { Target, Brain, Gamepad2, Award, User, Flame, Zap, Shield } from 'lucide-vue-next'

const route = useRoute()
const { padre, alumnoActivo } = useSession()

const navItems = [
  { to: '/alumno', label: 'Misión', icon: Target },
  { to: '/alumno/entrenar', label: 'Entrenar', icon: Brain },
  { to: '/alumno/juegos', label: 'Juegos', icon: Gamepad2 },
  { to: '/alumno/progreso', label: 'Progreso', icon: Award },
  { to: '/alumno/perfil', label: 'Perfil', icon: User }
]

const isActive = (path: string) => {
  if (path === '/alumno') return route.path === '/alumno'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="min-h-screen bg-[#F7FAFC] flex flex-col">
    <div class="flex-1 flex">
      <!-- Sidebar escritorio -->
      <aside class="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-slate-200 shrink-0">
        <div class="p-5 border-b border-slate-100">
          <NuxtLink to="/alumno" class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center text-xl shadow-sm">
              🧮
            </div>
            <div>
              <div class="font-display font-extrabold text-base text-slate-900 leading-tight">
                Mi Profe de Mate
              </div>
              <div class="text-[11px] font-semibold text-slate-500">
                Tutor IA · {{ padre?.pais || 'Venezuela' }}
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Tarjeta del alumno activo -->
        <div class="p-4">
          <div class="rounded-2xl bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-100 p-3.5 space-y-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl">
                {{ alumnoActivo?.avatar || '🦊' }}
              </div>
              <div class="min-w-0">
                <div class="font-display font-extrabold text-sm text-slate-900 truncate">
                  {{ alumnoActivo?.nombre }}
                </div>
                <div class="text-[11px] font-medium text-slate-600 truncate">
                  {{ alumnoActivo?.grado }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="pill-streak">
                <Flame class="w-3.5 h-3.5" /> {{ alumnoActivo?.rachaActual || 0 }} días
              </span>
              <span class="pill-xp">
                <Zap class="w-3.5 h-3.5" /> {{ alumnoActivo?.xp || 0 }} XP
              </span>
            </div>
          </div>
        </div>

        <nav class="flex-1 px-3 space-y-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition"
            :class="
              isActive(item.to)
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            "
          >
            <component :is="item.icon" class="w-5 h-5 shrink-0" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </nav>

        <div class="p-4 border-t border-slate-100">
          <NuxtLink
            to="/padres"
            class="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 hover:border-[#2563EB] hover:text-[#2563EB] py-2.5 text-xs font-bold text-slate-600 transition"
          >
            <Shield class="w-4 h-4" />
            Portal Padres
          </NuxtLink>
        </div>
      </aside>

      <!-- Área principal -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Header superior móvil/tablet -->
        <header class="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 h-15 py-2.5 flex items-center justify-between lg:px-8">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="lg:hidden w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl shrink-0">
              {{ alumnoActivo?.avatar || '🦊' }}
            </div>
            <div class="min-w-0">
              <div class="font-display font-extrabold text-sm sm:text-base text-slate-900 truncate">
                ¡Hola, {{ alumnoActivo?.nombre || 'Estudiante' }}!
              </div>
              <div class="text-[11px] font-medium text-slate-500 truncate">
                Nivel {{ alumnoActivo?.nivel || 1 }} · {{ alumnoActivo?.grado }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="pill-streak">
              <Flame class="w-3.5 h-3.5" /> {{ alumnoActivo?.rachaActual || 0 }}
            </span>
            <span class="pill-xp">
              <Zap class="w-3.5 h-3.5" /> {{ alumnoActivo?.xp || 0 }} XP
            </span>
            <NuxtLink
              to="/padres"
              class="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-[#2563EB]"
              title="Portal Padres"
              aria-label="Portal Padres"
            >
              <Shield class="w-4 h-4" />
            </NuxtLink>
          </div>
        </header>

        <main class="flex-1 w-full max-w-4xl mx-auto px-4 py-5 pb-24 lg:px-8 lg:py-7 lg:pb-10">
          <slot />
        </main>
      </div>
    </div>

    <!-- Bottom Nav móvil -->
    <nav
      class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_12px_rgba(15,23,42,0.06)]"
      aria-label="Navegación principal"
    >
      <div class="grid grid-cols-5 h-16 max-w-lg mx-auto">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition"
          :class="isActive(item.to) ? 'text-[#2563EB]' : 'text-slate-500'"
        >
          <div class="px-3 py-1 rounded-full transition" :class="isActive(item.to) ? 'bg-blue-50' : ''">
            <component :is="item.icon" class="w-5 h-5" />
          </div>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
