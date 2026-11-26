<script setup lang="ts">
import { Zap, Trophy, RotateCcw } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'finished', payload: { motorId: 'A'; tema: string; dificultad: number; aciertos: number; total: number; rachaMaxima: number; duracionSeg: number }): void
}>()

interface Round {
  prompt: string
  correct: number
  options: number[]
}

const TOTAL_ROUNDS = 8
const rounds = ref<Round[]>([])
const idx = ref(0)
const aciertos = ref(0)
const racha = ref(0)
const rachaMaxima = ref(0)
const feedback = ref<'ok' | 'err' | null>(null)
const startedAt = ref(Date.now())
const finished = ref(false)

function buildRounds(): Round[] {
  const list: Round[] = []
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const tipo = i % 3
    let prompt = ''
    let correct = 0
    if (tipo === 0) {
      const a = Math.floor(Math.random() * 18) + 6
      const b = Math.floor(Math.random() * 15) + 4
      prompt = `${a} + ${b}`
      correct = a + b
    } else if (tipo === 1) {
      const a = Math.floor(Math.random() * 9) + 3
      const b = Math.floor(Math.random() * 9) + 3
      prompt = `${a} × ${b}`
      correct = a * b
    } else {
      const a = Math.floor(Math.random() * 14) - 7
      const b = Math.floor(Math.random() * 14) + 2
      prompt = `${a} + ${b}`
      correct = a + b
    }

    const opts = new Set<number>([correct])
    while (opts.size < 4) {
      const delta = (Math.floor(Math.random() * 7) - 3) || 2
      opts.add(correct + delta)
    }
    list.push({
      prompt,
      correct,
      options: Array.from(opts).sort(() => Math.random() - 0.5)
    })
  }
  return list
}

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
        motorId: 'A',
        tema: 'Operaciones y Cálculo Mental',
        dificultad: 2,
        aciertos: aciertos.value,
        total: TOTAL_ROUNDS,
        rachaMaxima: rachaMaxima.value,
        duracionSeg: Math.max(15, Math.round((Date.now() - startedAt.value) / 1000))
      })
    } else {
      idx.value++
    }
  }, 550)
}
</script>

<template>
  <div class="card-surface space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <span class="text-[11px] font-extrabold uppercase tracking-wider text-[#2563EB]">Motor A · Disparo Numérico</span>
        <h3 class="text-lg font-extrabold text-slate-900">Agilidad de Cálculo Mental</h3>
      </div>
      <span class="pill-xp"><Zap class="w-3.5 h-3.5" /> Combo ×{{ racha }}</span>
    </div>

    <div v-if="!finished && rounds[idx]" class="space-y-5">
      <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          class="h-full bg-[#2563EB] transition-all duration-300"
          :style="{ width: `${((idx + 1) / TOTAL_ROUNDS) * 100}%` }"
        />
      </div>

      <div
        class="rounded-2xl p-8 text-center border-2 transition"
        :class="
          feedback === 'ok'
            ? 'bg-emerald-50 border-emerald-400'
            : feedback === 'err'
              ? 'bg-amber-50 border-amber-400'
              : 'bg-blue-50/50 border-blue-100'
        "
      >
        <div class="text-xs font-bold text-slate-500 mb-1">Reto {{ idx + 1 }} de {{ TOTAL_ROUNDS }}</div>
        <div class="font-display font-black text-4xl text-slate-900">{{ rounds[idx].prompt }} = ?</div>
        <div v-if="feedback === 'ok'" class="mt-2 text-xs font-extrabold text-emerald-700">¡Disparo certero! 🎯</div>
        <div v-else-if="feedback === 'err'" class="mt-2 text-xs font-extrabold text-amber-800">
          🧠 El error es útil para aprender · Era {{ rounds[idx].correct }}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="opt in rounds[idx].options"
          :key="opt"
          type="button"
          class="h-14 rounded-2xl bg-white hover:bg-blue-50 border-2 border-slate-200 hover:border-[#2563EB] font-display font-extrabold text-xl text-slate-800 shadow-sm active:scale-95 transition"
          @click="elegir(opt)"
        >
          {{ opt }}
        </button>
      </div>
    </div>

    <div v-else class="text-center py-6 space-y-4">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
        <Trophy class="w-8 h-8" />
      </div>
      <div>
        <h4 class="text-xl font-extrabold text-slate-900">¡Partida completada!</h4>
        <p class="text-sm text-slate-600 mt-1">
          Lograste <strong>{{ aciertos }}/{{ TOTAL_ROUNDS }}</strong> aciertos · Racha máxima: <strong>{{ rachaMaxima }}</strong>
        </p>
      </div>
      <button type="button" class="btn-primary" @click="reiniciar">
        <RotateCcw class="w-4 h-4" /> Jugar otra ronda
      </button>
    </div>
  </div>
</template>
