<script setup lang="ts">
import { Shield, Users, Save, LogOut, CheckCircle2 } from 'lucide-vue-next'

definePageMeta({ layout: 'alumno' })

const { padre, alumnoActivo, fetchMe, logout } = useSession()
const { data: catalogo } = await useFetch<{
  paises: Array<{ pais: string; grados: string[] }>
  avatares: string[]
}>('/api/catalogo')

const grados = computed(() => {
  const found = catalogo.value?.paises.find((p) => p.pais === padre.value?.pais)
  return found?.grados || ['1er Año (Secundaria)']
})
const avatares = computed(() => catalogo.value?.avatares || ['🦊', '🦁', '🦉', '🐼'])

const form = reactive({
  nombre: alumnoActivo.value?.nombre || '',
  grado: alumnoActivo.value?.grado || '',
  avatar: alumnoActivo.value?.avatar || '🦊'
})

const saving = ref(false)
const okMsg = ref('')

const guardarPerfil = async () => {
  if (!alumnoActivo.value) return
  okMsg.value = ''
  saving.value = true
  try {
    await $fetch(`/api/alumnos/${alumnoActivo.value.id}`, { method: 'PUT', body: form })
    await fetchMe(true)
    okMsg.value = 'Perfil del alumno actualizado.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-2xl mx-auto">
    <div>
      <h1 class="text-2xl font-extrabold text-slate-900">Mi Perfil</h1>
      <p class="text-sm text-slate-600">Personaliza tu avatar, cambia de estudiante o entra al Portal Padres.</p>
    </div>

    <!-- Accesos principales (Hub claro sin mezclar responsabilidades) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <NuxtLink to="/seleccionar-alumno" class="card-surface hover:border-[#2563EB] transition flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
          <Users class="w-6 h-6" />
        </div>
        <div>
          <div class="font-display font-extrabold text-sm text-slate-900">Cambiar de Estudiante</div>
          <div class="text-xs text-slate-500">Ver todos los hijos de la familia</div>
        </div>
      </NuxtLink>

      <NuxtLink to="/padres" class="card-surface hover:border-slate-900 transition flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
          <Shield class="w-6 h-6" />
        </div>
        <div>
          <div class="font-display font-extrabold text-sm text-slate-900">Portal Padres</div>
          <div class="text-xs text-slate-500">Reportes, biblioteca y controles (PIN)</div>
        </div>
      </NuxtLink>
    </div>

    <!-- Editar perfil del estudiante -->
    <section class="card-surface space-y-4">
      <h2 class="text-base font-extrabold text-slate-900">Datos de {{ alumnoActivo?.nombre }}</h2>

      <div v-if="okMsg" class="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-700 flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4" /> {{ okMsg }}
      </div>

      <form class="space-y-4" @submit.prevent="guardarPerfil">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Nombre</label>
            <input v-model="form.nombre" required class="input-field" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Grado escolar</label>
            <select v-model="form.grado" class="input-field">
              <option v-for="g in grados" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1.5">Avatar</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="av in avatares"
              :key="av"
              type="button"
              class="w-11 h-11 rounded-xl border-2 text-xl flex items-center justify-center transition"
              :class="form.avatar === av ? 'border-[#2563EB] bg-blue-50 scale-105' : 'border-slate-200 bg-white'"
              @click="form.avatar = av"
            >
              {{ av }}
            </button>
          </div>
        </div>

        <button type="submit" class="btn-primary" :disabled="saving">
          <Save class="w-4 h-4" /> {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </form>
    </section>

    <section class="card-surface flex items-center justify-between gap-3">
      <div>
        <div class="text-sm font-extrabold text-slate-900">Cuenta familiar</div>
        <div class="text-xs text-slate-500">{{ padre?.correo }}</div>
      </div>
      <button type="button" class="btn-danger text-xs py-2 px-3.5" @click="logout">
        <LogOut class="w-4 h-4" /> Cerrar sesión
      </button>
    </section>
  </div>
</template>
