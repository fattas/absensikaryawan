"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  name: string
  email: string
  role?: string
  todayAttendance?: {
    hasCheckedIn: boolean
    hasCheckedOut: boolean
    checkInTime?: string
    checkOutTime?: string
  }
}

export function AttendanceTesting() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [resettingUser, setResettingUser] = useState<string | null>(null)

  // Fetch users dengan status attendance hari ini
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      // Fetch all users
      const usersResponse = await fetch('/api/users/all')
      if (!usersResponse.ok) throw new Error('Failed to fetch users')
      const usersData = await usersResponse.json()

      // Fetch attendance hari ini untuk setiap user
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const attendanceResponse = await fetch('/api/attendance/admin/all')
      if (!attendanceResponse.ok) throw new Error('Failed to fetch attendance')
      const attendanceData = await attendanceResponse.json()

      // Process user data dengan attendance hari ini
      const usersWithAttendance = usersData.users.map((user: any) => {
        const todayAttendances = attendanceData.attendances.filter((att: any) => {
          const attDate = new Date(att.timestamp)
          return att.userId === user.id && 
                 attDate >= today && 
                 attDate < tomorrow
        })

        const checkIn = todayAttendances.find((att: any) => att.type === 'CHECK_IN')
        const checkOut = todayAttendances.find((att: any) => att.type === 'CHECK_OUT')

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          todayAttendance: {
            hasCheckedIn: !!checkIn,
            hasCheckedOut: !!checkOut,
            checkInTime: checkIn?.timestamp,
            checkOutTime: checkOut?.timestamp
          }
        }
      })

      // Filter hanya user non-admin
      setUsers(usersWithAttendance.filter((user: any) => user.role !== 'ADMIN'))
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleResetAttendance = async (userId: string, userName: string) => {
    setResettingUser(userId)
    try {
      const response = await fetch('/api/attendance/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset attendance')
      }

      toast({
        title: "Berhasil",
        description: `Absensi ${userName} berhasil direset untuk testing`,
      })

      // Refresh data
      await fetchUsers()
    } catch (error) {
      console.error("Error resetting attendance:", error)
      toast({
        title: "Error",
        description: "Gagal mereset absensi",
        variant: "destructive"
      })
    } finally {
      setResettingUser(null)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Testing Absensi</CardTitle>
        <CardDescription>
          Reset status absensi pengguna untuk keperluan testing. Data historis tidak akan terpengaruh.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 mb-1">Informasi Testing</p>
              <p className="text-blue-700">
                Fitur ini memungkinkan Anda untuk mereset status absensi pengguna hari ini untuk keperluan testing. 
                Setelah direset, pengguna dapat melakukan check-in dan check-out kembali.
              </p>
            </div>
          </div>

          {/* Users Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Pengguna</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status Hari Ini</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Tidak ada pengguna yang terdaftar
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-gray-600">{user.email}</TableCell>
                      <TableCell>
                        {user.todayAttendance?.hasCheckedOut ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Selesai
                          </Badge>
                        ) : user.todayAttendance?.hasCheckedIn ? (
                          <Badge variant="default" className="bg-blue-100 text-blue-800">
                            Sudah Check In
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Belum Absen
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.todayAttendance?.checkInTime ? (
                          <span className="text-green-600">
                            {formatTime(user.todayAttendance.checkInTime)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.todayAttendance?.checkOutTime ? (
                          <span className="text-green-600">
                            {formatTime(user.todayAttendance.checkOutTime)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={resettingUser === user.id || (!user.todayAttendance?.hasCheckedIn && !user.todayAttendance?.hasCheckedOut)}
                              className="gap-2"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Reset
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reset Absensi untuk Testing?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin mereset absensi <strong>{user.name}</strong> hari ini? 
                                Tindakan ini akan menghapus data check-in dan check-out hari ini, 
                                memungkinkan pengguna untuk melakukan testing absensi kembali.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleResetAttendance(user.id, user.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Reset Absensi
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={fetchUsers}
              disabled={isLoading}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 