import { z } from 'zod'
import { requireAlumnoActivo } from '~/server/utils/auth'
import { analyzeCurriculumDocumentWithGemini } from '~/server/utils/ai'

const schema = z.object({
  alumnoId: z.string().optional(),
  nombreArchivo: z.string().trim().min(1),
  tipoMime: z.string().trim().min(3),
  base64Data: z.string().optional(),
  textoPlano: z.string().max(30_000).optional(),
  tipoDoc: z.enum(['curriculo', 'libro', 'guia', 'otro']).default('curriculo')
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Sube un PDF, foto o archivo de texto válido.' })
  }

  const d = parsed.data
  const { padre, alumno } = await requireAlumnoActivo(event, d.alumnoId)

  const extracted = await analyzeCurriculumDocumentWithGemini({
    fileName: d.nombreArchivo,
    mimeType: d.tipoMime,
    base64Data: d.base64Data,
    textoPlano: d.textoPlano,
    tipoDoc: d.tipoDoc,
    grado: alumno.grado,
    pais: padre.pais
  })

  return extracted
})
