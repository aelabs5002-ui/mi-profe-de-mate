<script setup lang="ts">
import {
  Lightbulb,
  Send,
  ArrowRight,
  Trophy,
  Keyboard,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  MessageCircleQuestion
} from 'lucide-vue-next'

definePageMeta({ layout: 'alumno' })

const route = useRoute()
const { alumnoActivo, fetchMe } = useSession()

const mision = ref<any>(null)
const maxPistasPorPaso = ref(2)
const pasoIndex = ref(0)
const respuesta = ref('')
const showKeyboard = ref(true)
const loading = ref(true)
const sending = ref(false)
const hintLoading = ref(false)
const skipping = ref(false)
const err = ref('')

// Voz del tutor (Web Speech API)
const vozPermitida = computed(() => alumnoActivo.value?.vozPermitida !== false)
const hablando = ref(false)
const escuchando = ref(false)
const soportaDictado = ref(false)
let recognitionInstance: any = null

// Chat de dudas conceptuales
const showDuda = ref(false)
const dudaTexto = ref('')
const dudaLoading = ref(false)
const respuestaDuda = ref('')

const feedbackActual = ref<{ esCorrecta: boolean; guiado?: boolean; mensaje: string } | null>(null)
const pistasReveladas = ref<string[]>([])
const resumenFinal = ref<any>(null)
const resumenPendiente = ref<any>(null)

const pasoActual = computed(() => mision.value?.pasos?.[pasoIndex.value] || null)
const puedeVerExplicacion = computed(() => {
  if (!pasoActual.value || feedbackActual.value?.esCorrecta || feedbackActual.value?.guiado) return false
  const intentos = pasoActual.value.intentosCount || 0
  const pistas = pasoActual.value.pistasUsadas || 0
  return intentos >= 3 || (intentos >= 2 && pistas >= maxPistasPorPaso.value)
})

onMounted(() => {
  if (import.meta.client) {
    const w = window as any
    soportaDictado.value = Boolean(w.SpeechRecognition || w.webkitSpeechRecognition)
  }
})

const detenerVoz = () => {
  if (import.meta.client && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  hablando.value = false
}

const leerEnVozAlta = (texto: string) => {
  if (!import.meta.client || !('speechSynthesis' in window) || !vozPermitida.value) return
  if (hablando.value) {
    detenerVoz()
    return
  }
  const limpio = texto.replace(/[🧠🎉✨🎯📘🧑‍🏫💡]/g, '').trim()
  const utter = new SpeechSynthesisUtterance(limpio)
  utter.lang = 'es-ES'
  utter.rate = 0.96
  utter.onstart = () => (hablando.value = true)
  utter.onend = () => (hablando.value = false)
  utter.onerror = () => (hablando.value = false)
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utter)
}

const normalizarVozMatematica = (raw: string): string => {
  const numMap: Record<string, string> = {
    cero: '0',
    uno: '1',
    dos: '2',
    tres: '3',
    cuatro: '4',
    cinco: '5',
    seis: '6',
    siete: '7',
    ocho: '8',
    nueve: '9',
    diez: '10'
  }
  let s = raw.toLowerCase().trim()
  s = s.replace(/\bmenos\s+/g, '-')
  s = s.replace(/\bmás\s+/g, '+')
  s = s.replace(/\bsobre\b|\bentre\b/g, '/')
  s = s.replace(/\bcoma\b|\bpunto\b/g, '.')
  s = s.replace(/\bequis\b/g, 'x')
  s = s.replace(/\bigual a\b|\bigual\b/g, '=')
  for (const [palabra, digito] of Object.entries(numMap)) {
    s = s.replace(new RegExp(`\\b${palabra}\\b`, 'g'), digito)
  }
  return s.replace(/\s+/g, '')
}

const alternarDictado = () => {
  if (!import.meta.client || !vozPermitida.value) return
  const w = window as any
  const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!SpeechRec) return

  if (escuchando.value && recognitionInstance) {
    recognitionInstance.stop()
    escuchando.value = false
    return
  }

  const rec = new SpeechRec()
  rec.lang = 'es-ES'
  rec.interimResults = false
  rec.maxAlternatives = 1
  rec.onstart = () => (escuchando.value = true)
  rec.onend = () => (escuchando.value = false)
  rec.onerror = () => (escuchando.value = false)
  rec.onresult = (ev: any) => {
    const transcript = ev?.results?.[0]?.[0]?.transcript || ''
    if (transcript) {
      respuesta.value = normalizarVozMatematica(transcript)
    }
  }
  recognitionInstance = rec
  rec.start()
}

