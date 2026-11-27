<script setup lang="ts">
import { BookOpen, Plus, Trash2, CheckCircle2, Sparkles, Upload } from 'lucide-vue-next'

definePageMeta({ layout: 'padres' })

const { alumnoActivo } = useSession()
const selectedAlumnoId = ref(alumnoActivo.value?.id || '')

const { data, refresh } = await useFetch<any>(() =>
  selectedAlumnoId.value ? `/api/padres/resumen?alumnoId=${selectedAlumnoId.value}` : '/api/padres/resumen'
)
watch(selectedAlumnoId, () => refresh())

const form = reactive({
  titulo: '',
  nombreArchivo: '',
  tipoDoc: 'curriculo' as 'curriculo' | 'libro' | 'guia' | 'otro',
  temasTexto: '',
  resumenExtraido: '',
  prioridad: 1
})

const saving = ref(false)
const analyzing = ref(false)
const msg = ref('')
const err = ref('')

const readFileAsBase64 = (file: File) =>
  new Promise<{ dataUrl: string; base64: string }>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
      resolve({ dataUrl, base64 })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const compressImage = async (file: File): Promise<{ base64: string; mime: string }> => {
  const { dataUrl } = await readFileAsBase64(file)
  return await new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const maxDim = 1400
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
      const compressed = canvas.toDataURL('image/jpeg', 0.82)
      resolve({ base64: compressed.split(',')[1], mime: 'image/jpeg' })
    }
    img.onerror = () => resolve({ base64: dataUrl.split(',')[1], mime: file.type || 'image/jpeg' })
    img.src = dataUrl
  })
}

const onPickFile = async (e: Event) => {
  err.value = ''
  msg.value = ''
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return

  const isImage = f.type.startsWith('image/')
  const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
  const isText = f.type.startsWith('text/') || /\.(txt|md|csv)$/i.test(f.name)

  if (isPdf && f.size > 3 * 1024 * 1024) {
    err.value = 'El PDF es muy pesado (máximo 3 MB). Si es un libro grande, sube solo las páginas del índice o temario, o tómale una foto.'
    return
  }
  if (f.size > 8 * 1024 * 1024) {
    err.value = 'El archivo supera el límite permitido (8 MB para fotos, 3 MB para PDF).'
    return
  }

  form.nombreArchivo = f.name
  if (!form.titulo) {
    form.titulo = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')
  }

  if (!isImage && !isPdf && !isText) {
    msg.value = 'Archivo adjuntado. Para archivos Word (.doc/.docx), copia y pega abajo los temas o súbelo como PDF/foto para lectura automática con IA.'
    return
  }

  analyzing.value = true
  try {
    let base64Data: string | undefined
    let textoPlano: string | undefined
    let tipoMime = f.type || (isPdf ? 'application/pdf' : 'text/plain')

    if (isText) {
      textoPlano = await f.text()
      tipoMime = 'text/plain'
    } else if (isImage) {
      const processed = await compressImage(f)
      base64Data = processed.base64
      tipoMime = processed.mime
    } else {
      const read = await readFileAsBase64(f)
      base64Data = read.base64
      tipoMime = 'application/pdf'
    }

    const res = await $fetch<{
      tituloSugerido: string
      temas: string[]
      resumenExtraido: string
      usedGemini: boolean
    }>('/api/padres/biblioteca/analizar', {
      method: 'POST',
      body: {
        alumnoId: selectedAlumnoId.value || alumnoActivo.value?.id,
        nombreArchivo: f.name,
        tipoMime,
        base64Data,
        textoPlano,
        tipoDoc: form.tipoDoc
      }
    })

    if (res.tituloSugerido) form.titulo = res.tituloSugerido
    if (res.temas?.length) form.temasTexto = res.temas.join(', ')
    if (res.resumenExtraido) form.resumenExtraido = res.resumenExtraido

    msg.value = res.usedGemini
      ? '✨ ¡Currículo leído automáticamente con IA! Revisa los temas y el resumen detectados y pulsa "Guardar en Biblioteca Activa".'
      : 'Archivo cargado. Puedes ajustar los temas y notas clave abajo antes de guardar.'
  } catch (e: any) {
    err.value = e?.data?.statusMessage || 'No pudimos leer el archivo automáticamente. Puedes escribir los temas y notas manualmente abajo.'
  } finally {
    analyzing.value = false
  }
}

const agregarMaterial = async () => {
  msg.value = ''
  err.value = ''
  saving.value = true
  try {
    await $fetch('/api/padres/biblioteca', {
      method: 'POST',
      body: {
        alumnoId: selectedAlumnoId.value || alumnoActivo.value?.id,
        titulo: form.titulo,
        nombreArchivo: form.nombreArchivo || `${form.titulo}.pdf`,
        tipoDoc: form.tipoDoc,
        temas: form.temasTexto
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        resumenExtraido: form.resumenExtraido,
        prioridad: form.prioridad
      }
    })
    form.titulo = ''
    form.nombreArchivo = ''
    form.temasTexto = ''
    form.resumenExtraido = ''
    msg.value = 'Material guardado. El Tutor IA y los botones rápidos del alumno ya priorizarán tu currículo (PARENT_LIBRARY_FIRST).'
    await refresh()
  } catch (e: any) {
    err.value = e?.data?.statusMessage || 'No se pudo guardar el material.'
  } finally {
    saving.value = false
  }
}

