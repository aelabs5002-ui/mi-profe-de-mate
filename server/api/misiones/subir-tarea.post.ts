import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAlumnoActivo } from '~/server/utils/auth'
import { analyzeHomeworkWithGemini } from '~/server/utils/ai'
import { checkParentalAccess, crearMisionAdaptativa } from '~/server/utils/mmcg'

const schema = z.object({
  nombreArchivo: z.string().trim().min(1),
  tipoMime: z.string().trim().min(3),
  base64Data: z.string().optional(),
  dataUrlPreview: z.string().optional(),
  notaAlumno: z.string().trim().max(500).optional()
})

export default defineEventHandler(async (event) => {
  const { padre, alumno } = await requireAlumnoActivo(event)
  const parental = checkParentalAccess(alumno)
  if (!parental.permitido) {
    throw createError({ statusCode: 403, statusMessage: parental.motivo })
  }

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Sube una imagen o PDF válido de tu tarea.' })
  }

  const d = parsed.data
  const analysis = await analyzeHomeworkWithGemini({
    fileName: d.nombreArchivo,
    mimeType: d.tipoMime,
    base64Data: d.base64Data,
    notaAlumno: d.notaAlumno,
    grado: alumno.grado,
    pais: padre.pais
  })

  // Guardar vista previa solo si es pequeña (< 500 KB) para no inflar la BD
  const safePreview = d.dataUrlPreview && d.dataUrlPreview.length < 500_000 ? d.dataUrlPreview : null

  const tarea = await prisma.tareaSubida.create({
    data: {
      alumnoId: alumno.id,
      nombreArchivo: d.nombreArchivo,
      tipoMime: d.tipoMime,
      archivoDataUrl: safePreview,
      textoExtraido: analysis.resumen,
      temaDetectado: analysis.temaDetectado,
      ejerciciosJson: JSON.stringify(analysis.ejercicios),
      estado: 'analizada'
    }
  })

  const mision = await crearMisionAdaptativa({
    alumnoId: alumno.id,
    temaForzado: analysis.temaDetectado,
    origen: 'tarea',
    tareaSubidaId: tarea.id,
    ejerciciosPersonalizados: analysis.ejercicios,
    tituloPersonalizado: `Tu Tarea: ${analysis.temaDetectado}`,
    descripcionPersonalizada: analysis.resumen
  })

  return {
    tarea,
    mision,
    usedGemini: analysis.usedGemini
  }
})
