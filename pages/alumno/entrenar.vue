<script setup lang="ts">
import { Lightbulb, Send, ArrowRight, Trophy, Keyboard, Sparkles, CheckCircle2, BookOpen } from 'lucide-vue-next'

definePageMeta({ layout: 'alumno' })

const route = useRoute()
const { fetchMe } = useSession()

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

const siguientePaso = () => {
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
          <span class="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#2563EB]">
            <Sparkles class="w-3.5 h-3.5" /> Reto #{{ pasoActual.orden }}
          </span>
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
          <div class="space-y-1 text-sm font-medium leading-relaxed">
            <div class="text-xs font-extrabold uppercase tracking-wide opacity-75">
              {{ feedbackActual.guiado ? 'Explicación paso a paso' : 'Mi Profe de Mate' }}
            </div>
            <p>{{ feedbackActual.mensaje }}</p>
          </div>
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
