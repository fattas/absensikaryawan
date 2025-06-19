"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Clock, MapPin, CheckCircle, AlertCircle, Calendar } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface AttendanceData {
  date: string
  timeSettings: {
    maxClockInTime: string
    minClockOutTime: string
  } | null
  attendance: {
    checkIn: {
      timestamp: string
      isLate: boolean
      lateMinutes: number
    } | null
    checkOut: {
      timestamp: string
    } | null
  }
  leave?: {
    onLeave: boolean
    leaveType?: string
  }
  status: {
    hasCheckedIn: boolean
    hasCheckedOut: boolean
    isComplete: boolean
    isOnLeave?: boolean
    message: string
  }
}

export function AttendanceCard() {
  const router = useRouter()
  const { toast } = useToast()
  const [locationName, setLocationName] = useState<string>("Memuat lokasi...")
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update waktu setiap detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Fetch semua data yang diperlukan
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true)
      try {
        // Fetch attendance data hari ini
        const attendanceResponse = await fetch('/api/attendance/today')
        if (attendanceResponse.ok) {
          const data = await attendanceResponse.json()
          setAttendanceData(data)
        }

        // Fetch lokasi absensi
        const locationResponse = await fetch('/api/location/settings')
        if (locationResponse.ok) {
          const settings = await locationResponse.json()
          
          // Mendapatkan nama lokasi melalui internal API
          const geoResponse = await fetch(
            `/api/location/geocode?lat=${settings.latitude}&lng=${settings.longitude}`
          )

          if (geoResponse.ok) {
            const data = await geoResponse.json()
            if (data.success && data.locationName) {
              setLocationName(data.locationName)
            } else {
              setLocationName(`${settings.latitude.toFixed(6)}, ${settings.longitude.toFixed(6)}`)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Gagal memuat data absensi",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllData()
    
    // Refresh data setiap 30 detik
    const interval = setInterval(fetchAllData, 30000)
    
    return () => clearInterval(interval)
  }, [toast])

  // Format date dan time
  const formatDate = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    
    const dayName = days[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    
    return `${dayName}, ${day} ${month} ${year}`
  }

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  const formatTimeOnly = (timeStr: string) => {
    const date = new Date(timeStr)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const handleCheckIn = () => {
    router.push("/check-in")
  }

  // Tentukan status dan action button
  const getAttendanceStatus = () => {
    if (!attendanceData) {
      return {
        status: "loading",
        message: "Memuat...",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        action: "Memuat...",
        actionEnabled: false
      }
    }

    // Check if user is on leave
    if (attendanceData.status.isOnLeave) {
      return {
        status: "on_leave",
        message: attendanceData.status.message,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        action: "Sedang Cuti/Izin",
        actionEnabled: false
      }
    }

    if (!attendanceData.status.hasCheckedIn) {
      return {
        status: "belum_absen_masuk",
        message: "Belum Absen Masuk",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        action: "Absen Masuk",
        actionEnabled: true
      }
    }

    if (attendanceData.status.hasCheckedIn && !attendanceData.status.hasCheckedOut) {
      return {
        status: "belum_absen_pulang",
        message: "Sudah Absen Masuk",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        action: "Absen Pulang",
        actionEnabled: true
      }
    }

    return {
      status: "selesai",
      message: "Absensi Hari Ini Selesai",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      action: "Selesai",
      actionEnabled: false
    }
  }

  const status = getAttendanceStatus()

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header dengan tanggal dan waktu */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">{formatDate(currentTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-800">{formatTime(currentTime)}</span>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color} ${status.borderColor} border`}>
            {status.message}
          </div>
        </div>
      </div>

      {/* Jadwal Absensi Perusahaan */}
      <Card className="p-4 border-2 border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Jadwal Jam Kerja
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Jam Masuk (Maks)</p>
            <p className="text-lg font-bold text-gray-800">
              {attendanceData?.timeSettings?.maxClockInTime || "07:00"}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Jam Pulang (Min)</p>
            <p className="text-lg font-bold text-gray-800">
              {attendanceData?.timeSettings?.minClockOutTime || "17:00"}
            </p>
          </div>
        </div>
      </Card>

      {/* Status Absensi Hari Ini */}
      <Card className="p-4 border-2" style={{ borderColor: status.borderColor.replace('border-', '') }}>
        <h3 className="font-semibold text-gray-800 mb-3">Status Absensi Hari Ini</h3>
        
        {/* Show leave notice if user is on leave */}
        {attendanceData?.status.isOnLeave && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm font-medium text-purple-800">
              {attendanceData.status.message}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              Anda tidak perlu melakukan absensi hari ini
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          {/* Check In Status */}
          <div className="flex items-start gap-3">
            {attendanceData?.attendance.checkIn ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium text-gray-800">Absen Masuk</p>
              {attendanceData?.attendance.checkIn ? (
                <div>
                  <p className="text-sm text-gray-600">
                    {formatTimeOnly(attendanceData.attendance.checkIn.timestamp)}
                  </p>
                  {attendanceData.attendance.checkIn.isLate && (
                    <p className="text-xs text-red-600 mt-1">
                      Terlambat {attendanceData.attendance.checkIn.lateMinutes} menit
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Belum absen</p>
              )}
            </div>
          </div>

          {/* Check Out Status */}
          <div className="flex items-start gap-3">
            {attendanceData?.attendance.checkOut ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium text-gray-800">Absen Pulang</p>
              {attendanceData?.attendance.checkOut ? (
                <p className="text-sm text-gray-600">
                  {formatTimeOnly(attendanceData.attendance.checkOut.timestamp)}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Belum absen</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Lokasi Absensi */}
      <Card className="p-3 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">Lokasi Absensi:</p>
            <p className="text-sm text-blue-700">{locationName}</p>
          </div>
        </div>
      </Card>

      {/* Action Button */}
      <Button 
        onClick={handleCheckIn} 
        className="w-full h-12 text-base font-semibold"
        disabled={!status.actionEnabled}
        variant={status.actionEnabled ? "default" : "secondary"}
      >
        {status.action}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Verifikasi wajah dan pemeriksaan lokasi diperlukan untuk absensi
      </p>
    </div>
  )
} 