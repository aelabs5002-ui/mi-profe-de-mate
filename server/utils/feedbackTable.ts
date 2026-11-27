import { prisma } from './prisma'

let feedbackTableReady = false

/**
 * Garantiza que la tabla FeedbackPrueba exista en PostgreSQL/Supabase
 * aunque no se haya ejecutado `prisma db push` desde la red local.
 */
export async function ensureFeedbackTable() {
  if (feedbackTableReady) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "FeedbackPrueba" (
      "id" TEXT NOT NULL,
      "padreId" TEXT,
      "alumnoId" TEXT,
      "autorNombre" TEXT NOT NULL DEFAULT 'Anónimo',
      "autorTipo" TEXT NOT NULL DEFAULT 'padre',
      "categoria" TEXT NOT NULL DEFAULT 'sugerencia',
      "calificacion" INTEGER,
      "mensaje" TEXT NOT NULL,
      "ruta" TEXT NOT NULL DEFAULT '/',
      "dispositivo" TEXT NOT NULL DEFAULT 'web',
      "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "FeedbackPrueba_pkey" PRIMARY KEY ("id")
    );
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "FeedbackPrueba_creadoEn_idx" ON "FeedbackPrueba"("creadoEn");`
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "FeedbackPrueba_categoria_idx" ON "FeedbackPrueba"("categoria");`
  )
  feedbackTableReady = true
}
