<script setup lang="ts">
import { Delete, CornerDownLeft } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'insert', value: string): void
  (e: 'backspace'): void
  (e: 'clear'): void
  (e: 'submit'): void
}>()

const rows = [
  ['7', '8', '9', '/', 'x'],
  ['4', '5', '6', '-', 'y'],
  ['1', '2', '3', '+', '='],
  ['0', '.', '(', ')', '×']
]
</script>

<template>
  <div class="rounded-2xl bg-slate-100 border border-slate-200 p-2.5 space-y-2 select-none">
    <div v-for="(row, rIdx) in rows" :key="rIdx" class="grid grid-cols-5 gap-1.5">
      <button
        v-for="key in row"
        :key="key"
        type="button"
        class="h-11 rounded-xl bg-white hover:bg-blue-50 active:scale-95 border border-slate-200 font-display font-extrabold text-base text-slate-800 shadow-sm transition"
        :class="['/', '-', '+', '=', '×', 'x', 'y'].includes(key) ? 'text-[#2563EB] bg-blue-50/40' : ''"
        @click="emit('insert', key)"
      >
        {{ key }}
      </button>
    </div>
    <div class="grid grid-cols-3 gap-1.5 pt-0.5">
      <button
        type="button"
        class="h-10 rounded-xl bg-white hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-600 transition"
        @click="emit('clear')"
      >
        Limpiar
      </button>
      <button
        type="button"
        class="h-10 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 text-xs font-bold text-rose-600 inline-flex items-center justify-center gap-1 transition"
        @click="emit('backspace')"
      >
        <Delete class="w-4 h-4" /> Borrar
      </button>
      <button
        type="button"
        class="h-10 rounded-xl bg-[#10B981] hover:bg-[#059669] text-xs font-extrabold text-white inline-flex items-center justify-center gap-1 shadow-sm transition"
        @click="emit('submit')"
      >
        <CornerDownLeft class="w-4 h-4" /> Comprobar
      </button>
    </div>
  </div>
</template>
