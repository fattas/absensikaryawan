import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, differenceInDays, format, getYear } from 'date-fns';

type LeaveType = 'ANNUAL_LEAVE' | 'PERMISSION' | 'SICK_LEAVE' | 'EMERGENCY';
type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface CreateLeaveRequestInput {
  userId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export interface ApproveRejectLeaveInput {
  requestId: string;
  adminId: string;
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export class LeaveService {
  // Calculate working days between two dates (excluding weekends)
  private static calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  }

  // Create or get leave balance for a user for the current year
  static async getOrCreateLeaveBalance(userId: string, year?: number): Promise<any> {
    const targetYear = year || getYear(new Date());
    
    let balance = await prisma.leaveBalance.findUnique({
      where: {
        userId_year: {
          userId,
          year: targetYear
        }
      }
    });

    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: {
          userId,
          year: targetYear,
          totalDays: 12,
          usedDays: 0,
          remainingDays: 12
        }
      });
    }

    return balance;
  }

  // Create a new leave request
  static async createLeaveRequest(input: CreateLeaveRequestInput): Promise<any> {
    const { userId, leaveType, startDate, endDate, reason } = input;

    // Validate dates
    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }

    // Calculate total days
    const totalDays = this.calculateWorkingDays(startDate, endDate);
    
    if (totalDays === 0) {
      throw new Error('Leave request must include at least one working day');
    }

    // For annual leave, check if user has enough balance
    if (leaveType === 'ANNUAL_LEAVE') {
      const year = getYear(startDate);
      const balance = await this.getOrCreateLeaveBalance(userId, year);
      
      if (balance.remainingDays < totalDays) {
        throw new Error(`Insufficient leave balance. You have ${balance.remainingDays} days remaining but requested ${totalDays} days.`);
      }
    }

    // Check for overlapping requests
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } }
            ]
          }
        ]
      }
    });

    if (overlapping) {
      throw new Error('You already have a leave request for these dates');
    }

    // Create the leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        leaveType,
        startDate: startOfDay(startDate),
        endDate: endOfDay(endDate),
        reason,
        totalDays,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return leaveRequest;
  }

  // Approve or reject a leave request
  static async approveRejectLeave(input: ApproveRejectLeaveInput): Promise<any> {
    const { requestId, adminId, status, rejectionReason } = input;

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!leaveRequest) {
      throw new Error('Leave request not found');
    }

    if (leaveRequest.status !== 'PENDING') {
      throw new Error('Only pending requests can be approved or rejected');
    }

    // Update the leave request
    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status,
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectionReason: status === 'REJECTED' ? rejectionReason : null
      }
    });

    // If approved and it's annual leave, update the leave balance
    if (status === 'APPROVED' && leaveRequest.leaveType === 'ANNUAL_LEAVE') {
      const year = getYear(leaveRequest.startDate);
      const balance = await this.getOrCreateLeaveBalance(leaveRequest.userId, year);
      
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          usedDays: balance.usedDays + leaveRequest.totalDays,
          remainingDays: balance.remainingDays - leaveRequest.totalDays
        }
      });
    }

    return updatedRequest;
  }

  // Get leave requests for a user
  static async getUserLeaveRequests(userId: string, year?: number): Promise<any[]> {
    const whereClause: any = { userId };
    
    if (year) {
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31, 23, 59, 59);
      whereClause.startDate = { gte: yearStart, lte: yearEnd };
    }

    return prisma.leaveRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  // Get all pending leave requests (for admin)
  static async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    return prisma.leaveRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  // Check if a user is on leave for a specific date
  static async isUserOnLeave(userId: string, date: Date): Promise<{ onLeave: boolean; leaveType?: LeaveType }> {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const leave = await prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: 'APPROVED',
        startDate: { lte: dayEnd },
        endDate: { gte: dayStart }
      }
    });

    return {
      onLeave: !!leave,
      leaveType: leave?.leaveType
    };
  }

  // Cancel a leave request
  static async cancelLeaveRequest(requestId: string, userId: string): Promise<LeaveRequest> {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: requestId }
    });

    if (!leaveRequest) {
      throw new Error('Leave request not found');
    }

    if (leaveRequest.userId !== userId) {
      throw new Error('You can only cancel your own leave requests');
    }

    if (leaveRequest.status !== 'PENDING') {
      throw new Error('Only pending requests can be cancelled');
    }

    return prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' }
    });
  }

  // Get leave balance for a user
  static async getUserLeaveBalance(userId: string, year?: number): Promise<LeaveBalance> {
    return this.getOrCreateLeaveBalance(userId, year);
  }

  // Get all leave requests (for admin)
  static async getAllLeaveRequests(filters?: {
    status?: LeaveStatus;
    leaveType?: LeaveType;
    startDate?: Date;
    endDate?: Date;
  }): Promise<LeaveRequest[]> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.leaveType) {
      where.leaveType = filters.leaveType;
    }
    if (filters?.startDate || filters?.endDate) {
      where.startDate = {};
      if (filters.startDate) {
        where.startDate.gte = startOfDay(filters.startDate);
      }
      if (filters.endDate) {
        where.startDate.lte = endOfDay(filters.endDate);
      }
    }

    return prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }
}

export default LeaveService; 