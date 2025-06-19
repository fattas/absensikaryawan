require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/employee_attendance_v2'
    }
  }
})

async function fixAdminLogin() {
  try {
    console.log('Fixing admin login issue...\n')
    
    // Get existing admin
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })
    
    if (admin) {
      console.log('✅ Admin found:')
      console.log(`   ID: ${admin.id}`)
      console.log(`   Email: ${admin.email}`)
      console.log(`   Name: ${admin.name}`)
      console.log(`   Role: ${admin.role}`)
      
      // Reset password to make sure we can login
      console.log('\nResetting admin password to: admin123')
      
      const hashedPassword = await bcrypt.hash('admin123', 12)
      await prisma.user.update({
        where: { id: admin.id },
        data: { password: hashedPassword }
      })
      
      console.log('✅ Admin password reset successfully')
    } else {
      console.log('❌ No admin found! Creating new admin...')
      
      const hashedPassword = await bcrypt.hash('admin123', 12)
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@attendance.com',
          name: 'System Administrator',
          password: hashedPassword,
          role: 'ADMIN'
        }
      })
      
      console.log('✅ New admin created:')
      console.log(`   ID: ${newAdmin.id}`)
      console.log(`   Email: ${newAdmin.email}`)
      console.log(`   Password: admin123`)
    }
    
    console.log('\n========================================')
    console.log('LOGIN INSTRUCTIONS:')
    console.log('========================================')
    console.log('1. Go to http://localhost:3000')
    console.log('2. Login with:')
    console.log('   Email: admin@attendance.com')
    console.log('   Password: admin123')
    console.log('\nIMPORTANT: Make sure to login as ADMIN, not regular user!')
    console.log('If you see "Admin tidak ditemukan" error, try:')
    console.log('1. Clear browser cookies')
    console.log('2. Login again with admin credentials')
    console.log('========================================')
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixAdminLogin() 