import { detectErrorTag, ERROR_TAG_LABELS, type ErrorTag } from './errorTagger'

export interface TutorAiResponse {
  mensaje: string
  evento: {
    turnType: 'evaluate' | 'hint' | 'scaffold' | 'advance' | 'close'
    isCorrect: boolean
    errorTag: ErrorTag | null
    hintsUsedDelta: 0 | 1
    recommendNext: 'retry' | 'next_step' | 'refuerzo' | 'close'
    moodGuess: 'normal' | 'frustrado' | 'confiado' | 'cansado'
  }
  usedGemini: boolean
}

export interface ExtractedHomework {
  temaDetectado: string
  resumen: string
  ejercicios: Array<{
    enunciado: string
    respuestaEsperada: string
    pistas: string[]
    tema: string
  }>
  usedGemini: boolean
}

const SYSTEM_PROMPT_SOCRATICO = `Eres "Mi Profe de Mate", un tutor de matemáticas cálido, paciente y motivador para estudiantes de 9 a 15 años.

CONSTITUCIÓN PEDAGÓGICA Y REGLAS DURAS (P01 + P07 — NUNCA VIOLAR):
1. PROHIBIDO entregar la respuesta final directamente cuando el estudiante se equivoca o pide pista.
2. Si el estudiante se equivoca, inicia con la frase exacta: "🧠 El error es útil para aprender."
3. NUNCA uses palabras hirientes o negativas ("mal", "incorrecto", "equivocado", "fallaste").
4. Mensajes cortos y claros: máximo 3 oraciones.
5. Si es el intento 2 o más, divide el problema en un subpaso muy sencillo (scaffolding).
6. Termina siempre con una acción concreta ("Intenta...", "Prueba calcular...", "Escribe...").
7. Si la respuesta es correcta, celebra el esfuerzo y destaca brevemente qué estrategia aplicó bien.

Responde ÚNICAMENTE con un objeto JSON válido con esta forma exacta (sin markdown ni texto fuera del JSON):
{
  "mensaje": "Texto breve y cálido para el alumno (1 a 3 oraciones).",
  "turnType": "evaluate|hint|scaffold|advance",
  "moodGuess": "normal|frustrado|confiado|cansado"
}`

function getGeminiConfig() {
  const config = useRuntimeConfig()
  const apiKey = (process.env.GEMINI_API_KEY || config.geminiApiKey || '').trim()
  const model = (process.env.GEMINI_MODEL || config.geminiModel || 'gemini-2.5-flash').trim()
  return { apiKey, model }
}

