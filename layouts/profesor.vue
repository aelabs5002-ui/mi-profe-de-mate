<script setup lang="ts">
import { GraduationCap, Users, LogOut } from 'lucide-vue-next'

const route = useRoute()
const { profesor, logoutProfesor } = useProfesorSession()
</script>

<template>
  <div class="min-h-screen bg-[#F7FAFC] flex flex-col">
    <header class="sticky top-0 z-30 bg-slate-900 text-white border-b border-white/10">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <NuxtLink to="/profesor" class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-sm shrink-0">
            <GraduationCap class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <div class="font-display font-extrabold text-sm sm:text-base leading-tight truncate">
              Mi Profe de Mate · Portal Docente
            </div>
            <div class="text-[11px] text-indigo-200 truncate">
              {{ profesor?.nombre }}{{ profesor?.institucion ? ` · ${profesor.institucion}` : '' }}
            </div>
          </div>
        </NuxtLink>

        <div class="flex items-center gap-2 shrink-0">
          <NuxtLink
            to="/profesor"
            class="px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
            :class="route.path === '/profesor' ? 'bg-indigo-500 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-100'"
          >
            <Users class="w-4 h-4" />
            <span class="hidden sm:inline">Mis Estudiantes</span>
          </NuxtLink>
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold inline-flex items-center gap-1.5 transition"
            @click="logoutProfesor"
          >
            <LogOut class="w-4 h-4" />
            <span class="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20">
      <slot />
    </main>
  </div>
</template>
