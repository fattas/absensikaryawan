import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import LeaveService from '@/lib/leave-service';
import { prisma } from '@/lib/prisma';

// DELETE: Cancel a leave request
export async function DELETE(request: NextRequest) {
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
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const cancelledRequest = await LeaveService.cancelLeaveRequest(requestId, userId);

    return NextResponse.json({
      success: true,
      data: cancelledRequest
    });
  } catch (error: any) {
    console.error('Error cancelling leave request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel leave request' },
      { status: 400 }
    );
  }
} 