async function callGemini(parts: Array<Record<string, any>>, systemInstruction?: string): Promise<string | null> {
  const { apiKey, model } = getGeminiConfig()
  if (!apiKey) return null

  const isVertexExpress = apiKey.startsWith('AQ.')
  const endpoint = isVertexExpress
    ? `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  const body: Record<string, any> = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json'
    }
  }
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) return null
    const data: any = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || ''
    return text.trim() || null
  } catch {
    return null
  }
}

export async function generateSocraticFeedback(params: {
  alumnoNombre: string
  grado: string
  pais: string
  tema: string
  enunciado: string
  respuestaEsperada: string
  respuestaAlumno: string
  esCorrecta: boolean
  intentoNumero: number
  pistasDisponibles: string[]
  pistasUsadas: number
  instruccionesPadre?: string
  bibliotecaResumen?: string
}): Promise<TutorAiResponse> {
  const errorTag: ErrorTag | null = params.esCorrecta
    ? null
    : detectErrorTag({
        studentAnswer: params.respuestaAlumno,
        expectedAnswer: params.respuestaEsperada,
        enunciado: params.enunciado,
        tema: params.tema
      })

  const promptUsuario = JSON.stringify({
    alumno: params.alumnoNombre,
    grado: params.grado,
    pais: params.pais,
    tema: params.tema,
    ejercicio: params.enunciado,
    respuestaCorrectaReferencia: params.respuestaEsperada,
    respuestaAlumno: params.respuestaAlumno,
    esCorrecta: params.esCorrecta,
    errorDetectado: errorTag ? ERROR_TAG_LABELS[errorTag] : null,
    intentoNumero: params.intentoNumero,
    pistaSugerida: params.pistasDisponibles[Math.min(params.intentoNumero - 1, params.pistasDisponibles.length - 1)] || null,
    instruccionesPadre: params.instruccionesPadre || null,
    bibliotecaPrioritaria: params.bibliotecaResumen || null
  })

  const raw = await callGemini([{ text: promptUsuario }], SYSTEM_PROMPT_SOCRATICO)
  if (raw) {
    try {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
      const parsed = JSON.parse(cleaned)
      if (parsed?.mensaje) {
        let msg = String(parsed.mensaje).trim()
        if (!params.esCorrecta && !msg.includes('El error es útil para aprender')) {
          msg = `🧠 El error es útil para aprender. ${msg}`
        }
        return {
          mensaje: msg,
          evento: {
            turnType: params.esCorrecta ? 'advance' : params.intentoNumero >= 2 ? 'scaffold' : 'evaluate',
            isCorrect: params.esCorrecta,
            errorTag,
            hintsUsedDelta: 0,
            recommendNext: params.esCorrecta ? 'next_step' : params.intentoNumero >= 3 ? 'refuerzo' : 'retry',
            moodGuess: parsed.moodGuess || (params.intentoNumero >= 3 ? 'frustrado' : params.esCorrecta ? 'confiado' : 'normal')
          },
          usedGemini: true
        }
      }
    } catch {
      // Fallback determinístico si Gemini devuelve texto no JSON
    }
  }

  // Fallback pedagógico socrático de alta calidad (si no hay GEMINI_API_KEY)
  if (params.esCorrecta) {
    const elogios = [
      `¡Excelente razonamiento, ${params.alumnoNombre}! 🎯 Aplicaste muy bien el procedimiento en ${params.tema}. ¡Vamos al siguiente reto!`,
      `¡Muy bien, ${params.alumnoNombre}! ✨ Resolviste este paso con precisión. Pulsa continuar para seguir subiendo tu dominio.`,
      `¡Genial trabajo! 💡 Tu estrategia funcionó perfecto en este ejercicio. ¡Sigamos avanzando!`
    ]
    return {
      mensaje: elogios[params.intentoNumero % elogios.length],
      evento: {
        turnType: 'advance',
        isCorrect: true,
        errorTag: null,
        hintsUsedDelta: 0,
        recommendNext: 'next_step',
        moodGuess: 'confiado'
      },
      usedGemini: false
    }
  }

  const pistaPaso =
    params.pistasDisponibles[Math.min(params.intentoNumero - 1, Math.max(0, params.pistasDisponibles.length - 1))] ||
    'Divide el ejercicio en dos partes pequeñas y revisa cada operación con calma.'

  const etiqueta = errorTag ? ERROR_TAG_LABELS[errorTag].toLowerCase() : 'el procedimiento'
  const mensaje =
    params.intentoNumero === 1
      ? `🧠 El error es útil para aprender. Revisa con calma ${etiqueta} en tu respuesta "${params.respuestaAlumno}". Pista: ${pistaPaso} Intenta de nuevo.`
      : `🧠 El error es útil para aprender. Vamos a hacerlo por pasos cortos sin apuro: ${pistaPaso} Escribe tu nuevo intento cuando estés listo.`

  return {
    mensaje,
    evento: {
      turnType: params.intentoNumero >= 2 ? 'scaffold' : 'evaluate',
      isCorrect: false,
      errorTag,
      hintsUsedDelta: 0,
      recommendNext: params.intentoNumero >= 3 ? 'refuerzo' : 'retry',
      moodGuess: params.intentoNumero >= 3 ? 'frustrado' : 'normal'
    },
    usedGemini: false
  }
}

export async function analyzeHomeworkWithGemini(params: {
  fileName: string
  mimeType: string
  base64Data?: string
  notaAlumno?: string
  grado: string
  pais: string
}): Promise<ExtractedHomework> {
  const prompt = `Analiza esta tarea escolar de matemáticas de un estudiante de ${params.grado} (${params.pais}).
Nota del alumno: "${params.notaAlumno || 'Ninguna'}".
Extrae entre 3 y 5 ejercicios reales de la imagen o documento (si hay texto o ejercicios visibles) y organízalos para una sesión guiada socrática (sin dar la respuesta en las pistas).
Devuelve ÚNICAMENTE JSON válido con esta estructura:
{
  "temaDetectado": "Nombre corto del tema (ej. Ecuaciones Lineales, Fracciones Equivalentes)",
  "resumen": "Breve resumen de 1 línea de lo que se detectó en la tarea.",
  "ejercicios": [
    {
      "enunciado": "Enunciado claro del ejercicio",
      "respuestaEsperada": "Respuesta corta exacta (ej. 6 o 3/4)",
      "pistas": ["Pista 1 sin revelar respuesta", "Pista 2 más concreta sin revelar respuesta"],
      "tema": "Nombre del tema"
    }
  ]
}`

  const parts: Array<Record<string, any>> = [{ text: prompt }]
  if (params.base64Data && (params.mimeType.startsWith('image/') || params.mimeType === 'application/pdf')) {
    parts.push({
      inlineData: {
        mimeType: params.mimeType,
        data: params.base64Data
      }
    })
  }

  const raw = await callGemini(parts)
  if (raw) {
    try {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed?.ejercicios) && parsed.ejercicios.length > 0) {
        return {
          temaDetectado: String(parsed.temaDetectado || 'Matemáticas'),
          resumen: String(parsed.resumen || `Ejercicios detectados en ${params.fileName}`),
          ejercicios: parsed.ejercicios.slice(0, 6).map((e: any) => ({
            enunciado: String(e.enunciado || 'Resuelve el ejercicio'),
            respuestaEsperada: String(e.respuestaEsperada || '0'),
            pistas: Array.isArray(e.pistas) && e.pistas.length > 0 ? e.pistas.map(String) : ['Revisa el enunciado paso a paso.'],
            tema: String(e.tema || parsed.temaDetectado || 'Matemáticas')
          })),
          usedGemini: true
        }
      }
    } catch {
      // Fallback
    }
  }

  // Fallback pedagógico inteligente cuando no hay GEMINI_API_KEY o archivo de texto
  const notaLower = `${params.fileName} ${params.notaAlumno || ''}`.toLowerCase()
  if (notaLower.includes('fracc')) {
    return {
      temaDetectado: 'Fracciones Equivalentes',
      resumen: `Guía de práctica generada a partir de "${params.fileName}" enfocada en fracciones.`,
      ejercicios: [
        {
          enunciado: 'Completa la fracción equivalente: 2/3 = ?/9',
          respuestaEsperada: '6',
          pistas: ['Observa por cuánto se multiplicó el 3 para convertirse en 9.', 'Multiplica el numerador 2 por ese mismo factor.'],
          tema: 'Fracciones Equivalentes'
        },
        {
          enunciado: 'Suma y simplifica: 1/3 + 1/6',
          respuestaEsperada: '1/2',
          pistas: ['Convierte 1/3 a sextos multiplicando arriba y abajo por 2.', 'Suma los numeradores y simplifica el resultado.'],
          tema: 'Fracciones Equivalentes'
        },
        {
          enunciado: 'Simplifica a su mínima expresión: 8/12',
          respuestaEsperada: '2/3',
          pistas: ['Busca el mayor número que divide a 8 y a 12.', 'Divide numerador y denominador entre 4.'],
          tema: 'Fracciones Equivalentes'
        }
      ],
      usedGemini: false
    }
  }

  return {
    temaDetectado: 'Ecuaciones Lineales',
    resumen: `Misión guiada creada desde "${params.fileName}" para practicar paso a paso sin resolverla por ti.`,
    ejercicios: [
      {
        enunciado: 'Despeja x en la ecuación: 2x + 6 = 18',
        respuestaEsperada: '6',
        pistas: ['Pasa el +6 al otro lado restando.', 'Cuando tengas 2x = 12, divide ambos lados entre 2.'],
        tema: 'Ecuaciones Lineales'
      },
      {
        enunciado: 'Resuelve paso a paso: 3x - 5 = 16',
        respuestaEsperada: '7',
        pistas: ['El -5 pasa al otro lado sumando: 3x = 16 + 5.', 'Divide 21 entre 3 para hallar x.'],
        tema: 'Ecuaciones Lineales'
      },
      {
        enunciado: 'Aplica distributiva y despeja x: 2(x + 4) = 20',
        respuestaEsperada: '6',
        pistas: ['Divide ambos lados entre 2 o multiplica el 2 por x y por 4.', 'Si x + 4 = 10, ¿qué número sumado a 4 da 10?'],
        tema: 'Ecuaciones Lineales'
      }
    ],
    usedGemini: false
  }
}
