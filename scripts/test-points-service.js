require('dotenv').config()

async function testPointsService() {
  try {
    console.log('=== Testing Points Service ===')
    
    // Test basic database connection
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    // Test point activities
    console.log('Testing point activities...')
    const activities = await prisma.$queryRaw`SELECT * FROM point_activities LIMIT 3`
    console.log(`✓ Found ${activities.length} activities`)
    activities.forEach(activity => {
      console.log(`  - ${activity.activity_name}: ${activity.base_points} points`)
    })
    
    // Test rewards
    console.log('\nTesting rewards...')
    const rewards = await prisma.$queryRaw`SELECT * FROM rewards LIMIT 3`
    console.log(`✓ Found ${rewards.length} rewards`)
    rewards.forEach(reward => {
      console.log(`  - ${reward.name}: ${reward.pointsCost} points`)
    })
    
    await prisma.$disconnect()
    
    console.log('\n✅ Points service test completed successfully!')
    
  } catch (error) {
    console.error('❌ Points service test failed:', error.message)
  }
}

testPointsService() 