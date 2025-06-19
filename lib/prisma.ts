import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/employee_attendance_v2'
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Log queries in development
if (process.env.NODE_ENV !== 'production') {
  // @ts-ignore
  prisma.$on('query', (e: any) => {
    console.log('Query: ' + e.query)
    console.log('Params: ' + e.params)
    console.log('Duration: ' + e.duration + 'ms')
  })
}

// Initialize connection with retry logic
let connectionAttempts = 0
const maxConnectionAttempts = 3

async function initializeDatabase() {
  try {
    connectionAttempts++
    console.log(`Attempting database connection (attempt ${connectionAttempts}/${maxConnectionAttempts})...`)
    
    await prisma.$connect()
    console.log('✅ Successfully connected to the database')
    
    // Verify the database exists and is accessible
    const result = await prisma.$queryRaw`SELECT DATABASE() as db` as any[]
    console.log('✅ Connected to database:', result[0].db)
    
    // Reset attempts on success
    connectionAttempts = 0
  } catch (err: any) {
    console.error(`❌ Database connection attempt ${connectionAttempts} failed:`, err.message)
    
    if (connectionAttempts < maxConnectionAttempts) {
      console.log(`Retrying in 2 seconds...`)
      setTimeout(initializeDatabase, 2000)
    } else {
      console.error('❌ Max connection attempts reached. Database connection failed.')
      console.error('Please ensure MySQL/XAMPP is running and the database exists.')
    }
  }
}

// Start connection initialization
if (typeof window === 'undefined') {
  initializeDatabase()
}
