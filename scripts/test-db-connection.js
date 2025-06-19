require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

console.log('DATABASE_URL:', process.env.DATABASE_URL)

async function testConnection() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/employee_attendance_v2'
      }
    }
  })
  
  try {
    console.log('Testing database connection...')
    
    // Test raw query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✓ Raw query successful:', result)
    
    // Test user count
    const userCount = await prisma.user.count()
    console.log(`✓ User count: ${userCount}`)
    
    // Test if admin exists
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    console.log('✓ Admin user:', admin ? admin.email : 'Not found')
    
    console.log('\n✅ Database connection successful!')
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection() 