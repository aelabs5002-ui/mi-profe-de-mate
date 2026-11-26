import { requirePadre, setActiveStudentCookie } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { padre } = await requirePadre(event)
  const id = getRouterParam(event, 'id')
  const alumno = padre.alumnos.find((a) => a.id === id)
  if (!alumno) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil de estudiante no encontrado.' })
  }

  setActiveStudentCookie(event, alumno.id)
  return { alumno }
})
