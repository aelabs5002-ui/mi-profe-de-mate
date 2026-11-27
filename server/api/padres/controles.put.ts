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
  const esCuentaDemo = padre.correo === 'familia@miprofedemate.edu'

  // Proteger cuenta demo compartida para que un tester no bloquee a otros testers
  const pinSeguro = esCuentaDemo ? undefined : d.pinParental
  const limiteSeguro =
    d.limiteMinutosDiario !== undefined
      ? esCuentaDemo
        ? Math.max(30, d.limiteMinutosDiario)
        : d.limiteMinutosDiario
      : undefined
  const diasSeguros = d.diasPermitidos
    ? esCuentaDemo
      ? Array.from(new Set([...d.diasPermitidos, new Date().getDay()]))
      : d.diasPermitidos
    : undefined

  if (d.pais || pinSeguro) {
    await prisma.padre.update({
      where: { id: padre.id },
      data: {
        ...(d.pais ? { pais: d.pais } : {}),
        ...(pinSeguro ? { pinParental: pinSeguro } : {})
      }
    })
  }

  const updatedAlumno = await prisma.alumno.update({
    where: { id: alumno.id },
    data: {
      ...(limiteSeguro !== undefined ? { limiteMinutosDiario: limiteSeguro } : {}),
      ...(diasSeguros ? { diasPermitidosJson: JSON.stringify(diasSeguros) } : {}),
      ...(d.maxPistasPorPaso !== undefined ? { maxPistasPorPaso: d.maxPistasPorPaso } : {}),
      ...(d.vozPermitida !== undefined ? { vozPermitida: d.vozPermitida } : {}),
      ...(d.instruccionesPadre !== undefined ? { instruccionesPadre: d.instruccionesPadre } : {}),
      ...(d.grado ? { grado: d.grado } : {})
    }
  })

  return {
    ok: true,
    alumno: updatedAlumno,
    notaDemo:
      esCuentaDemo && d.pinParental
        ? 'En la cuenta demo compartida el PIN se mantiene en 1234 para que todos puedan probar. Crea tu propia cuenta en /registro para personalizar el PIN.'
        : undefined
  }
})
