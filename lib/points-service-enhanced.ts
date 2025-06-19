import { prisma } from './prisma'
import { v4 as uuidv4 } from 'uuid'
import { PointDetails, LeaderboardEntry, RewardItem } from './points-service'

export interface PointActivity {
  id: string
  activityCode: string
  activityName: string
  description?: string
  basePoints: number
  isActive: boolean
}

export interface PointTerms {
  id: string
  title: string
  content: string
  category: 'earning' | 'redemption' | 'general'
  displayOrder: number
  isActive: boolean
}

export interface DetailedPointHistory {
  id: string
  userId: string
  points: number
  reason: string
  activityCode?: string
  metadata?: any
  date: Date
  attendanceId?: string
}

export interface UserPointsDetail extends PointDetails {
  history: DetailedPointHistory[]
  nextReward?: {
    reward: RewardItem
    pointsNeeded: number
    progress: number
  }
}

export interface EnhancedRewardItem extends RewardItem {
  category?: string
  imageUrl?: string
  stockAlertThreshold?: number
  maxPerUser?: number
  userRedemptionCount?: number
}

class EnhancedPointsService {
  // Admin Configuration Methods
  async getPointActivities(): Promise<PointActivity[]> {
    const activities = await prisma.$queryRaw<any[]>`
      SELECT * FROM point_activities ORDER BY activity_name
    `
    return activities.map(activity => ({
      id: activity.id,
      activityCode: activity.activity_code,
      activityName: activity.activity_name,
      description: activity.description,
      basePoints: Number(activity.base_points),
      isActive: Boolean(activity.is_active)
    }))
  }

  async updatePointActivity(
    activityCode: string,
    basePoints: number,
    isActive: boolean
  ): Promise<void> {
    await prisma.$executeRaw`
      UPDATE point_activities 
      SET base_points = ${basePoints}, 
          is_active = ${isActive},
          updated_at = NOW()
      WHERE activity_code = ${activityCode}
    `
  }

  async getPointsTerms(category?: string): Promise<PointTerms[]> {
    let query = `SELECT * FROM points_terms WHERE is_active = true`
    if (category) {
      query += ` AND category = '${category}'`
    }
    query += ` ORDER BY display_order, created_at`
    
    const terms = await prisma.$queryRawUnsafe<any[]>(query)
    return terms
  }

  async updatePointsTerms(terms: Partial<PointTerms>): Promise<void> {
    const id = terms.id || uuidv4()
    
    if (terms.id) {
      await prisma.$executeRaw`
        UPDATE points_terms 
        SET title = ${terms.title},
            content = ${terms.content},
            category = ${terms.category},
            display_order = ${terms.displayOrder},
            updated_at = NOW()
        WHERE id = ${terms.id}
      `
    } else {
      await prisma.$executeRaw`
        INSERT INTO points_terms (id, title, content, category, display_order)
        VALUES (${id}, ${terms.title}, ${terms.content}, ${terms.category}, ${terms.displayOrder || 0})
      `
    }
  }

