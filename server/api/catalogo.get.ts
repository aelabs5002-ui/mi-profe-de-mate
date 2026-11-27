import { AVATARES_ALUMNO, CATALOGO_MOTORES, PAISES_CURRICULO, TEMAS_CURRICULARES } from '~/server/utils/curriculum'

export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  const apiKey = (process.env.GEMINI_API_KEY || config.geminiApiKey || '').trim()
  const modeloIa = (process.env.GEMINI_MODEL || config.geminiModel || 'gemini-2.5-flash').trim()

  return {
    paises: PAISES_CURRICULO,
    avatares: AVATARES_ALUMNO,
    motores: CATALOGO_MOTORES,
    temas: TEMAS_CURRICULARES,
    iaConectada: Boolean(apiKey),
    modeloIa
  }
})
