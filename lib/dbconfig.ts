// File konfigurasi database
// PENTING: Data akan disimpan di database 'employee_attendance_v2'

import { PrismaClient } from '@prisma/client'

// PrismaClient dibuat sekali dan digunakan di seluruh aplikasi
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/employee_attendance_v2'
      }
    }
  })

// Menyimpan instance Prisma di global untuk mencegah terlalu banyak koneksi di mode pengembangan
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 