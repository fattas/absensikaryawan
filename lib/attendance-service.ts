import { getCookie } from './cookie-utils'

interface CreateAttendanceData {
  userId: string
  type: 'CHECK_IN' | 'CHECK_OUT'
  latitude: number
  longitude: number
  location?: string
}

interface RecordAttendanceData {
  location: {
    lat: number
    lng: number
  }
  faceMatchScore?: number
  faceSnapshot?: string
  isSuccessful: boolean
}

// Record attendance with API call
export async function recordAttendance(data: RecordAttendanceData): Promise<{success: boolean; message?: string; error?: string; attendance?: any}> {
  try {
    const response = await fetch('/api/attendance/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Gagal mencatat absensi")
    }

    return {
      success: true,
      ...result
    }
  } catch (error: any) {
    console.error("Error recording attendance:", error)
    return {
      success: false,
      error: error.message || "Gagal mencatat absensi"
    }
  }
}

// Get user's attendance history
export async function getUserAttendance(userId?: string) {
  const url = userId ? `/api/attendance/user/${userId}` : '/api/attendance/user'
  
  const response = await fetch(url)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Gagal mengambil riwayat absensi")
  }

  return result
}

// Get all attendance records (admin only)
export async function getAllAttendance(page = 1, limit = 10) {
  const response = await fetch(`/api/attendance/admin/all?page=${page}&limit=${limit}`)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Gagal mengambil data absensi")
  }

  return result
}

// Get attendance records by date range
export async function getAttendanceByDateRange(startDate: Date, endDate: Date) {
  const response = await fetch('/api/attendance/range', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Gagal mengambil data absensi berdasarkan tanggal")
  }

  return result
}

// Get latest attendance for a user
export async function getLatestAttendance(userId?: string) {
  const url = userId ? `/api/attendance/latest/${userId}` : '/api/attendance/latest'
  
  const response = await fetch(url)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Gagal mengambil absensi terakhir")
  }

  return result
}

// Get attendance statistics
export async function getAttendanceStats(userId?: string) {
  const url = userId ? `/api/attendance/stats/${userId}` : '/api/attendance/stats'
  
  const response = await fetch(url)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Gagal mengambil statistik absensi")
  }

  return result
}
