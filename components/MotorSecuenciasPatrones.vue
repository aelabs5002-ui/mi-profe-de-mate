<script setup lang="ts">
import { Sparkles, Trophy, RotateCcw } from 'lucide-vue-next'

const emit = defineEmits<{
  (
    e: 'finished',
    payload: {
      motorId: 'H'
      tema: string
      dificultad: number
      aciertos: number
      total: number
      rachaMaxima: number
      duracionSeg: number
    }
  ): void
}>()

interface SeqRound {
  terms: number[]
  correct: number
  ruleHint: string
  options: number[]
}

const TOTAL_ROUNDS = 6

function buildRounds(): SeqRound[] {
  const list: SeqRound[] = []
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const tipo = i % 4
    let terms: number[] = []
    let correct = 0
    let ruleHint = ''

    if (tipo === 0) {
      // Aritmética creciente
      const start = Math.floor(Math.random() * 10) + 2
      const diff = Math.floor(Math.random() * 6) + 3
      terms = [start, start + diff, start + diff * 2, start + diff * 3]
      correct = start + diff * 4
      ruleHint = `Se suma +${diff} cada vez`
    } else if (tipo === 1) {
      // Geométrica ×2 o ×3
      const start = Math.floor(Math.random() * 3) + 2
      const ratio = 2
      terms = [start, start * ratio, start * ratio ** 2, start * ratio ** 3]
      correct = start * ratio ** 4
      ruleHint = `Se multiplica ×${ratio} cada vez`
    } else if (tipo === 2) {
      // Incrementos crecientes (+2, +4, +6, +8) o (+1, +2, +3, +4)
      const start = Math.floor(Math.random() * 5) + 1
      const step = Math.floor(Math.random() * 2) + 1
      const t1 = start
      const t2 = t1 + step
      const t3 = t2 + step * 2
      const t4 = t3 + step * 3
      terms = [t1, t2, t3, t4]
      correct = t4 + step * 4
      ruleHint = `Cada salto aumenta en +${step}`
    } else {
      // Descendente constante
      const diff = Math.floor(Math.random() * 5) + 3
      const start = diff * 5 + Math.floor(Math.random() * 12) + 6
      terms = [start, start - diff, start - diff * 2, start - diff * 3]
      correct = start - diff * 4
      ruleHint = `Se resta -${diff} cada vez`
    }

    const opts = new Set<number>([correct])
    while (opts.size < 4) {
      const delta = (Math.floor(Math.random() * 9) - 4) || 2
      const cand = correct + delta
      if (cand >= 0) opts.add(cand)
    }

    list.push({
      terms,
      correct,
      ruleHint,
      options: Array.from(opts).sort(() => Math.random() - 0.5)
    })
  }
  return list
}

const rounds = ref<SeqRound[]>([])
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
        motorId: 'H',
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
  }, 850)
}
</script>

<template>
  <div class="card-surface space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <span class="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">Motor H · Secuencias y Patrones</span>
        <h3 class="text-lg font-extrabold text-slate-900">Descubre el Número que Sigue</h3>
      </div>
      <span class="pill-mastery"><Sparkles class="w-3.5 h-3.5" /> Serie {{ Math.min(idx + 1, TOTAL_ROUNDS) }}/{{ TOTAL_ROUNDS }}</span>
    </div>

    <div v-if="!finished && rounds[idx]" class="space-y-5">
      <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          class="h-full bg-indigo-500 transition-all duration-300"
          :style="{ width: `${((idx + 1) / TOTAL_ROUNDS) * 100}%` }"
        />
      </div>

      <div
        class="rounded-2xl p-6 border-2 transition space-y-4 text-center"
        :class="
          feedback === 'ok'
            ? 'bg-emerald-50 border-emerald-400'
            : feedback === 'err'
              ? 'bg-amber-50 border-amber-400'
              : 'bg-indigo-50/50 border-indigo-100'
        "
      >
        <div class="text-xs font-bold text-slate-500">Observa el patrón entre los números:</div>
        <div class="flex items-center justify-center gap-2.5 flex-wrap">
          <span
            v-for="(num, tIdx) in rounds[idx].terms"
            :key="tIdx"
            class="w-14 h-14 rounded-2xl bg-white border-2 border-indigo-200 flex items-center justify-center font-display font-black text-xl text-slate-900 shadow-sm"
          >
            {{ num }}
          </span>
          <span class="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-display font-black text-2xl shadow-sm">
            ?
          </span>
        </div>

        <div v-if="feedback === 'ok'" class="text-xs font-extrabold text-emerald-700">
          ¡Patrón descubierto! ✨ ({{ rounds[idx].ruleHint }})
        </div>
        <div v-else-if="feedback === 'err'" class="text-xs font-extrabold text-amber-800">
          🧠 El error es útil para aprender · Era {{ rounds[idx].correct }} ({{ rounds[idx].ruleHint }})
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="opt in rounds[idx].options"
          :key="opt"
          type="button"
          class="h-14 rounded-2xl bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-500 font-display font-extrabold text-xl text-slate-800 shadow-sm active:scale-95 transition"
          @click="elegir(opt)"
        >
          {{ opt }}
        </button>
      </div>
    </div>

    <div v-else class="text-center py-6 space-y-4">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
        <Trophy class="w-8 h-8" />
      </div>
      <div>
        <h4 class="text-xl font-extrabold text-slate-900">¡Mente lógica activada!</h4>
        <p class="text-sm text-slate-600 mt-1">
          Acertaste <strong>{{ aciertos }}/{{ TOTAL_ROUNDS }}</strong> secuencias · Racha máxima: <strong>{{ rachaMaxima }}</strong>
        </p>
      </div>
      <button type="button" class="btn-primary" @click="reiniciar">
        <RotateCcw class="w-4 h-4" /> Jugar nuevas secuencias
      </button>
    </div>
  </div>
</template>
