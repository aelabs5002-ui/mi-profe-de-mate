<script setup lang="ts">
import { Download, Sparkles, AlertTriangle, CheckCircle2, Award, Clock } from 'lucide-vue-next'

definePageMeta({ layout: 'padres' })

const { alumnoActivo } = useSession()
const selectedAlumnoId = ref(alumnoActivo.value?.id || '')

const { data, refresh } = await useFetch<any>(() =>
  selectedAlumnoId.value ? `/api/padres/resumen?alumnoId=${selectedAlumnoId.value}` : '/api/padres/resumen'
)

watch(selectedAlumnoId, () => refresh())
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">Resumen Semanal de Progreso</h1>
        <p class="text-sm text-slate-600">Seguimiento real basado en la Carta Cognitiva del Alumno (CCA).</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <select v-model="selectedAlumnoId" class="input-field w-auto text-xs font-bold">
          <option v-for="a in data?.alumnos || []" :key="a.id" :value="a.id">
            {{ a.avatar }} {{ a.nombre }} ({{ a.grado }})
          </option>
        </select>
        <a
          :href="`/api/padres/reporte-pdf?alumnoId=${data?.alumno?.id || ''}`"
          target="_blank"
          class="btn-primary text-xs py-2.5 px-4"
        >
          <Download class="w-4 h-4" /> Descargar Reporte PDF
        </a>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card-surface p-4">
        <div class="text-xs font-bold text-slate-500">Misiones (7 días)</div>
        <div class="font-display font-black text-2xl text-[#2563EB] mt-1">
          {{ data?.metricas?.misionesCompletadasSemana || 0 }}
        </div>
      </div>
      <div class="card-surface p-4">
        <div class="text-xs font-bold text-slate-500">Partidas de Juego</div>
        <div class="font-display font-black text-2xl text-violet-600 mt-1">
          {{ data?.metricas?.juegosSemana || 0 }}
        </div>
      </div>
      <div class="card-surface p-4">
        <div class="text-xs font-bold text-slate-500">Certificados SECC</div>
        <div class="font-display font-black text-2xl text-emerald-600 mt-1">
          {{ data?.metricas?.competenciasCertificadas || 0 }}
        </div>
      </div>
      <div class="card-surface p-4">
        <div class="text-xs font-bold text-slate-500 flex items-center gap-1">
          <Clock class="w-3.5 h-3.5" /> Tiempo hoy
        </div>
        <div class="font-display font-black text-2xl text-slate-900 mt-1">
          {{ data?.metricas?.minutosHoy || 0 }} / {{ data?.metricas?.limiteMinutosDiario || 30 }} min
        </div>
      </div>
    </div>

    <!-- Recomendaciones pedagógicas -->
    <section class="card-surface bg-blue-50/50 border-blue-200 space-y-3">
      <h2 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
        <Sparkles class="w-5 h-5 text-[#2563EB]" /> Recomendaciones para acompañar en casa
      </h2>
      <ul class="space-y-2">
        <li
          v-for="(rec, idx) in data?.recomendaciones || []"
          :key="idx"
          class="text-sm text-slate-700 bg-white rounded-xl border border-blue-100 p-3.5"
        >
          {{ rec }}
        </li>
      </ul>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- Competencias -->
      <section class="card-surface space-y-3">
        <h2 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Award class="w-5 h-5 text-emerald-600" /> Competencias CCA
        </h2>
        <div v-if="(data?.competencias || []).length === 0" class="text-xs text-slate-500">Sin datos aún.</div>
        <div v-else class="space-y-2.5">
          <div v-for="c in data.competencias" :key="c.id" class="space-y-1">
            <div class="flex items-center justify-between text-xs font-bold">
              <span class="text-slate-800">{{ c.tema }}</span>
              <span :class="c.certificada ? 'text-emerald-700' : 'text-slate-600'">
                {{ c.nivelDominio }}% {{ c.certificada ? '· Certificada ✓' : '' }}
              </span>
            </div>
            <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full"
                :class="c.certificada ? 'bg-emerald-500' : 'bg-[#2563EB]'"
                :style="{ width: `${c.nivelDominio}%` }"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Errores activos -->
      <section class="card-surface space-y-3">
        <h2 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <AlertTriangle class="w-5 h-5 text-amber-500" /> Áreas de refuerzo activas
        </h2>
        <div
          v-if="(data?.erroresActivos || []).length === 0"
          class="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-700 flex items-center gap-2"
        >
          <CheckCircle2 class="w-4 h-4" /> Sin errores frecuentes pendientes esta semana.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="e in data.erroresActivos"
            :key="e.id"
            class="rounded-xl bg-amber-50/70 border border-amber-200 p-3 flex items-center justify-between"
          >
            <div>
              <div class="text-xs font-extrabold text-slate-900">{{ e.etiquetaLegible }}</div>
              <div class="text-[11px] text-slate-600">{{ e.tema }}</div>
            </div>
            <span class="text-xs font-extrabold text-amber-800">{{ e.conteo }} incidencias</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
