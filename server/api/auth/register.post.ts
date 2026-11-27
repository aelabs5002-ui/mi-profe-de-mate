import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { createSessionToken, sanitizePadre, setActiveStudentCookie, setAuthCookie } from '~/server/utils/auth'
import { ensureProfesorTables } from '~/server/utils/profesorTables'

const registerSchema = z.object({
  nombrePadre: z.string().trim().min(2, 'Ingresa tu nombre'),
  correo: z.string().trim().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  pais: z.string().trim().min(2).default('Venezuela'),
  pinParental: z.string().trim().regex(/^\d{4}$/, 'El PIN parental debe tener 4 dígitos').default('1234'),
  nombreAlumno: z.string().trim().min(2, 'Ingresa el nombre del estudiante'),
  gradoAlumno: z.string().trim().min(2, 'Selecciona el grado escolar'),
  avatarAlumno: z.string().trim().default('🦊'),
  codigoProfesor: z.string().trim().max(24).optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Datos de registro inválidos.'
    })
  }

  const d = parsed.data
  const correoNorm = d.correo.trim().toLowerCase()

  const exists = await prisma.padre.findUnique({ where: { correo: correoNorm } })
  if (exists) {
    throw createError({ statusCode: 409, statusMessage: 'Ya existe una cuenta familiar con ese correo.' })
  }

  const passwordHash = await bcrypt.hash(d.password, 10)
  const padre = await prisma.padre.create({
    data: {
      nombre: d.nombrePadre,
      correo: correoNorm,
      passwordHash,
      pais: d.pais,
      pinParental: d.pinParental,
      ultimoAcceso: new Date(),
      alumnos: {
        create: {
          nombre: d.nombreAlumno,
          grado: d.gradoAlumno,
          avatar: d.avatarAlumno || '🦊',
          xp: 20,
          nivel: 1,
          rachaActual: 1,
          mejorRacha: 1,
          ultimaActividad: new Date()
        }
      }
    },
    include: { alumnos: true }
  })

  const primerAlumno = padre.alumnos[0]

  // Si la familia entró mediante el enlace de invitación de un profesor, vincular automáticamente
  let profesorVinculado: string | null = null
  if (primerAlumno && d.codigoProfesor && d.codigoProfesor.trim().length >= 4) {
    try {
      await ensureProfesorTables()
      const codigoNorm = d.codigoProfesor.trim().toUpperCase()
      const inv = await prisma.codigoInvitacionProfesor.findUnique({
        where: { codigo: codigoNorm },
        include: { profesor: { select: { id: true, nombre: true } } }
      })
      if (inv) {
        await prisma.vinculoProfesor.upsert({
          where: { profesorId_alumnoId: { profesorId: inv.profesor.id, alumnoId: primerAlumno.id } },
          update: { activo: true, codigoUsado: codigoNorm },
          create: {
            profesorId: inv.profesor.id,
            alumnoId: primerAlumno.id,
            codigoUsado: codigoNorm
          }
        })
        profesorVinculado = inv.profesor.nombre
      }
    } catch {
      // No bloquear el registro si el código es inválido
    }
  }

  const token = await createSessionToken({
    padreId: padre.id,
    correo: padre.correo,
    nombre: padre.nombre
  })
  setAuthCookie(event, token)
  if (primerAlumno) {
    setActiveStudentCookie(event, primerAlumno.id)
  }

  return {
    padre: sanitizePadre(padre),
    alumnoActivo: primerAlumno || null,
    profesorVinculado
  }
})
