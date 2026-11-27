<script setup lang="ts">
import { MessageSquarePlus, X, Send, CheckCircle2 } from 'lucide-vue-next'

const route = useRoute()

const open = ref(false)
const sending = ref(false)
const sent = ref(false)
const err = ref('')

const autorTipo = ref<'alumno' | 'padre' | 'profesor'>('alumno')
const categoria = ref<'sugerencia' | 'error' | 'dificultad' | 'me_gusto'>('sugerencia')
const calificacion = ref<number | null>(5)
const mensaje = ref('')

const abrir = () => {
  autorTipo.value = route.path.startsWith('/profesor')
    ? 'profesor'
    : route.path.startsWith('/padres')
      ? 'padre'
      : 'alumno'
  err.value = ''
  sent.value = false
  open.value = true
}

const cerrar = () => {
  open.value = false
}

const categorias = [
  { id: 'me_gusto', label: '❤️ Me gustó' },
  { id: 'sugerencia', label: '💡 Sugerencia' },
  { id: 'dificultad', label: '😕 Confuso / difícil' },
  { id: 'error', label: '🐞 Algo falló' }
] as const

const caritas = [
  { val: 1, icon: '😫', label: 'Mal' },
  { val: 2, icon: '😕', label: 'Regular' },
  { val: 3, icon: '🙂', label: 'Bien' },
  { val: 4, icon: '😊', label: 'Muy bien' },
  { val: 5, icon: '🤩', label: 'Genial' }
]

const detectarDispositivo = () => {
  if (!import.meta.client) return 'web'
  const w = window.innerWidth
  if (w < 640) return `Móvil (${w}px)`
  if (w < 1024) return `Tablet (${w}px)`
  return `Escritorio (${w}px)`
}

const enviar = async () => {
  if (mensaje.value.trim().length < 3 || sending.value) return
  err.value = ''
  sending.value = true
  try {
    await $fetch('/api/feedback', {
      method: 'POST',
      body: {
        autorTipo: autorTipo.value,
        categoria: categoria.value,
        calificacion: calificacion.value,
        mensaje: mensaje.value.trim(),
        ruta: route.fullPath || '/',
        dispositivo: detectarDispositivo()
      }
    })
    sent.value = true
    mensaje.value = ''
    setTimeout(() => {
      open.value = false
      sent.value = false
    }, 1800)
  } catch (e: any) {
    err.value = e?.data?.statusMessage || 'No pudimos guardar tu comentario. Intenta de nuevo.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div>
    <!-- Botón flotante discreto (encima del bottom-nav en móvil) -->
    <button
      type="button"
      class="fixed bottom-20 right-4 lg:bottom-5 lg:right-5 z-40 inline-flex items-center gap-1.5 rounded-full bg-slate-900 hover:bg-[#2563EB] text-white text-xs font-extrabold px-3.5 py-2.5 shadow-lg transition active:scale-95"
      title="Enviar opinión o reportar un problema"
      @click="abrir"
    >
      <MessageSquarePlus class="w-4 h-4" />
      <span>Opinar</span>
    </button>

    <!-- Modal de opinión para prueba de campo -->
    <Teleport to="body">
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4"
        @click.self="cerrar"
      >
        <div class="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-[#2563EB]">Prueba de Campo</span>
              <h2 class="font-display font-extrabold text-lg text-slate-900">¿Qué te parece Mi Profe de Mate?</h2>
            </div>
            <button
              type="button"
              class="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Cerrar"
              @click="cerrar"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div v-if="sent" class="py-6 text-center space-y-2">
            <div class="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 class="w-6 h-6" />
            </div>
            <div class="font-display font-extrabold text-base text-slate-900">¡Gracias por tu opinión!</div>
            <p class="text-xs text-slate-600">Tu comentario quedó guardado para ayudarnos a mejorar.</p>
          </div>

          <form v-else class="space-y-3.5" @submit.prevent="enviar">
            <!-- ¿Quién escribe? -->
            <div class="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                class="py-2 px-2 rounded-xl border-2 text-[11px] font-extrabold transition"
                :class="autorTipo === 'alumno' ? 'border-[#2563EB] bg-blue-50 text-[#1D4ED8]' : 'border-slate-200 text-slate-600'"
                @click="autorTipo = 'alumno'"
              >
                👧 Alumno
              </button>
              <button
                type="button"
                class="py-2 px-2 rounded-xl border-2 text-[11px] font-extrabold transition"
                :class="autorTipo === 'padre' ? 'border-[#2563EB] bg-blue-50 text-[#1D4ED8]' : 'border-slate-200 text-slate-600'"
                @click="autorTipo = 'padre'"
              >
                👨‍👩‍👧 Padre
              </button>
              <button
                type="button"
                class="py-2 px-2 rounded-xl border-2 text-[11px] font-extrabold transition"
                :class="autorTipo === 'profesor' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'"
                @click="autorTipo = 'profesor'"
              >
                👩‍🏫 Profesor
              </button>
            </div>

            <!-- Calificación con caritas -->
            <div>
              <div class="text-xs font-bold text-slate-700 mb-1.5">¿Cómo te sientes usando la app?</div>
              <div class="grid grid-cols-5 gap-1.5">
                <button
                  v-for="c in caritas"
                  :key="c.val"
                  type="button"
                  class="py-2 rounded-xl border-2 flex flex-col items-center gap-0.5 transition"
                  :class="calificacion === c.val ? 'border-[#2563EB] bg-blue-50 scale-105' : 'border-slate-200 hover:bg-slate-50'"
                  @click="calificacion = c.val"
                >
                  <span class="text-xl leading-none">{{ c.icon }}</span>
                  <span class="text-[10px] font-bold text-slate-600">{{ c.label }}</span>
                </button>
              </div>
            </div>

            <!-- Categoría -->
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="cat in categorias"
                :key="cat.id"
                type="button"
                class="px-2.5 py-1.5 rounded-xl border text-xs font-bold transition"
                :class="
                  categoria === cat.id
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                "
                @click="categoria = cat.id"
              >
                {{ cat.label }}
              </button>
            </div>

            <!-- Mensaje -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Cuéntanos en tus palabras</label>
              <textarea
                v-model="mensaje"
                rows="3"
                required
                minlength="3"
                maxlength="1500"
                class="input-field text-sm"
                placeholder="Ej. Me gustó el juego, o me trabé en un ejercicio de fracciones, o me gustaría que tuviera..."
              />
            </div>

            <div v-if="err" class="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">
              {{ err }}
            </div>

            <button type="submit" class="btn-primary w-full" :disabled="sending || mensaje.trim().length < 3">
              <Send class="w-4 h-4" />
              {{ sending ? 'Enviando...' : 'Enviar opinión' }}
            </button>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
