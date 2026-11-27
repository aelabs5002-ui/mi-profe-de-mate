import { prisma } from '~/server/utils/prisma'
import { requireProfesor } from '~/server/utils/profesorAuth'
import { ERROR_TAG_LABELS, type ErrorTag } from '~/server/utils/errorTagger'

export default defineEventHandler(async (event) => {
  const profesor = await requireProfesor(event)

  const vinculos = await prisma.vinculoProfesor.findMany({
    where: { profesorId: profesor.id, activo: true },
    include: {
      alumno: {
        include: {
          padre: { select: { nombre: true, pais: true } },
          competencias: true,
          erroresFrecuentes: { where: { superado: false }, orderBy: { conteo: 'desc' }, take: 3 },
          misiones: { orderBy: { creadoEn: 'desc' }, take: 5 }
        }
      }
    },
    orderBy: { creadoEn: 'desc' }
  })

  const erroresGrupoMap = new Map<string, { tag: string; etiqueta: string; alumnos: number; incidencias: number }>()

  const estudiantes = vinculos.map((v) => {
    const a = v.alumno
    const comps = a.competencias
    const promedioDominio = comps.length
      ? Math.round(comps.reduce((acc, c) => acc + c.nivelDominio, 0) / comps.length)
      : 0
    const certificadas = comps.filter((c) => c.certificada).length
    const misionesCompletadas = a.misiones.filter((m) => m.estado === 'completada').length

    for (const e of a.erroresFrecuentes) {
      const prev = erroresGrupoMap.get(e.errorTag)
      if (prev) {
        prev.alumnos += 1
        prev.incidencias += e.conteo
      } else {
        erroresGrupoMap.set(e.errorTag, {
          tag: e.errorTag,
          etiqueta: ERROR_TAG_LABELS[e.errorTag as ErrorTag] || e.errorTag,
          alumnos: 1,
          incidencias: e.conteo
        })
      }
    }

    return {
      vinculoId: v.id,
      id: a.id,
      nombre: a.nombre,
      grado: a.grado,
      avatar: a.avatar,
      pais: a.padre?.pais || profesor.pais,
      representante: a.padre?.nombre || '',
      nivel: a.nivel,
      xp: a.xp,
      rachaActual: a.rachaActual,
      ultimaActividad: a.ultimaActividad,
      promedioDominio,
      certificadas,
      misionesCompletadas,
      notaPedagogica: v.notaPedagogica,
      erroresTop: a.erroresFrecuentes.map((e) => ({
        tema: e.tema,
        errorTag: e.errorTag,
        etiqueta: ERROR_TAG_LABELS[e.errorTag as ErrorTag] || e.errorTag,
        conteo: e.conteo
      }))
    }
  })

  const promedioGrupo = estudiantes.length
    ? Math.round(estudiantes.reduce((acc, e) => acc + e.promedioDominio, 0) / estudiantes.length)
    : 0

  const focosGrupo = Array.from(erroresGrupoMap.values())
    .sort((a, b) => b.incidencias - a.incidencias)
    .slice(0, 5)

  return {
    profesor: {
      id: profesor.id,
      nombre: profesor.nombre,
      institucion: profesor.institucion,
      pais: profesor.pais
    },
    resumenGrupo: {
      totalEstudiantes: estudiantes.length,
      promedioDominio: promedioGrupo,
      totalCertificados: estudiantes.reduce((acc, e) => acc + e.certificadas, 0),
      focosGrupo
    },
    estudiantes
  }
})
