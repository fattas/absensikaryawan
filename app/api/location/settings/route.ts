import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// Get location settings
export async function GET() {
  try {
    // Ambil setting lokasi yang aktif (asumsi hanya ada satu setting)
    const locationSetting = await prisma.locationSetting.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!locationSetting) {
      console.log("No location settings found");
      return NextResponse.json(
        { error: "Setting lokasi tidak ditemukan" },
        { status: 404 }
      )
    }

    // Log untuk debugging
    console.log("Returning location settings:", {
      id: locationSetting.id,
      latitude: locationSetting.latitude.toString(),
      longitude: locationSetting.longitude.toString(),
      radius: locationSetting.radius
    });

    return NextResponse.json({
      id: locationSetting.id,
      latitude: locationSetting.latitude,
      longitude: locationSetting.longitude,
      radius: locationSetting.radius,
    })
  } catch (error: any) {
    console.error("Error fetching location settings:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil setting lokasi" },
      { status: 500 }
    )
  }
}

// Update location settings (admin only)
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    
    // Check for both admin_token and user_token
    let adminId = null
    const adminToken = cookieStore.get('admin_token')
    const userToken = cookieStore.get('user_token')
    
    if (adminToken) {
      adminId = adminToken.value
    } else if (userToken) {
      adminId = userToken.value
    } else {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      )
    }
    const body = await req.json()
    
    // Log raw input
    console.log("Raw location settings input:", body);
    
    // Ekstrak dan konversi nilai ke tipe number dengan presisi penuh
    const latitude = parseFloat(body.latitude);
    const longitude = parseFloat(body.longitude);
    const radius = Number(body.radius);

    // Validasi input
    if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
      console.error("Data koordinat tidak valid:", { 
        body, 
        parsedLatitude: latitude, 
        parsedLongitude: longitude, 
        parsedRadius: radius 
      });
      return NextResponse.json(
        { error: "Data koordinat dan radius harus berupa angka" },
        { status: 400 }
      )
    }

    if (radius <= 0) {
      return NextResponse.json(
        { error: "Radius harus lebih besar dari 0" },
        { status: 400 }
      )
    }

    // Cek apakah user adalah admin
    console.log("Checking admin with ID:", adminId);
    
    const admin = await prisma.user.findFirst({
      where: { 
        id: adminId,
        role: 'ADMIN'
      },
      select: { 
        id: true,
        email: true,
        role: true 
      }
    })

    if (!admin) {
      console.log("Admin not found or user is not admin. Checking user details...");
      
      // Check if user exists but is not admin
      const user = await prisma.user.findUnique({
        where: { id: adminId },
        select: { 
          id: true, 
          email: true, 
          role: true 
        }
      })
      
      if (user) {
        console.log("User found but not admin:", user);
        return NextResponse.json(
          { error: "Anda tidak memiliki akses admin untuk mengubah pengaturan lokasi" },
          { status: 403 }
        )
      } else {
        console.log("User not found with ID:", adminId);
        return NextResponse.json(
          { error: "User tidak ditemukan" },
          { status: 404 }
        )
      }
    }
    
    console.log("Admin verified:", admin.email);

    // Log koordinat yang akan disimpan
    console.log("Saving location settings:", {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius
    });

    // Buat setting lokasi baru
    const locationSetting = await prisma.locationSetting.create({
      data: {
        latitude,
        longitude,
        radius,
      },
    })

    // Log hasil penyimpanan
    console.log("Saved location settings:", {
      id: locationSetting.id,
      latitude: locationSetting.latitude.toString(),
      longitude: locationSetting.longitude.toString(),
      radius: locationSetting.radius
    });

    return NextResponse.json({
      success: true,
      message: "Setting lokasi berhasil diupdate",
      data: {
        id: locationSetting.id,
        latitude: locationSetting.latitude,
        longitude: locationSetting.longitude,
        radius: locationSetting.radius,
      }
    })
  } catch (error: any) {
    console.error("Error updating location settings:", error)
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat mengupdate setting lokasi" },
      { status: 500 }
    )
  }
} 