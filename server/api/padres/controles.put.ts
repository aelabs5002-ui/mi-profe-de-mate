import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAlumnoActivo } from '~/server/utils/auth'

const schema = z.object({
  alumnoId: z.string().optional(),
  pais: z.string().trim().min(2).optional(),
  pinParental: z.string().trim().regex(/^\d{4}$/).optional(),
  limiteMinutosDiario: z.number().int().min(5).max(180).optional(),
  diasPermitidos: z.array(z.number().int().min(0).max(6)).optional(),
  maxPistasPorPaso: z.number().int().min(0).max(4).optional(),
  vozPermitida: z.boolean().optional(),
  instruccionesPadre: z.string().trim().max(600).optional(),
  grado: z.string().trim().min(2).optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Revisa los valores de configuración.' })
  }

  const d = parsed.data
  const { padre, alumno } = await requireAlumnoActivo(event, d.alumnoId)

  if (d.pais || d.pinParental) {
    await prisma.padre.update({
      where: { id: padre.id },
      data: {
        ...(d.pais ? { pais: d.pais } : {}),
        ...(d.pinParental ? { pinParental: d.pinParental } : {})
      }
    })
  }

  const updatedAlumno = await prisma.alumno.update({
    where: { id: alumno.id },
    data: {
      ...(d.limiteMinutosDiario !== undefined ? { limiteMinutosDiario: d.limiteMinutosDiario } : {}),
      ...(d.diasPermitidos ? { diasPermitidosJson: JSON.stringify(d.diasPermitidos) } : {}),
      ...(d.maxPistasPorPaso !== undefined ? { maxPistasPorPaso: d.maxPistasPorPaso } : {}),
      ...(d.vozPermitida !== undefined ? { vozPermitida: d.vozPermitida } : {}),
      ...(d.instruccionesPadre !== undefined ? { instruccionesPadre: d.instruccionesPadre } : {}),
      ...(d.grado ? { grado: d.grado } : {})
    }
  })

  return { ok: true, alumno: updatedAlumno }
})
