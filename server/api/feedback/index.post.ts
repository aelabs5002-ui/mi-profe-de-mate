import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { getSessionContext } from '~/server/utils/auth'

const schema = z.object({
  autorTipo: z.enum(['padre', 'alumno', 'visitante']).default('padre'),
  categoria: z.enum(['sugerencia', 'error', 'dificultad', 'me_gusto']).default('sugerencia'),
  calificacion: z.number().int().min(1).max(5).nullable().optional(),
  mensaje: z.string().trim().min(3, 'Escribe al menos unas palabras para poder entender tu comentario.').max(1500),
  ruta: z.string().trim().max(250).default('/'),
  dispositivo: z.string().trim().max(120).default('web')
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Comentario inválido.'
    })
  }

  const { padre, alumnoActivo } = await getSessionContext(event).catch(() => ({
    padre: null,
    alumnoActivo: null
  }))

  const d = parsed.data
  const autorNombre =
    d.autorTipo === 'alumno' && alumnoActivo
      ? `${alumnoActivo.nombre} (${alumnoActivo.grado})`
      : padre
        ? `${padre.nombre} (${padre.pais})`
        : 'Visitante'

  const item = await prisma.feedbackPrueba.create({
    data: {
      padreId: padre?.id || null,
      alumnoId: alumnoActivo?.id || null,
      autorNombre,
      autorTipo: padre ? d.autorTipo : 'visitante',
      categoria: d.categoria,
      calificacion: d.calificacion ?? null,
      mensaje: d.mensaje,
      ruta: d.ruta,
      dispositivo: d.dispositivo
    }
  })

  return { ok: true, id: item.id }
})
