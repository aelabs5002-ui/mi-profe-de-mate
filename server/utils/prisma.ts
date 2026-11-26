import { PrismaClient } from '@prisma/client'
import { resolve } from 'node:path'

function resolveDatabaseUrl() {
  const url = process.env.DATABASE_URL || 'file:./dev.db'
  if (url.startsWith('file:./') || url.startsWith('file:../')) {
    const rel = url.replace(/^file:/, '')
    const abs = resolve(process.cwd(), 'prisma', rel).replace(/\\/g, '/')
    return `file:${abs}`
  }
  return url
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: resolveDatabaseUrl() }
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
