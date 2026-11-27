import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAlumnoActivo } from '~/server/utils/auth'
import { answerStudentQuestionSocratically } from '~/server/utils/ai'
import { getNotasProfesoresActivos } from '~/server/utils/profesorTables'

const schema = z.object({
  pasoId: z.string().min(1),
  pregunta: z.string().trim().min(3, 'Escribe tu duda para que pueda ayudarte.').max(400)
})

export default defineEventHandler(async (event) => {
  const { padre, alumno } = await requireAlumnoActivo(event)
  const misionId = getRouterParam(event, 'id')
  if (!misionId) throw createError({ statusCode: 400, statusMessage: 'Misión no especificada.' })

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Pregunta inválida.'
    })
  }

  const paso = await prisma.pasoMision.findFirst({
    where: { id: parsed.data.pasoId, misionId, mision: { alumnoId: alumno.id } }
  })
  if (!paso) throw createError({ statusCode: 404, statusMessage: 'Ejercicio no encontrado.' })

  const docsActivos = await prisma.documentoBiblioteca.findMany({
    where: { alumnoId: alumno.id, activo: true },
    orderBy: { prioridad: 'asc' },
    take: 2
  })
  const bibliotecaResumen = docsActivos.map((d) => `${d.titulo}: ${d.resumenExtraido}`).join(' | ')
  const notasProfesores = await getNotasProfesoresActivos(alumno.id)
  const instruccionesCombinadas = [alumno.instruccionesPadre, notasProfesores].filter(Boolean).join(' | ')

  const res = await answerStudentQuestionSocratically({
    alumnoNombre: alumno.nombre,
    grado: alumno.grado,
    pais: padre.pais,
    tema: paso.tema,
    enunciado: paso.enunciado,
    respuestaEsperada: paso.respuestaEsperada,
    pregunta: parsed.data.pregunta,
    bibliotecaResumen,
    instruccionesPadre: instruccionesCombinadas
  })

  return {
    respuesta: res.respuesta,
    usedGemini: res.usedGemini
  }
})
