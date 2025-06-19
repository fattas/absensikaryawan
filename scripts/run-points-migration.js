require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

async function runPointsMigration() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/employee_attendance_v2'
      }
    }
  })
  
  try {
    console.log('=== Running Points Configuration System Migration ===')
    
    // Read the migration SQL file
    const migrationFile = path.join(__dirname, 'add-points-configuration-system.sql')
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8')
    
    // Split SQL statements and execute them one by one
    const statements = migrationSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`)
          await prisma.$executeRawUnsafe(statement)
        } catch (error) {
          // Ignore "table already exists" errors
          if (!error.message.includes('already exists')) {
            console.error(`Error in statement ${i + 1}:`, error.message)
            throw error
          } else {
            console.log(`Statement ${i + 1}: Table already exists, skipping...`)
          }
        }
      }
    }
    
    console.log('✅ Points configuration migration completed successfully!')
    
    // Test that tables were created
    console.log('\nTesting created tables...')
    
    const activities = await prisma.$queryRaw`SELECT COUNT(*) as count FROM point_activities`
    console.log(`✓ point_activities table: ${activities[0].count} records`)
    
    const terms = await prisma.$queryRaw`SELECT COUNT(*) as count FROM points_terms`
    console.log(`✓ points_terms table: ${terms[0].count} records`)
    
    const rewards = await prisma.$queryRaw`SELECT COUNT(*) as count FROM rewards`
    console.log(`✓ rewards table: ${rewards[0].count} records`)
    
    console.log('\n=== Migration completed successfully! ===')
    console.log('The following features are now available:')
    console.log('  - Point Activities Configuration')
    console.log('  - Enhanced Rewards Management')
    console.log('  - Terms and Conditions System')
    console.log('  - Admin Analytics Dashboard')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runPointsMigration() 