<script setup lang="ts">
import { Save, CheckCircle2, Volume2 } from 'lucide-vue-next'

definePageMeta({ layout: 'padres' })

const { alumnoActivo, fetchMe } = useSession()
const selectedAlumnoId = ref(alumnoActivo.value?.id || '')

const { data, refresh } = await useFetch<any>(() =>
  selectedAlumnoId.value ? `/api/padres/resumen?alumnoId=${selectedAlumnoId.value}` : '/api/padres/resumen'
)
const { data: catalogo } = await useFetch<{ paises: Array<{ pais: string; grados: string[] }> }>('/api/catalogo')

const DIAS = [
  { id: 1, label: 'Lun' },
  { id: 2, label: 'Mar' },
  { id: 3, label: 'Mié' },
  { id: 4, label: 'Jue' },
  { id: 5, label: 'Vie' },
  { id: 6, label: 'Sáb' },
  { id: 0, label: 'Dom' }
]

const paisesLista = computed(() => catalogo.value?.paises || [])
const paisGuardado = computed(() => data.value?.padre?.pais || 'Venezuela')
const estaEnLista = computed(() => paisesLista.value.some((p) => p.pais === paisGuardado.value))

const form = reactive({
  pais: estaEnLista.value ? paisGuardado.value : 'Libre / Internacional',
  paisLibre: estaEnLista.value ? '' : paisGuardado.value,
  grado: data.value?.alumno?.grado || '',
  pinParental: '',
  limiteMinutosDiario: data.value?.alumno?.limiteMinutosDiario ?? 30,
  diasPermitidos: (data.value?.alumno?.diasPermitidos as number[]) || [0, 1, 2, 3, 4, 5, 6],
  maxPistasPorPaso: data.value?.alumno?.maxPistasPorPaso ?? 2,
  vozPermitida: data.value?.alumno?.vozPermitida ?? true,
  instruccionesPadre: data.value?.alumno?.instruccionesPadre || ''
})

const esOpcionLibre = computed(() => form.pais === 'Libre / Internacional')

const gradosDisponibles = computed(() => {
  const found = paisesLista.value.find((p) => p.pais === form.pais)
  const libre = paisesLista.value.find((p) => p.pais === 'Libre / Internacional')
  const base = found?.grados || libre?.grados || ['Práctica Libre (Todos los niveles)']
  if (form.grado && !base.includes(form.grado)) {
    return [form.grado, ...base]
  }
  return base
})

watch(selectedAlumnoId, async () => {
  await refresh()
  if (data.value?.alumno) {
    form.grado = data.value.alumno.grado || ''
    form.limiteMinutosDiario = data.value.alumno.limiteMinutosDiario ?? 30
    form.diasPermitidos = (data.value.alumno.diasPermitidos as number[]) || [0, 1, 2, 3, 4, 5, 6]
    form.maxPistasPorPaso = data.value.alumno.maxPistasPorPaso ?? 2
    form.vozPermitida = data.value.alumno.vozPermitida ?? true
    form.instruccionesPadre = data.value.alumno.instruccionesPadre || ''
  }
})

const toggleDia = (d: number) => {
  if (form.diasPermitidos.includes(d)) {
    if (form.diasPermitidos.length > 1) {
      form.diasPermitidos = form.diasPermitidos.filter((x) => x !== d)
    }
  } else {
    form.diasPermitidos.push(d)
  }
}

const saving = ref(false)
const okMsg = ref('')

