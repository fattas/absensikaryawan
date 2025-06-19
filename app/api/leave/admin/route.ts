import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import LeaveService from '@/lib/leave-service';
import { prisma } from '@/lib/prisma';

// GET: Get all leave requests (admin only)
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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as any;
    const leaveType = searchParams.get('leaveType') as any;
    const pending = searchParams.get('pending') === 'true';

    let leaveRequests;
    if (pending) {
      leaveRequests = await LeaveService.getPendingLeaveRequests();
    } else {
      leaveRequests = await LeaveService.getAllLeaveRequests({
        status,
        leaveType
      });
    }

    return NextResponse.json({
      success: true,
      data: leaveRequests
    });
  } catch (error: any) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leave requests' },
      { status: 500 }
    );
  }
}

// PUT: Approve or reject leave request
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
    const { requestId, status, rejectionReason } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Request ID and status are required' },
        { status: 400 }
      );
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    const updatedRequest = await LeaveService.approveRejectLeave({
      requestId,
      adminId,
      status,
      rejectionReason
    });

    return NextResponse.json({
      success: true,
      data: updatedRequest
    });
  } catch (error: any) {
    console.error('Error updating leave request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update leave request' },
      { status: 400 }
    );
  }
} 