const toggleDoc = async (doc: any) => {
  await $fetch(`/api/padres/biblioteca/${doc.id}`, {
    method: 'PUT',
    body: { activo: !doc.activo }
  })
  await refresh()
}

const eliminarDoc = async (id: string) => {
  await $fetch(`/api/padres/biblioteca/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <span class="text-xs font-extrabold uppercase tracking-wider text-[#2563EB]">Regla PARENT_LIBRARY_FIRST</span>
        <h1 class="text-2xl font-extrabold text-slate-900 mt-0.5">Biblioteca y Currículo del Tutor</h1>
        <p class="text-sm text-slate-600 mt-1">
          Sube el <strong>PDF o foto del programa/temario escolar</strong> (o escríbelo). La IA extraerá los temas automáticamente para que <strong>{{ data?.alumno?.nombre }}</strong> practique su currículo real.
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

    <div v-if="err" class="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
      {{ err }}
    </div>

    <!-- Formulario agregar material -->
    <section class="card-surface space-y-4">
      <h2 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
        <Plus class="w-5 h-5 text-[#2563EB]" /> Cargar currículo, guía o libro escolar
      </h2>
      <form class="space-y-3.5" @submit.prevent="agregarMaterial">
        <div class="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-4 space-y-2">
          <label class="block text-xs font-extrabold text-[#1D4ED8] flex items-center gap-1.5">
            <Upload class="w-4 h-4" /> Subir PDF (máx. 3 MB), foto del temario o archivo .txt — Lectura automática IA
          </label>
          <input
            type="file"
            accept=".pdf,.txt,.md,image/*"
            class="input-field py-2 text-xs bg-white"
            :disabled="analyzing"
            @change="onPickFile"
          />
          <div v-if="analyzing" class="text-xs font-bold text-[#2563EB] flex items-center gap-1.5 pt-1">
            <Sparkles class="w-4 h-4 animate-pulse" /> Leyendo documento y extrayendo temas del currículo con Gemini IA...
          </div>
          <p v-else class="text-[11px] text-slate-500">
            Consejo: si el currículo oficial es muy largo, sube la foto o el PDF de las páginas del <strong>índice de matemáticas</strong> del grado.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Título del currículo o guía</label>
            <input v-model="form.titulo" required class="input-field" placeholder="Ej. Programa 6to Grado — 2do Trimestre" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Tipo de material</label>
            <select v-model="form.tipoDoc" class="input-field">
              <option value="curriculo">Currículo oficial / Programa escolar</option>
              <option value="guia">Guía escolar</option>
              <option value="libro">Libro de texto</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Prioridad (1 = máxima)</label>
            <select v-model.number="form.prioridad" class="input-field">
              <option :value="1">1 — Máxima</option>
              <option :value="2">2 — Alta</option>
              <option :value="3">3 — Normal</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-slate-700 mb-1">Temas detectados / a practicar (separados por coma)</label>
            <input v-model="form.temasTexto" class="input-field" placeholder="Regla de tres, Fracciones, Ecuaciones de primer grado..." />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Contenido / notas clave del currículo para el Tutor IA</label>
          <textarea
            v-model="form.resumenExtraido"
            rows="4"
            maxlength="3000"
            class="input-field"
            placeholder="Aquí aparecerá el resumen extraído automáticamente del PDF/foto, o puedes pegar el temario del colegio..."
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="saving || analyzing">
          {{ saving ? 'Guardando...' : 'Guardar en Biblioteca Activa' }}
        </button>
      </form>
    </section>

    <!-- Lista de documentos -->
    <section class="card-surface space-y-3">
      <h2 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
        <BookOpen class="w-5 h-5 text-emerald-600" /> Materiales cargados ({{ (data?.documentos || []).length }})
      </h2>

      <div v-if="(data?.documentos || []).length === 0" class="text-xs text-slate-500">
        Aún no hay materiales en la biblioteca.
      </div>
      <div v-else class="space-y-2.5">
        <div
          v-for="doc in data.documentos"
          :key="doc.id"
          class="rounded-2xl border p-4 flex items-start justify-between gap-3"
          :class="doc.activo ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50 opacity-75'"
        >
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-[#1D4ED8]">
                {{ doc.tipoDoc }} · P{{ doc.prioridad }}
              </span>
              <span class="text-xs font-bold text-slate-500">{{ doc.grado }}</span>
            </div>
            <div class="font-display font-extrabold text-sm text-slate-900">{{ doc.titulo }}</div>
            <p class="text-xs text-slate-600">{{ doc.resumenExtraido }}</p>
            <div v-if="doc.temas?.length" class="flex flex-wrap gap-1 pt-1">
              <span v-for="t in doc.temas" :key="t" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                {{ t }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button type="button" class="btn-secondary text-xs py-1.5 px-2.5" @click="toggleDoc(doc)">
              {{ doc.activo ? 'Activo ✓' : 'Pausado' }}
            </button>
            <button type="button" class="p-2 rounded-xl text-rose-600 hover:bg-rose-50" @click="eliminarDoc(doc.id)">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
