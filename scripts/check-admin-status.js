require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/employee_attendance_v2'
    }
  }
})

async function checkAdminStatus() {
  try {
    console.log('Checking admin status in database...\n')
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })
    
    console.log(`Total users: ${users.length}`)
    console.log('========================================')
    
    users.forEach(user => {
      console.log(`ID: ${user.id}`)
      console.log(`Email: ${user.email}`)
      console.log(`Name: ${user.name}`)
      console.log(`Role: ${user.role} ${user.role === 'ADMIN' ? '✅ (Admin)' : ''}`)
      console.log(`Created: ${user.createdAt}`)
      console.log('----------------------------------------')
    })
    
    // Check admin specifically
    const admins = users.filter(u => u.role === 'ADMIN')
    console.log(`\nTotal admins found: ${admins.length}`)
    
    if (admins.length === 0) {
      console.log('\n⚠️  No admin users found in database!')
      console.log('Creating default admin...')
      
      // Create default admin
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('admin123', 12)
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@attendance.com',
          name: 'System Administrator',
          password: hashedPassword,
          role: 'ADMIN'
        }
      })
      
      console.log('✅ Admin created successfully!')
      console.log(`Email: ${newAdmin.email}`)
      console.log('Password: admin123')
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdminStatus() 