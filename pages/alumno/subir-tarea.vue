<script setup lang="ts">
import { Camera, Upload, FileText, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-vue-next'

definePageMeta({ layout: 'alumno' })

const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const base64Data = ref<string | undefined>(undefined)
const notaAlumno = ref('')
const analyzing = ref(false)
const err = ref('')

const fileInputRef = ref<HTMLInputElement | null>(null)
const cameraInputRef = ref<HTMLInputElement | null>(null)

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

const compressImageIfNeeded = async (file: File): Promise<{ dataUrl: string; base64: string; mime: string }> => {
  if (!file.type.startsWith('image/')) {
    const { dataUrl, base64 } = await readFileAsBase64(file)
    return { dataUrl, base64, mime: file.type || 'application/pdf' }
  }
  const { dataUrl } = await readFileAsBase64(file)
  return await new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const maxDim = 1280
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, width, height)
      const compressed = canvas.toDataURL('image/jpeg', 0.8)
      resolve({ dataUrl: compressed, base64: compressed.split(',')[1], mime: 'image/jpeg' })
    }
    img.onerror = () => resolve({ dataUrl, base64: dataUrl.split(',')[1], mime: file.type })
    img.src = dataUrl
  })
}

const onFileChange = async (e: Event) => {
  err.value = ''
  const target = e.target as HTMLInputElement
  const f = target.files?.[0]
  if (!f) return
  if (f.size > 8 * 1024 * 1024) {
    err.value = 'El archivo es muy grande (máximo 8 MB).'
    return
  }
  selectedFile.value = f
  const processed = await compressImageIfNeeded(f)
  previewUrl.value = processed.mime.startsWith('image/') ? processed.dataUrl : null
  base64Data.value = processed.base64
}

const analizarYCrearMision = async () => {
  if (!selectedFile.value) {
    err.value = 'Toma una foto o selecciona un archivo PDF/imagen de tu tarea primero.'
    return
  }
  err.value = ''
  analyzing.value = true
  try {
    const res = await $fetch<{ mision: { id: string } }>('/api/misiones/subir-tarea', {
      method: 'POST',
      body: {
        nombreArchivo: selectedFile.value.name,
        tipoMime: selectedFile.value.type.startsWith('image/') ? 'image/jpeg' : selectedFile.value.type || 'application/pdf',
        base64Data: base64Data.value,
        dataUrlPreview: previewUrl.value || undefined,
        notaAlumno: notaAlumno.value
      }
    })
    await navigateTo(`/alumno/entrenar?misionId=${res.mision.id}`)
  } catch (e: any) {
    err.value = e?.data?.statusMessage || 'No pudimos analizar el archivo. Intenta con una foto más clara.'
  } finally {
    analyzing.value = false
  }
}
</script>

<template>
  <div class="space-y-5 max-w-2xl mx-auto">
    <NuxtLink to="/alumno" class="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563EB] hover:underline">
      <ArrowLeft class="w-4 h-4" /> Volver al tablero de misión
    </NuxtLink>

    <div class="card-surface space-y-5">
      <div>
        <span class="text-xs font-extrabold uppercase tracking-wider text-[#2563EB]">Visión IA Socrática</span>
        <h1 class="text-2xl font-extrabold text-slate-900 mt-0.5">Sube tu tarea de matemáticas</h1>
        <p class="text-sm text-slate-600 mt-1">
          Toma una foto a tu cuaderno o sube una guía PDF. Extraeremos los ejercicios para resolverlos juntos <strong>paso a paso</strong> (sin darte la respuesta directa).
        </p>
      </div>

      <div v-if="err" class="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
        {{ err }}
      </div>

      <!-- Botones nativos de captura / subida -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          class="rounded-2xl border-2 border-blue-200 bg-blue-50/60 hover:bg-blue-50 p-5 flex flex-col items-center gap-2 text-[#1D4ED8] transition"
          @click="cameraInputRef?.click()"
        >
          <Camera class="w-7 h-7" />
          <span class="font-display font-extrabold text-sm">Tomar foto ahora</span>
          <span class="text-[11px] text-slate-500">Cámara del teléfono</span>
        </button>

        <button
          type="button"
          class="rounded-2xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 p-5 flex flex-col items-center gap-2 text-slate-800 transition"
          @click="fileInputRef?.click()"
        >
          <Upload class="w-7 h-7 text-emerald-600" />
          <span class="font-display font-extrabold text-sm">Subir imagen o PDF</span>
          <span class="text-[11px] text-slate-500">Galería o archivos</span>
        </button>

        <input ref="cameraInputRef" type="file" accept="image/*" capture="environment" class="hidden" @change="onFileChange" />
        <input ref="fileInputRef" type="file" accept="image/*,application/pdf" class="hidden" @change="onFileChange" />
      </div>

      <!-- Vista previa del archivo -->
      <div v-if="selectedFile" class="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
        <div class="flex items-center gap-2.5 text-emerald-800">
          <CheckCircle2 class="w-5 h-5 shrink-0" />
          <div class="min-w-0">
            <div class="text-sm font-extrabold truncate">{{ selectedFile.name }}</div>
            <div class="text-xs text-emerald-700">Listo para analizar con Mi Profe de Mate</div>
          </div>
        </div>
        <img
          v-if="previewUrl"
          :src="previewUrl"
          alt="Vista previa de la tarea"
          class="w-full max-h-64 object-contain rounded-xl bg-white border border-slate-200"
        />
        <div v-else class="flex items-center gap-2 text-xs text-slate-600 bg-white rounded-xl p-3 border border-slate-200">
          <FileText class="w-4 h-4 text-[#2563EB]" /> Archivo PDF listo para extracción de ejercicios.
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">¿Alguna indicación extra? (opcional)</label>
        <input
          v-model="notaAlumno"
          type="text"
          class="input-field"
          placeholder="Ej. Me cuestan los ejercicios de fracciones o despeje de x..."
        />
      </div>

      <button
        type="button"
        class="btn-primary w-full py-3.5"
        :disabled="!selectedFile || analyzing"
        @click="analizarYCrearMision"
      >
        <Sparkles class="w-4 h-4" />
        {{ analyzing ? 'Analizando tarea y creando misión guiada...' : 'Crear Misión Guiada desde mi Tarea' }}
      </button>
    </div>
  </div>
</template>
