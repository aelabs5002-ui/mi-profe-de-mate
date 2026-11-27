import { prisma } from '~/server/utils/prisma'
import { requireAlumnoActivo } from '~/server/utils/auth'
import { ensureProfesorTables, generarCodigoVinculacion } from '~/server/utils/profesorTables'

export default defineEventHandler(async (event) => {
  await ensureProfesorTables()
  const body = (await readBody(event).catch(() => ({}))) || {}
  const { alumno } = await requireAlumnoActivo(event, body.alumnoId)

  let codigo = generarCodigoVinculacion(alumno.nombre)
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.codigoVinculacionAlumno.findUnique({ where: { codigo } })
    if (!exists) break
    codigo = generarCodigoVinculacion(alumno.nombre)
  }

  const rec = await prisma.codigoVinculacionAlumno.upsert({
    where: { alumnoId: alumno.id },
    update: { codigo, creadoEn: new Date() },
    create: { alumnoId: alumno.id, codigo }
  })

  return { codigo: rec.codigo }
})
