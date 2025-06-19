import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// GET /api/time-settings - Get current time settings
export async function GET() {
  try {
    // Get active time settings
    const timeSettings = await prisma.timeSettings.findFirst({
      where: {
        isActive: true,
      },
    });

    if (!timeSettings) {
      return NextResponse.json({ error: 'Setting waktu tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(timeSettings, { status: 200 });
  } catch (error) {
    console.error('Error fetching time settings:', error);
    return NextResponse.json({ error: 'Gagal mengambil setting waktu' }, { status: 500 });
  }
}

// PUT /api/time-settings - Update time settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');
    
    if (!token) {
      return NextResponse.json({ error: 'Tidak terautentikasi sebagai admin' }, { status: 401 });
    }

    const adminId = token.value;
    
    // Check if admin exists
    const admin = await prisma.user.findFirst({
      where: { 
        id: adminId,
        role: 'ADMIN'
      },
      select: { id: true }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const { maxClockInTime, minClockOutTime } = body;

    // Simple validation
    if (!maxClockInTime || !minClockOutTime) {
      return NextResponse.json(
        { error: 'Parameter yang diperlukan: maxClockInTime dan minClockOutTime harus diisi' },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(maxClockInTime) || !timeRegex.test(minClockOutTime)) {
      return NextResponse.json(
        { error: 'Format waktu tidak valid: Gunakan format HH:MM (24-jam)' },
        { status: 400 }
      );
    }

    // Get existing active time settings
    const existingSettings = await prisma.timeSettings.findFirst({
      where: {
        isActive: true,
      },
    });

    let updatedSettings;

    if (existingSettings) {
      // Update existing settings
      updatedSettings = await prisma.timeSettings.update({
        where: {
          id: existingSettings.id,
        },
        data: {
          maxClockInTime,
          minClockOutTime,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new settings
      updatedSettings = await prisma.timeSettings.create({
        data: {
          maxClockInTime,
          minClockOutTime,
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Setting waktu berhasil diupdate',
      data: updatedSettings
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating time settings:', error);
    return NextResponse.json({ error: 'Gagal mengupdate setting waktu' }, { status: 500 });
  }
} 