  // Enhanced award points with activity configuration
  async awardAttendancePointsEnhanced(
    userId: string,
    attendanceId: string,
    type: 'CHECK_IN' | 'CHECK_OUT',
    isLate: boolean = false,
    lateMinutes: number = 0
  ): Promise<void> {
    // Get activity configuration
    let activityCode: string
    const metadata: any = {}
    
    if (type === 'CHECK_IN') {
      const now = new Date()
      const hour = now.getHours()
      const isEarlyBird = hour < 6 || (hour === 6 && now.getMinutes() < 30)
      
      if (!isLate) {
        activityCode = isEarlyBird ? 'CHECK_IN_EARLY_BIRD' : 'CHECK_IN_ON_TIME'
        metadata.checkInTime = now.toISOString()
        
        // Award early bird bonus separately
        if (isEarlyBird) {
          const earlyBirdActivity = await prisma.$queryRaw<any[]>`
            SELECT * FROM point_activities WHERE activity_code = 'CHECK_IN_EARLY_BIRD' AND is_active = true
          `
          if (earlyBirdActivity.length > 0) {
            await this.recordPoints(
              userId,
              earlyBirdActivity[0].base_points,
              'Early bird bonus',
              'CHECK_IN_EARLY_BIRD',
              attendanceId,
              { bonusType: 'early_bird' }
            )
          }
          
          // Still award regular on-time points
          activityCode = 'CHECK_IN_ON_TIME'
        }
      } else {
        activityCode = 'CHECK_IN_LATE'
        metadata.lateMinutes = lateMinutes
      }
    } else {
      activityCode = 'CHECK_OUT'
      metadata.checkOutTime = new Date().toISOString()
    }
    
    // Get configured points for activity
    const activity = await prisma.$queryRaw<any[]>`
      SELECT * FROM point_activities WHERE activity_code = ${activityCode} AND is_active = true
    `
    
    if (activity.length === 0) {
      console.warn(`No active point activity found for code: ${activityCode}`)
      return
    }
    
    let points = activity[0].base_points
    
    // Apply late penalty if applicable
    if (activityCode === 'CHECK_IN_LATE' && lateMinutes > 0) {
      points = Math.max(points - Math.floor(lateMinutes / 10), 1)
      metadata.adjustedPoints = points
    }
    
    await this.recordPoints(userId, points, activity[0].activity_name, activityCode, attendanceId, metadata)
    
    // Check for streak bonuses
    await this.checkStreakBonuses(userId)
  }

