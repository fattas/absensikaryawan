require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

async function createPointsTables() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/employee_attendance_v2'
      }
    }
  })
  
  try {
    console.log('=== Creating Points System Tables ===')
    
    // Create point_activities table
    console.log('Creating point_activities table...')
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS point_activities (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        activity_code VARCHAR(50) UNIQUE NOT NULL,
        activity_name VARCHAR(100) NOT NULL,
        description TEXT,
        base_points INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_activity_code (activity_code),
        INDEX idx_is_active (is_active)
      )
    `
    console.log('✓ point_activities table created')
    
    // Insert default activities
    console.log('Inserting default point activities...')
    await prisma.$executeRaw`
      INSERT IGNORE INTO point_activities (activity_code, activity_name, description, base_points) VALUES
      ('CHECK_IN_ON_TIME', 'On-time Check-in', 'Points awarded for checking in on time', 10),
      ('CHECK_IN_EARLY_BIRD', 'Early Bird Check-in', 'Bonus points for checking in before 6:30 AM', 5),
      ('CHECK_IN_LATE', 'Late Check-in', 'Reduced points for late check-in', 5),
      ('CHECK_OUT', 'Check-out Completed', 'Points for completing check-out', 5),
      ('PERFECT_WEEK', 'Perfect Week Streak', 'Bonus for 5 consecutive days of on-time attendance', 25),
      ('PERFECT_MONTH', 'Perfect Month', 'Bonus for 20+ days of on-time attendance in a month', 50),
      ('NO_LEAVE_BONUS', 'No Leave Taken', 'Monthly bonus for not taking any leave', 20)
    `
    console.log('✓ Default point activities inserted')
    
    // Create points_terms table
    console.log('Creating points_terms table...')
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS points_terms (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50),
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_display_order (display_order)
      )
    `
    console.log('✓ points_terms table created')
    
    // Insert default terms
    console.log('Inserting default terms...')
    await prisma.$executeRaw`
      INSERT IGNORE INTO points_terms (title, content, category, display_order) VALUES
      ('How to Earn Points', 'Points are awarded for various attendance-related activities. Check in on time to maximize your points!', 'earning', 1),
      ('On-time Attendance', 'Check in before the maximum clock-in time to receive full points. Late check-ins receive reduced points.', 'earning', 2),
      ('Attendance Streaks', 'Maintain consecutive days of on-time attendance to earn streak bonuses.', 'earning', 3),
      ('Point Expiry', 'Points do not expire and can be accumulated over time.', 'general', 4),
      ('Reward Redemption', 'Points can be redeemed for available rewards. Some rewards have limited stock.', 'redemption', 5),
      ('Redemption Process', 'Once you redeem a reward, it will be reviewed by admin before approval.', 'redemption', 6)
    `
    console.log('✓ Default terms inserted')
    
    // Update rewards table with new columns
    console.log('Updating rewards table...')
    try {
      await prisma.$executeRaw`ALTER TABLE rewards ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general'`
      await prisma.$executeRaw`ALTER TABLE rewards ADD COLUMN IF NOT EXISTS image_url VARCHAR(255)`
      await prisma.$executeRaw`ALTER TABLE rewards ADD COLUMN IF NOT EXISTS stock_alert_threshold INT DEFAULT 5`
      console.log('✓ Rewards table updated')
    } catch (error) {
      console.log('Note: Some reward columns might already exist')
    }
    
    // Create reward_stock_history table
    console.log('Creating reward_stock_history table...')
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS reward_stock_history (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        reward_id VARCHAR(36) NOT NULL,
        quantity_change INT NOT NULL,
        new_quantity INT NOT NULL,
        reason VARCHAR(100),
        admin_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_reward_id (reward_id),
        INDEX idx_created_at (created_at)
      )
    `
    console.log('✓ reward_stock_history table created')
    
    // Create user_notifications table
    console.log('Creating user_notifications table...')
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        userId VARCHAR(36) NOT NULL,
        type ENUM('REWARD_ELIGIBLE', 'BADGE_EARNED', 'STREAK_BONUS', 'POINTS_EARNED', 'SYSTEM_MESSAGE') NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        points INT DEFAULT NULL,
        rewardId VARCHAR(36) DEFAULT NULL,
        rewardName VARCHAR(200) DEFAULT NULL,
        badgeName VARCHAR(200) DEFAULT NULL,
        metadata JSON DEFAULT NULL,
        isRead BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        readAt TIMESTAMP NULL,
        INDEX idx_user_id (userId),
        INDEX idx_type (type),
        INDEX idx_is_read (isRead),
        INDEX idx_created_at (createdAt)
      )
    `
    console.log('✓ user_notifications table created')
    
    // Update point_history table
    console.log('Updating point_history table...')
    try {
      await prisma.$executeRaw`ALTER TABLE point_history ADD COLUMN IF NOT EXISTS activity_code VARCHAR(50)`
      await prisma.$executeRaw`ALTER TABLE point_history ADD COLUMN IF NOT EXISTS metadata JSON`
      console.log('✓ point_history table updated')
    } catch (error) {
      console.log('Note: Some point_history columns might already exist')
    }
    
    // Verify all tables exist
    console.log('\nVerifying tables...')
    const tables = ['point_activities', 'points_terms', 'reward_stock_history', 'user_notifications']
    for (const tableName of tables) {
      try {
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${tableName}`)
        console.log(`✓ ${tableName}: ${result[0].count} records`)
      } catch (error) {
        console.log(`❌ ${tableName}: verification failed`)
      }
    }
    
    console.log('\n=== Points System Tables Created Successfully! ===')
    console.log('The admin panel should now work properly.')
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createPointsTables() 