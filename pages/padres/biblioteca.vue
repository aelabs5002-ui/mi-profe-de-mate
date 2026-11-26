<script setup lang="ts">
import { BookOpen, Plus, Trash2, CheckCircle2 } from 'lucide-vue-next'

definePageMeta({ layout: 'padres' })

const { alumnoActivo } = useSession()
const { data, refresh } = await useFetch<any>('/api/padres/resumen')

const form = reactive({
  titulo: '',
  nombreArchivo: '',
  tipoDoc: 'guia' as 'curriculo' | 'libro' | 'guia' | 'otro',
  temasTexto: '',
  resumenExtraido: '',
  prioridad: 1
})

const saving = ref(false)
const msg = ref('')

const onPickFile = (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  form.nombreArchivo = f.name
  if (!form.titulo) {
    form.titulo = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')
  }
}

const agregarMaterial = async () => {
  msg.value = ''
  saving.value = true
  try {
    await $fetch('/api/padres/biblioteca', {
      method: 'POST',
      body: {
        alumnoId: alumnoActivo.value?.id,
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
    msg.value = 'Material agregado. El Tutor IA lo priorizará automáticamente (PARENT_LIBRARY_FIRST).'
    await refresh()
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
    <div>
      <span class="text-xs font-extrabold uppercase tracking-wider text-[#2563EB]">Regla PARENT_LIBRARY_FIRST</span>
      <h1 class="text-2xl font-extrabold text-slate-900 mt-0.5">Biblioteca del Tutor</h1>
      <p class="text-sm text-slate-600 mt-1">
        Carga guías, libros o currículos escolares para que el Tutor IA y el Motor de Misiones los usen como prioridad para <strong>{{ data?.alumno?.nombre }}</strong>.
      </p>
    </div>

    <div v-if="msg" class="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-700 flex items-center gap-2">
      <CheckCircle2 class="w-4 h-4" /> {{ msg }}
    </div>

    <!-- Formulario agregar material -->
    <section class="card-surface space-y-4">
      <h2 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
        <Plus class="w-5 h-5 text-[#2563EB]" /> Agregar guía o material curricular
      </h2>
      <form class="space-y-3" @submit.prevent="agregarMaterial">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Archivo PDF / Guía (opcional)</label>
            <input type="file" accept=".pdf,.doc,.docx,image/*" class="input-field py-2 text-xs" @change="onPickFile" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Título del material</label>
            <input v-model="form.titulo" required class="input-field" placeholder="Ej. Guía 2do Lapso — Fracciones" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Tipo</label>
            <select v-model="form.tipoDoc" class="input-field">
              <option value="guia">Guía escolar</option>
              <option value="curriculo">Currículo oficial</option>
              <option value="libro">Libro de texto</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Prioridad (1 = máxima)</label>
            <select v-model.number="form.prioridad" class="input-field">
              <option :value="1">1 — Máxima</option>
              <option :value="2">2 — Alta</option>
              <option :value="3">3 — Normal</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Temas (separados por coma)</label>
            <input v-model="form.temasTexto" class="input-field" placeholder="Fracciones, Ecuaciones" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Notas clave del temario para el Tutor IA</label>
          <textarea
            v-model="form.resumenExtraido"
            rows="2"
            class="input-field"
            placeholder="Ej. Usar método de transposición de términos y simplificación de fracciones."
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="saving">
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
