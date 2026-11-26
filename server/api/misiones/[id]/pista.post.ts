import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAlumnoActivo } from '~/server/utils/auth'

const schema = z.object({
  pasoId: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const { alumno } = await requireAlumnoActivo(event)
  const misionId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!misionId || !parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Paso no especificado.' })
  }

  const paso = await prisma.pasoMision.findFirst({
    where: { id: parsed.data.pasoId, misionId, mision: { alumnoId: alumno.id } }
  })
  if (!paso) throw createError({ statusCode: 404, statusMessage: 'Ejercicio no encontrado.' })

  if (paso.pistasUsadas >= alumno.maxPistasPorPaso) {
    throw createError({
      statusCode: 400,
      statusMessage: `Ya usaste el máximo de ${alumno.maxPistasPorPaso} pistas permitidas en este paso. ¡Intenta con lo que descubriste!`
    })
  }

  let pistas: string[] = []
  try {
    pistas = JSON.parse(paso.pistasJson || '[]')
  } catch {}

  const pista =
    pistas[paso.pistasUsadas] ||
    'Lee el enunciado despacio, separa las operaciones una por una y prueba escribir un primer paso.'

  const updated = await prisma.pasoMision.update({
    where: { id: paso.id },
    data: { pistasUsadas: { increment: 1 } }
  })

  return {
    pista,
    pistasUsadas: updated.pistasUsadas,
    maxPistasPorPaso: alumno.maxPistasPorPaso
  }
})
