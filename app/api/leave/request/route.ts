import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import LeaveService from '@/lib/leave-service';
import { prisma } from '@/lib/prisma';

// POST: Create a new leave request
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_token');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.value;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { leaveType, startDate, endDate, reason } = body;

    // Validate required fields
    if (!leaveType || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Leave type, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Validate leave type
    const validLeaveTypes = ['ANNUAL_LEAVE', 'PERMISSION', 'SICK_LEAVE', 'EMERGENCY'];
    if (!validLeaveTypes.includes(leaveType)) {
      return NextResponse.json(
        { error: 'Invalid leave type' },
        { status: 400 }
      );
    }

    // Create leave request
    const leaveRequest = await LeaveService.createLeaveRequest({
      userId: user.id,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason
    });

    return NextResponse.json({
      success: true,
      data: leaveRequest
    });
  } catch (error: any) {
    console.error('Error creating leave request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create leave request' },
      { status: 400 }
    );
  }
}

// GET: Get leave requests for the current user
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_token');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.value;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : undefined;

    const leaveRequests = await LeaveService.getUserLeaveRequests(user.id, year);
    const leaveBalance = await LeaveService.getUserLeaveBalance(user.id, year);

    return NextResponse.json({
      success: true,
      data: {
        requests: leaveRequests,
        balance: leaveBalance
      }
    });
  } catch (error: any) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leave requests' },
      { status: 500 }
    );
  }
}