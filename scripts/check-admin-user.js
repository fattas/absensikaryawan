require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

async function checkAdminUser() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/employee_attendance_v2'
      }
    }
  })
  
  try {
    console.log('=== Checking Admin Users ===')
    
    // Check for admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })
    
    console.log(`Found ${adminUsers.length} admin user(s):`)
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found!')
      console.log('\n🔧 To create an admin user, you can:')
      console.log('   1. Run: node scripts/create-admin.js')
      console.log('   2. Or manually insert into database')
      console.log('   3. Or register a user and update their role to ADMIN')
    } else {
      adminUsers.forEach((admin, index) => {
        console.log(`\n${index + 1}. Admin User:`)
        console.log(`   📧 Email: ${admin.email}`)
        console.log(`   👤 Name: ${admin.name || 'N/A'}`)
        console.log(`   🆔 ID: ${admin.id}`)
        console.log(`   📅 Created: ${admin.createdAt}`)
      })
    }
    
    // Check total users
    const totalUsers = await prisma.user.count()
    console.log(`\n📊 Total users in database: ${totalUsers}`)
    
    // Show sample of regular users
    const regularUsers = await prisma.user.findMany({
      where: {
        role: 'USER'
      },
      take: 3,
      select: {
        email: true,
        name: true
      }
    })
    
    if (regularUsers.length > 0) {
      console.log('\n👥 Sample regular users:')
      regularUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.name || 'No name'})`)
      })
    }
    
    console.log('\n✅ User check completed!')
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdminUser() 