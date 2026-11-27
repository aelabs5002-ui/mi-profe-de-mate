import { prisma } from '~/server/utils/prisma'
import { requireAlumnoActivo } from '~/server/utils/auth'
import { checkParentalAccess, crearMisionAdaptativa, todayKey } from '~/server/utils/mmcg'

export default defineEventHandler(async (event) => {
  const { alumno } = await requireAlumnoActivo(event)
  const parental = checkParentalAccess(alumno)

  const hoy = todayKey()
  let misionActiva = await prisma.mision.findFirst({
    where: {
      alumnoId: alumno.id,
      estado: { in: ['creada', 'en_progreso'] }
    },
    include: { pasos: { orderBy: { orden: 'asc' } } },
    orderBy: { creadoEn: 'desc' }
  })

  if (!misionActiva) {
    const completadaHoy = await prisma.mision.findFirst({
      where: { alumnoId: alumno.id, fechaClave: hoy, estado: 'completada' },
      orderBy: { completadaEn: 'desc' }
    })
    if (!completadaHoy) {
      misionActiva = await crearMisionAdaptativa({ alumnoId: alumno.id })
    }
  }

  const misionesRecientes = await prisma.mision.findMany({
    where: { alumnoId: alumno.id },
    orderBy: { creadoEn: 'desc' },
    take: 5,
    select: {
      id: true,
      titulo: true,
      tema: true,
      origen: true,
      motorId: true,
      estado: true,
      precisionPct: true,
      xpGanado: true,
      fechaClave: true
    }
  })

  const erroresFrecuentes = await prisma.errorFrecuenteCCA.findMany({
    where: { alumnoId: alumno.id, superado: false },
    orderBy: { conteo: 'desc' },
    take: 3
  })

  const docsActivos = await prisma.documentoBiblioteca.findMany({
    where: { alumnoId: alumno.id, activo: true },
    orderBy: { prioridad: 'asc' },
    take: 5
  })
  const temasBiblioteca = Array.from(
    new Set(
      docsActivos.flatMap((d) => {
        try {
          const parsed = JSON.parse(d.temasJson || '[]')
          return Array.isArray(parsed) ? parsed.map((t: any) => String(t).trim()).filter(Boolean) : []
        } catch {
          return []
        }
      })
    )
  ).slice(0, 12)

  return {
    alumno,
    parental,
    misionActiva,
    misionesRecientes,
    erroresFrecuentes,
    temasBiblioteca
  }
})
