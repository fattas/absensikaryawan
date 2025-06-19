import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { isLocationValid } from '@/lib/location-service'
import { pointsService } from '@/lib/points-service'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('user_token')
    if (!token) {
      return NextResponse.json(
        { error: "Tidak terautentikasi. Silakan login terlebih dahulu." },
        { status: 401 }
      )
    }

    const userId = token.value
    const { location, faceMatchScore, faceSnapshot, isSuccessful } = await req.json()

    // Log input data
    console.log("Attendance record request:", {
      userId,
      location: location ? {
        lat: location.lat.toString(),
        lng: location.lng.toString()
      } : null,
      isSuccessful
    });

    // Validasi input
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      console.error("Invalid location data:", location);
      return NextResponse.json(
        { error: "Data lokasi tidak valid" },
        { status: 400 }
      )
    }

    if (typeof isSuccessful !== 'boolean') {
      return NextResponse.json(
        { error: "Status absensi tidak valid" },
        { status: 400 }
      )
    }

    // Cek apakah user ada
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      )
    }
    
    // Verifikasi validitas lokasi
    const { valid: locationValid, distance } = await isLocationValid(location.lat, location.lng);
    
    // Log untuk debugging
    console.log(`Server-side location validation for user ${user.name}:`, {
      userId,
      location: {
        lat: location.lat.toString(),
        lng: location.lng.toString()
      },
      locationValid,
      distance,
      isSuccessful,
      clientSuccessful: isSuccessful
    });

    // Tentukan tipe absensi berdasarkan record terakhir
    const latestAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)) // Hari ini
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // Jika belum ada record hari ini atau record terakhir adalah CHECK_OUT, maka CHECK_IN
    const attendanceType = !latestAttendance || latestAttendance.type === 'CHECK_OUT' 
      ? 'CHECK_IN' 
      : 'CHECK_OUT'

    // Ambil pengaturan waktu
    const timeSettings = await prisma.timeSettings.findFirst({
      where: { isActive: true }
    });

    if (!timeSettings) {
      return NextResponse.json(
        { error: "Pengaturan waktu absensi belum dikonfigurasi" },
        { status: 400 }
      );
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Validasi waktu check-in dan check-out
    if (attendanceType === 'CHECK_IN') {
      // Periksa keterlambatan
      const [maxHour, maxMinute] = timeSettings.maxClockInTime.split(':').map(Number);
      const isLate = 
        (currentHour > maxHour) || 
        (currentHour === maxHour && currentMinute > maxMinute);
      
      // Hitung keterlambatan dalam menit
      let lateMinutes = 0;
      let lateMessage = "";
      if (isLate) {
        // Hitung keterlambatan total dalam menit
        lateMinutes = (currentHour - maxHour) * 60 + (currentMinute - maxMinute);
        if (lateMinutes < 0) lateMinutes = 0;
        
        // Format pesan keterlambatan
        const lateHours = Math.floor(lateMinutes / 60);
        const remainingMinutes = lateMinutes % 60;
        
        if (lateHours > 0 && remainingMinutes > 0) {
          lateMessage = `Terlambat ${lateHours} jam ${remainingMinutes} menit`;
        } else if (lateHours > 0) {
          lateMessage = `Terlambat ${lateHours} jam`;
        } else {
          lateMessage = `Terlambat ${remainingMinutes} menit`;
        }
      }

      // Resolve lokasi nama dari koordinat
      let locationName = "Lokasi tidak diketahui"
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=14&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "id",
              "User-Agent": "AttendanceApp/1.0",
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          const address = data.address
          let formattedLocation = ""

          if (address.city || address.town || address.village) {
            formattedLocation += address.city || address.town || address.village
          }

          if (address.state || address.province) {
            if (formattedLocation) formattedLocation += ", "
            formattedLocation += address.state || address.province
          }

          if (address.country) {
            if (formattedLocation) formattedLocation += ", "
            formattedLocation += address.country
          }

          locationName = formattedLocation || "Lokasi tidak diketahui"
        }
      } catch (error) {
        console.error("Error resolving location name:", error)
      }

      // Simpan record absensi dengan informasi validitas lokasi dan keterlambatan
      const attendance = await prisma.attendance.create({
        data: {
          userId,
          type: attendanceType,
          latitude: location.lat,
          longitude: location.lng,
          location: locationName,
          isLocationValid: locationValid,
          locationDistance: distance,
          isLate: isLate,
          lateMinutes: lateMinutes
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      // Log hasil absensi
      console.log(`Attendance recorded for user ${user.name}:`, {
        id: attendance.id,
        type: attendance.type,
        timestamp: attendance.timestamp,
        location: locationName,
        locationValid,
        distance,
        isLate,
        lateMinutes,
        lateMessage,
        isSuccessful: isSuccessful && locationValid
      });

      // Award points for check-in
      if (isSuccessful && locationValid) {
        try {
          await pointsService.awardAttendancePoints(
            userId,
            attendance.id,
            'CHECK_IN',
            isLate,
            lateMinutes
          );
        } catch (error) {
          console.error("Error awarding points:", error);
        }
      }

      return NextResponse.json({
        success: true,
        attendance: {
          id: attendance.id,
          type: attendance.type,
          timestamp: attendance.timestamp,
          location: attendance.location,
          locationValid,
          distance,
          isLate,
          lateMinutes,
          lateMessage,
          isSuccessful: isSuccessful && locationValid,
        }
      })
    } else if (attendanceType === 'CHECK_OUT') {
      // Validasi waktu checkout minimum
      const [minHour, minMinute] = timeSettings.minClockOutTime.split(':').map(Number);
      const isTooEarly = 
        (currentHour < minHour) || 
        (currentHour === minHour && currentMinute < minMinute);

      if (isTooEarly) {
        return NextResponse.json(
          { 
            error: `Anda belum dapat melakukan absen pulang sebelum pukul ${timeSettings.minClockOutTime}` 
          },
          { status: 403 }
        );
      }

      // Resolve lokasi nama dari koordinat
      let locationName = "Lokasi tidak diketahui"
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=14&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "id",
              "User-Agent": "AttendanceApp/1.0",
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          const address = data.address
          let formattedLocation = ""

          if (address.city || address.town || address.village) {
            formattedLocation += address.city || address.town || address.village
          }

          if (address.state || address.province) {
            if (formattedLocation) formattedLocation += ", "
            formattedLocation += address.state || address.province
          }

          if (address.country) {
            if (formattedLocation) formattedLocation += ", "
            formattedLocation += address.country
          }

          locationName = formattedLocation || "Lokasi tidak diketahui"
        }
      } catch (error) {
        console.error("Error resolving location name:", error)
      }

      // Simpan record absensi dengan informasi validitas lokasi
      const attendance = await prisma.attendance.create({
        data: {
          userId,
          type: attendanceType,
          latitude: location.lat,
          longitude: location.lng,
          location: locationName,
          isLocationValid: locationValid,
          locationDistance: distance
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      // Log hasil absensi
      console.log(`Attendance recorded for user ${user.name}:`, {
        id: attendance.id,
        type: attendance.type,
        timestamp: attendance.timestamp,
        location: locationName,
        locationValid,
        distance,
        isSuccessful: isSuccessful && locationValid
      });

      // Award points for check-out
      if (isSuccessful && locationValid) {
        try {
          await pointsService.awardAttendancePoints(
            userId,
            attendance.id,
            'CHECK_OUT',
            false,
            0
          );
        } catch (error) {
          console.error("Error awarding points:", error);
        }
      }

      return NextResponse.json({
        success: true,
        attendance: {
          id: attendance.id,
          type: attendance.type,
          timestamp: attendance.timestamp,
          location: attendance.location,
          locationValid,
          distance,
          isSuccessful: isSuccessful && locationValid,
        }
      })
    }
  } catch (error: any) {
    console.error("Error recording attendance:", error)
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat mencatat absensi. Silakan coba lagi." },
      { status: 500 }
    )
  }
} 