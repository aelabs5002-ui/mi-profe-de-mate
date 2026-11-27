import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { getSessionContext } from '~/server/utils/auth'
import { getProfesorContext } from '~/server/utils/profesorAuth'
import { ensureFeedbackTable } from '~/server/utils/feedbackTable'

const schema = z.object({
  autorTipo: z.enum(['padre', 'alumno', 'profesor', 'visitante']).default('padre'),
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

  const [{ padre, alumnoActivo }, profesor] = await Promise.all([
    getSessionContext(event).catch(() => ({ padre: null, alumnoActivo: null })),
    getProfesorContext(event).catch(() => null)
  ])

  const d = parsed.data
  const autorNombre =
    d.autorTipo === 'profesor' && profesor
      ? `Profe ${profesor.nombre}${profesor.institucion ? ` (${profesor.institucion})` : ''}`
      : d.autorTipo === 'alumno' && alumnoActivo
        ? `${alumnoActivo.nombre} (${alumnoActivo.grado})`
        : padre
          ? `${padre.nombre} (${padre.pais})`
          : profesor
            ? `Profe ${profesor.nombre}`
            : 'Visitante'

  await ensureFeedbackTable()

  const item = await prisma.feedbackPrueba.create({
    data: {
      padreId: padre?.id || null,
      alumnoId: alumnoActivo?.id || null,
      autorNombre,
      autorTipo: d.autorTipo === 'profesor' && profesor ? 'profesor' : padre ? d.autorTipo : profesor ? 'profesor' : 'visitante',
      categoria: d.categoria,
      calificacion: d.calificacion ?? null,
      mensaje: d.mensaje,
      ruta: d.ruta,
      dispositivo: d.dispositivo
    }
  })

  return { ok: true, id: item.id }
})
