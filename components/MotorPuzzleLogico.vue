<script setup lang="ts">
import { Puzzle, Trophy, RotateCcw, ArrowRight } from 'lucide-vue-next'

const emit = defineEmits<{
  (
    e: 'finished',
    payload: {
      motorId: 'D'
      tema: string
      dificultad: number
      aciertos: number
      total: number
      rachaMaxima: number
      duracionSeg: number
    }
  ): void
}>()

interface ChainRound {
  start: number
  steps: string[]
  correct: number
  options: number[]
}

const TOTAL_ROUNDS = 6

function buildRounds(): ChainRound[] {
  const list: ChainRound[] = []
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const start = Math.floor(Math.random() * 8) + 3 // 3..10
    const mult = Math.floor(Math.random() * 3) + 2 // 2..4
    const afterMult = start * mult
    const addOrSub = i % 2 === 0
    const delta = Math.floor(Math.random() * 9) + 2
    const afterSecond = addOrSub ? afterMult + delta : afterMult - delta
    const thirdVal = Math.floor(Math.random() * 6) + 2
    const finalVal = i % 3 === 0 && afterSecond % 2 === 0 ? afterSecond / 2 : afterSecond + thirdVal
    const step3 = i % 3 === 0 && afterSecond % 2 === 0 ? '÷ 2' : `+ ${thirdVal}`

    const opts = new Set<number>([finalVal])
    while (opts.size < 4) {
      const offset = (Math.floor(Math.random() * 9) - 4) || 3
      const candidate = finalVal + offset
      if (candidate >= 0) opts.add(candidate)
    }

    list.push({
      start,
      steps: [`× ${mult}`, addOrSub ? `+ ${delta}` : `- ${delta}`, step3],
      correct: finalVal,
      options: Array.from(opts).sort(() => Math.random() - 0.5)
    })
  }
  return list
}

const rounds = ref<ChainRound[]>([])
const idx = ref(0)
const aciertos = ref(0)
const racha = ref(0)
const rachaMaxima = ref(0)
const feedback = ref<'ok' | 'err' | null>(null)
const startedAt = ref(Date.now())
const finished = ref(false)

const reiniciar = () => {
  rounds.value = buildRounds()
  idx.value = 0
  aciertos.value = 0
  racha.value = 0
  rachaMaxima.value = 0
  feedback.value = null
  startedAt.value = Date.now()
  finished.value = false
}

reiniciar()

const elegir = (val: number) => {
  if (feedback.value || finished.value) return
  const current = rounds.value[idx.value]
  if (val === current.correct) {
    aciertos.value++
    racha.value++
    rachaMaxima.value = Math.max(rachaMaxima.value, racha.value)
    feedback.value = 'ok'
  } else {
    racha.value = 0
    feedback.value = 'err'
  }

  setTimeout(() => {
    feedback.value = null
    if (idx.value + 1 >= TOTAL_ROUNDS) {
      finished.value = true
      emit('finished', {
        motorId: 'D',
        tema: 'Operaciones y Cálculo Mental',
        dificultad: 2,
        aciertos: aciertos.value,
        total: TOTAL_ROUNDS,
        rachaMaxima: rachaMaxima.value,
        duracionSeg: Math.max(20, Math.round((Date.now() - startedAt.value) / 1000))
      })
    } else {
      idx.value++
    }
  }, 700)
}
</script>

<template>
  <div class="card-surface space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <span class="text-[11px] font-extrabold uppercase tracking-wider text-cyan-600">Motor D · Puzzle Lógico</span>
        <h3 class="text-lg font-extrabold text-slate-900">Cadena de Operaciones</h3>
      </div>
      <span class="pill-xp"><Puzzle class="w-3.5 h-3.5" /> Reto {{ Math.min(idx + 1, TOTAL_ROUNDS) }}/{{ TOTAL_ROUNDS }}</span>
    </div>

    <div v-if="!finished && rounds[idx]" class="space-y-5">
      <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          class="h-full bg-cyan-500 transition-all duration-300"
          :style="{ width: `${((idx + 1) / TOTAL_ROUNDS) * 100}%` }"
        />
      </div>

      <div
        class="rounded-2xl p-6 border-2 transition space-y-4"
        :class="
          feedback === 'ok'
            ? 'bg-emerald-50 border-emerald-400'
            : feedback === 'err'
              ? 'bg-amber-50 border-amber-400'
              : 'bg-cyan-50/50 border-cyan-100'
        "
      >
        <div class="text-xs font-bold text-slate-500 text-center">Sigue la cadena de izquierda a derecha:</div>
        <div class="flex items-center justify-center gap-2 flex-wrap">
          <span class="px-4 py-2.5 rounded-2xl bg-[#2563EB] text-white font-display font-black text-2xl shadow-sm">
            {{ rounds[idx].start }}
          </span>
          <template v-for="(st, sIdx) in rounds[idx].steps" :key="sIdx">
            <ArrowRight class="w-4 h-4 text-slate-400" />
            <span class="px-3.5 py-2 rounded-xl bg-white border-2 border-cyan-200 font-display font-extrabold text-lg text-slate-800">
              {{ st }}
            </span>
          </template>
          <ArrowRight class="w-4 h-4 text-slate-400" />
          <span class="px-4 py-2.5 rounded-2xl bg-slate-900 text-white font-display font-black text-2xl">?</span>
        </div>

        <div v-if="feedback === 'ok'" class="text-center text-xs font-extrabold text-emerald-700">
          ¡Cadena resuelta sin fallos! 🎯
        </div>
        <div v-else-if="feedback === 'err'" class="text-center text-xs font-extrabold text-amber-800">
          🧠 El error es útil para aprender · El resultado final era {{ rounds[idx].correct }}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="opt in rounds[idx].options"
          :key="opt"
          type="button"
          class="h-14 rounded-2xl bg-white hover:bg-cyan-50 border-2 border-slate-200 hover:border-cyan-500 font-display font-extrabold text-xl text-slate-800 shadow-sm active:scale-95 transition"
          @click="elegir(opt)"
        >
          {{ opt }}
        </button>
      </div>
    </div>

    <div v-else class="text-center py-6 space-y-4">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
        <Trophy class="w-8 h-8" />
      </div>
      <div>
        <h4 class="text-xl font-extrabold text-slate-900">¡Puzzle Lógico completado!</h4>
        <p class="text-sm text-slate-600 mt-1">
          Lograste <strong>{{ aciertos }}/{{ TOTAL_ROUNDS }}</strong> cadenas correctas · Racha máxima: <strong>{{ rachaMaxima }}</strong>
        </p>
      </div>
      <button type="button" class="btn-primary" @click="reiniciar">
        <RotateCcw class="w-4 h-4" /> Jugar otra ronda
      </button>
    </div>
  </div>
</template>
