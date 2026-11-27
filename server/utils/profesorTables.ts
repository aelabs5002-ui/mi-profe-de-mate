import { prisma } from './prisma'

let profesorTablesReady = false

/**
 * Crea automáticamente las tablas del Portal Profesor en PostgreSQL/Supabase
 * si aún no existen, evitando dependencia de migraciones manuales desde red local.
 */
export async function ensureProfesorTables() {
  if (profesorTablesReady) return

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Profesor" (
      "id" TEXT NOT NULL,
      "nombre" TEXT NOT NULL,
      "correo" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "pais" TEXT NOT NULL DEFAULT 'Venezuela',
      "institucion" TEXT NOT NULL DEFAULT '',
      "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "ultimoAcceso" TIMESTAMP(3),
      CONSTRAINT "Profesor_pkey" PRIMARY KEY ("id")
    );
  `)
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Profesor_correo_key" ON "Profesor"("correo");`
  )

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CodigoVinculacionAlumno" (
      "id" TEXT NOT NULL,
      "alumnoId" TEXT NOT NULL,
      "codigo" TEXT NOT NULL,
      "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CodigoVinculacionAlumno_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "CodigoVinculacionAlumno_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `)
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "CodigoVinculacionAlumno_alumnoId_key" ON "CodigoVinculacionAlumno"("alumnoId");`
  )
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "CodigoVinculacionAlumno_codigo_key" ON "CodigoVinculacionAlumno"("codigo");`
  )

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VinculoProfesor" (
      "id" TEXT NOT NULL,
      "profesorId" TEXT NOT NULL,
      "alumnoId" TEXT NOT NULL,
      "codigoUsado" TEXT NOT NULL DEFAULT '',
      "notaPedagogica" TEXT NOT NULL DEFAULT '',
      "activo" BOOLEAN NOT NULL DEFAULT true,
      "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "VinculoProfesor_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "VinculoProfesor_profesorId_fkey" FOREIGN KEY ("profesorId") REFERENCES "Profesor"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "VinculoProfesor_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `)
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "VinculoProfesor_profesorId_alumnoId_key" ON "VinculoProfesor"("profesorId", "alumnoId");`
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "VinculoProfesor_alumnoId_activo_idx" ON "VinculoProfesor"("alumnoId", "activo");`
  )

  profesorTablesReady = true
}

/**
 * Obtiene las notas pedagógicas activas de profesores vinculados a un alumno.
 * Silencioso si las tablas aún no se han inicializado.
 */
export async function getNotasProfesoresActivos(alumnoId: string): Promise<string> {
  try {
    await ensureProfesorTables()
    const vinculos = await prisma.vinculoProfesor.findMany({
      where: { alumnoId, activo: true, NOT: { notaPedagogica: '' } },
      include: { profesor: { select: { nombre: true } } },
      take: 3
    })
    return vinculos
      .map((v) => `Profe ${v.profesor.nombre}: ${v.notaPedagogica.trim()}`)
      .filter(Boolean)
      .join(' | ')
  } catch {
    return ''
  }
}

export function generarCodigoVinculacion(nombreAlumno: string): string {
  const prefijo =
    nombreAlumno
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z]/g, '')
      .toUpperCase()
      .slice(0, 3)
      .padEnd(3, 'M') || 'EST'
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let sufijo = ''
  for (let i = 0; i < 4; i++) {
    sufijo += chars[Math.floor(Math.random() * chars.length)]
  }
  return `${prefijo}-${sufijo}`
}
