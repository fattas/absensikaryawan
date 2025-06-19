"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUserAttendance } from "@/lib/attendance-service"
import { CheckCircle2, ChevronLeft, Clock, Filter, MapPin, Search, XCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface AttendanceRecord {
  id: string
  timestamp: string
  type: 'CHECK_IN' | 'CHECK_OUT'
  isSuccessful: boolean
  location_lat: number
  location_lng: number
  location: string
  face_match_score?: number
  isLate?: boolean
  lateMinutes?: number
  lateMessage?: string
}

export default function AttendanceHistory() {
  const router = useRouter()
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<string>("newest")

  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      try {
        setIsLoading(true)
        const records = await getUserAttendance()
        setAttendanceRecords(records)
        setFilteredRecords(records)
      } catch (error) {
        console.error("Error fetching attendance history:", error)
        toast.error("Gagal mengambil riwayat absensi")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAttendanceHistory()
  }, [])

  useEffect(() => {
    // Apply filters and sorting
    let results = [...attendanceRecords]

    // Apply status filter
    if (filterStatus !== "all") {
      const isSuccessful = filterStatus === "success"
      results = results.filter((record) => record.isSuccessful === isSuccessful)
    }

    // Apply type filter
    if (filterType !== "all") {
      const type = filterType === "check_in" ? "CHECK_IN" : "CHECK_OUT"
      results = results.filter((record) => record.type === type)
    }

    // Apply search (by date)
    if (searchTerm) {
      results = results.filter((record) => {
        const date = new Date(record.timestamp)
        const formattedDate = format(date, "dd-MM-yyyy")
        return formattedDate.includes(searchTerm)
      })
    }

    // Apply sorting
    results.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime()
      const dateB = new Date(b.timestamp).getTime()
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB
    })

    setFilteredRecords(results)
  }, [attendanceRecords, searchTerm, filterStatus, filterType, sortOrder])

  // Format date as DD-MM-YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "dd-MM-yyyy", { locale: id })
  }

  // Format time as 24-hour format (HH:MM)
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "HH:mm", { locale: id })
  }

  // Format day name in Indonesian
  const formatDayName = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "EEEE", { locale: id })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-sm flex flex-col">
        {/* App header */}
        <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            <ChevronLeft className="h-5 w-5 mr-1" />
            Kembali
          </Button>
          <h1 className="text-lg font-bold">Riwayat Absensi</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </header>

        {/* App content */}
        <main className="flex-1 overflow-auto p-4 space-y-4">
          {/* Search and filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Cari berdasarkan tanggal (DD-MM-YYYY)"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="filter-status" className="text-xs text-gray-500 mb-1 block">
                  Status
                </Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger id="filter-status" className="h-9">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="success">Berhasil</SelectItem>
                    <SelectItem value="failed">Gagal</SelectItem>
                    <SelectItem value="late">Terlambat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="filter-type" className="text-xs text-gray-500 mb-1 block">
                  Tipe
                </Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger id="filter-type" className="h-9">
                    <SelectValue placeholder="Semua Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="check_in">Check-In</SelectItem>
                    <SelectItem value="check_out">Check-Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="sort-order" className="text-xs text-gray-500 mb-1 block">
                  Urutan
                </Label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger id="sort-order" className="h-9">
                    <SelectValue placeholder="Terbaru" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Terbaru</SelectItem>
                    <SelectItem value="oldest">Terlama</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Attendance records */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-700">Tidak ada data</h3>
              <p className="text-gray-500 mt-1">
                {searchTerm || filterStatus !== "all" || filterType !== "all"
                  ? "Tidak ada data yang sesuai dengan filter"
                  : "Belum ada riwayat absensi"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <Card key={record.id} className="overflow-hidden">
                  <div 
                    className={`h-1.5 ${
                      !record.isSuccessful 
                        ? "bg-red-500" 
                        : record.isLate 
                          ? "bg-amber-500" 
                          : "bg-green-500"
                    }`}
                  ></div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium">{formatDate(record.timestamp)}</h3>
                        <p className="text-sm text-gray-500">{formatDayName(record.timestamp)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={record.type === 'CHECK_IN' ? 'default' : 'outline'}>
                          {record.type === 'CHECK_IN' ? 'Masuk' : 'Pulang'}
                        </Badge>
                        {record.isSuccessful ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            <span className="text-sm">Berhasil</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            <span className="text-sm">Gagal</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Waktu: {formatTime(record.timestamp)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>
                          Lokasi: {record.location || `${record.location_lat.toFixed(6)}, ${record.location_lng.toFixed(6)}`}
                        </span>
                      </div>
                      {record.face_match_score !== undefined && (
                        <div className="flex items-center text-gray-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2"
                          >
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          <span>Skor Kecocokan: {Math.round(record.face_match_score * 100)}%</span>
                        </div>
                      )}

                      {/* Tampilkan status keterlambatan jika terlambat */}
                      {record.isLate && record.type === 'CHECK_IN' && (
                        <div className="flex items-center text-amber-600 mt-1">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span>
                            {record.lateMessage || `Terlambat ${record.lateMinutes} menit`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
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
