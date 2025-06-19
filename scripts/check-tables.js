require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

async function checkTables() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/employee_attendance_v2'
      }
    }
  })
  
  try {
    console.log('=== Checking Database Tables ===')
    
    // Show all tables
    const tables = await prisma.$queryRaw`SHOW TABLES`
    console.log('Existing tables:')
    tables.forEach(table => {
      const tableName = table[Object.keys(table)[0]]
      console.log(`  - ${tableName}`)
    })
    
    // Check if points-related tables exist
    const pointsTables = ['point_activities', 'points_terms', 'reward_stock_history', 'user_notifications']
    
    console.log('\nChecking points system tables:')
    for (const tableName of pointsTables) {
      try {
        const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${tableName}`
        console.log(`✓ ${tableName}: exists with ${result[0].count} records`)
      } catch (error) {
        console.log(`❌ ${tableName}: does not exist`)
      }
    }
    
    // Check rewards table structure
    try {
      const rewardsStructure = await prisma.$queryRaw`DESCRIBE rewards`
      console.log('\nRewards table structure:')
      rewardsStructure.forEach(column => {
        console.log(`  - ${column.Field}: ${column.Type}`)
      })
    } catch (error) {
      console.log('❌ Rewards table does not exist')
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkTables() 