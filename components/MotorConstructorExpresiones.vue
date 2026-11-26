<script setup lang="ts">
import { Blocks, Trophy, RotateCcw, CheckCircle2 } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'finished', payload: { motorId: 'F'; tema: string; dificultad: number; aciertos: number; total: number; rachaMaxima: number; duracionSeg: number }): void
}>()

interface Challenge {
  enunciado: string
  pasoGuia: string
  tokens: string[]
  expected: string[]
}

const CHALLENGES: Challenge[] = [
  {
    enunciado: 'Ordena el despeje correcto de: x + 5 = 12',
    pasoGuia: 'Deja la x sola a la izquierda y pasa el +5 restando.',
    tokens: ['x', '=', '12', '-', '5', '+'],
    expected: ['x', '=', '12', '-', '5']
  },
  {
    enunciado: 'Arma el primer paso para despejar: 2x = 14',
    pasoGuia: 'El 2 que multiplica pasa dividiendo al otro lado.',
    tokens: ['x', '=', '14', '÷', '2', '×'],
    expected: ['x', '=', '14', '÷', '2']
  },
  {
    enunciado: 'Aplica la propiedad distributiva a: 3(x + 2)',
    pasoGuia: 'Multiplica 3 por x y 3 por 2.',
    tokens: ['3x', '+', '6', '2', '5x'],
    expected: ['3x', '+', '6']
  },
  {
    enunciado: 'Despeja x en: x - 4 = 9',
    pasoGuia: 'El -4 pasa sumando al otro lado de la igualdad.',
    tokens: ['x', '=', '9', '+', '4', '-'],
    expected: ['x', '=', '9', '+', '4']
  }
]

const idx = ref(0)
const built = ref<string[]>([])
const aciertos = ref(0)
const feedback = ref<'ok' | 'err' | null>(null)
const startedAt = ref(Date.now())
const finished = ref(false)
const intentoActual = ref(0)

const addToken = (t: string) => {
  if (feedback.value === 'ok') return
  built.value.push(t)
}

const removeLast = () => {
  built.value.pop()
}

const comprobar = () => {
  const ch = CHALLENGES[idx.value]
  intentoActual.value++
  const ok = built.value.join(' ') === ch.expected.join(' ')
  if (ok) {
    if (intentoActual.value === 1) aciertos.value++
    feedback.value = 'ok'
    setTimeout(() => {
      feedback.value = null
      built.value = []
      intentoActual.value = 0
      if (idx.value + 1 >= CHALLENGES.length) {
        finished.value = true
        emit('finished', {
          motorId: 'F',
          tema: 'Ecuaciones Lineales',
          dificultad: 2,
          aciertos: Math.max(aciertos.value, CHALLENGES.length - 1),
          total: CHALLENGES.length,
          rachaMaxima: aciertos.value,
          duracionSeg: Math.max(25, Math.round((Date.now() - startedAt.value) / 1000))
        })
      } else {
        idx.value++
      }
    }, 800)
  } else {
    feedback.value = 'err'
  }
}

const reiniciar = () => {
  idx.value = 0
  built.value = []
  aciertos.value = 0
  feedback.value = null
  intentoActual.value = 0
  startedAt.value = Date.now()
  finished.value = false
}
</script>

<template>
  <div class="card-surface space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <span class="text-[11px] font-extrabold uppercase tracking-wider text-violet-600">Motor F · Constructor de Expresiones</span>
        <h3 class="text-lg font-extrabold text-slate-900">Construye Ecuaciones y Despejes</h3>
      </div>
      <span class="text-xs font-bold text-slate-500">Reto {{ idx + 1 }}/{{ CHALLENGES.length }}</span>
    </div>

    <div v-if="!finished" class="space-y-4">
      <div class="rounded-2xl bg-violet-50/70 border border-violet-100 p-4">
        <div class="font-display font-extrabold text-lg text-slate-900">{{ CHALLENGES[idx].enunciado }}</div>
        <p class="text-xs text-slate-600 mt-1">💡 {{ CHALLENGES[idx].pasoGuia }}</p>
      </div>

      <!-- Zona de construcción -->
      <div class="min-h-[64px] rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-3 flex items-center gap-2 flex-wrap">
        <span v-if="built.length === 0" class="text-xs text-slate-400">Toca los bloques de abajo en orden para armar la expresión...</span>
        <span
          v-for="(tok, i) in built"
          :key="i"
          class="px-3.5 py-1.5 rounded-xl bg-[#2563EB] text-white font-display font-extrabold text-base shadow-sm"
        >
          {{ tok }}
        </span>
      </div>

      <div v-if="feedback === 'ok'" class="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 flex items-center gap-1.5">
        <CheckCircle2 class="w-4 h-4" /> ¡Expresión construida perfectamente!
      </div>
      <div v-else-if="feedback === 'err'" class="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-bold text-amber-800">
        🧠 El error es útil para aprender. Revisa el orden o el signo y vuelve a intentarlo.
      </div>

      <!-- Fichas -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(tok, i) in CHALLENGES[idx].tokens"
          :key="`${idx}-${i}`"
          type="button"
          class="px-4 py-2.5 rounded-xl bg-white hover:bg-violet-50 border-2 border-slate-200 hover:border-violet-400 font-display font-extrabold text-base text-slate-800 shadow-sm active:scale-95 transition"
          @click="addToken(tok)"
        >
          {{ tok }}
        </button>
      </div>

      <div class="flex items-center gap-2 pt-1">
        <button type="button" class="btn-secondary" @click="removeLast">Quitar último</button>
        <button type="button" class="btn-secondary" @click="built = []; feedback = null">Limpiar</button>
        <button type="button" class="btn-primary flex-1" :disabled="built.length === 0" @click="comprobar">
          <Blocks class="w-4 h-4" /> Comprobar expresión
        </button>
      </div>
    </div>

    <div v-else class="text-center py-6 space-y-4">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center">
        <Trophy class="w-8 h-8" />
      </div>
      <div>
        <h4 class="text-xl font-extrabold text-slate-900">¡Álgebra en acción!</h4>
        <p class="text-sm text-slate-600 mt-1">Terminaste los {{ CHALLENGES.length }} retos de construcción algebraica.</p>
      </div>
      <button type="button" class="btn-primary" @click="reiniciar">
        <RotateCcw class="w-4 h-4" /> Repetir retos
      </button>
    </div>
  </div>
</template>