  private async recordPoints(
    userId: string,
    points: number,
    reason: string,
    activityCode: string,
    attendanceId?: string,
    metadata?: any
  ): Promise<void> {
    // Get or create user points
    let userPoints = await prisma.$queryRaw<any[]>`
      SELECT * FROM user_points WHERE userId = ${userId}
    `
    
    if (!userPoints || userPoints.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO user_points (id, userId, points, totalEarned, currentStreak, longestStreak)
        VALUES (${uuidv4()}, ${userId}, ${points}, ${points}, 1, 1)
      `
    } else {
      // Update streak if it's a check-in
      const current = userPoints[0]
      let newStreak = current.currentStreak
      
      if (activityCode.includes('CHECK_IN') && !activityCode.includes('LATE')) {
        const lastUpdate = new Date(current.lastUpdated)
        const today = new Date()
        const diffDays = Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 1) {
          newStreak = current.currentStreak + 1
        } else if (diffDays > 1) {
          newStreak = 1
        }
      }
      
      const newLongestStreak = Math.max(current.longestStreak, newStreak)
      
      await prisma.$executeRaw`
        UPDATE user_points 
        SET points = points + ${points},
            totalEarned = totalEarned + ${points},
            currentStreak = ${newStreak},
            longestStreak = ${newLongestStreak},
            lastUpdated = NOW()
        WHERE userId = ${userId}
      `
    }
    
    // Record in history with enhanced data
    await prisma.$executeRaw`
      INSERT INTO point_history (id, userId, points, reason, activity_code, attendanceId, metadata)
      VALUES (${uuidv4()}, ${userId}, ${points}, ${reason}, ${activityCode}, ${attendanceId || null}, ${JSON.stringify(metadata || {})})
    `
  }

  private async checkStreakBonuses(userId: string): Promise<void> {
    const userPoints = await prisma.$queryRaw<any[]>`
      SELECT * FROM user_points WHERE userId = ${userId}
    `
    
    if (!userPoints || userPoints.length === 0) return
    
    const user = userPoints[0]
    
    // Check for perfect week (5 days streak)
    if (user.currentStreak === 5) {
      const weekActivity = await prisma.$queryRaw<any[]>`
        SELECT * FROM point_activities WHERE activity_code = 'PERFECT_WEEK' AND is_active = true
      `
      if (weekActivity.length > 0) {
        await this.recordPoints(
          userId,
          weekActivity[0].base_points,
          weekActivity[0].activity_name,
          'PERFECT_WEEK',
          undefined,
          { streakDays: 5 }
        )
      }
    }
    
    // Check for perfect month (20+ days in last 30)
    const perfectDays = await prisma.$queryRaw<any[]>`
      SELECT COUNT(DISTINCT DATE(timestamp)) as count
      FROM attendances 
      WHERE userId = ${userId}
      AND type = 'CHECK_IN' 
      AND isLate = false
      AND timestamp >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `
    
    if (perfectDays[0]?.count >= 20) {
      // Check if already awarded this month
      const existingBonus = await prisma.$queryRaw<any[]>`
        SELECT * FROM point_history 
        WHERE userId = ${userId}
        AND activity_code = 'PERFECT_MONTH'
        AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      `
      
      if (existingBonus.length === 0) {
        const monthActivity = await prisma.$queryRaw<any[]>`
          SELECT * FROM point_activities WHERE activity_code = 'PERFECT_MONTH' AND is_active = true
        `
        if (monthActivity.length > 0) {
          await this.recordPoints(
            userId,
            monthActivity[0].base_points,
            monthActivity[0].activity_name,
            'PERFECT_MONTH',
            undefined,
            { perfectDays: perfectDays[0].count }
          )
        }
      }
    }
  }

  // Get user points from original service
  async getUserPoints(userId: string): Promise<PointDetails | null> {
    const userPoints = await prisma.$queryRaw<any[]>`
      SELECT * FROM user_points WHERE userId = ${userId}
    `
    
    if (!userPoints || userPoints.length === 0) {
      return null
    }
    
    const badges = await prisma.$queryRaw<any[]>`
      SELECT b.*, ub.earnedAt
      FROM user_badges ub
      JOIN badges b ON ub.badgeId = b.id
      WHERE ub.userId = ${userId}
      ORDER BY ub.earnedAt DESC
    `
    
    return {
      userId: userPoints[0].userId,
      points: userPoints[0].points,
      totalEarned: userPoints[0].totalEarned,
      currentStreak: userPoints[0].currentStreak,
      longestStreak: userPoints[0].longestStreak,
      badges: badges.map(b => ({
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        level: b.level,
        earnedAt: b.earnedAt
      }))
    }
  }

  // Enhanced user points with detailed history
  async getUserPointsDetailed(userId: string): Promise<UserPointsDetail | null> {
    const basicPoints = await this.getUserPoints(userId)
    if (!basicPoints) return null
    
    // Get detailed history
    const history = await prisma.$queryRaw<any[]>`
      SELECT ph.*, pa.activity_name as activityName, pa.description as activityDescription
      FROM point_history ph
      LEFT JOIN point_activities pa ON ph.activity_code = pa.activity_code
      WHERE ph.userId = ${userId}
      ORDER BY ph.date DESC
      LIMIT 50
    `
    
    // Get next achievable reward
    const availableRewards = await this.getAvailableRewardsEnhanced(userId)
    const nextReward = availableRewards
      .filter(r => r.pointsCost > basicPoints.points)
      .sort((a, b) => a.pointsCost - b.pointsCost)[0]
    
    const result: UserPointsDetail = {
      ...basicPoints,
      history: history.map(h => ({
        id: h.id,
        userId: h.userId,
        points: h.points,
        reason: h.activityName || h.reason,
        activityCode: h.activity_code,
        metadata: h.metadata ? JSON.parse(h.metadata) : undefined,
        date: h.date,
        attendanceId: h.attendanceId
      }))
    }
    
    if (nextReward) {
      result.nextReward = {
        reward: nextReward,
        pointsNeeded: nextReward.pointsCost - basicPoints.points,
        progress: (basicPoints.points / nextReward.pointsCost) * 100
      }
    }
    
    return result
  }

  // Enhanced rewards with user-specific data
  async getAvailableRewardsEnhanced(userId?: string): Promise<EnhancedRewardItem[]> {
    const rewards = await prisma.$queryRaw<any[]>`
      SELECT * FROM rewards 
      WHERE isActive = true 
      AND (quantity > 0 OR quantity = -1)
      ORDER BY pointsCost ASC
    `
    
    const formattedRewards = rewards.map(reward => ({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      pointsCost: Number(reward.pointsCost),
      quantity: Number(reward.quantity),
      isActive: Boolean(reward.isActive),
      createdAt: reward.createdAt,
      updatedAt: reward.updatedAt,
      category: reward.category,
      imageUrl: reward.image_url,
      stockAlertThreshold: Number(reward.stock_alert_threshold || 5),
      maxPerUser: Number(reward.max_per_user || -1)
    }))
    
    if (userId) {
      // Get user redemption counts
      const redemptionCounts = await prisma.$queryRaw<any[]>`
        SELECT rewardId, COUNT(*) as count
        FROM reward_redemptions
        WHERE userId = ${userId}
        GROUP BY rewardId
      `
      
      const countsMap = new Map(redemptionCounts.map(r => [r.rewardId, Number(r.count)]))
      
      return formattedRewards.map(r => ({
        ...r,
        userRedemptionCount: countsMap.get(r.id) || 0
      }))
    }
    
    return formattedRewards
  }

  // Reward management for admins
  async createOrUpdateReward(reward: Partial<EnhancedRewardItem>): Promise<void> {
    const id = reward.id || uuidv4()
    
    if (reward.id) {
      await prisma.$executeRaw`
        UPDATE rewards 
        SET name = ${reward.name},
            description = ${reward.description},
            pointsCost = ${reward.pointsCost},
            quantity = ${reward.quantity},
            category = ${reward.category || 'general'},
            image_url = ${reward.imageUrl || null},
            stock_alert_threshold = ${reward.stockAlertThreshold || 5},
            max_per_user = ${reward.maxPerUser || -1},
            isActive = ${reward.isActive},
            updatedAt = NOW()
        WHERE id = ${reward.id}
      `
    } else {
      await prisma.$executeRaw`
        INSERT INTO rewards (
          id, name, description, pointsCost, quantity, 
          category, image_url, stock_alert_threshold, max_per_user, isActive
        )
        VALUES (
          ${id}, ${reward.name}, ${reward.description}, ${reward.pointsCost}, 
          ${reward.quantity}, ${reward.category || 'general'}, 
          ${reward.imageUrl || null}, ${reward.stockAlertThreshold || 5}, 
          ${reward.maxPerUser || -1}, ${reward.isActive !== false}
        )
      `
    }
    
    // Log stock change if quantity changed
    if (reward.quantity !== undefined) {
      await prisma.$executeRaw`
        INSERT INTO reward_stock_history (id, reward_id, quantity_change, new_quantity, reason)
        VALUES (${uuidv4()}, ${id}, ${reward.quantity}, ${reward.quantity}, 'Admin update')
      `
    }
  }

  async adjustRewardStock(
    rewardId: string,
    quantityChange: number,
    reason: string,
    adminId?: string
  ): Promise<void> {
    const currentReward = await prisma.$queryRaw<any[]>`
      SELECT * FROM rewards WHERE id = ${rewardId}
    `
    
    if (currentReward.length === 0) {
      throw new Error('Reward not found')
    }
    
    const newQuantity = currentReward[0].quantity + quantityChange
    
    await prisma.$executeRaw`
      UPDATE rewards 
      SET quantity = ${newQuantity}
      WHERE id = ${rewardId}
    `
    
    await prisma.$executeRaw`
      INSERT INTO reward_stock_history (
        id, reward_id, quantity_change, new_quantity, reason, admin_id
      )
      VALUES (
        ${uuidv4()}, ${rewardId}, ${quantityChange}, ${newQuantity}, ${reason}, ${adminId || null}
      )
    `
  }

  // Get redemptions with enhanced filtering
  async getRedemptions(filters: {
    status?: string
    userId?: string
    rewardId?: string
    dateFrom?: Date
    dateTo?: Date
  }) {
    let query = `
      SELECT 
        rr.*,
        r.name as rewardName,
        r.description as rewardDescription,
        r.category as rewardCategory,
        u.name as userName,
        u.email as userEmail
      FROM reward_redemptions rr
      JOIN rewards r ON rr.rewardId = r.id
      JOIN users u ON rr.userId = u.id
      WHERE 1=1
    `
    
    if (filters.status) {
      query += ` AND rr.status = '${filters.status}'`
    }
    if (filters.userId) {
      query += ` AND rr.userId = '${filters.userId}'`
    }
    if (filters.rewardId) {
      query += ` AND rr.rewardId = '${filters.rewardId}'`
    }
    if (filters.dateFrom) {
      query += ` AND rr.redeemedAt >= '${filters.dateFrom.toISOString()}'`
    }
    if (filters.dateTo) {
      query += ` AND rr.redeemedAt <= '${filters.dateTo.toISOString()}'`
    }
    
    query += ` ORDER BY rr.redeemedAt DESC`
    
    const redemptions = await prisma.$queryRawUnsafe(query)
    return redemptions
  }

  // Analytics for admin dashboard
  async getPointsAnalytics() {
    try {
      const totalUsers = await prisma.$queryRaw<any[]>`
        SELECT COUNT(DISTINCT userId) as count FROM user_points
      `
      
      const totalPointsDistributed = await prisma.$queryRaw<any[]>`
        SELECT COALESCE(SUM(totalEarned), 0) as total FROM user_points
      `
      
      const activeUsers = await prisma.$queryRaw<any[]>`
        SELECT COUNT(DISTINCT userId) as count 
        FROM point_history 
        WHERE date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `
      
      // Simplified top activities query to avoid collation issues
      const topActivities = await prisma.$queryRaw<any[]>`
        SELECT 
          COALESCE(activity_code, 'Unknown') as activity_name,
          COUNT(*) as count,
          SUM(points) as totalPoints
        FROM point_history
        WHERE date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND activity_code IS NOT NULL
        GROUP BY activity_code
        ORDER BY totalPoints DESC
        LIMIT 5
      `
      
      // Check if reward_redemptions table exists before querying
      let redemptionStats = []
      try {
        redemptionStats = await prisma.$queryRaw<any[]>`
          SELECT 
            'completed' as status,
            COUNT(*) as count,
            COALESCE(SUM(pointsSpent), 0) as totalPoints
          FROM reward_redemptions
          WHERE redeemedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `
      } catch (error) {
        // If table doesn't exist, return empty stats
        redemptionStats = [{ status: 'completed', count: 0, totalPoints: 0 }]
      }
      
      return {
        totalUsers: Number(totalUsers[0]?.count || 0),
        totalPointsDistributed: Number(totalPointsDistributed[0]?.total || 0),
        activeUsers: Number(activeUsers[0]?.count || 0),
        topActivities: (topActivities || []).map(activity => ({
          ...activity,
          count: Number(activity.count),
          totalPoints: Number(activity.totalPoints)
        })),
        redemptionStats: (redemptionStats || []).map(stat => ({
          ...stat,
          count: Number(stat.count),
          totalPoints: Number(stat.totalPoints)
        }))
      }
    } catch (error) {
      console.error('Error in getPointsAnalytics:', error)
      // Return default analytics if there's an error
      return {
        totalUsers: 0,
        totalPointsDistributed: 0,
        activeUsers: 0,
        topActivities: [],
        redemptionStats: []
      }
    }
  }
}

// Export both services for backward compatibility
export { pointsService } from './points-service'
export const enhancedPointsService = new EnhancedPointsService() 