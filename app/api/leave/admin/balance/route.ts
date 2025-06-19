import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Since Prisma types aren't available, using any for now
const db = prisma as any;

// GET: Get all employee leave balances
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const adminId = adminToken.value;
    const admin = await prisma.user.findUnique({
      where: { id: adminId, role: 'ADMIN' }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized - Not an admin' }, { status: 403 });
    }

    // Get current year from query params or use current year
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Get all users
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: { name: 'asc' }
    });

    // Get leave balances for all users
    const leaveBalances = await db.leaveBalance.findMany({
      where: { year }
    });

    // Create a map for quick lookup
    const balanceMap = new Map(leaveBalances.map((b: any) => [b.userId, b]));

    // For users without leave balance for the year, create default
    const usersWithBalances = await Promise.all(
      users.map(async (user) => {
        let balance = balanceMap.get(user.id);
        
        if (!balance) {
          // Create default leave balance
          balance = await db.leaveBalance.create({
            data: {
              userId: user.id,
              year,
              totalDays: 12,
              usedDays: 0,
              remainingDays: 12
            }
          });
        }
        
        return {
          ...user,
          leaveBalance: balance
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: usersWithBalances,
      year
    });
  } catch (error: any) {
    console.error('Error fetching leave balances:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leave balances' },
      { status: 500 }
    );
  }
}

// PUT: Update employee leave balance
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const adminId = adminToken.value;
    const admin = await prisma.user.findUnique({
      where: { id: adminId, role: 'ADMIN' }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized - Not an admin' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, year, totalDays, remainingDays } = body;

    // Validate input
    if (!userId || !year || totalDays === undefined || remainingDays === undefined) {
      return NextResponse.json(
        { error: 'User ID, year, total days, and remaining days are required' },
        { status: 400 }
      );
    }

    // Validate numbers
    if (totalDays < 0 || remainingDays < 0) {
      return NextResponse.json(
        { error: 'Total days and remaining days must be non-negative' },
        { status: 400 }
      );
    }

    if (remainingDays > totalDays) {
      return NextResponse.json(
        { error: 'Remaining days cannot exceed total days' },
        { status: 400 }
      );
    }

    // Find existing balance
    const existingBalance = await db.leaveBalance.findUnique({
      where: {
        userId_year: {
          userId,
          year: parseInt(year.toString())
        }
      }
    });

    if (!existingBalance) {
      return NextResponse.json(
        { error: 'Leave balance not found for this user and year' },
        { status: 404 }
      );
    }

    // Calculate used days
    const usedDays = totalDays - remainingDays;

    // Update the balance
    const updatedBalance = await db.leaveBalance.update({
      where: { id: existingBalance.id },
      data: {
        totalDays,
        usedDays,
        remainingDays
      }
    });

    // Get user info for response
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedBalance,
        user
      },
      message: `Leave balance updated successfully for ${user?.name}`
    });
  } catch (error: any) {
    console.error('Error updating leave balance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update leave balance' },
      { status: 400 }
    );
  }
} 