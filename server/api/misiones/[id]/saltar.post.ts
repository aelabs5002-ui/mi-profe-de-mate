import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAlumnoActivo } from '~/server/utils/auth'
import { actualizarCcaYSecc } from '~/server/utils/mmcg'

const schema = z.object({
  pasoId: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const { alumno } = await requireAlumnoActivo(event)
  const misionId = getRouterParam(event, 'id')
  if (!misionId) throw createError({ statusCode: 400, statusMessage: 'Misión no especificada.' })

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ejercicio no especificado.' })
  }

  const mision = await prisma.mision.findFirst({
    where: { id: misionId, alumnoId: alumno.id },
    include: { pasos: { orderBy: { orden: 'asc' } } }
  })
  if (!mision) throw createError({ statusCode: 404, statusMessage: 'Misión no encontrada.' })

  const paso = mision.pasos.find((p) => p.id === parsed.data.pasoId)
  if (!paso) throw createError({ statusCode: 404, statusMessage: 'Ejercicio no encontrado.' })

  if (paso.intentosCount < 2 && paso.pistasUsadas < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Intenta responder al menos 2 veces o pide una pista antes de ver la explicación paso a paso.'
    })
  }

  const explicacion = paso.explicacionBase?.trim()
    ? `${paso.explicacionBase.trim()} (Respuesta: ${paso.respuestaEsperada})`
    : `La respuesta esperada era ${paso.respuestaEsperada}. Repasa este procedimiento con calma antes de pasar al siguiente reto.`

  const mensaje = `🧠 Ver cómo se resuelve también entrena tu mente. ${explicacion} ¡Buen esfuerzo por intentarlo, sigamos con el próximo reto!`

  await prisma.intento.create({
    data: {
      pasoId: paso.id,
      alumnoId: alumno.id,
      respuesta: '[explicacion_guiada]',
      esCorrecta: false,
      errorTag: null,
      feedbackIa: mensaje,
      turnType: 'scaffold',
      moodDetectado: 'frustrado'
    }
  })

  await prisma.pasoMision.update({
    where: { id: paso.id },
    data: {
      estado: 'completado',
      pistasUsadas: Math.max(paso.pistasUsadas, 1)
    }
  })

  // Verificar si era el último paso de la misión
  let resumenFinal: any = null
  const pasosActualizados = await prisma.pasoMision.findMany({
    where: { misionId: mision.id },
    include: { intentos: { select: { esCorrecta: true } } }
  })
  const pendientes = pasosActualizados.filter((p) => p.estado !== 'completado')
  if (pendientes.length === 0) {
    const totalPasos = pasosActualizados.length
    const resueltosCorrectamente = pasosActualizados.filter((p) => p.intentos.some((i) => i.esCorrecta)).length
    const pasosConAyudaGuiada = totalPasos - resueltosCorrectamente
    const totalPistas = pasosActualizados.reduce((acc, p) => acc + p.pistasUsadas, 0) + Math.max(1, pasosConAyudaGuiada)
    const duracionSeg = Math.min(900, Math.max(60, Math.round((Date.now() - mision.creadoEn.getTime()) / 1000)))

    const ccaResult = await actualizarCcaYSecc({
      alumnoId: alumno.id,
      tema: mision.tema,
      motorId: mision.motorId,
      dificultad: mision.dificultad,
      aciertos: resueltosCorrectamente,
      total: totalPasos,
      pistasUsadas: totalPistas,
      duracionSeg
    })

    await prisma.mision.update({
      where: { id: mision.id },
      data: {
        estado: 'completada',
        xpGanado: ccaResult?.xpGanado || 25,
        precisionPct: ccaResult?.precisionPct || 0,
        pistasUsadas: totalPistas,
        duracionSeg,
        completadaEn: new Date()
      }
    })

    resumenFinal = {
      completada: true,
      xpGanado: ccaResult?.xpGanado || 25,
      precisionPct: ccaResult?.precisionPct || 0,
      nuevaRacha: ccaResult?.nuevaRacha || 1,
      recienCertificada: false,
      competenciaTema: ccaResult?.competencia?.tema || mision.tema
    }
  }

  return {
    ok: true,
    explicacion: mensaje,
    respuestaEsperada: paso.respuestaEsperada,
    resumenFinal
  }
})
