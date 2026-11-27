import { z } from 'zod'
import { requireAlumnoVinculado } from '~/server/utils/profesorAuth'
import { crearMisionAdaptativa } from '~/server/utils/mmcg'
import { analyzeHomeworkWithGemini } from '~/server/utils/ai'
import { prisma } from '~/server/utils/prisma'

const schema = z.object({
  modo: z.enum(['tema', 'archivo']).default('tema'),
  tema: z.string().trim().max(120).optional(),
  dificultad: z.number().int().min(1).max(3).default(2),
  notaProfesor: z.string().trim().max(500).optional(),
  nombreArchivo: z.string().trim().optional(),
  tipoMime: z.string().trim().optional(),
  base64Data: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Estudiante no especificado.' })

  const { profesor, alumno } = await requireAlumnoVinculado(event, id)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Revisa los datos de la misión a asignar.' })
  }

  const d = parsed.data
  const pais = alumno.padre?.pais || profesor.pais

  if (d.modo === 'archivo' && d.nombreArchivo && d.tipoMime) {
    const analysis = await analyzeHomeworkWithGemini({
      fileName: d.nombreArchivo,
      mimeType: d.tipoMime,
      base64Data: d.base64Data,
      notaAlumno: d.notaProfesor,
      grado: alumno.grado,
      pais
    })

    const tarea = await prisma.tareaSubida.create({
      data: {
        alumnoId: alumno.id,
        nombreArchivo: `[Profe ${profesor.nombre}] ${d.nombreArchivo}`,
        tipoMime: d.tipoMime,
        textoExtraido: analysis.resumen,
        temaDetectado: analysis.temaDetectado,
        ejerciciosJson: JSON.stringify(analysis.ejercicios),
        estado: 'analizada'
      }
    })

    const mision = await crearMisionAdaptativa({
      alumnoId: alumno.id,
      temaForzado: d.tema || analysis.temaDetectado,
      origen: 'profesor',
      dificultadForzada: d.dificultad,
      tareaSubidaId: tarea.id,
      ejerciciosPersonalizados: analysis.ejercicios,
      profesorNombre: profesor.nombre,
      tituloPersonalizado: `Tarea de Profe ${profesor.nombre}: ${d.tema || analysis.temaDetectado}`,
      descripcionPersonalizada: d.notaProfesor || analysis.resumen
    })

    return { ok: true, mision, usedGemini: analysis.usedGemini }
  }

  if (!d.tema || d.tema.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Indica el tema que deseas asignar al estudiante.' })
  }

  const mision = await crearMisionAdaptativa({
    alumnoId: alumno.id,
    temaForzado: d.tema,
    origen: 'profesor',
    dificultadForzada: d.dificultad,
    profesorNombre: profesor.nombre,
    tituloPersonalizado: `Misión de Profe ${profesor.nombre}: ${d.tema}`,
    descripcionPersonalizada:
      d.notaProfesor || `Práctica guiada asignada por ${profesor.nombre} para fortalecer ${d.tema}.`
  })

  return { ok: true, mision }
})