onBeforeUnmount(() => {
  detenerVoz()
  if (recognitionInstance) {
    try {
      recognitionInstance.stop()
    } catch {}
  }
})

const cargarMision = async () => {
  loading.value = true
  err.value = ''
  try {
    let targetId = route.query.misionId ? String(route.query.misionId) : ''
    if (!targetId) {
      const actual = await $fetch<any>('/api/misiones/actual')
      if (actual.misionActiva) {
        targetId = actual.misionActiva.id
      } else {
        const created = await $fetch<{ mision: { id: string } }>('/api/misiones/crear', { method: 'POST', body: {} })
        targetId = created.mision.id
      }
    }

    const res = await $fetch<{ mision: any; maxPistasPorPaso: number }>(`/api/misiones/${targetId}`)
    mision.value = res.mision
    maxPistasPorPaso.value = res.maxPistasPorPaso
    const firstPending = res.mision.pasos.findIndex((p: any) => p.estado !== 'completado')
    pasoIndex.value = firstPending >= 0 ? firstPending : 0
    if (res.mision.estado === 'completada') {
      resumenFinal.value = {
        completada: true,
        xpGanado: res.mision.xpGanado,
        precisionPct: res.mision.precisionPct,
        competenciaTema: res.mision.tema
      }
    }
  } catch (e: any) {
    err.value = e?.data?.statusMessage || 'No se pudo cargar la sesión de entrenamiento.'
  } finally {
    loading.value = false
  }
}

await cargarMision()

const comprobarRespuesta = async () => {
  if (!pasoActual.value || !respuesta.value.trim() || sending.value) return
  err.value = ''
  sending.value = true
  try {
    const res = await $fetch<{
      esCorrecta: boolean
      intentosCount?: number
      feedback: string
      resumenFinal: any
    }>(`/api/misiones/${mision.value.id}/responder`, {
      method: 'POST',
      body: { pasoId: pasoActual.value.id, respuesta: respuesta.value.trim() }
    })

    if (typeof res.intentosCount === 'number') {
      pasoActual.value.intentosCount = res.intentosCount
    } else {
      pasoActual.value.intentosCount = (pasoActual.value.intentosCount || 0) + 1
    }

    feedbackActual.value = { esCorrecta: res.esCorrecta, mensaje: res.feedback }
    if (res.esCorrecta) {
      pasoActual.value.estado = 'completado'
      if (res.resumenFinal) {
        resumenFinal.value = res.resumenFinal
        await fetchMe(true)
      }
    }
  } catch (e: any) {
    err.value = e?.data?.statusMessage || 'Error al evaluar tu respuesta.'
  } finally {
    sending.value = false
  }
}

const verExplicacionYAvanzar = async () => {
  if (!pasoActual.value || skipping.value) return
  err.value = ''
  skipping.value = true
  try {
    const res = await $fetch<{
      explicacion: string
      resumenFinal: any
    }>(`/api/misiones/${mision.value.id}/saltar`, {
      method: 'POST',
      body: { pasoId: pasoActual.value.id }
    })
    pasoActual.value.estado = 'completado'
    feedbackActual.value = { esCorrecta: false, guiado: true, mensaje: res.explicacion }
    if (res.resumenFinal) {
      resumenPendiente.value = res.resumenFinal
      await fetchMe(true)
    }
  } catch (e: any) {
    err.value = e?.data?.statusMessage || 'No pudimos cargar la explicación todavía.'
  } finally {
    skipping.value = false
  }
}

const pedirPista = async () => {
  if (!pasoActual.value || hintLoading.value) return
  err.value = ''
  hintLoading.value = true
  try {
    const res = await $fetch<{ pista: string; pistasUsadas: number }>(`/api/misiones/${mision.value.id}/pista`, {
      method: 'POST',
      body: { pasoId: pasoActual.value.id }
    })
    pistasReveladas.value.push(res.pista)
    pasoActual.value.pistasUsadas = res.pistasUsadas
  } catch (e: any) {
    err.value = e?.data?.statusMessage || 'No hay más pistas disponibles para este ejercicio.'
  } finally {
    hintLoading.value = false
  }
}

