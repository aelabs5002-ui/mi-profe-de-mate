import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAlumnoActivo } from '~/server/utils/auth'
import { actualizarCcaYSecc } from '~/server/utils/mmcg'

const schema = z.object({
  motorId: z.enum(['A', 'C', 'F']),
  tema: z.string().trim().min(2),
  dificultad: z.number().int().min(1).max(5).default(2),
  aciertos: z.number().int().min(0),
  total: z.number().int().min(1),
  rachaMaxima: z.number().int().min(0).default(0),
  duracionSeg: z.number().int().min(1).default(60)
})

export default defineEventHandler(async (event) => {
  const { alumno } = await requireAlumnoActivo(event)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Datos de partida inválidos.' })
  }

  const d = parsed.data
  const ccaResult = await actualizarCcaYSecc({
    alumnoId: alumno.id,
    tema: d.tema,
    motorId: d.motorId,
    dificultad: d.dificultad,
    aciertos: Math.min(d.aciertos, d.total),
    total: d.total,
    pistasUsadas: 0,
    duracionSeg: d.duracionSeg
  })

  const sesion = await prisma.sesionJuego.create({
    data: {
      alumnoId: alumno.id,
      motorId: d.motorId,
      tema: d.tema,
      dificultad: d.dificultad,
      aciertos: Math.min(d.aciertos, d.total),
      total: d.total,
      rachaMaxima: d.rachaMaxima,
      duracionSeg: d.duracionSeg,
      xpGanado: ccaResult?.xpGanado || 30
    }
  })

  return {
    sesion,
    xpGanado: ccaResult?.xpGanado || 30,
    precisionPct: ccaResult?.precisionPct || 0,
    nuevaRacha: ccaResult?.nuevaRacha || 1,
    recienCertificada: ccaResult?.recienCertificada || false,
    competencia: ccaResult?.competencia || null
  }
})
