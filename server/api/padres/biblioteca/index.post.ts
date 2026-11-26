import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAlumnoActivo } from '~/server/utils/auth'

const createSchema = z.object({
  alumnoId: z.string().optional(),
  titulo: z.string().trim().min(2, 'Ingresa un título para el material'),
  nombreArchivo: z.string().trim().min(1).default('material.pdf'),
  tipoDoc: z.enum(['curriculo', 'libro', 'guia', 'otro']).default('guia'),
  grado: z.string().trim().optional(),
  temas: z.array(z.string().trim()).default([]),
  resumenExtraido: z.string().trim().max(1000).default(''),
  prioridad: z.number().int().min(1).max(5).default(1)
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message || 'Datos inválidos.' })
  }

  const d = parsed.data
  const { padre, alumno } = await requireAlumnoActivo(event, d.alumnoId)

  const doc = await prisma.documentoBiblioteca.create({
    data: {
      alumnoId: alumno.id,
      titulo: d.titulo,
      nombreArchivo: d.nombreArchivo,
      tipoDoc: d.tipoDoc,
      pais: padre.pais,
      grado: d.grado || alumno.grado,
      temasJson: JSON.stringify(d.temas),
      resumenExtraido: d.resumenExtraido || `Material prioritario (${d.tipoDoc}) cargado por el representante.`,
      prioridad: d.prioridad,
      activo: true
    }
  })

  return { documento: { ...doc, temas: d.temas } }
})
