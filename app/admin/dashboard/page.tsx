"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminAttendanceList } from "@/components/admin-attendance-list"
import { LocationSettings } from "@/components/location-settings"
import { UserManagement } from "@/components/user-management"
import { AttendanceTesting } from "@/components/attendance-testing"
import { AdminLeaveManagement } from "@/components/admin-leave-management"
import { AdminLeaveBalanceManagement } from "@/components/admin-leave-balance-management"
import Link from "next/link"

interface AdminProfile {
  id: string
  email: string
  name: string
}

interface TimeSettings {
  id: string
  maxClockInTime: string
  minClockOutTime: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [attendanceData, setAttendanceData] = useState([])
  const [userData, setUserData] = useState([])
  const [timeSettings, setTimeSettings] = useState<TimeSettings | null>(null)

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch admin profile
        const adminResponse = await fetch('/api/auth/admin/profile');
        if (!adminResponse.ok) {
          throw new Error('Failed to fetch admin profile');
        }
        const adminData = await adminResponse.json();
        setAdmin(adminData);

        // Fetch attendance data
        const attendanceResponse = await fetch('/api/attendance/admin/all');
        if (attendanceResponse.ok) {
          const attendanceResult = await attendanceResponse.json();
          setAttendanceData(attendanceResult.attendances || []);
        }

        // Fetch user data
        const usersResponse = await fetch('/api/users/all');
        if (usersResponse.ok) {
          const usersResult = await usersResponse.json();
          setUserData(usersResult.users || []);
        }

        // Fetch time settings
        try {
          const timeSettingsResponse = await fetch('/api/time-settings');
          if (timeSettingsResponse.ok) {
            const timeSettingsData = await timeSettingsResponse.json();
            setTimeSettings(timeSettingsData);
          }
        } catch (error) {
          console.error("Error fetching time settings:", error);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
        router.push("/admin");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/admin/logout', { method: 'POST' });
      router.push("/admin");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Login sebagai: {admin?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-8 mb-8">
            <TabsTrigger value="attendance">Absensi</TabsTrigger>
            <TabsTrigger value="leave">Cuti/Izin</TabsTrigger>
            <TabsTrigger value="leave-balance">Saldo Cuti</TabsTrigger>
            <TabsTrigger value="points">Poin & Reward</TabsTrigger>
            <TabsTrigger value="location">Lokasi</TabsTrigger>
            <TabsTrigger value="time">Waktu</TabsTrigger>
            <TabsTrigger value="users">Pengguna</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Catatan Absensi</CardTitle>
                <CardDescription>Lihat dan kelola catatan absensi karyawan</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminAttendanceList attendanceData={attendanceData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leave" className="space-y-4">
            <AdminLeaveManagement />
          </TabsContent>

          <TabsContent value="leave-balance" className="space-y-4">
            <AdminLeaveBalanceManagement />
          </TabsContent>

          <TabsContent value="points" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sistem Poin & Reward</CardTitle>
                <CardDescription>Kelola konfigurasi sistem poin, reward, dan redemptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Konfigurasi Poin</h3>
                    <p className="text-sm text-muted-foreground">
                      Atur nilai poin untuk berbagai aktivitas karyawan
                    </p>
                    <Button asChild>
                      <Link href="/admin/points-system">
                        Kelola Sistem Poin
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Manajemen Reward</h3>
                    <p className="text-sm text-muted-foreground">
                      Tambah, edit, dan kelola stok reward yang tersedia
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/admin/points-system?tab=rewards">
                        Kelola Rewards
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Redemptions</h3>
                    <p className="text-sm text-muted-foreground">
                      Proses dan kelola permintaan penukaran reward
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/admin/redemptions">
                        Kelola Redemptions
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Lokasi</CardTitle>
                <CardDescription>Konfigurasi lokasi absensi yang diizinkan dan radiusnya</CardDescription>
              </CardHeader>
              <CardContent>
                <LocationSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="time" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Waktu</CardTitle>
                <CardDescription>Konfigurasi batasan waktu absen masuk dan absen Pulang</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-1">Batas Waktu Absen Masuk</h3>
                      <p className="text-sm text-gray-500">
                        {timeSettings?.maxClockInTime || "07:00"}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Waktu Minimum Absen Pulang</h3>
                      <p className="text-sm text-gray-500">
                        {timeSettings?.minClockOutTime || "17:00"}
                      </p>
                    </div>
                  </div>
                  
                  <Button asChild>
                    <Link href="/admin/time-settings">
                      Konfigurasi Waktu Absensi
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manajemen Pengguna</CardTitle>
                <CardDescription>Lihat dan kelola akun karyawan</CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement userData={userData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-4">
            <AttendanceTesting />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
