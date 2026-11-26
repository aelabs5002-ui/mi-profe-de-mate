<script setup lang="ts">
import { Plus, Flame, Zap, Shield, LogOut } from 'lucide-vue-next'

definePageMeta({ layout: false })

const { padre, fetchMe, selectAlumno, logout } = useSession()
const { data: catalogo } = await useFetch<{
  paises: Array<{ pais: string; grados: string[] }>
  avatares: string[]
}>('/api/catalogo')

const grados = computed(() => {
  const list = catalogo.value?.paises || []
  const found = list.find((p) => p.pais === padre.value?.pais)
  const libre = list.find((p) => p.pais === 'Libre / Internacional')
  return found?.grados || libre?.grados || ['Nivel Básico (9–10 años)', 'Secundaria Inicial (12–13 años)', 'Práctica Libre (Todos los niveles)']
})
const avatares = computed(() => catalogo.value?.avatares || ['🦊', '🦁', '🦉', '🐼'])

const showNuevo = ref(false)
const nuevo = reactive({ nombre: '', grado: '', avatar: '🦊' })
const creando = ref(false)
const err = ref('')

watchEffect(() => {
  if (!nuevo.grado && grados.value.length > 0) {
    nuevo.grado = grados.value[Math.min(3, grados.value.length - 1)]
  }
})

const entrarComo = async (id: string) => {
  await selectAlumno(id)
  await navigateTo('/alumno')
}

const crearAlumno = async () => {
  err.value = ''
  creando.value = true
  try {
    await $fetch('/api/alumnos', { method: 'POST', body: nuevo })
    await fetchMe(true)
    showNuevo.value = false
    nuevo.nombre = ''
    await navigateTo('/alumno')
  } catch (e: any) {
    err.value = e?.data?.statusMessage || 'No se pudo crear el perfil.'
  } finally {
    creando.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-blue-50/70 via-[#F7FAFC] to-emerald-50/40 flex items-center justify-center p-4 py-10">
    <div class="w-full max-w-2xl space-y-6">
      <div class="text-center space-y-1.5">
        <div class="text-xs font-extrabold uppercase tracking-wider text-[#2563EB]">
          Familia {{ padre?.nombre }} · {{ padre?.pais }}
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">¿Quién va a practicar hoy?</h1>
        <p class="text-sm text-slate-600">Elige un perfil de estudiante para cargar su Carta Cognitiva (CCA).</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          v-for="a in padre?.alumnos || []"
          :key="a.id"
          type="button"
          class="card-surface text-left hover:border-[#2563EB] hover:shadow-soft transition group space-y-3"
          @click="entrarComo(a.id)"
        >
          <div class="flex items-center gap-3.5">
            <div class="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-3xl group-hover:scale-105 transition">
              {{ a.avatar }}
            </div>
            <div class="min-w-0">
              <div class="font-display font-extrabold text-lg text-slate-900 truncate">{{ a.nombre }}</div>
              <div class="text-xs font-semibold text-slate-500">{{ a.grado }}</div>
            </div>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-100">
            <div class="flex items-center gap-2">
              <span class="pill-streak"><Flame class="w-3.5 h-3.5" /> {{ a.rachaActual }} días</span>
              <span class="pill-xp"><Zap class="w-3.5 h-3.5" /> Nivel {{ a.nivel }}</span>
            </div>
            <span class="text-xs font-extrabold text-[#2563EB]">Entrar →</span>
          </div>
        </button>

        <button
          type="button"
          class="rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#2563EB] hover:bg-blue-50/40 p-6 flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-[#2563EB] transition"
          @click="showNuevo = !showNuevo"
        >
          <div class="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
            <Plus class="w-6 h-6" />
          </div>
          <span class="font-display font-extrabold text-sm">Añadir otro estudiante</span>
        </button>
      </div>

      <!-- Formulario añadir estudiante -->
      <div v-if="showNuevo" class="card-surface space-y-4">
        <h2 class="text-base font-extrabold text-slate-900">Nuevo perfil de estudiante</h2>
        <div v-if="err" class="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{{ err }}</div>
        <form class="space-y-3" @submit.prevent="crearAlumno">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Nombre</label>
              <input v-model="nuevo.nombre" required class="input-field" placeholder="Ej. Mateo" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Grado</label>
              <select v-model="nuevo.grado" class="input-field">
                <option v-for="g in grados" :key="g" :value="g">{{ g }}</option>
              </select>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="av in avatares"
              :key="av"
              type="button"
              class="w-10 h-10 rounded-xl border-2 text-lg flex items-center justify-center"
              :class="nuevo.avatar === av ? 'border-[#2563EB] bg-blue-50' : 'border-slate-200 bg-white'"
              @click="nuevo.avatar = av"
            >
              {{ av }}
            </button>
          </div>
          <div class="flex gap-2 justify-end">
            <button type="button" class="btn-secondary" @click="showNuevo = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="creando">
              {{ creando ? 'Creando...' : 'Crear y entrar' }}
            </button>
          </div>
        </form>
      </div>

      <div class="flex items-center justify-center gap-4 pt-2">
        <NuxtLink to="/padres" class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#2563EB]">
          <Shield class="w-4 h-4" /> Ir al Portal Padres
        </NuxtLink>
        <button type="button" class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600" @click="logout">
          <LogOut class="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  </div>
</template>
