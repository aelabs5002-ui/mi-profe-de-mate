<script setup lang="ts">
import { Award, Download, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-vue-next'

definePageMeta({ layout: 'alumno' })

const { data } = await useFetch<any>('/api/cca')
</script>

<template>
  <div class="space-y-6">
    <div>
      <span class="text-xs font-extrabold uppercase tracking-wider text-[#2563EB]">Carta Cognitiva del Alumno (CCA)</span>
      <h1 class="text-2xl font-extrabold text-slate-900 mt-0.5">Mi Progreso y Certificados SECC</h1>
      <p class="text-sm text-slate-600 mt-1">
        Cada competencia se certifica automáticamente al lograr <strong>90%+ en 3 sesiones</strong> de dificultad media o superior sin usar pistas.
      </p>
    </div>

    <!-- Métricas globales -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="card-surface p-4 text-center">
        <div class="text-xs font-bold text-slate-500">Dominio medio</div>
        <div class="font-display font-black text-2xl text-[#2563EB] mt-1">{{ data?.resumen?.promedioDominio || 0 }}%</div>
      </div>
      <div class="card-surface p-4 text-center">
        <div class="text-xs font-bold text-slate-500">Certificados SECC</div>
        <div class="font-display font-black text-2xl text-emerald-600 mt-1">{{ data?.resumen?.certificadas || 0 }}</div>
      </div>
      <div class="card-surface p-4 text-center">
        <div class="text-xs font-bold text-slate-500">Misiones</div>
        <div class="font-display font-black text-2xl text-slate-900 mt-1">{{ data?.resumen?.misionesCompletadas || 0 }}</div>
      </div>
      <div class="card-surface p-4 text-center">
        <div class="text-xs font-bold text-slate-500">Mejor racha</div>
        <div class="font-display font-black text-2xl text-orange-600 mt-1">{{ data?.alumno?.mejorRacha || 0 }} días</div>
      </div>
    </div>

    <!-- Matriz de Competencias CCA + Certificados SECC -->
    <section class="card-surface space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <Award class="w-5 h-5 text-emerald-600" /> Competencias por Área
        </h2>
        <span class="text-xs font-semibold text-slate-500">Currículo {{ data?.pais }}</span>
      </div>

      <div v-if="(data?.competencias || []).length === 0" class="text-sm text-slate-500 py-4 text-center">
        Completa tu primera misión o partida de juego para empezar a construir tu Carta Cognitiva.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="c in data.competencias"
          :key="c.id"
          class="rounded-2xl border p-4 space-y-2.5"
          :class="c.certificada ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'"
        >
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[11px] font-extrabold text-slate-400">{{ c.codigo }}</span>
                <span v-if="c.certificada" class="pill-mastery">
                  <CheckCircle2 class="w-3.5 h-3.5" /> Certificada SECC
                </span>
                <span v-else class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB]">
                  SECC: {{ c.sesionesExitosasSinAyuda }}/3 sesiones sin pistas
                </span>
              </div>
              <h3 class="font-display font-extrabold text-base text-slate-900 mt-0.5">{{ c.tema }}</h3>
            </div>

            <div class="flex items-center gap-3">
              <div class="text-right">
                <div class="font-display font-black text-xl text-slate-900">{{ c.nivelDominio }}%</div>
                <div class="text-[11px] text-slate-500">{{ c.correctos }}/{{ c.totalEjercicios }} aciertos</div>
              </div>
              <a
                v-if="c.certificada"
                :href="`/api/secc/certificado/${c.id}`"
                target="_blank"
                class="btn-success text-xs py-2 px-3"
              >
                <Download class="w-4 h-4" /> PDF
              </a>
            </div>
          </div>

          <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="c.certificada ? 'bg-emerald-500' : 'bg-[#2563EB]'"
              :style="{ width: `${c.nivelDominio}%` }"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Errores frecuentes y superados -->
    <section class="card-surface space-y-3">
      <h2 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
        <TrendingUp class="w-5 h-5 text-[#2563EB]" /> Mapa de Aprendizaje desde el Error
      </h2>
      <p class="text-xs text-slate-500">
        🧠 El error es útil para aprender: aquí ves qué áreas estamos reforzando y cuáles ya superaste.
      </p>

      <div v-if="(data?.errores || []).length === 0" class="text-xs text-slate-500">
        Todavía no hay errores registrados en tu memoria cognitiva.
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div
          v-for="e in data.errores"
          :key="e.id"
          class="rounded-xl border p-3 flex items-center justify-between gap-2"
          :class="e.superado ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/60 border-amber-200'"
        >
          <div class="flex items-center gap-2 min-w-0">
            <CheckCircle2 v-if="e.superado" class="w-4 h-4 text-emerald-600 shrink-0" />
            <AlertTriangle v-else class="w-4 h-4 text-amber-600 shrink-0" />
            <div class="min-w-0">
              <div class="text-xs font-extrabold text-slate-900 truncate">{{ e.etiquetaLegible }}</div>
              <div class="text-[11px] text-slate-600 truncate">{{ e.tema }}</div>
            </div>
          </div>
          <span class="text-[11px] font-extrabold shrink-0" :class="e.superado ? 'text-emerald-700' : 'text-amber-800'">
            {{ e.superado ? 'Superado ✓' : `${e.conteo} veces` }}
          </span>
        </div>
      </div>
    </section>
  </div>
</template>
