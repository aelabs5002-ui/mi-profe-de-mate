import { prisma } from '~/server/utils/prisma'
import { ensureProfesorTables } from '~/server/utils/profesorTables'

export default defineEventHandler(async (event) => {
  await ensureProfesorTables()
  const raw = getRouterParam(event, 'codigo')
  if (!raw) {
    throw createError({ statusCode: 400, statusMessage: 'Código de invitación no especificado.' })
  }

  const codigo = raw.trim().toUpperCase()
  const inv = await prisma.codigoInvitacionProfesor.findUnique({
    where: { codigo },
    include: {
      profesor: {
        select: { id: true, nombre: true, institucion: true, pais: true }
      }
    }
  })

  if (!inv) {
    throw createError({ statusCode: 404, statusMessage: 'Enlace o código de profesor no encontrado.' })
  }

  return {
    codigo: inv.codigo,
    mensajeBienvenida: inv.mensajeBienvenida,
    profesor: inv.profesor
  }
})