const guardar = async () => {
  okMsg.value = ''
  saving.value = true
  try {
    const paisFinal = esOpcionLibre.value && form.paisLibre.trim() ? form.paisLibre.trim() : form.pais
    const res = await $fetch<{ notaDemo?: string }>('/api/padres/controles', {
      method: 'PUT',
      body: {
        alumnoId: data.value?.alumno?.id,
        pais: paisFinal,
        ...(form.grado ? { grado: form.grado } : {}),
        ...(form.pinParental.length === 4 ? { pinParental: form.pinParental } : {}),
        limiteMinutosDiario: form.limiteMinutosDiario,
        diasPermitidos: form.diasPermitidos,
        maxPistasPorPaso: form.maxPistasPorPaso,
        vozPermitida: form.vozPermitida,
        instruccionesPadre: form.instruccionesPadre
      }
    })
    form.pinParental = ''
    await fetchMe(true)
    await refresh()
    okMsg.value = res?.notaDemo || 'Controles parentales y configuración familiar guardados correctamente.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-2xl">
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">Controles Parentales y Familia</h1>
        <p class="text-sm text-slate-600 mt-1">
          Configura grado escolar, límites saludables, voz y país curricular para <strong>{{ data?.alumno?.nombre }}</strong>.
        </p>
      </div>
      <select v-if="(data?.alumnos || []).length > 1" v-model="selectedAlumnoId" class="input-field w-auto text-xs font-bold">
        <option v-for="a in data?.alumnos || []" :key="a.id" :value="a.id">
          {{ a.avatar }} {{ a.nombre }} ({{ a.grado }})
        </option>
      </select>
    </div>

    <div v-if="okMsg" class="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-700 flex items-center gap-2">
      <CheckCircle2 class="w-4 h-4 shrink-0" /> <span>{{ okMsg }}</span>
    </div>

    <form class="card-surface space-y-5" @submit.prevent="guardar">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">País / Currículo Escolar</label>
          <select v-model="form.pais" class="input-field">
            <option v-for="p in paisesLista" :key="p.pais" :value="p.pais">{{ p.pais }}</option>
          </select>
          <input
            v-if="esOpcionLibre"
            v-model="form.paisLibre"
            type="text"
            class="input-field mt-2"
            placeholder="Escribe país o modalidad libre (ej. Homeschooling)"
          />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Grado escolar de {{ data?.alumno?.nombre }}</label>
          <select v-model="form.grado" class="input-field">
            <option v-for="g in gradosDisponibles" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Límite diario (min)</label>
          <input v-model.number="form.limiteMinutosDiario" type="number" min="5" max="180" class="input-field" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Máx. pistas por paso</label>
          <select v-model.number="form.maxPistasPorPaso" class="input-field">
            <option :value="0">0 pistas (SECC puro)</option>
            <option :value="1">1 pista</option>
            <option :value="2">2 pistas (recomendado)</option>
            <option :value="3">3 pistas</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Cambiar PIN (4 díg.)</label>
          <input
            v-model="form.pinParental"
            type="text"
            inputmode="numeric"
            maxlength="4"
            placeholder="Conservar actual"
            class="input-field"
          />
        </div>
      </div>

      <!-- Control de voz del tutor -->
      <div class="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 flex items-center justify-between gap-3">
        <div class="flex items-start gap-2.5">
          <Volume2 class="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <div>
            <div class="text-xs font-extrabold text-slate-900">Voz del Tutor (lectura en voz alta y dictado)</div>
            <p class="text-[11px] text-slate-500">
              Permite que el niño escuche los ejercicios/explicaciones y dicte respuestas por micrófono.
            </p>
          </div>
        </div>
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition shrink-0"
          :class="form.vozPermitida ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'"
          @click="form.vozPermitida = !form.vozPermitida"
        >
          {{ form.vozPermitida ? 'Activada ✓' : 'Desactivada' }}
        </button>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 mb-2">Días permitidos para estudiar</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="d in DIAS"
            :key="d.id"
            type="button"
            class="px-3.5 py-2 rounded-xl border-2 text-xs font-extrabold transition"
            :class="
              form.diasPermitidos.includes(d.id)
                ? 'bg-[#2563EB] border-[#2563EB] text-white'
                : 'bg-white border-slate-200 text-slate-500'
            "
            @click="toggleDia(d.id)"
          >
            {{ d.label }}
          </button>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Instrucciones especiales para el Tutor IA</label>
        <textarea
          v-model="form.instruccionesPadre"
          rows="3"
          class="input-field"
          placeholder="Ej. Tiene examen de ecuaciones el viernes, reforzar ley de signos con paciencia..."
        />
      </div>

      <button type="submit" class="btn-primary" :disabled="saving">
        <Save class="w-4 h-4" /> {{ saving ? 'Guardando...' : 'Guardar configuración' }}
      </button>
    </form>
  </div>
</template>
