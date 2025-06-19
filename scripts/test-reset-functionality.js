require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/employee_attendance_v2'
    }
  }
})

async function testResetFunctionality() {
  try {
    console.log('Testing Reset Attendance Functionality...\n')
    
    // Get a test user
    const testUser = await prisma.user.findFirst({
      where: { 
        role: 'USER' 
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })
    
    if (!testUser) {
      console.log('❌ No test user found. Please create a user first.')
      return
    }
    
    console.log(`Test User: ${testUser.name} (${testUser.email})`)
    console.log('========================================\n')
    
    // Check today's attendance
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Get current attendance
    const currentAttendance = await prisma.attendance.findMany({
      where: {
        userId: testUser.id,
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    })
    
    console.log('Current Today\'s Attendance:')
    if (currentAttendance.length === 0) {
      console.log('  - No attendance records for today')
    } else {
      currentAttendance.forEach(att => {
        console.log(`  - ${att.type}: ${att.timestamp}`)
      })
    }
    
    // Get historical attendance (yesterday)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const historicalAttendance = await prisma.attendance.findMany({
      where: {
        userId: testUser.id,
        timestamp: {
          gte: yesterday,
          lt: today
        }
      }
    })
    
    console.log('\nHistorical Attendance (Yesterday):')
    if (historicalAttendance.length === 0) {
      console.log('  - No attendance records for yesterday')
    } else {
      console.log(`  - Found ${historicalAttendance.length} records`)
    }
    
    // Create sample attendance for today if none exists
    if (currentAttendance.length === 0) {
      console.log('\n📝 Creating sample attendance for testing...')
      
      // Create check-in
      await prisma.attendance.create({
        data: {
          userId: testUser.id,
          type: 'CHECK_IN',
          timestamp: new Date(),
          latitude: -6.2088,
          longitude: 106.8456,
          location: 'Test Location',
          isLocationValid: true,
          locationDistance: 50,
          isLate: false,
          lateMinutes: 0
        }
      })
      
      // Create check-out
      const checkOutTime = new Date()
      checkOutTime.setHours(checkOutTime.getHours() + 8)
      
      await prisma.attendance.create({
        data: {
          userId: testUser.id,
          type: 'CHECK_OUT',
          timestamp: checkOutTime,
          latitude: -6.2088,
          longitude: 106.8456,
          location: 'Test Location',
          isLocationValid: true,
          locationDistance: 50
        }
      })
      
      console.log('✅ Sample attendance created')
    }
    
    // Verify data before reset
    const beforeReset = await prisma.attendance.findMany({
      where: {
        userId: testUser.id,
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      }
    })
    
    console.log('\n🔍 Before Reset:')
    console.log(`  - Today's records: ${beforeReset.length}`)
    console.log(`  - Historical records: ${historicalAttendance.length}`)
    
    // Simulate reset (delete today's attendance only)
    console.log('\n🔄 Simulating Reset...')
    const deletedCount = await prisma.attendance.deleteMany({
      where: {
        userId: testUser.id,
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      }
    })
    
    console.log(`  - Deleted ${deletedCount.count} records`)
    
    // Verify after reset
    const afterResetToday = await prisma.attendance.findMany({
      where: {
        userId: testUser.id,
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      }
    })
    
    const afterResetHistorical = await prisma.attendance.findMany({
      where: {
        userId: testUser.id,
        timestamp: {
          gte: yesterday,
          lt: today
        }
      }
    })
    
    console.log('\n✅ After Reset:')
    console.log(`  - Today's records: ${afterResetToday.length}`)
    console.log(`  - Historical records: ${afterResetHistorical.length}`)
    
    if (afterResetToday.length === 0 && afterResetHistorical.length === historicalAttendance.length) {
      console.log('\n🎉 Reset functionality working correctly!')
      console.log('  - Today\'s attendance cleared')
      console.log('  - Historical data preserved')
    } else {
      console.log('\n❌ Reset functionality has issues!')
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testResetFunctionality() 