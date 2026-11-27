<script setup lang="ts">
import { Link2, Users, Award, AlertTriangle, ArrowRight, Flame, CheckCircle2 } from 'lucide-vue-next'

definePageMeta({ layout: 'profesor' })

const { data, refresh } = await useFetch<any>('/api/profesor/alumnos')

const codigoInput = ref('')
const linking = ref(false)
const linkMsg = ref('')
const linkErr = ref('')

const vincularEstudiante = async () => {
  if (!codigoInput.value.trim() || linking.value) return
  linkMsg.value = ''
  linkErr.value = ''
  linking.value = true
  try {
    const res = await $fetch<{ alumno: { nombre: string; grado: string } }>('/api/profesor/vincular', {
      method: 'POST',
      body: { codigo: codigoInput.value.trim() }
    })
    codigoInput.value = ''
    linkMsg.value = `¡${res.alumno.nombre} (${res.alumno.grado}) vinculado correctamente a tu panel!`
    await refresh()
  } catch (e: any) {
    linkErr.value = e?.data?.statusMessage || 'No pudimos vincular ese código.'
  } finally {
    linking.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado y caja de vinculación -->
    <section class="rounded-3xl bg-gradient-to-br from-indigo-600 to-[#2563EB] text-white p-6 shadow-soft space-y-4">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span class="text-xs font-extrabold uppercase tracking-wider text-indigo-200">Asistente Docente IA</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold mt-0.5">Panel de Estudiantes</h1>
          <p class="text-sm text-indigo-100 mt-1">
            Vincula a tus alumnos con el código que genera su representante en el Portal Padres y monitorea su avance real.
          </p>
        </div>
      </div>

      <form class="flex flex-col sm:flex-row gap-2.5 max-w-xl" @submit.prevent="vincularEstudiante">
        <div class="relative flex-1">
          <Link2 class="w-4 h-4 text-indigo-200 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            v-model="codigoInput"
            type="text"
            maxlength="16"
            placeholder="Código del estudiante (ej. SOF-8K4P)"
            class="w-full rounded-xl bg-white/15 border border-white/30 placeholder-indigo-200 text-white font-extrabold tracking-wider uppercase text-sm pl-10 pr-3.5 py-2.5 focus:outline-none focus:bg-white/20"
          />
        </div>
        <button
          type="submit"
          class="rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 font-extrabold text-sm px-5 py-2.5 transition shrink-0 disabled:opacity-50"
          :disabled="linking || !codigoInput.trim()"
        >
          {{ linking ? 'Vinculando...' : '+ Vincular estudiante' }}
        </button>
      </form>

      <div v-if="linkMsg" class="rounded-xl bg-emerald-500/20 border border-emerald-300/40 px-3.5 py-2 text-xs font-bold text-white flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 shrink-0" /> {{ linkMsg }}
      </div>
      <div v-if="linkErr" class="rounded-xl bg-rose-500/25 border border-rose-300/40 px-3.5 py-2 text-xs font-bold text-white">
        {{ linkErr }}
      </div>
    </section>

    <!-- KPIs del grupo -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="card-surface p-4 flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Users class="w-5 h-5" />
        </div>
        <div>
          <div class="text-xs font-bold text-slate-500">Estudiantes vinculados</div>
          <div class="font-display font-black text-2xl text-slate-900">{{ data?.resumenGrupo?.totalEstudiantes || 0 }}</div>
        </div>
      </div>

      <div class="card-surface p-4 flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
          <Award class="w-5 h-5" />
        </div>
        <div>
          <div class="text-xs font-bold text-slate-500">Dominio medio CCA</div>
          <div class="font-display font-black text-2xl text-[#2563EB]">{{ data?.resumenGrupo?.promedioDominio || 0 }}%</div>
        </div>
      </div>

      <div class="card-surface p-4 flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 class="w-5 h-5" />
        </div>
        <div>
          <div class="text-xs font-bold text-slate-500">Certificados SECC</div>
          <div class="font-display font-black text-2xl text-emerald-600">{{ data?.resumenGrupo?.totalCertificados || 0 }}</div>
        </div>
      </div>
    </div>

    <!-- Alertas de errores frecuentes del grupo -->
    <section v-if="(data?.resumenGrupo?.focosGrupo || []).length > 0" class="card-surface bg-amber-50/50 border-amber-200 space-y-3">
      <h2 class="text-sm font-extrabold text-amber-900 flex items-center gap-2">
        <AlertTriangle class="w-4 h-4 text-amber-600" /> Patrones de error más repetidos en tus alumnos
      </h2>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="f in data.resumenGrupo.focosGrupo"
          :key="f.tag"
          class="rounded-xl bg-white border border-amber-200 px-3 py-2 text-xs font-bold text-slate-800"
        >
          {{ f.etiqueta }}
          <span class="text-amber-700 ml-1">({{ f.alumnos }} alum. · {{ f.incidencias }} incid.)</span>
        </div>
      </div>
    </section>

    <!-- Lista de estudiantes -->
    <section class="space-y-3">
      <h2 class="text-lg font-extrabold text-slate-900">Tus Estudiantes ({{ (data?.estudiantes || []).length }})</h2>

      <div v-if="(data?.estudiantes || []).length === 0" class="card-surface text-center py-10 space-y-2">
        <div class="text-3xl">👩‍🏫</div>
        <h3 class="font-display font-extrabold text-base text-slate-900">Aún no tienes estudiantes vinculados</h3>
        <p class="text-xs text-slate-600 max-w-md mx-auto">
          Pide a un padre o representante que entre a <strong>Portal Padres → Profesores</strong>, genere el código de su hijo y te lo comparta. Al pegarlo arriba aparecerá aquí al instante.
        </p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NuxtLink
          v-for="est in data.estudiantes"
          :key="est.id"
          :to="`/profesor/alumno/${est.id}`"
          class="card-surface hover:border-indigo-400 hover:shadow-soft transition space-y-3.5 block"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shrink-0">
                {{ est.avatar }}
              </div>
              <div class="min-w-0">
                <div class="font-display font-extrabold text-base text-slate-900 truncate">{{ est.nombre }}</div>
                <div class="text-xs text-slate-500 truncate">{{ est.grado }} · {{ est.pais }}</div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="font-display font-black text-xl text-indigo-600">{{ est.promedioDominio }}%</div>
              <div class="text-[10px] font-bold text-slate-400 uppercase">CCA</div>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <span class="pill-streak"><Flame class="w-3.5 h-3.5" /> {{ est.rachaActual }} días</span>
            <span class="pill-mastery">{{ est.certificadas }} SECC</span>
            <span class="text-xs font-bold text-slate-500">{{ est.misionesCompletadas }} misiones</span>
          </div>

          <div v-if="est.erroresTop?.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="e in est.erroresTop.slice(0, 2)"
              :key="`${e.tema}-${e.errorTag}`"
              class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800"
            >
              ⚠️ {{ e.etiqueta }} ({{ e.conteo }})
            </span>
          </div>

          <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-indigo-600">
            <span>Ver radiografía CCA y asignar misión</span>
            <ArrowRight class="w-4 h-4" />
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