const enviarDuda = async () => {
  if (!pasoActual.value || dudaTexto.value.trim().length < 3 || dudaLoading.value) return
  err.value = ''
  dudaLoading.value = true
  try {
    const res = await $fetch<{ respuesta: string }>(`/api/misiones/${mision.value.id}/duda`, {
      method: 'POST',
      body: { pasoId: pasoActual.value.id, pregunta: dudaTexto.value.trim() }
    })
    respuestaDuda.value = res.respuesta
    dudaTexto.value = ''
  } catch (e: any) {
    err.value = e?.data?.statusMessage || 'No pudimos responder tu duda en este momento.'
  } finally {
    dudaLoading.value = false
  }
}

const siguientePaso = () => {
  detenerVoz()
  if (resumenPendiente.value) {
    resumenFinal.value = resumenPendiente.value
    resumenPendiente.value = null
    return
  }
  if (pasoIndex.value + 1 < (mision.value?.pasos?.length || 0)) {
    pasoIndex.value++
    respuesta.value = ''
    feedbackActual.value = null
    pistasReveladas.value = []
    respuestaDuda.value = ''
    showDuda.value = false
    err.value = ''
  }
}

const nuevaMision = async () => {
  resumenFinal.value = null
  resumenPendiente.value = null
  feedbackActual.value = null
  pistasReveladas.value = []
  respuesta.value = ''
  const created = await $fetch<{ mision: { id: string } }>('/api/misiones/crear', { method: 'POST', body: {} })
  await navigateTo(`/alumno/entrenar?misionId=${created.mision.id}`)
  await cargarMision()
}
</script>

