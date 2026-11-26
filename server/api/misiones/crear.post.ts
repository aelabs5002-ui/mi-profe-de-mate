import { z } from 'zod'
import { requireAlumnoActivo } from '~/server/utils/auth'
import { checkParentalAccess, crearMisionAdaptativa } from '~/server/utils/mmcg'

const schema = z.object({
  tema: z.string().trim().optional(),
  origen: z.enum(['practica_ia', 'refuerzo_cca']).optional()
})

export default defineEventHandler(async (event) => {
  const { alumno } = await requireAlumnoActivo(event)
  const parental = checkParentalAccess(alumno)
  if (!parental.permitido) {
    throw createError({ statusCode: 403, statusMessage: parental.motivo })
  }

  const body = (await readBody(event).catch(() => ({}))) || {}
  const parsed = schema.safeParse(body)
  const tema = parsed.success ? parsed.data.tema : undefined
  const origen = parsed.success ? parsed.data.origen : undefined

  const mision = await crearMisionAdaptativa({
    alumnoId: alumno.id,
    temaForzado: tema,
    origen
  })

  return { mision }
})
