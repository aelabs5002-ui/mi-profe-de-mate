import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAlumnoActivo } from '~/server/utils/auth'
import { ensureProfesorTables } from '~/server/utils/profesorTables'

const schema = z.object({
  alumnoId: z.string().optional(),
  codigoProfesor: z.string().trim().min(4, 'Ingresa el código que te envió el profesor.').max(24)
})

export default defineEventHandler(async (event) => {
  await ensureProfesorTables()
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Código inválido.'
    })
  }

  const { alumno } = await requireAlumnoActivo(event, parsed.data.alumnoId)
  const codigoNorm = parsed.data.codigoProfesor.trim().toUpperCase()

  const inv = await prisma.codigoInvitacionProfesor.findUnique({
    where: { codigo: codigoNorm },
    include: { profesor: { select: { id: true, nombre: true, institucion: true } } }
  })

  if (!inv) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Código de profesor no encontrado. Verifica el código que te compartió el docente.'
    })
  }

  await prisma.vinculoProfesor.upsert({
    where: { profesorId_alumnoId: { profesorId: inv.profesor.id, alumnoId: alumno.id } },
    update: { activo: true, codigoUsado: codigoNorm },
    create: {
      profesorId: inv.profesor.id,
      alumnoId: alumno.id,
      codigoUsado: codigoNorm
    }
  })

  return {
    ok: true,
    profesor: inv.profesor,
    alumnoNombre: alumno.nombre
  }
})