<template>
  <div class="space-y-5 max-w-2xl mx-auto">
    <div v-if="loading" class="card-surface text-center py-12 text-sm font-semibold text-slate-500">
      Preparando tu sesión guiada con Mi Profe de Mate...
    </div>

    <div v-else-if="err && !mision" class="card-surface text-center py-8 space-y-3">
      <p class="text-sm font-semibold text-rose-700">{{ err }}</p>
      <NuxtLink to="/alumno" class="btn-primary">Volver al tablero</NuxtLink>
    </div>

    <!-- Celebración de misión completada -->
    <div v-else-if="resumenFinal" class="card-surface text-center py-8 space-y-5">
      <div class="w-20 h-20 mx-auto rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
        <Trophy class="w-10 h-10" />
      </div>
      <div class="space-y-1">
        <span class="pill-mastery">¡MISIÓN COMPLETADA!</span>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">¡Excelente trabajo!</h1>
        <p class="text-sm text-slate-600">
          Actualizamos tu Carta Cognitiva (CCA) en <strong>{{ resumenFinal.competenciaTema }}</strong>.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        <div class="rounded-2xl bg-amber-50 border border-amber-200 p-4">
          <div class="text-xs font-bold text-amber-700">XP GANADO</div>
          <div class="font-display font-black text-2xl text-amber-800">+{{ resumenFinal.xpGanado }} XP</div>
        </div>
        <div class="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
          <div class="text-xs font-bold text-emerald-700">PRECISIÓN</div>
          <div class="font-display font-black text-2xl text-emerald-800">{{ resumenFinal.precisionPct }}%</div>
        </div>
      </div>

      <div
        v-if="resumenFinal.recienCertificada"
        class="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm font-bold text-[#1D4ED8]"
      >
        🏆 ¡Desbloqueaste un nuevo Certificado Oficial SECC! Ya puedes descargarlo en PDF desde tu pestaña Progreso.
      </div>

      <div class="flex flex-wrap gap-3 justify-center pt-2">
        <NuxtLink to="/alumno/progreso" class="btn-success">Ver mi Carta Cognitiva (CCA)</NuxtLink>
        <button type="button" class="btn-primary" @click="nuevaMision">Siguiente Misión</button>
        <NuxtLink to="/alumno" class="btn-secondary">Volver a Inicio</NuxtLink>
      </div>
    </div>

    <!-- Sesión Activa Socrática -->
    <template v-else-if="mision && pasoActual">
      <!-- Barra de progreso superior -->
      <div class="card-surface py-3.5 space-y-2.5">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="text-[11px] font-extrabold uppercase tracking-wider text-[#2563EB] truncate">
              {{ mision.titulo }}
            </div>
            <div class="text-xs text-slate-500">
              Ejercicio {{ pasoIndex + 1 }} de {{ mision.pasos.length }} · {{ pasoActual.tema }}
            </div>
          </div>
          <span class="pill-xp shrink-0">Motor {{ mision.motorId }}</span>
        </div>
        <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-[#10B981] transition-all duration-300"
            :style="{ width: `${((pasoIndex + (pasoActual.estado === 'completado' ? 1 : 0)) / mision.pasos.length) * 100}%` }"
          />
        </div>
      </div>

      <!-- Tarjeta del ejercicio -->
      <div class="card-surface space-y-5">
        <div class="rounded-2xl bg-blue-50/60 border border-blue-100 p-5 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#2563EB]">
              <Sparkles class="w-3.5 h-3.5" /> Reto #{{ pasoActual.orden }}
            </span>
            <button
              v-if="vozPermitida"
              type="button"
              class="inline-flex items-center gap-1 rounded-lg bg-white hover:bg-blue-100 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-[#1D4ED8] transition"
              @click="leerEnVozAlta(pasoActual.enunciado)"
            >
              <VolumeX v-if="hablando" class="w-3.5 h-3.5" />
              <Volume2 v-else class="w-3.5 h-3.5" />
              {{ hablando ? 'Detener' : 'Escuchar' }}
            </button>
          </div>
          <h2 class="font-display font-extrabold text-xl sm:text-2xl text-slate-900 leading-snug">
            {{ pasoActual.enunciado }}
          </h2>
        </div>

        <!-- Burbuja de Feedback Socrático IA -->
        <div
          v-if="feedbackActual"
          class="rounded-2xl p-4 border-2 flex items-start gap-3 transition"
          :class="
            feedbackActual.esCorrecta
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : feedbackActual.guiado
                ? 'bg-blue-50 border-blue-300 text-blue-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
          "
        >
          <div class="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg shrink-0 shadow-sm">
            {{ feedbackActual.esCorrecta ? '🎉' : feedbackActual.guiado ? '📘' : '🧑‍🏫' }}
          </div>
          <div class="space-y-1 text-sm font-medium leading-relaxed flex-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-extrabold uppercase tracking-wide opacity-75">
                {{ feedbackActual.guiado ? 'Explicación paso a paso' : 'Mi Profe de Mate' }}
              </span>
              <button
                v-if="vozPermitida"
                type="button"
                class="text-[11px] font-bold opacity-75 hover:opacity-100 inline-flex items-center gap-1"
                @click="leerEnVozAlta(feedbackActual.mensaje)"
              >
                <Volume2 class="w-3.5 h-3.5" /> Escuchar
              </button>
            </div>
            <p>{{ feedbackActual.mensaje }}</p>
          </div>
        </div>

        <!-- Respuesta a duda conceptual del alumno -->
        <div
          v-if="respuestaDuda"
          class="rounded-2xl bg-violet-50 border border-violet-200 p-3.5 text-sm text-violet-950 space-y-1"
        >
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-extrabold uppercase tracking-wider text-violet-700">💬 Respuesta a tu duda</span>
            <button
              v-if="vozPermitida"
              type="button"
              class="text-[11px] font-bold text-violet-700 inline-flex items-center gap-1"
              @click="leerEnVozAlta(respuestaDuda)"
            >
              <Volume2 class="w-3.5 h-3.5" /> Escuchar
            </button>
          </div>
          <p class="font-medium leading-relaxed">{{ respuestaDuda }}</p>
        </div>

        <!-- Pistas reveladas -->
        <div v-if="pistasReveladas.length > 0" class="space-y-2">
          <div
            v-for="(p, i) in pistasReveladas"
            :key="i"
            class="rounded-xl bg-blue-50/70 border border-blue-200 px-3.5 py-2.5 text-xs font-semibold text-blue-900 flex items-start gap-2"
          >
            <Lightbulb class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span><strong>Pista {{ i + 1 }}:</strong> {{ p }}</span>
          </div>
        </div>

        <div v-if="err" class="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2 text-xs font-semibold text-rose-700">
          {{ err }}
        </div>

        <!-- Entrada de respuesta -->
        <form v-if="!feedbackActual?.esCorrecta && !feedbackActual?.guiado" class="space-y-3" @submit.prevent="comprobarRespuesta">
          <div class="flex gap-2">
            <input
              v-model="respuesta"
              type="text"
              autocomplete="off"
              autocapitalize="none"
              spellcheck="false"
              placeholder="Escribe tu respuesta (ej. 6, 3/4, -12)..."
              class="input-field text-base font-bold flex-1"
            />
            <button
              v-if="vozPermitida && soportaDictado"
              type="button"
              class="px-3 rounded-xl border-2 transition shrink-0 flex items-center justify-center"
              :class="
                escuchando
                  ? 'bg-rose-500 border-rose-500 text-white animate-pulse'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-[#2563EB] hover:text-[#2563EB]'
              "
              :title="escuchando ? 'Escuchando...' : 'Dictar respuesta por voz'"
              @click="alternarDictado"
            >
              <MicOff v-if="escuchando" class="w-4 h-4" />
              <Mic v-else class="w-4 h-4" />
            </button>
            <button type="submit" class="btn-primary shrink-0" :disabled="sending || !respuesta.trim()">
              <Send class="w-4 h-4" />
              {{ sending ? '...' : 'Comprobar' }}
            </button>
          </div>

          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                class="btn-outline text-xs py-2 px-3"
                :disabled="hintLoading || pasoActual.pistasUsadas >= maxPistasPorPaso"
                @click="pedirPista"
              >
                <Lightbulb class="w-4 h-4 text-amber-500" />
                {{
                  pasoActual.pistasUsadas >= maxPistasPorPaso
                    ? `Pistas usadas (${pasoActual.pistasUsadas}/${maxPistasPorPaso})`
                    : `Pedir pista (${pasoActual.pistasUsadas}/${maxPistasPorPaso})`
                }}
              </button>

              <button
                type="button"
                class="rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-extrabold py-2 px-3 inline-flex items-center gap-1.5 transition"
                @click="showDuda = !showDuda"
              >
                <MessageCircleQuestion class="w-4 h-4" />
                Tengo una duda
              </button>

              <button
                v-if="puedeVerExplicacion"
                type="button"
                class="rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] text-xs font-extrabold py-2 px-3 inline-flex items-center gap-1.5 transition"
                :disabled="skipping"
                @click="verExplicacionYAvanzar"
              >
                <BookOpen class="w-4 h-4" />
                {{ skipping ? 'Cargando...' : 'Ver explicación y continuar' }}
              </button>
            </div>

            <button
              type="button"
              class="text-xs font-bold text-slate-500 hover:text-[#2563EB] inline-flex items-center gap-1"
              @click="showKeyboard = !showKeyboard"
            >
              <Keyboard class="w-4 h-4" />
              {{ showKeyboard ? 'Ocultar teclado mate' : 'Mostrar teclado mate' }}
            </button>
          </div>

          <!-- Caja desplegable para preguntarle una duda conceptual al profe -->
          <div v-if="showDuda" class="rounded-2xl bg-violet-50/70 border border-violet-200 p-3 flex gap-2">
            <input
              v-model="dudaTexto"
              type="text"
              maxlength="400"
              placeholder="Ej. ¿Qué significa denominador? o ¿Por qué se invierte el signo?"
              class="input-field bg-white text-xs flex-1"
              @keydown.enter.prevent="enviarDuda"
            />
            <button
              type="button"
              class="rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold px-3.5 py-2 shrink-0 disabled:opacity-50"
              :disabled="dudaLoading || dudaTexto.trim().length < 3"
              @click="enviarDuda"
            >
              {{ dudaLoading ? '...' : 'Preguntar' }}
            </button>
          </div>

          <MathKeyboard
            v-if="showKeyboard"
            @insert="(v) => (respuesta += v)"
            @backspace="respuesta = respuesta.slice(0, -1)"
            @clear="respuesta = ''"
            @submit="comprobarRespuesta"
          />
        </form>

        <!-- Botón continuar cuando acierta o vio la explicación guiada -->
        <div v-else class="pt-1">
          <button
            type="button"
            class="w-full py-3.5 text-base"
            :class="feedbackActual?.guiado ? 'btn-primary' : 'btn-success'"
            @click="siguientePaso"
          >
            <CheckCircle2 class="w-5 h-5" />
            {{ resumenPendiente ? 'Ver resumen de mi misión' : 'Continuar al siguiente ejercicio' }}
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
