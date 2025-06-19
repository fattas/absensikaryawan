require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

async function addSampleRewards() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/employee_attendance_v2'
      }
    }
  })
  
  try {
    console.log('=== Adding Sample Rewards ===')
    
    // Check if rewards already exist
    const existingRewards = await prisma.$queryRaw`SELECT COUNT(*) as count FROM rewards`
    console.log(`Existing rewards: ${existingRewards[0].count}`)
    
    // Add sample rewards if none exist
    if (existingRewards[0].count === 0) {
      console.log('Adding sample rewards...')
      
      const sampleRewards = [
        {
          id: 'reward-coffee-001',
          name: 'Coffee Voucher',
          description: 'Free coffee for a week',
          pointsCost: 200,
          quantity: 30,
          category: 'voucher',
          stockAlertThreshold: 5,
          maxPerUser: -1
        },
        {
          id: 'reward-lunch-001',
          name: 'Lunch Voucher',
          description: 'IDR 50,000 lunch voucher',
          pointsCost: 300,
          quantity: 50,
          category: 'voucher',
          stockAlertThreshold: 10,
          maxPerUser: -1
        },
        {
          id: 'reward-parking-001',
          name: 'Parking Pass',
          description: 'Free parking for one month',
          pointsCost: 500,
          quantity: 20,
          category: 'general',
          stockAlertThreshold: 5,
          maxPerUser: 1
        },
        {
          id: 'reward-gift-001',
          name: 'Gift Card',
          description: 'IDR 100,000 shopping gift card',
          pointsCost: 800,
          quantity: 25,
          category: 'gift-card',
          stockAlertThreshold: 5,
          maxPerUser: -1
        },
        {
          id: 'reward-wfh-001',
          name: 'Work From Home',
          description: 'One day work from home pass',
          pointsCost: 1000,
          quantity: 15,
          category: 'general',
          stockAlertThreshold: 3,
          maxPerUser: 2
        },
        {
          id: 'reward-leave-001',
          name: 'Extra Day Off',
          description: 'One additional day of paid leave',
          pointsCost: 1500,
          quantity: 10,
          category: 'general',
          stockAlertThreshold: 2,
          maxPerUser: 1
        }
      ]
      
      for (const reward of sampleRewards) {
        await prisma.$executeRaw`
          INSERT INTO rewards (
            id, name, description, pointsCost, quantity, 
            category, stock_alert_threshold, max_per_user, isActive
          ) VALUES (
            ${reward.id}, ${reward.name}, ${reward.description}, 
            ${reward.pointsCost}, ${reward.quantity}, ${reward.category},
            ${reward.stockAlertThreshold}, ${reward.maxPerUser}, true
          )
        `
        console.log(`✓ Added: ${reward.name}`)
      }
      
      console.log('✅ Sample rewards added successfully!')
    } else {
      console.log('Rewards already exist, skipping sample data creation.')
    }
    
    // Verify rewards
    const allRewards = await prisma.$queryRaw`
      SELECT name, pointsCost, quantity, category FROM rewards WHERE isActive = true
    `
    
    console.log('\nCurrent active rewards:')
    allRewards.forEach(reward => {
      console.log(`  - ${reward.name}: ${reward.pointsCost} points (${reward.quantity} in stock)`)
    })
    
    console.log('\n=== Sample Rewards Setup Complete! ===')
    
  } catch (error) {
    console.error('❌ Error adding sample rewards:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addSampleRewards() 