<script setup lang="ts">
import { Save, CheckCircle2 } from 'lucide-vue-next'

definePageMeta({ layout: 'padres' })

const { fetchMe } = useSession()
const { data, refresh } = await useFetch<any>('/api/padres/resumen')
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

const form = reactive({
  pais: data.value?.padre?.pais || 'Venezuela',
  pinParental: '',
  limiteMinutosDiario: data.value?.alumno?.limiteMinutosDiario ?? 30,
  diasPermitidos: (data.value?.alumno?.diasPermitidos as number[]) || [0, 1, 2, 3, 4, 5, 6],
  maxPistasPorPaso: data.value?.alumno?.maxPistasPorPaso ?? 2,
  instruccionesPadre: data.value?.alumno?.instruccionesPadre || ''
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
    await $fetch('/api/padres/controles', {
      method: 'PUT',
      body: {
        alumnoId: data.value?.alumno?.id,
        pais: form.pais,
        ...(form.pinParental.length === 4 ? { pinParental: form.pinParental } : {}),
        limiteMinutosDiario: form.limiteMinutosDiario,
        diasPermitidos: form.diasPermitidos,
        maxPistasPorPaso: form.maxPistasPorPaso,
        instruccionesPadre: form.instruccionesPadre
      }
    })
    form.pinParental = ''
    await fetchMe(true)
    await refresh()
    okMsg.value = 'Controles parentales y configuración familiar guardados correctamente.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-2xl">
    <div>
      <h1 class="text-2xl font-extrabold text-slate-900">Controles Parentales y Familia</h1>
      <p class="text-sm text-slate-600 mt-1">
        Configura límites saludables, país curricular e indicaciones personalizadas para el Tutor IA de <strong>{{ data?.alumno?.nombre }}</strong>.
      </p>
    </div>

    <div v-if="okMsg" class="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-700 flex items-center gap-2">
      <CheckCircle2 class="w-4 h-4" /> {{ okMsg }}
    </div>

    <form class="card-surface space-y-5" @submit.prevent="guardar">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">País / Currículo Escolar</label>
          <select v-model="form.pais" class="input-field">
            <option v-for="p in catalogo?.paises || []" :key="p.pais" :value="p.pais">{{ p.pais }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Cambiar PIN Parental (opcional, 4 dígitos)</label>
          <input
            v-model="form.pinParental"
            type="text"
            inputmode="numeric"
            maxlength="4"
            placeholder="Dejar vacío para conservar"
            class="input-field"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Límite diario de estudio (minutos)</label>
          <input v-model.number="form.limiteMinutosDiario" type="number" min="5" max="180" class="input-field" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Máximo de pistas por ejercicio</label>
          <select v-model.number="form.maxPistasPorPaso" class="input-field">
            <option :value="0">0 pistas (evaluación pura SECC)</option>
            <option :value="1">1 pista</option>
            <option :value="2">2 pistas (recomendado)</option>
            <option :value="3">3 pistas</option>
          </select>
        </div>
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
