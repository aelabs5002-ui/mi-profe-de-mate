<script setup lang="ts">
import {
  BookOpen,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  GraduationCap,
  Users,
  Smile
} from 'lucide-vue-next'

definePageMeta({ layout: false })

const router = useRouter()
const { data: catalogo } = await useFetch<{ iaConectada?: boolean; modeloIa?: string }>('/api/catalogo')

const tab = ref<'padres' | 'alumno' | 'profesor' | 'faq'>('padres')

const volver = () => {
  if (import.meta.client && window.history.length > 1) {
    router.back()
  } else {
    navigateTo('/login')
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F7FAFC] pb-20">
    <!-- Cabecera -->
    <header class="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div class="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-sm font-extrabold text-[#2563EB] hover:underline"
          @click="volver"
        >
          <ArrowLeft class="w-4 h-4" /> Volver
        </button>

        <div class="flex items-center gap-2 font-display font-extrabold text-sm sm:text-base text-slate-900">
          <BookOpen class="w-4 h-4 text-[#2563EB]" />
          <span>Guía de Uso · Mi Profe de Mate</span>
        </div>

        <NuxtLink to="/login" class="text-xs font-bold text-slate-600 hover:text-[#2563EB]">
          Entrar
        </NuxtLink>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <!-- Hero -->
      <section class="rounded-3xl bg-gradient-to-br from-[#2563EB] to-indigo-700 text-white p-6 shadow-soft space-y-3">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold">
            <Sparkles class="w-3.5 h-3.5" /> Tutorial rápido (2 minutos)
          </span>
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold"
            :class="catalogo?.iaConectada ? 'bg-emerald-400/25 text-emerald-100' : 'bg-amber-400/25 text-amber-100'"
          >
            <CheckCircle2 class="w-3.5 h-3.5" />
            {{ catalogo?.iaConectada ? 'Motor IA Gemini: Conectado' : 'Modo pedagógico de respaldo' }}
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold leading-tight">
          Cómo usar Mi Profe de Mate en familia y en clase
        </h1>
        <p class="text-sm text-blue-100">
          Tutor matemático con IA socrática para estudiantes de 9 a 15 años: nunca regala la respuesta, guía paso a paso y conecta al estudiante con sus padres y su profesor.
        </p>
      </section>

      <!-- Pestañas de rol -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          class="rounded-2xl border-2 p-3 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition"
          :class="tab === 'padres' ? 'bg-blue-50 border-[#2563EB] text-[#1D4ED8]' : 'bg-white border-slate-200 text-slate-600'"
          @click="tab = 'padres'"
        >
          <Users class="w-4 h-4" /> Padres
        </button>
        <button
          type="button"
          class="rounded-2xl border-2 p-3 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition"
          :class="tab === 'alumno' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'"
          @click="tab = 'alumno'"
        >
          <Smile class="w-4 h-4" /> Estudiantes
        </button>
        <button
          type="button"
          class="rounded-2xl border-2 p-3 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition"
          :class="tab === 'profesor' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'"
          @click="tab = 'profesor'"
        >
          <GraduationCap class="w-4 h-4" /> Profesores
        </button>
        <button
          type="button"
          class="rounded-2xl border-2 p-3 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition"
          :class="tab === 'faq' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600'"
          @click="tab = 'faq'"
        >
          <HelpCircle class="w-4 h-4" /> Dudas
        </button>
      </div>

      <!-- TAB PADRES -->
      <section v-if="tab === 'padres'" class="space-y-4">
        <div class="card-surface border-blue-200 bg-blue-50/50 space-y-3">
          <div class="text-xs font-extrabold uppercase tracking-wider text-[#2563EB]">
            ✨ Qué puedes hacer y lograr como padre o representante
          </div>
          <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-slate-700">
            <li class="rounded-xl bg-white border border-blue-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span><strong>Acompañar sin estrés ni discusiones:</strong> el Tutor IA guía a tu hijo/a paso a paso sin regalarle la respuesta, ideal incluso si no recuerdas el tema.</span>
            </li>
            <li class="rounded-xl bg-white border border-blue-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span><strong>Adaptar la app al colegio real:</strong> sube una foto o PDF del temario escolar y la IA genera prácticas alineadas a su grado y país.</span>
            </li>
            <li class="rounded-xl bg-white border border-blue-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span><strong>Saber exactamente en qué falla:</strong> la Carta Cognitiva (CCA) muestra el dominio por tema, los tropiezos frecuentes y qué reforzar en casa.</span>
            </li>
            <li class="rounded-xl bg-white border border-blue-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span><strong>Controlar hábitos saludables:</strong> fija minutos diarios, días de estudio, límite de pistas, voz del tutor y protege todo con tu PIN de 4 dígitos.</span>
            </li>
            <li class="rounded-xl bg-white border border-blue-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span><strong>Respaldo en PDF:</strong> descarga reportes semanales claros y los Certificados SECC que tu hijo/a vaya logrando.</span>
            </li>
            <li class="rounded-xl bg-white border border-blue-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span><strong>Conectar al profesor con privacidad:</strong> autoriza al docente o tutor particular solo para el hijo que elijas y desvincula en 1 clic cuando quieras.</span>
            </li>
          </ul>
        </div>

        <div class="card-surface space-y-2">
          <div class="text-xs font-extrabold text-[#2563EB] uppercase">Paso 1 · Crear cuenta familiar</div>
          <h2 class="text-base font-extrabold text-slate-900">Regístrate en menos de 1 minuto</h2>
          <p class="text-sm text-slate-600 leading-relaxed">
            Pulsa <strong>"Crear cuenta familiar gratis"</strong>, elige tu país (19 países hispanohablantes o <em>Libre / Internacional</em>), crea un <strong>PIN de 4 dígitos</strong> para el Portal Padres y agrega el perfil de tu hijo/a. Si tienes más hijos, luego puedes agregarlos en <em>Perfil → Cambiar de Estudiante</em>.
          </p>
        </div>

        <div class="card-surface space-y-2">
          <div class="text-xs font-extrabold text-[#2563EB] uppercase">Paso 2 · Subir currículo escolar</div>
          <h2 class="text-base font-extrabold text-slate-900">Portal Padres → Biblioteca Tutor</h2>
          <p class="text-sm text-slate-600 leading-relaxed">
            Entra al escudo <strong>Portal Padres</strong> con tu PIN y abre <strong>Biblioteca Tutor</strong>. Sube una <strong>foto del temario</strong> o un <strong>PDF (máx. 3 MB)</strong>: la IA lo lee sola, extrae los temas y el resumen curricular, y los prioriza automáticamente en las misiones de tu hijo/a.
          </p>
        </div>

        <div class="card-surface space-y-2">
          <div class="text-xs font-extrabold text-[#2563EB] uppercase">Paso 3 · Controles y reportes</div>
          <h2 class="text-base font-extrabold text-slate-900">Límites saludables, grado y Reporte PDF</h2>
          <p class="text-sm text-slate-600 leading-relaxed">
            En <strong>Controles y Familia</strong> puedes ajustar el grado escolar, minutos diarios, días permitidos, cantidad de pistas, activar/desactivar la voz del tutor y dejar indicaciones especiales al Tutor IA. En <strong>Resumen Semanal</strong> puedes descargar el <strong>Reporte PDF</strong>.
          </p>
        </div>

        <div class="card-surface space-y-2">
          <div class="text-xs font-extrabold text-indigo-600 uppercase">Paso 4 · Conectar al Profesor</div>
          <h2 class="text-base font-extrabold text-slate-900">Dos formas fáciles de enlazar al docente</h2>
          <ul class="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
            <li><strong>Si el profesor te envió un enlace o código:</strong> al registrarte desde su enlace se vincula solo; si ya tenías cuenta, pega su código en <em>Portal Padres → Profesores</em>.</li>
            <li><strong>Si tú quieres invitar al profesor:</strong> en <em>Portal Padres → Profesores</em> genera un código de tu hijo/a y compártelo. Puedes desvincular al profesor en 1 clic cuando desees.</li>
          </ul>
        </div>
      </section>

      <!-- TAB ESTUDIANTES -->
      <section v-else-if="tab === 'alumno'" class="space-y-4">
        <div class="card-surface border-emerald-200 bg-emerald-50/50 space-y-3">
          <div class="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
            ✨ Qué puedes hacer y lograr como estudiante
          </div>
          <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-slate-700">
            <li class="rounded-xl bg-white border border-emerald-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Entender matemáticas de verdad:</strong> aprendes paso a paso sin regaños, ganando seguridad antes de tus evaluaciones y exámenes.</span>
            </li>
            <li class="rounded-xl bg-white border border-emerald-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Resolver tus tareas del cuaderno:</strong> toma una foto a tus ejercicios reales y el profe IA te guía hasta que logres resolverlos tú mismo.</span>
            </li>
            <li class="rounded-xl bg-white border border-emerald-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Nunca quedarte atascado:</strong> escucha los retos en voz alta (🔊), dicta respuestas (🎙️), pregunta tus dudas (💬) y pide pistas cuando lo necesites.</span>
            </li>
            <li class="rounded-xl bg-white border border-emerald-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Practicar jugando:</strong> diviértete con 5 juegos matemáticos de cálculo mental, fracciones, álgebra, lógica y secuencias mientras subes de nivel y racha.</span>
            </li>
            <li class="rounded-xl bg-white border border-emerald-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Recibir misiones de tu profesor:</strong> practica exactamente lo que tu profe asignó para clase o tutoría desde un solo lugar.</span>
            </li>
            <li class="rounded-xl bg-white border border-emerald-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Ganar Certificados Oficiales SECC:</strong> demuestra que dominas cada tema (90%+ sin pistas) y descarga tu diploma en PDF.</span>
            </li>
          </ul>
        </div>

        <div class="card-surface space-y-2">
          <div class="text-xs font-extrabold text-emerald-600 uppercase">🎯 Misiones y Tareas</div>
          <h2 class="text-base font-extrabold text-slate-900">Misión del Día, de tu Currículo o de tu Profesor</h2>
          <p class="text-sm text-slate-600 leading-relaxed">
            En <strong>Misión</strong> toca <strong>"Comenzar Misión"</strong> para resolver 4 retos adaptados a tu grado. Si tu profesor te asignó una tarea, aparecerá arriba como <strong>👩‍🏫 MISIÓN DE TU PROFESOR</strong>. También puedes tocar cualquier tema de <strong>📚 De tu currículo escolar</strong>.
          </p>
        </div>

        <div class="card-surface space-y-2">
          <div class="text-xs font-extrabold text-emerald-600 uppercase">🧠 Entrenamiento con Voz y Dudas</div>
          <h2 class="text-base font-extrabold text-slate-900">Aprende paso a paso sin atascarte</h2>
          <ul class="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
            <li>Usa el <strong>teclado matemático</strong> en pantalla, toca <strong>🔊 Escuchar</strong> para oír el enunciado o el micrófono <strong>🎙️</strong> para dictar tu respuesta.</li>
            <li>Si te equivocas, el profe te explica qué revisar sin regañarte: <em>el error es útil para aprender</em>.</li>
            <li>Si no entiendes una palabra o regla, toca <strong>💬 Tengo una duda</strong> para preguntarle al profe.</li>
            <li>Si fallas <strong>3 veces</strong> en el mismo ejercicio, aparecerá <strong>📘 Ver explicación y continuar</strong> para aprender el procedimiento y seguir avanzando.</li>
          </ul>
        </div>

        <div class="card-surface space-y-2">
          <div class="text-xs font-extrabold text-emerald-600 uppercase">📸 Subir foto de tu cuaderno</div>
          <h2 class="text-base font-extrabold text-slate-900">Resuelve tu tarea real con guía IA</h2>
          <p class="text-sm text-slate-600 leading-relaxed">
            Toca <strong>"Subir foto / PDF de tarea"</strong>, toma una foto clara a tu cuaderno o guía (PDF máx. 3 MB) y la IA extraerá tus ejercicios para resolverlos paso a paso contigo.
          </p>
        </div>

        <div class="card-surface space-y-2">
          <div class="text-xs font-extrabold text-emerald-600 uppercase">🎮 5 Juegos y Certificados SECC</div>
          <h2 class="text-base font-extrabold text-slate-900">Juega y desbloquea certificados PDF</h2>
          <p class="text-sm text-slate-600 leading-relaxed">
            En <strong>Juegos</strong> tienes 5 motores activos (<em>Disparo Numérico, Memory Matemático, Puzzle Lógico, Constructor de Expresiones y Secuencias y Patrones</em>). En <strong>Progreso</strong> verás tu Carta Cognitiva y podrás descargar tu <strong>Certificado SECC en PDF</strong> al lograr 90%+ en 3 sesiones sin pistas.
          </p>
        </div>
      </section>

      <!-- TAB PROFESORES -->
      <section v-else-if="tab === 'profesor'" class="space-y-4">
        <div class="card-surface border-indigo-200 bg-indigo-50/50 space-y-3">
          <div class="text-xs font-extrabold uppercase tracking-wider text-indigo-700">
            ✨ Qué puedes hacer y lograr como profesor de matemáticas
          </div>
          <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-slate-700">
            <li class="rounded-xl bg-white border border-indigo-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span><strong>Tener un asistente IA 24/7 para tus alumnos:</strong> refuerzan en casa con guía socrática que nunca les hace la tarea ni les regala respuestas.</span>
            </li>
            <li class="rounded-xl bg-white border border-indigo-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span><strong>Diagnosticar en segundos dónde se traba tu grupo:</strong> detecta patrones de error repetidos (signos, despeje, fracciones, operaciones) para enfocar mejor tus clases.</span>
            </li>
            <li class="rounded-xl bg-white border border-indigo-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span><strong>Asignar prácticas y guías en 1 minuto:</strong> envía misiones por tema o subiendo la foto/PDF de tus propios ejercicios y recibe precisión, intentos y pistas usadas.</span>
            </li>
            <li class="rounded-xl bg-white border border-indigo-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span><strong>Mantener tu metodología en casa:</strong> escribe indicaciones pedagógicas para que el Tutor IA explique exactamente con el método que enseñas en el salón.</span>
            </li>
            <li class="rounded-xl bg-white border border-indigo-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span><strong>Potenciar tus clases adicionales y tutorías:</strong> envía tu enlace único por WhatsApp para vincular automáticamente a nuevos alumnos y familias contigo.</span>
            </li>
            <li class="rounded-xl bg-white border border-indigo-100 p-3 flex items-start gap-2">
              <CheckCircle2 class="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span><strong>Mostrar resultados profesionales a los padres:</strong> descarga el Reporte PDF de cada estudiante con su Carta Cognitiva y evolución comprobada.</span>
            </li>
          </ul>
        </div>

        <div class="card-surface space-y-2">
          <div class="text-xs font-extrabold text-indigo-600 uppercase">Paso 1 · Entrar al Portal Docente</div>
          <h2 class="text-base font-extrabold text-slate-900">Cuenta gratuita o Demo Docente</h2>
          <p class="text-sm text-slate-600 leading-relaxed">
            Desde el inicio (`/login`), toca la tarjeta <strong>"¿Eres profesor de matemáticas? Entrar al Portal Docente"</strong>. Crea tu cuenta gratis con tu nombre, país y colegio/modalidad de tutorías, o prueba el modo demostración docente en 1 clic.
          </p>
        </div>

        <div class="card-surface space-y-2">
          <div class="text-xs font-extrabold text-indigo-600 uppercase">Paso 2 · Invitar alumnos a tus clases o tutorías</div>
          <h2 class="text-base font-extrabold text-slate-900">Envía tu enlace por WhatsApp en 1 clic</h2>
          <ul class="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
            <li>En tu panel verás tu <strong>enlace único de invitación</strong> y el botón <strong>WhatsApp</strong>: cuando el representante crea su cuenta desde ese enlace, su hijo/a queda vinculado automáticamente contigo.</li>
            <li>Si la familia ya tenía cuenta, solo pega tu código corto en <em>Portal Padres → Profesores</em> (o tú pegas el código del estudiante en <em>+ Vincular estudiante</em>).</li>
          </ul>
        </div>

        <div class="card-surface space-y-2">
          <div class="text-xs font-extrabold text-indigo-600 uppercase">Paso 3 · Asistente Docente IA</div>
          <h2 class="text-base font-extrabold text-slate-900">Monitorea errores y asigna misiones guiadas</h2>
          <ul class="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
            <li>Revisa los <strong>errores más repetidos de tu grupo</strong> y la radiografía CCA de cada estudiante.</li>
            <li>Asigna una <strong>Misión Guiada</strong> por tema o subiendo la <strong>foto/PDF de tu propia guía</strong>: el alumno la resuelve guiado por la IA sin que le haga trampa, y tú ves su precisión y pistas usadas.</li>
            <li>Escribe tus <strong>Indicaciones Metodológicas</strong> para que el Tutor IA explique con el mismo método que usas en clase, y descarga el <strong>Reporte PDF</strong>.</li>
          </ul>
        </div>
      </section>

      <!-- TAB FAQ -->
      <section v-else class="space-y-4">
        <div class="card-surface space-y-1.5">
          <h2 class="text-sm font-extrabold text-slate-900">¿La IA le hace la tarea al estudiante?</h2>
          <p class="text-sm text-slate-600">
            No. Está programada con una Constitución Pedagógica Socrática: nunca regala la respuesta final al equivocarse ni al responder dudas; solo da pistas breves y guía paso a paso.
          </p>
        </div>
        <div class="card-surface space-y-1.5">
          <h2 class="text-sm font-extrabold text-slate-900">¿Cuál es el tamaño máximo para subir fotos y PDFs?</h2>
          <p class="text-sm text-slate-600">
            Las <strong>fotos</strong> se comprimen automáticamente (hasta 8 MB). Los <strong>PDFs</strong> deben pesar máximo <strong>3 MB</strong>; si una guía es más pesada, tómale una foto clara con el celular a la página de ejercicios o al índice.
          </p>
        </div>
        <div class="card-surface space-y-1.5">
          <h2 class="text-sm font-extrabold text-slate-900">¿Cómo enviamos correcciones o sugerencias?</h2>
          <p class="text-sm text-slate-600">
            Usa el botón negro <strong>"Opinar"</strong> que aparece abajo a la derecha en todas las pantallas. Sirve tanto para alumnos como para padres y profesores.
          </p>
        </div>
        <div class="card-surface space-y-1.5">
          <h2 class="text-sm font-extrabold text-slate-900">¿El profesor puede cambiar los controles parentales o ver a otros hijos?</h2>
          <p class="text-sm text-slate-600">
            No. El profesor solo accede al progreso del estudiante vinculado. Los controles del hogar, el PIN parental y el botón para desvincular siempre pertenecen únicamente al representante.
          </p>
        </div>
      </section>
    </main>
  </div>
</template>
