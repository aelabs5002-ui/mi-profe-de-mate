import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Inicializando datos de demostración para Mi Profe de Mate...')

  const passDemo = await bcrypt.hash('Demo123*', 10)
  const hoy = new Date().toISOString().slice(0, 10)

  const padre = await prisma.padre.upsert({
    where: { correo: 'familia@miprofedemate.edu' },
    update: {},
    create: {
      nombre: 'María Elena Contreras',
      correo: 'familia@miprofedemate.edu',
      passwordHash: passDemo,
      pinParental: '1234',
      pais: 'Venezuela',
      ultimoAcceso: new Date()
    }
  })

  // Hijo 1: 1er Año de Secundaria (con 1 competencia ya certificada SECC y otra en refuerzo)
  let sofia = await prisma.alumno.findFirst({
    where: { padreId: padre.id, nombre: 'Sofía' }
  })

  if (!sofia) {
    sofia = await prisma.alumno.create({
      data: {
        padreId: padre.id,
        nombre: 'Sofía',
        grado: '1er Año (Secundaria)',
        avatar: '🦊',
        xp: 480,
        nivel: 5,
        rachaActual: 4,
        mejorRacha: 7,
        ultimaActividad: new Date(),
        limiteMinutosDiario: 30,
        minutosUsadosHoy: 12,
        fechaUsoHoy: hoy,
        maxPistasPorPaso: 2,
        instruccionesPadre: 'Reforzar ecuaciones de primer grado y operaciones con fracciones antes del examen del viernes.'
      }
    })
  }

  // Hijo 2: 5to Grado de Primaria
  let mateo = await prisma.alumno.findFirst({
    where: { padreId: padre.id, nombre: 'Mateo' }
  })

  if (!mateo) {
    mateo = await prisma.alumno.create({
      data: {
        padreId: padre.id,
        nombre: 'Mateo',
        grado: '5to Grado (Primaria)',
        avatar: '🦁',
        xp: 210,
        nivel: 3,
        rachaActual: 2,
        mejorRacha: 4,
        ultimaActividad: new Date(Date.now() - 86400000),
        limiteMinutosDiario: 25,
        minutosUsadosHoy: 0,
        fechaUsoHoy: hoy,
        maxPistasPorPaso: 2,
        instruccionesPadre: 'Practicar tablas, fracciones equivalentes y cálculo mental sin apuro.'
      }
    })
  }

  // Biblioteca del Padre (PARENT_LIBRARY_FIRST)
  const docsCount = await prisma.documentoBiblioteca.count({ where: { alumnoId: sofia.id } })
  if (docsCount === 0) {
    await prisma.documentoBiblioteca.createMany({
      data: [
        {
          alumnoId: sofia.id,
          titulo: 'Guía 1er Año — Ecuaciones Lineales y Despeje',
          nombreArchivo: 'guia-ecuaciones-1er-ano.pdf',
          tipoDoc: 'guia',
          pais: 'Venezuela',
          grado: '1er Año (Secundaria)',
          temasJson: JSON.stringify(['Ecuaciones lineales', 'Ley de signos']),
          resumenExtraido: 'Resolución de ecuaciones de la forma ax + b = c, transposición de términos y verificación.',
          prioridad: 1,
          activo: true
        },
        {
          alumnoId: sofia.id,
          titulo: 'Currículo Nacional — Fracciones y Números Racionales',
          nombreArchivo: 'curriculo-fracciones-venezuela.pdf',
          tipoDoc: 'curriculo',
          pais: 'Venezuela',
          grado: '1er Año (Secundaria)',
          temasJson: JSON.stringify(['Fracciones equivalentes', 'Suma y resta de fracciones']),
          resumenExtraido: 'Equivalencias entre fracciones, decimales y porcentajes; operaciones con distinto denominador.',
          prioridad: 2,
          activo: true
        }
      ]
    })
  }

  // Competencias CCA para Sofía (incluye una certificada SECC lista para descargar PDF!)
  const competenciasSofia = [
    {
      codigo: 'MAT-OPB-01',
      tema: 'Operaciones y Cálculo Mental',
      grado: '1er Año (Secundaria)',
      nivelDominio: 96,
      totalEjercicios: 24,
      correctos: 23,
      sesionesExitosasSinAyuda: 3,
      certificada: true,
      certificadaEn: new Date(Date.now() - 86400000 * 2),
      motoresUsadosJson: JSON.stringify(['A', 'C'])
    },
    {
      codigo: 'MAT-FRAC-01',
      tema: 'Fracciones Equivalentes',
      grado: '1er Año (Secundaria)',
      nivelDominio: 82,
      totalEjercicios: 15,
      correctos: 12,
      sesionesExitosasSinAyuda: 2,
      certificada: false,
      certificadaEn: null,
      motoresUsadosJson: JSON.stringify(['C', 'F'])
    },
    {
      codigo: 'MAT-ALG-01',
      tema: 'Ecuaciones Lineales',
      grado: '1er Año (Secundaria)',
      nivelDominio: 64,
      totalEjercicios: 11,
      correctos: 7,
      sesionesExitosasSinAyuda: 1,
      certificada: false,
      certificadaEn: null,
      motoresUsadosJson: JSON.stringify(['F'])
    },
    {
      codigo: 'MAT-SIG-01',
      tema: 'Números Enteros y Signos',
      grado: '1er Año (Secundaria)',
      nivelDominio: 58,
      totalEjercicios: 12,
      correctos: 7,
      sesionesExitosasSinAyuda: 0,
      certificada: false,
      certificadaEn: null,
      motoresUsadosJson: JSON.stringify(['A', 'F'])
    }
  ]

  for (const c of competenciasSofia) {
    await prisma.competenciaCCA.upsert({
      where: { alumnoId_codigo: { alumnoId: sofia.id, codigo: c.codigo } },
      update: {},
      create: { alumnoId: sofia.id, ...c }
    })
  }

  // Errores frecuentes CCA de Sofía
  const erroresSofia = [
    { tema: 'Ecuaciones Lineales', errorTag: 'signos', conteo: 4, superado: false },
    { tema: 'Ecuaciones Lineales', errorTag: 'despeje', conteo: 3, superado: false },
    { tema: 'Fracciones Equivalentes', errorTag: 'fracciones', conteo: 2, superado: true }
  ]

  for (const err of erroresSofia) {
    await prisma.errorFrecuenteCCA.upsert({
      where: { alumnoId_tema_errorTag: { alumnoId: sofia.id, tema: err.tema, errorTag: err.errorTag } },
      update: {},
      create: { alumnoId: sofia.id, ...err }
    })
  }

  // Competencias iniciales para Mateo
  await prisma.competenciaCCA.upsert({
    where: { alumnoId_codigo: { alumnoId: mateo.id, codigo: 'MAT-OPB-01' } },
    update: {},
    create: {
      alumnoId: mateo.id,
      codigo: 'MAT-OPB-01',
      tema: 'Operaciones y Cálculo Mental',
      grado: '5to Grado (Primaria)',
      nivelDominio: 78,
      totalEjercicios: 14,
      correctos: 11,
      sesionesExitosasSinAyuda: 1,
      certificada: false,
      motoresUsadosJson: JSON.stringify(['A'])
    }
  })

  // Historial de misiones recientes completadas para Sofía
  const misionesCount = await prisma.mision.count({ where: { alumnoId: sofia.id } })
  if (misionesCount === 0) {
    await prisma.mision.createMany({
      data: [
        {
          alumnoId: sofia.id,
          fechaClave: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
          origen: 'practica_ia',
          motorId: 'A',
          titulo: 'Dominio de Cálculo Mental',
          descripcion: 'Misión adaptativa completada sin pistas (evidencia SECC #3).',
          tema: 'Operaciones y Cálculo Mental',
          dificultad: 3,
          estado: 'completada',
          xpGanado: 90,
          precisionPct: 100,
          pistasUsadas: 0,
          duracionSeg: 420,
          completadaEn: new Date(Date.now() - 86400000 * 2)
        },
        {
          alumnoId: sofia.id,
          fechaClave: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
          origen: 'refuerzo_cca',
          motorId: 'F',
          titulo: 'Refuerzo Inteligente: Signos en Ecuaciones',
          descripcion: 'Práctica enfocada en transposición de signos.',
          tema: 'Ecuaciones Lineales',
          dificultad: 2,
          estado: 'completada',
          xpGanado: 65,
          precisionPct: 80,
          pistasUsadas: 1,
          duracionSeg: 510,
          completadaEn: new Date(Date.now() - 86400000)
        }
      ]
    })
  }

  console.log('Seed completado con éxito.')
  console.log('  Cuenta Demo Padre: familia@miprofedemate.edu / Demo123* (PIN Portal Padres: 1234)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
