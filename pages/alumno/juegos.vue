<script setup lang="ts">
import { Gamepad2, Lock, CheckCircle2 } from 'lucide-vue-next'

definePageMeta({ layout: 'alumno' })

const { fetchMe } = useSession()
const { data: catalogo } = await useFetch<{
  motores: Array<{ id: string; nombre: string; foco: string; disponible: boolean; color: string }>
}>('/api/catalogo')

const motorActivo = ref<'A' | 'C' | 'F'>('A')
const toast = ref('')

const guardarResultadoJuego = async (payload: {
  motorId: 'A' | 'C' | 'F'
  tema: string
  dificultad: number
  aciertos: number
  total: number
  rachaMaxima: number
  duracionSeg: number
}) => {
  toast.value = ''
  try {
    const res = await $fetch<{ xpGanado: number; precisionPct: number; recienCertificada: boolean }>(
      '/api/juegos/completar',
      { method: 'POST', body: payload }
    )
    await fetchMe(true)
    toast.value = res.recienCertificada
      ? `🏆 +${res.xpGanado} XP (${res.precisionPct}%) — ¡Certificaste ${payload.tema} en el SECC!`
      : `✨ ¡Partida guardada en tu CCA! Ganaste +${res.xpGanado} XP (${res.precisionPct}% precisión).`
  } catch {
    toast.value = 'Partida terminada.'
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <span class="text-xs font-extrabold uppercase tracking-wider text-emerald-600">Neuroaprendizaje Gamificado</span>
      <h1 class="text-2xl font-extrabold text-slate-900 mt-0.5">Consola de Motores Cognitivos</h1>
      <p class="text-sm text-slate-600 mt-1">
        Cada motor entrena una habilidad matemática real y registra evidencia directa en tu Carta Cognitiva (CCA).
      </p>
    </div>

    <div
      v-if="toast"
      class="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-bold text-emerald-800 flex items-center gap-2"
    >
      <CheckCircle2 class="w-5 h-5 shrink-0" />
      <span>{{ toast }}</span>
    </div>

    <!-- Selector de motores disponibles -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <button
        v-for="m in (catalogo?.motores || []).filter((x) => x.disponible)"
        :key="m.id"
        type="button"
        class="rounded-2xl p-4 border-2 text-left transition"
        :class="
          motorActivo === m.id
            ? 'bg-blue-50/80 border-[#2563EB] shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300'
        "
        @click="motorActivo = m.id as 'A' | 'C' | 'F'; toast = ''"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-extrabold uppercase text-[#2563EB]">Motor {{ m.id }}</span>
          <Gamepad2 class="w-4 h-4 text-slate-400" />
        </div>
        <div class="font-display font-extrabold text-base text-slate-900 mt-1">{{ m.nombre }}</div>
        <div class="text-xs text-slate-500 mt-0.5">{{ m.foco }}</div>
      </button>
    </div>

    <!-- Motor jugable activo -->
    <MotorDisparoNumerico v-if="motorActivo === 'A'" @finished="guardarResultadoJuego" />
    <MotorMemoryMatematico v-else-if="motorActivo === 'C'" @finished="guardarResultadoJuego" />
    <MotorConstructorExpresiones v-else-if="motorActivo === 'F'" @finished="guardarResultadoJuego" />

    <!-- Catálogo completo (Próximos motores B, D, E, G, H) -->
    <section class="card-surface space-y-3">
      <h2 class="text-base font-extrabold text-slate-900">Catálogo de Motores Próximos (v2)</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        <div
          v-for="m in (catalogo?.motores || []).filter((x) => !x.disponible)"
          :key="m.id"
          class="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex items-start gap-2.5 opacity-80"
        >
          <Lock class="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <div class="text-xs font-extrabold text-slate-700">Motor {{ m.id }} · {{ m.nombre }}</div>
            <div class="text-[11px] text-slate-500">{{ m.foco }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
