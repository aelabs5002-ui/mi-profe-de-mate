<script setup lang="ts">
import { Play, Camera, Gamepad2, Sparkles, CheckCircle2, AlertCircle, Clock } from 'lucide-vue-next'

definePageMeta({ layout: 'alumno' })

const { fetchMe } = useSession()
const { data, refresh } = await useFetch<any>('/api/misiones/actual')
const { data: catalogo } = await useFetch<{ temas: Array<{ codigo: string; tema: string }> }>('/api/catalogo')

const creando = ref(false)
const err = ref('')

const pasosCompletados = computed(() => {
  const pasos = data.value?.misionActiva?.pasos || []
  return pasos.filter((p: any) => p.estado === 'completado').length
})
const totalPasos = computed(() => data.value?.misionActiva?.pasos?.length || 0)

const empezarMision = async (tema?: string) => {
  err.value = ''
  if (!tema && data.value?.misionActiva) {
    await navigateTo(`/alumno/entrenar?misionId=${data.value.misionActiva.id}`)
    return
  }

  creando.value = true
  try {
    const res = await $fetch<{ mision: { id: string } }>('/api/misiones/crear', {
      method: 'POST',
      body: { tema }
    })
    await fetchMe(true)
    await refresh()
    await navigateTo(`/alumno/entrenar?misionId=${res.mision.id}`)
  } catch (e: any) {
    err.value = e?.data?.statusMessage || 'No se pudo iniciar la misión.'
  } finally {
    creando.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Aviso de control parental si aplica -->
    <div
      v-if="data?.parental && !data.parental.permitido"
      class="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-amber-900"
    >
      <Clock class="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
      <div class="text-sm font-semibold">{{ data.parental.motivo }}</div>
    </div>

    <div v-if="err" class="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
      {{ err }}
    </div>

    <!-- Tarjeta principal: Misión del Día (MMCG) -->
    <section class="rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white p-6 sm:p-7 shadow-soft space-y-5">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold tracking-wide">
          <Sparkles class="w-3.5 h-3.5" />
          {{ data?.misionActiva?.origen === 'tarea' ? 'MISIÓN DE TU TAREA' : 'MISIÓN ADAPTATIVA DEL DÍA' }}
        </span>
        <span v-if="data?.parental?.permitido" class="text-xs font-semibold text-blue-100">
          ⏱️ {{ data.parental.minutosRestantes }} min disponibles hoy
        </span>
      </div>

      <div class="space-y-1.5">
        <h1 class="text-2xl sm:text-3xl font-extrabold leading-tight">
          {{ data?.misionActiva?.titulo || '¡Misión diaria completada!' }}
        </h1>
        <p class="text-sm text-blue-100">
          {{
            data?.misionActiva?.descripcion ||
            'Excelente constancia hoy. Puedes iniciar una nueva práctica libre o subir una tarea escolar.'
          }}
        </p>
      </div>

      <div v-if="data?.misionActiva" class="space-y-2">
        <div class="flex items-center justify-between text-xs font-bold text-blue-100">
          <span>Progreso de la misión</span>
          <span>{{ pasosCompletados }} / {{ totalPasos }} ejercicios</span>
        </div>
        <div class="w-full h-2.5 bg-white/25 rounded-full overflow-hidden">
          <div
            class="h-full bg-[#10B981] transition-all duration-300"
            :style="{ width: `${totalPasos ? (pasosCompletados / totalPasos) * 100 : 0}%` }"
          />
        </div>
      </div>

      <div class="flex flex-wrap gap-3 pt-1">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-blue-50 text-[#1D4ED8] font-extrabold text-sm px-6 py-3.5 shadow-sm transition active:scale-95 disabled:opacity-50"
          :disabled="creando || (data?.parental && !data.parental.permitido)"
          @click="empezarMision()"
        >
          <Play class="w-4 h-4 fill-current" />
          {{
            creando
              ? 'Preparando...'
              : data?.misionActiva
                ? pasosCompletados > 0
                  ? 'Continuar Misión'
                  : 'Comenzar Misión'
                : 'Nueva Misión Adaptativa'
          }}
        </button>

        <NuxtLink
          to="/alumno/subir-tarea"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm px-5 py-3.5 transition"
        >
          <Camera class="w-4 h-4" /> Subir foto / PDF de tarea
        </NuxtLink>
      </div>
    </section>

    <!-- Accesos rápidos (Subir Tarea + Motores de Juego) -->
    <section class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <NuxtLink to="/alumno/subir-tarea" class="card-surface hover:border-[#2563EB] transition flex items-start gap-3.5 group">
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
          <Camera class="w-6 h-6" />
        </div>
        <div>
          <h2 class="font-display font-extrabold text-base text-slate-900">Resolver mi tarea con guía IA</h2>
          <p class="text-xs text-slate-600 mt-0.5">
            Toma una foto a tu cuaderno o sube un PDF. El profe te guiará paso a paso sin hacerla por ti.
          </p>
        </div>
      </NuxtLink>

      <NuxtLink to="/alumno/juegos" class="card-surface hover:border-emerald-500 transition flex items-start gap-3.5 group">
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
          <Gamepad2 class="w-6 h-6" />
        </div>
        <div>
          <h2 class="font-display font-extrabold text-base text-slate-900">Motores de Juego Cognitivos</h2>
          <p class="text-xs text-slate-600 mt-0.5">
            Entrena cálculo mental, equivalencias de fracciones y despejes ganando XP para tu CCA.
          </p>
        </div>
      </NuxtLink>
    </section>

    <!-- Elegir tema rápido -->
    <section class="card-surface space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-extrabold text-slate-900">Practicar un tema específico</h2>
        <span class="text-xs text-slate-500">4 retos guiados</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="t in catalogo?.temas || []"
          :key="t.codigo"
          type="button"
          class="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-[#2563EB] text-xs font-bold text-slate-700 hover:text-[#2563EB] transition"
          :disabled="creando || (data?.parental && !data.parental.permitido)"
          @click="empezarMision(t.tema)"
        >
          {{ t.tema }}
        </button>
      </div>
    </section>

    <!-- Focos de refuerzo CCA + Misiones recientes -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <section class="card-surface space-y-3">
        <h2 class="text-base font-extrabold text-slate-900">Foco inteligente (CCA)</h2>
        <div v-if="(data?.erroresFrecuentes || []).length === 0" class="text-xs text-emerald-700 bg-emerald-50 rounded-xl p-3 font-semibold flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 shrink-0" />
          ¡Sin tropiezos pendientes! Sigue entrenando para certificar nuevas competencias SECC.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="e in data.erroresFrecuentes"
            :key="e.id"
            class="rounded-xl bg-amber-50/80 border border-amber-200/70 p-3 flex items-center justify-between gap-2"
          >
            <div class="flex items-center gap-2 min-w-0">
              <AlertCircle class="w-4 h-4 text-amber-600 shrink-0" />
              <div class="min-w-0">
                <div class="text-xs font-extrabold text-slate-900 truncate">{{ e.tema }}</div>
                <div class="text-[11px] text-amber-800">Foco: {{ e.errorTag.replace('_', ' ') }} ({{ e.conteo }})</div>
              </div>
            </div>
            <button
              type="button"
              class="text-xs font-extrabold text-[#2563EB] hover:underline shrink-0"
              @click="empezarMision(e.tema)"
            >
              Reforzar →
            </button>
          </div>
        </div>
      </section>

      <section class="card-surface space-y-3">
        <h2 class="text-base font-extrabold text-slate-900">Actividad reciente</h2>
        <div v-if="(data?.misionesRecientes || []).length === 0" class="text-xs text-slate-500">
          Aún no tienes misiones completadas. ¡Inicia la primera hoy!
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="m in data.misionesRecientes"
            :key="m.id"
            class="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 flex items-center justify-between gap-2"
          >
            <div class="min-w-0">
              <div class="text-xs font-bold text-slate-900 truncate">{{ m.titulo }}</div>
              <div class="text-[11px] text-slate-500">{{ m.fechaClave }} · Motor {{ m.motorId }}</div>
            </div>
            <span
              class="text-[11px] font-extrabold px-2 py-0.5 rounded-full shrink-0"
              :class="m.estado === 'completada' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'"
            >
              {{ m.estado === 'completada' ? `${m.precisionPct}% · +${m.xpGanado} XP` : 'En curso' }}
            </span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
