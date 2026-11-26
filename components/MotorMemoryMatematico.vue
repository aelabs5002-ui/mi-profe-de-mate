<script setup lang="ts">
import { Sparkles, RotateCcw, Trophy } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'finished', payload: { motorId: 'C'; tema: string; dificultad: number; aciertos: number; total: number; rachaMaxima: number; duracionSeg: number }): void
}>()

interface Card {
  id: number
  pairId: string
  label: string
  flipped: boolean
  matched: boolean
}

const PAIRS: Array<[string, string]> = [
  ['1/2', '50%'],
  ['1/4', '0.25'],
  ['3/4', '75%'],
  ['2/4', '0.5'],
  ['1/5', '20%'],
  ['3/10', '0.3']
]

const cards = ref<Card[]>([])
const selected = ref<number[]>([])
const moves = ref(0)
const matches = ref(0)
const locked = ref(false)
const startedAt = ref(Date.now())
const finished = ref(false)

const iniciar = () => {
  const deck: Card[] = []
  let seq = 1
  PAIRS.forEach(([a, b], idx) => {
    const pairId = `p-${idx}`
    deck.push({ id: seq++, pairId, label: a, flipped: false, matched: false })
    deck.push({ id: seq++, pairId, label: b, flipped: false, matched: false })
  })
  cards.value = deck.sort(() => Math.random() - 0.5)
  selected.value = []
  moves.value = 0
  matches.value = 0
  locked.value = false
  startedAt.value = Date.now()
  finished.value = false
}

iniciar()

const flipCard = (card: Card) => {
  if (locked.value || card.flipped || card.matched) return
  card.flipped = true
  selected.value.push(card.id)

  if (selected.value.length === 2) {
    moves.value++
    locked.value = true
    const [id1, id2] = selected.value
    const c1 = cards.value.find((c) => c.id === id1)!
    const c2 = cards.value.find((c) => c.id === id2)!

    if (c1.pairId === c2.pairId) {
      c1.matched = true
      c2.matched = true
      matches.value++
      selected.value = []
      locked.value = false

      if (matches.value === PAIRS.length) {
        finished.value = true
        const aciertosCalc = Math.max(3, Math.min(PAIRS.length, PAIRS.length - Math.max(0, moves.value - PAIRS.length - 2)))
        emit('finished', {
          motorId: 'C',
          tema: 'Fracciones Equivalentes',
          dificultad: 2,
          aciertos: aciertosCalc,
          total: PAIRS.length,
          rachaMaxima: PAIRS.length,
          duracionSeg: Math.max(20, Math.round((Date.now() - startedAt.value) / 1000))
        })
      }
    } else {
      setTimeout(() => {
        c1.flipped = false
        c2.flipped = false
        selected.value = []
        locked.value = false
      }, 750)
    }
  }
}
</script>

<template>
  <div class="card-surface space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <span class="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">Motor C · Memory Matemático</span>
        <h3 class="text-lg font-extrabold text-slate-900">Empareja Equivalencias (Fracción · Decimal · %)</h3>
      </div>
      <span class="pill-mastery"><Sparkles class="w-3.5 h-3.5" /> {{ matches }}/{{ PAIRS.length }} pares</span>
    </div>

    <div v-if="!finished" class="space-y-3">
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        <button
          v-for="c in cards"
          :key="c.id"
          type="button"
          class="h-20 rounded-2xl border-2 font-display font-extrabold text-lg transition active:scale-95"
          :class="
            c.matched
              ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
              : c.flipped
                ? 'bg-blue-50 border-[#2563EB] text-[#2563EB]'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-400'
          "
          @click="flipCard(c)"
        >
          {{ c.flipped || c.matched ? c.label : '?' }}
        </button>
      </div>
      <div class="text-xs text-slate-500 text-center">
        Intentos realizados: <strong>{{ moves }}</strong> · Encuentra todas las parejas equivalentes.
      </div>
    </div>

    <div v-else class="text-center py-6 space-y-4">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
        <Trophy class="w-8 h-8" />
      </div>
      <div>
        <h4 class="text-xl font-extrabold text-slate-900">¡Todas las equivalencias dominadas!</h4>
        <p class="text-sm text-slate-600 mt-1">Completaste los {{ PAIRS.length }} pares en {{ moves }} intentos.</p>
      </div>
      <button type="button" class="btn-success" @click="iniciar">
        <RotateCcw class="w-4 h-4" /> Jugar de nuevo
      </button>
    </div>
  </div>
</template>
