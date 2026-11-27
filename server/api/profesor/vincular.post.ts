import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireProfesor } from '~/server/utils/profesorAuth'

const schema = z.object({
  codigo: z.string().trim().min(4, 'Ingresa el código que te dio el representante.').max(20)
})

export default defineEventHandler(async (event) => {
  const profesor = await requireProfesor(event)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Código inválido.'
    })
  }

  const codigoNorm = parsed.data.codigo.trim().toUpperCase()
  const rec = await prisma.codigoVinculacionAlumno.findUnique({
    where: { codigo: codigoNorm },
    include: { alumno: true }
  })

  if (!rec || !rec.alumno) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Código no encontrado. Pide al representante que verifique o genere el código en su Portal Padres.'
    })
  }

  const vinculo = await prisma.vinculoProfesor.upsert({
    where: { profesorId_alumnoId: { profesorId: profesor.id, alumnoId: rec.alumno.id } },
    update: { activo: true, codigoUsado: codigoNorm },
    create: {
      profesorId: profesor.id,
      alumnoId: rec.alumno.id,
      codigoUsado: codigoNorm
    },
    include: { alumno: true }
  })

  return {
    ok: true,
    alumno: {
      id: vinculo.alumno.id,
      nombre: vinculo.alumno.nombre,
      grado: vinculo.alumno.grado,
      avatar: vinculo.alumno.avatar
    }
  }
})
