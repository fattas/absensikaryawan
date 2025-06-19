"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AttendanceHistory } from "@/components/attendance-history"
import { UserGreeting } from "@/components/user-greeting"
import { AttendanceCard } from "@/components/attendance-card"

interface UserProfile {
  id: string
  name: string
  email: string
  hasFaceEncoding: boolean
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [attendanceHistory, setAttendanceHistory] = useState([])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user profile
        const userResponse = await fetch('/api/auth/user/profile');
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user profile');
        }
        const userData = await userResponse.json();
        setUser(userData);

        // Fetch attendance history
        const attendanceResponse = await fetch('/api/attendance/user');
        if (attendanceResponse.ok) {
          const historyData = await attendanceResponse.json();
          setAttendanceHistory(historyData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push("/");
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
    <div className="min-h-screen bg-gray-50 flex justify-center">
      {/* Mobile app container with width constraints */}
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-sm flex flex-col">
        {/* App header */}
        <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold">Portal Karyawan</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Keluar
          </Button>
        </header>

        {/* App content */}
        <main className="flex-1 overflow-auto p-4 space-y-4">
          {/* Face Enrollment Banner - only show if user hasn't enrolled their face */}
          {user && !user.hasFaceEncoding && (
            <Card className="border-amber-200 bg-amber-50 mb-4">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-shrink-0 bg-amber-100 p-2 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-amber-600"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-medium text-amber-800 text-lg">Daftarkan Wajah Anda</h3>
                    <p className="text-amber-700 mt-1">
                      Untuk pengalaman absensi yang lebih cepat dan aman, daftarkan wajah Anda sekarang.
                    </p>
                  </div>
                  <Button
                    className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => router.push("/user/enroll-face")}
                  >
                    Daftarkan Wajah
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <UserGreeting user={user} />

          {/* Absensi Section */}
          <AttendanceCard />

          {/* Leave Section */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Cuti & Izin</CardTitle>
              <CardDescription>Kelola permohonan cuti dan izin Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push("/leave-request")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M8 2v4"></path>
                  <path d="M16 2v4"></path>
                  <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                  <path d="M3 10h18"></path>
                  <path d="M8 14h.01"></path>
                  <path d="M12 14h.01"></path>
                  <path d="M16 14h.01"></path>
                  <path d="M8 18h.01"></path>
                  <path d="M12 18h.01"></path>
                  <path d="M16 18h.01"></path>
                </svg>
                Ajukan Cuti/Izin
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push("/leave-history")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M3 3v5h5"></path>
                  <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path>
                  <path d="M12 7v5l4 2"></path>
                </svg>
                Riwayat Cuti/Izin
              </Button>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Aktivitas Terbaru</CardTitle>
              <CardDescription>Riwayat absensi Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceHistory history={attendanceHistory} />
            </CardContent>
            <CardFooter>
              <Button variant="link" className="w-full text-sm" onClick={() => router.push("/attendance-history")}>
                Lihat Riwayat Lengkap
              </Button>
            </CardFooter>
          </Card>
        </main>

        {/* App bottom navigation */}
        <nav className="sticky bottom-0 z-10 bg-white border-t px-2 py-2">
          <div className="flex justify-around items-center">
            <Button
              variant="ghost"
              className="flex flex-col items-center h-auto py-2"
              onClick={() => router.push("/dashboard")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-1"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span className="text-xs">Beranda</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center h-auto py-2"
              onClick={() => router.push("/leaderboard")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-1"
              >
                <path d="M8 21V7c0-1 1-2 2-2h4c1 0 2 1 2 2v14"></path>
                <path d="M2 21V11c0-1 1-2 2-2h2c1 0 2 1 2 2v10"></path>
                <path d="M16 21V9c0-1 1-2 2-2h2c1 0 2 1 2 2v12"></path>
                <path d="M2 21h20"></path>
              </svg>
              <span className="text-xs">Leaderboard</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center h-auto py-2"
              onClick={() => router.push("/profile")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-1"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className="text-xs">Profil</span>
            </Button>
          </div>
        </nav>
      </div>
    </div>
  )
}
