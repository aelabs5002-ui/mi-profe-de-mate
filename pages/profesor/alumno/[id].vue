<script setup lang="ts">
import {
  ArrowLeft,
  Download,
  Send,
  Upload,
  Sparkles,
  Award,
  AlertTriangle,
  CheckCircle2,
  Save,
  BookOpen
} from 'lucide-vue-next'

definePageMeta({ layout: 'profesor' })

const route = useRoute()
const alumnoId = computed(() => String(route.params.id))

const { data, refresh } = await useFetch<any>(() => `/api/profesor/alumnos/${alumnoId.value}`)
const { data: catalogo } = await useFetch<{ temas: Array<{ codigo: string; tema: string }> }>('/api/catalogo')

// Asignar misión
const modoMision = ref<'tema' | 'archivo'>('tema')
const temaAsignar = ref('')
const dificultad = ref(2)
const notaMision = ref('')
const selectedFile = ref<File | null>(null)
const base64Data = ref<string | undefined>(undefined)
const assigning = ref(false)
const assignOk = ref('')
const assignErr = ref('')

// Nota pedagógica al Tutor IA
const notaPedagogica = ref(data.value?.vinculo?.notaPedagogica || '')
const savingNota = ref(false)
const notaOk = ref('')

watch(
  () => data.value?.vinculo?.notaPedagogica,
  (val) => {
    if (val !== undefined && !savingNota.value) notaPedagogica.value = val
  }
)

const readFileAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      resolve(dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const onFilePick = async (e: Event) => {
  assignErr.value = ''
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
  if (isPdf && f.size > 3 * 1024 * 1024) {
    assignErr.value = 'El PDF supera 3 MB. Sube solo la hoja de ejercicios o una foto clara.'
    return
  }
  if (f.size > 6 * 1024 * 1024) {
    assignErr.value = 'Archivo muy grande (máximo 6 MB para foto, 3 MB para PDF).'
    return
  }
  selectedFile.value = f
  base64Data.value = await readFileAsBase64(f)
}

const asignarMision = async () => {
  assignOk.value = ''
  assignErr.value = ''
  if (modoMision.value === 'tema' && temaAsignar.value.trim().length < 2) {
    assignErr.value = 'Escribe o selecciona un tema para asignar.'
    return
  }
  if (modoMision.value === 'archivo' && !selectedFile.value) {
    assignErr.value = 'Selecciona una foto o PDF de ejercicios primero.'
    return
  }

  assigning.value = true
  try {
    await $fetch(`/api/profesor/alumnos/${alumnoId.value}/asignar-mision`, {
      method: 'POST',
      body: {
        modo: modoMision.value,
        tema: temaAsignar.value.trim() || undefined,
        dificultad: dificultad.value,
        notaProfesor: notaMision.value.trim() || undefined,
        nombreArchivo: selectedFile.value?.name,
        tipoMime: selectedFile.value?.type || 'application/pdf',
        base64Data: modoMision.value === 'archivo' ? base64Data.value : undefined
      }
    })
    assignOk.value = `¡Misión asignada! Ya aparece destacada en el tablero de ${data.value?.alumno?.nombre} como "Misión de tu Profesor".`
    temaAsignar.value = ''
    notaMision.value = ''
    selectedFile.value = null
    base64Data.value = undefined
    await refresh()
  } catch (e: any) {
    assignErr.value = e?.data?.statusMessage || 'No pudimos asignar la misión.'
  } finally {
    assigning.value = false
  }
}

const guardarNota = async () => {
  notaOk.value = ''
  savingNota.value = true
  try {
    await $fetch(`/api/profesor/alumnos/${alumnoId.value}/nota`, {
      method: 'PUT',
      body: { notaPedagogica: notaPedagogica.value }
    })
    notaOk.value = 'Indicaciones guardadas. El Tutor IA las aplicará automáticamente con este alumno.'
  } finally {
    savingNota.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <NuxtLink to="/profesor" class="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:underline">
      <ArrowLeft class="w-4 h-4" /> Volver a Mis Estudiantes
    </NuxtLink>

    <!-- Cabecera del estudiante -->
    <section class="card-surface flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl">
          {{ data?.alumno?.avatar || '🦊' }}
        </div>
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900">{{ data?.alumno?.nombre }}</h1>
          <p class="text-sm text-slate-600">
            {{ data?.alumno?.grado }} · {{ data?.alumno?.pais }}
            <span v-if="data?.alumno?.representante" class="text-slate-400"> · Rep.: {{ data.alumno.representante }}</span>
          </p>
          <div class="flex items-center gap-2 mt-1.5 flex-wrap">
            <span class="pill-xp">Nivel {{ data?.alumno?.nivel || 1 }} · {{ data?.alumno?.xp || 0 }} XP</span>
            <span class="pill-mastery">{{ data?.resumen?.promedioDominio || 0 }}% Dominio CCA</span>
            <span class="pill-streak">{{ data?.alumno?.rachaActual || 0 }} días racha</span>
          </div>
        </div>
      </div>

      <a
        :href="`/api/profesor/alumnos/${alumnoId}/reporte-pdf`"
        target="_blank"
        class="btn-primary text-xs py-2.5 px-4"
      >
        <Download class="w-4 h-4" /> Descargar Reporte PDF
      </a>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Asignar Misión Guiada -->
      <section class="card-surface space-y-4">
        <div>
          <span class="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 inline-flex items-center gap-1">
            <Sparkles class="w-3.5 h-3.5" /> Asistente Docente Socrático
          </span>
          <h2 class="text-lg font-extrabold text-slate-900">Asignar Misión o Tarea Guiada</h2>
          <p class="text-xs text-slate-600 mt-0.5">
            El alumno la resolverá paso a paso con el Tutor IA (sin que le regale la respuesta) y tú verás su precisión y tropiezos.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            class="py-2 rounded-lg text-xs font-extrabold transition"
            :class="modoMision === 'tema' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'"
            @click="modoMision = 'tema'"
          >
            ✨ Por tema (IA)
          </button>
          <button
            type="button"
            class="py-2 rounded-lg text-xs font-extrabold transition"
            :class="modoMision === 'archivo' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'"
            @click="modoMision = 'archivo'"
          >
            📄 Foto / PDF de guía
          </button>
        </div>

        <div v-if="assignOk" class="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-700 flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 shrink-0" /> <span>{{ assignOk }}</span>
        </div>
        <div v-if="assignErr" class="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
          {{ assignErr }}
        </div>

        <form class="space-y-3" @submit.prevent="asignarMision">
          <div v-if="modoMision === 'tema'" class="space-y-2">
            <label class="block text-xs font-bold text-slate-700">Tema de la misión</label>
            <input
              v-model="temaAsignar"
              required
              class="input-field"
              placeholder="Ej. Ecuaciones de primer grado, Regla de tres, Fracciones..."
            />
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="t in catalogo?.temas || []"
                :key="t.codigo"
                type="button"
                class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition"
                @click="temaAsignar = t.tema"
              >
                {{ t.tema }}
              </button>
            </div>
          </div>

          <div v-else class="space-y-2">
            <label class="block text-xs font-bold text-slate-700">Sube tu hoja de ejercicios (foto o PDF máx. 3 MB)</label>
            <div class="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-3.5 space-y-2">
              <input type="file" accept="image/*,.pdf" class="input-field py-2 text-xs bg-white" @change="onFilePick" />
              <div v-if="selectedFile" class="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <Upload class="w-3.5 h-3.5" /> {{ selectedFile.name }} listo para extraer ejercicios
              </div>
            </div>
            <input
              v-model="temaAsignar"
              class="input-field text-xs"
              placeholder="Título o tema opcional (si lo dejas vacío la IA lo detecta)"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Dificultad</label>
              <select v-model.number="dificultad" class="input-field text-xs">
                <option :value="1">1 — Introductorio / Refuerzo</option>
                <option :value="2">2 — Estándar del grado</option>
                <option :value="3">3 — Reto / Preparación examen</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Nota u objetivo (opcional)</label>
              <input v-model="notaMision" class="input-field text-xs" placeholder="Ej. Para practicar antes del viernes" />
            </div>
          </div>

          <button type="submit" class="btn-primary w-full" :disabled="assigning">
            <Send class="w-4 h-4" />
            {{ assigning ? 'Creando y asignando misión...' : `Asignar misión a ${data?.alumno?.nombre || 'estudiante'}` }}
          </button>
        </form>
      </section>

      <!-- Indicaciones metodológicas del Profesor al Tutor IA -->
      <section class="card-surface space-y-4">
        <div>
          <span class="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 inline-flex items-center gap-1">
            <BookOpen class="w-3.5 h-3.5" /> Co-enseñanza con IA
          </span>
          <h2 class="text-lg font-extrabold text-slate-900">Indicaciones Metodológicas al Tutor IA</h2>
          <p class="text-xs text-slate-600 mt-0.5">
            Indícale al Tutor IA qué método usas en clase o en qué poner especial cuidado con {{ data?.alumno?.nombre }}.
          </p>
        </div>

        <div v-if="notaOk" class="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-700 flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 shrink-0" /> <span>{{ notaOk }}</span>
        </div>

        <form class="space-y-3" @submit.prevent="guardarNota">
          <textarea
            v-model="notaPedagogica"
            rows="4"
            maxlength="800"
            class="input-field text-sm"
            placeholder="Ej. En clase estamos usando el método de balanza para despejar x. Reforzar ley de signos al multiplicar negativos."
          />
          <button type="submit" class="btn-success" :disabled="savingNota">
            <Save class="w-4 h-4" /> {{ savingNota ? 'Guardando...' : 'Guardar indicaciones para el Tutor IA' }}
          </button>
        </form>

        <div v-if="(data?.documentos || []).length > 0" class="pt-3 border-t border-slate-100 space-y-2">
          <div class="text-xs font-extrabold text-slate-700">Currículo / Biblioteca activa del alumno:</div>
          <div v-for="doc in data.documentos" :key="doc.id" class="rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs">
            <div class="font-bold text-slate-900">{{ doc.titulo }}</div>
            <div class="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{{ doc.resumenExtraido }}</div>
          </div>
        </div>
      </section>
    </div>

    <!-- Radiografía CCA + Errores Frecuentes -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section class="card-surface space-y-3">
        <h2 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Award class="w-5 h-5 text-emerald-600" /> Carta Cognitiva (Competencias CCA)
        </h2>
        <div v-if="(data?.competencias || []).length === 0" class="text-xs text-slate-500">
          Aún no ha completado ejercicios evaluados.
        </div>
        <div v-else class="space-y-3">
          <div v-for="c in data.competencias" :key="c.id" class="space-y-1">
            <div class="flex items-center justify-between text-xs font-bold">
              <span class="text-slate-800">{{ c.tema }}</span>
              <span :class="c.certificada ? 'text-emerald-700' : 'text-slate-600'">
                {{ c.nivelDominio }}% ({{ c.correctos }}/{{ c.totalEjercicios }}) {{ c.certificada ? '· SECC ✓' : '' }}
              </span>
            </div>
            <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full"
                :class="c.certificada ? 'bg-emerald-500' : 'bg-indigo-600'"
                :style="{ width: `${c.nivelDominio}%` }"
              />
            </div>
          </div>
        </div>
      </section>

      <section class="card-surface space-y-3">
        <h2 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <AlertTriangle class="w-5 h-5 text-amber-500" /> Mapa de Errores Frecuentes
        </h2>
        <div v-if="(data?.errores || []).length === 0" class="text-xs text-emerald-700 bg-emerald-50 rounded-xl p-3 font-bold">
          Sin tropiezos frecuentes registrados.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="e in data.errores"
            :key="e.id"
            class="rounded-xl border p-3 flex items-center justify-between gap-2"
            :class="e.superado ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/70 border-amber-200'"
          >
            <div>
              <div class="text-xs font-extrabold text-slate-900">{{ e.etiquetaLegible }}</div>
              <div class="text-[11px] text-slate-600">{{ e.tema }}</div>
            </div>
            <span class="text-xs font-extrabold" :class="e.superado ? 'text-emerald-700' : 'text-amber-800'">
              {{ e.superado ? 'Superado ✓' : `${e.conteo} incidencias` }}
            </span>
          </div>
        </div>
      </section>
    </div>

    <!-- Historial de misiones -->
    <section class="card-surface space-y-3">
      <h2 class="text-base font-extrabold text-slate-900">Actividad y Misiones Recientes</h2>
      <div v-if="(data?.misiones || []).length === 0" class="text-xs text-slate-500">Sin misiones registradas aún.</div>
      <div v-else class="space-y-2.5">
        <div
          v-for="m in data.misiones"
          :key="m.id"
          class="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 flex items-center justify-between gap-3 flex-wrap"
        >
          <div class="min-w-0 space-y-0.5">
            <div class="flex items-center gap-2 flex-wrap">
              <span
                v-if="m.origen === 'profesor'"
                class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700"
              >
                👩‍🏫 Asignada por Profe
              </span>
              <span class="font-display font-extrabold text-sm text-slate-900">{{ m.titulo }}</span>
            </div>
            <div class="text-xs text-slate-500">
              {{ m.fechaClave }} · {{ m.pasos.filter((p: any) => p.estado === 'completado').length }}/{{ m.pasos.length }} ejercicios ·
              Pistas usadas: {{ m.pistasUsadas }}
            </div>
          </div>
          <span
            class="text-xs font-extrabold px-3 py-1 rounded-full"
            :class="m.estado === 'completada' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'"
          >
            {{ m.estado === 'completada' ? `Completada · ${m.precisionPct}%` : 'En progreso' }}
          </span>
        </div>
      </div>
    </section>
  </div>
</template>
