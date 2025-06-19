import { prisma } from './prisma'
import { v4 as uuidv4 } from 'uuid'

export interface PointDetails {
  userId: string
  points: number
  totalEarned: number
  currentStreak: number
  longestStreak: number
  badges: Array<{
    id: string
    name: string
    description: string
    icon: string
    level: string
    earnedAt: Date
  }>
  rank?: number
}

export interface LeaderboardEntry {
  userId: string
  userName: string
  points: number
  totalEarned: number
  currentStreak: number
  badges: number
  rank: number
}

export interface RewardItem {
  id: string
  name: string
  description: string
  pointsCost: number
  quantity: number
  isActive: boolean
}

class PointsService {
  async awardAttendancePoints(
    userId: string,
    attendanceId: string,
    type: 'CHECK_IN' | 'CHECK_OUT',
    isLate: boolean = false,
    lateMinutes: number = 0
  ): Promise<void> {
    const points = this.calculateAttendancePoints(type, isLate, lateMinutes)
    const reason = this.getPointReason(type, isLate, lateMinutes)
    
    // Get or create user points
    let userPoints = await prisma.$queryRaw<any[]>`
      SELECT * FROM user_points WHERE userId = ${userId}
    `
    
    if (!userPoints || userPoints.length === 0) {
      // Create user points record
      await prisma.$executeRaw`
        INSERT INTO user_points (id, userId, points, totalEarned, currentStreak, longestStreak)
        VALUES (${uuidv4()}, ${userId}, ${points}, ${points}, 1, 1)
      `
    } else {
      // Update existing record
      const current = userPoints[0]
      let newStreak = current.currentStreak
      
      if (type === 'CHECK_IN' && !isLate) {
        // Check if this continues the streak
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
    
    // Record in history
    await prisma.$executeRaw`
      INSERT INTO point_history (id, userId, points, reason, attendanceId)
      VALUES (${uuidv4()}, ${userId}, ${points}, ${reason}, ${attendanceId})
    `
    
    // Check and award badges
    await this.checkAndAwardBadges(userId)
  }
  
  private calculateAttendancePoints(
    type: 'CHECK_IN' | 'CHECK_OUT',
    isLate: boolean,
    lateMinutes: number
  ): number {
    if (type === 'CHECK_IN') {
      if (!isLate) {
        // On-time check-in
        const now = new Date()
        const hour = now.getHours()
        // Early bird bonus (before 6:30 AM)
        if (hour < 6 || (hour === 6 && now.getMinutes() < 30)) {
          return 15 // 10 base + 5 early bird bonus
        }
        return 10
      } else {
        // Late check-in (reduce points based on how late)
        return Math.max(5 - Math.floor(lateMinutes / 10), 1)
      }
    } else {
      // Check-out
      return 5
    }
  }
  
  private getPointReason(
    type: 'CHECK_IN' | 'CHECK_OUT',
    isLate: boolean,
    lateMinutes: number
  ): string {
    if (type === 'CHECK_IN') {
      if (!isLate) {
        const now = new Date()
        const hour = now.getHours()
        if (hour < 6 || (hour === 6 && now.getMinutes() < 30)) {
          return 'On-time check-in (Early bird bonus)'
        }
        return 'On-time check-in'
      } else {
        return `Late check-in (${lateMinutes} minutes late)`
      }
    } else {
      return 'Check-out completed'
    }
  }
  
  async checkAndAwardBadges(userId: string): Promise<void> {
    const userPoints = await prisma.$queryRaw<any[]>`
      SELECT * FROM user_points WHERE userId = ${userId}
    `
    
    if (!userPoints || userPoints.length === 0) return
    
    const user = userPoints[0]
    
    // Check point-based badges
    const pointBadges = await prisma.$queryRaw<any[]>`
      SELECT * FROM badges 
      WHERE pointsRequired > 0 
      AND pointsRequired <= ${user.totalEarned}
      AND id NOT IN (
        SELECT badgeId FROM user_badges WHERE userId = ${userId}
      )
    `
    
    // Award point badges
    for (const badge of pointBadges) {
      await prisma.$executeRaw`
        INSERT INTO user_badges (id, userId, badgeId)
        VALUES (${uuidv4()}, ${userId}, ${badge.id})
      `
    }
    
    // Check streak badges
    if (user.currentStreak >= 5) {
      // Perfect week badge
      await prisma.$executeRaw`
        INSERT IGNORE INTO user_badges (id, userId, badgeId)
        SELECT ${uuidv4()}, ${userId}, id FROM badges WHERE name = 'Perfect Week'
        AND id NOT IN (SELECT badgeId FROM user_badges WHERE userId = ${userId})
      `
    }
    
    // Check perfect month (20+ days of on-time attendance in last 30 days)
    const perfectDays = await prisma.$queryRaw<any[]>`
      SELECT COUNT(DISTINCT DATE(timestamp)) as count
      FROM attendances 
      WHERE userId = ${userId}
      AND type = 'CHECK_IN' 
      AND isLate = false
      AND timestamp >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `
    
    if (perfectDays[0]?.count >= 20) {
      await prisma.$executeRaw`
        INSERT IGNORE INTO user_badges (id, userId, badgeId)
        SELECT ${uuidv4()}, ${userId}, id FROM badges WHERE name = 'Perfect Month'
        AND id NOT IN (SELECT badgeId FROM user_badges WHERE userId = ${userId})
      `
    }
  }
  
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
  
  async getLeaderboard(
    limit: number = 10,
    offset: number = 0,
    period: string = 'all-time'
  ): Promise<LeaderboardEntry[]> {
    let dateCondition = ''
    let pointsColumn = 'up.points'
    
    switch (period) {
      case 'daily':
        dateCondition = 'AND DATE(up.lastUpdated) = CURDATE()'
        break
      case 'weekly':
        dateCondition = 'AND up.lastUpdated >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
        break
      case 'monthly':
        dateCondition = 'AND up.lastUpdated >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'
        break
      case 'all-time':
      default:
        // No date condition for all-time
        break
    }
    
    const leaderboard = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        up.userId,
        u.name as userName,
        up.points,
        up.totalEarned,
        up.currentStreak,
        COUNT(DISTINCT ub.badgeId) as badges
      FROM user_points up
      JOIN users u ON up.userId = u.id
      LEFT JOIN user_badges ub ON up.userId = ub.userId
      WHERE 1=1 ${dateCondition}
      GROUP BY up.userId, u.name, up.points, up.totalEarned, up.currentStreak
      ORDER BY up.points DESC, up.totalEarned DESC
      LIMIT ${limit} OFFSET ${offset}
    `)
    
    return leaderboard.map((entry, index) => ({
      ...entry,
      badges: Number(entry.badges),
      rank: offset + index + 1
    }))
  }
  
  async getAvailableRewards(): Promise<RewardItem[]> {
    const rewards = await prisma.$queryRaw<any[]>`
      SELECT * FROM rewards 
      WHERE isActive = true 
      AND (quantity > 0 OR quantity = -1)
      ORDER BY pointsCost ASC
    `
    
    return rewards
  }
  
  async redeemReward(
    userId: string,
    rewardId: string
  ): Promise<{ success: boolean; message: string }> {
    // Check user points
    const userPoints = await prisma.$queryRaw<any[]>`
      SELECT * FROM user_points WHERE userId = ${userId}
    `
    
    if (!userPoints || userPoints.length === 0) {
      return { success: false, message: 'User points not found' }
    }
    
    // Check reward
    const rewards = await prisma.$queryRaw<any[]>`
      SELECT * FROM rewards WHERE id = ${rewardId} AND isActive = true
    `
    
    if (!rewards || rewards.length === 0) {
      return { success: false, message: 'Reward not found or inactive' }
    }
    
    const reward = rewards[0]
    const user = userPoints[0]
    
    if (user.points < reward.pointsCost) {
      return { success: false, message: 'Insufficient points' }
    }
    
    if (reward.quantity === 0) {
      return { success: false, message: 'Reward out of stock' }
    }
    
    // Deduct points
    await prisma.$executeRaw`
      UPDATE user_points 
      SET points = points - ${reward.pointsCost}
      WHERE userId = ${userId}
    `
    
    // Reduce reward quantity if not unlimited
    if (reward.quantity > 0) {
      await prisma.$executeRaw`
        UPDATE rewards 
        SET quantity = quantity - 1
        WHERE id = ${rewardId}
      `
    }
    
    // Create redemption record
    await prisma.$executeRaw`
      INSERT INTO reward_redemptions (id, userId, rewardId, pointsSpent, status)
      VALUES (${uuidv4()}, ${userId}, ${rewardId}, ${reward.pointsCost}, 'PENDING')
    `
    
    return { success: true, message: 'Reward redeemed successfully' }
  }
  
  async getUserRedemptions(userId: string) {
    const redemptions = await prisma.$queryRaw`
      SELECT 
        rr.*,
        r.name as rewardName,
        r.description as rewardDescription
      FROM reward_redemptions rr
      JOIN rewards r ON rr.rewardId = r.id
      WHERE rr.userId = ${userId}
      ORDER BY rr.redeemedAt DESC
    `
    
    return redemptions
  }
  
  async getPointHistory(userId: string, limit: number = 20) {
    const history = await prisma.$queryRaw`
      SELECT * FROM point_history 
      WHERE userId = ${userId}
      ORDER BY date DESC
      LIMIT ${limit}
    `
    
    return history
  }
  
  // Admin functions
  async adjustUserPoints(
    userId: string,
    points: number,
    reason: string
  ): Promise<void> {
    await prisma.$executeRaw`
      UPDATE user_points 
      SET points = points + ${points},
          totalEarned = CASE WHEN ${points} > 0 THEN totalEarned + ${points} ELSE totalEarned END
      WHERE userId = ${userId}
    `
    
    await prisma.$executeRaw`
      INSERT INTO point_history (id, userId, points, reason)
      VALUES (${uuidv4()}, ${userId}, ${points}, ${reason})
    `
  }
  
  async processRedemption(
    redemptionId: string,
    status: 'APPROVED' | 'DELIVERED' | 'REJECTED',
    notes?: string
  ): Promise<void> {
    await prisma.$executeRaw`
      UPDATE reward_redemptions 
      SET status = ${status},
          processedAt = NOW(),
          notes = ${notes || null}
      WHERE id = ${redemptionId}
    `
    
    // If rejected, refund points
    if (status === 'REJECTED') {
      const redemption = await prisma.$queryRaw<any[]>`
        SELECT * FROM reward_redemptions WHERE id = ${redemptionId}
      `
      
      if (redemption && redemption.length > 0) {
        await prisma.$executeRaw`
          UPDATE user_points 
          SET points = points + ${redemption[0].pointsSpent}
          WHERE userId = ${redemption[0].userId}
        `
        
        await prisma.$executeRaw`
          INSERT INTO point_history (id, userId, points, reason)
          VALUES (${uuidv4()}, ${redemption[0].userId}, ${redemption[0].pointsSpent}, 'Refund: Redemption rejected')
        `
      }
    }
  }
  
  async getAllRedemptions(status?: string) {
    let query = `
      SELECT 
        rr.*,
        r.name as rewardName,
        r.description as rewardDescription,
        u.name as userName,
        u.email as userEmail
      FROM reward_redemptions rr
      JOIN rewards r ON rr.rewardId = r.id
      JOIN users u ON rr.userId = u.id
    `
    
    if (status) {
      query += ` WHERE rr.status = ${status}`
    }
    
    query += ` ORDER BY rr.redeemedAt DESC`
    
    const redemptions = await prisma.$queryRawUnsafe(query)
    return redemptions
  }
}

export const pointsService = new PointsService() 