<script setup lang="ts">
import { GraduationCap, KeyRound, Copy, RefreshCw, Trash2, CheckCircle2 } from 'lucide-vue-next'

definePageMeta({ layout: 'padres' })

const { alumnoActivo } = useSession()
const selectedAlumnoId = ref(alumnoActivo.value?.id || '')

const { data, refresh } = await useFetch<any>(() =>
  selectedAlumnoId.value ? `/api/padres/profesores?alumnoId=${selectedAlumnoId.value}` : '/api/padres/profesores'
)
watch(selectedAlumnoId, () => refresh())

const generating = ref(false)
const copied = ref(false)
const msg = ref('')

const generarCodigo = async () => {
  msg.value = ''
  generating.value = true
  try {
    await $fetch('/api/padres/profesores/codigo', {
      method: 'POST',
      body: { alumnoId: data.value?.alumno?.id }
    })
    await refresh()
    msg.value = 'Código actualizado. Compártelo con el profesor de matemáticas para que pueda monitorear y asignar misiones.'
  } finally {
    generating.value = false
  }
}

const copiarCodigo = async () => {
  if (!data.value?.codigo || !import.meta.client) return
  await navigator.clipboard.writeText(data.value.codigo)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

const desvincular = async (vinculoId: string) => {
  await $fetch(`/api/padres/profesores/${vinculoId}`, { method: 'DELETE' })
  msg.value = 'Profesor desvinculado. Ya no tiene acceso al progreso del estudiante.'
  await refresh()
}
</script>

<template>
  <div class="space-y-6 max-w-3xl">
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <span class="text-xs font-extrabold uppercase tracking-wider text-indigo-600">Enlace Seguro Familia ↔ Escuela</span>
        <h1 class="text-2xl font-extrabold text-slate-900 mt-0.5">Profesores Vinculados</h1>
        <p class="text-sm text-slate-600 mt-1">
          Conecta al profesor de matemáticas de <strong>{{ data?.alumno?.nombre }}</strong> para que vea su Carta Cognitiva, deje notas al Tutor IA y le asigne misiones guiadas.
        </p>
      </div>
      <select v-if="(data?.alumnos || []).length > 1" v-model="selectedAlumnoId" class="input-field w-auto text-xs font-bold">
        <option v-for="a in data?.alumnos || []" :key="a.id" :value="a.id">
          {{ a.avatar }} {{ a.nombre }} ({{ a.grado }})
        </option>
      </select>
    </div>

    <div v-if="msg" class="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-700 flex items-center gap-2">
      <CheckCircle2 class="w-4 h-4 shrink-0" /> <span>{{ msg }}</span>
    </div>

    <!-- Tarjeta de código de vinculación -->
    <section class="card-surface border-indigo-200 bg-indigo-50/40 space-y-4">
      <div class="flex items-start gap-3">
        <div class="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
          <KeyRound class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-base font-extrabold text-slate-900">Código de invitación para el profesor</h2>
          <p class="text-xs text-slate-600 mt-0.5">
            El profesor entra a <strong>Portal Docente (`/profesor/login`)</strong>, introduce este código y queda enlazado solo a <strong>{{ data?.alumno?.nombre }}</strong> (nunca ve tu PIN ni otros hijos).
          </p>
        </div>
      </div>

      <div v-if="data?.codigo" class="flex items-center gap-3 flex-wrap">
        <div class="rounded-2xl bg-white border-2 border-indigo-300 px-5 py-3 font-display font-black text-2xl tracking-[0.2em] text-indigo-700 shadow-xs">
          {{ data.codigo }}
        </div>
        <button type="button" class="btn-primary text-xs py-2.5 px-4" @click="copiarCodigo">
          <Copy class="w-4 h-4" /> {{ copied ? '¡Copiado!' : 'Copiar código' }}
        </button>
        <button type="button" class="btn-secondary text-xs py-2.5 px-3.5" :disabled="generating" @click="generarCodigo">
          <RefreshCw class="w-4 h-4" /> Regenerar
        </button>
      </div>

      <div v-else>
        <button type="button" class="btn-primary" :disabled="generating" @click="generarCodigo">
          <KeyRound class="w-4 h-4" /> {{ generating ? 'Generando...' : `Generar código para ${data?.alumno?.nombre || 'estudiante'}` }}
        </button>
      </div>
    </section>

    <!-- Lista de profesores vinculados -->
    <section class="card-surface space-y-3">
      <h2 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
        <GraduationCap class="w-5 h-5 text-indigo-600" /> Profesores con acceso ({{ (data?.vinculos || []).length }})
      </h2>

      <div v-if="(data?.vinculos || []).length === 0" class="text-xs text-slate-500">
        Aún no hay profesores vinculados a {{ data?.alumno?.nombre }}.
      </div>

      <div v-else class="space-y-2.5">
        <div
          v-for="v in data.vinculos"
          :key="v.id"
          class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-start justify-between gap-3"
        >
          <div class="space-y-1 min-w-0">
            <div class="font-display font-extrabold text-sm text-slate-900">{{ v.profesor.nombre }}</div>
            <div class="text-xs text-slate-500">
              {{ v.profesor.institucion || 'Docente independiente' }} · {{ v.profesor.correo }}
            </div>
            <p v-if="v.notaPedagogica" class="text-xs text-indigo-700 bg-indigo-50 rounded-lg px-2.5 py-1.5 mt-1">
              <strong>Nota al Tutor IA:</strong> {{ v.notaPedagogica }}
            </p>
          </div>
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold inline-flex items-center gap-1 shrink-0 transition"
            @click="desvincular(v.id)"
          >
            <Trash2 class="w-3.5 h-3.5" /> Desvincular
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
