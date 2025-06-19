"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Search, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AttendanceRecord {
  id: string
  timestamp: string
  type: string
  location?: string
  latitude: number
  longitude: number
  user?: {
    id: string
    name: string
    email: string
  }
  face_match_score?: number
  face_snapshot_path?: string
  is_successful?: boolean
  user_name?: string
  location_lat?: number
  location_lng?: number
  isLate?: boolean
  lateMinutes?: number
  lateMessage?: string
}

interface AdminAttendanceListProps {
  attendanceData: AttendanceRecord[]
}

export function AdminAttendanceList({ attendanceData = [] }: AdminAttendanceListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)

  // Format data untuk tampilan
  const formattedData = attendanceData.map(record => ({
    ...record,
    user_name: record.user?.name || "Unknown User",
    is_successful: record.is_successful ?? true,
    face_match_score: record.face_match_score || 0,
    location_lat: record.latitude,
    location_lng: record.longitude
  }))

  const filteredData = formattedData.filter(
    (record) =>
      record.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDate(record.timestamp).includes(searchTerm),
  )

  const handleViewDetails = (record: AttendanceRecord) => {
    setSelectedRecord(record)
  }

  // Format date as DD-MM-YYYY
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const year = date.getFullYear()
      return `${day}-${month}-${year}`
    } catch (err) {
      return "Invalid Date"
    }
  }

  // Format time as 24-hour format (HH:MM)
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const hours = date.getHours().toString().padStart(2, "0")
      const minutes = date.getMinutes().toString().padStart(2, "0")
      return `${hours}:${minutes}`
    } catch (err) {
      return "Invalid Time"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Cari berdasarkan nama atau tanggal..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Karyawan</TableHead>
              <TableHead>Tanggal & Waktu</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Skor Kecocokan</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                  Tidak ada catatan absensi ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.user_name}</TableCell>
                  <TableCell>
                    {formatDate(record.timestamp)}{" "}
                    <span className="text-gray-500 text-xs">{formatTime(record.timestamp)}</span>
                    {record.isLate && record.type === 'CHECK_IN' && (
                      <div className="mt-1">
                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          {record.lateMessage || `Terlambat ${record.lateMinutes} menit`}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.is_successful ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Berhasil</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span>Gagal</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.face_match_score ? `${Math.round(record.face_match_score * 100)}%` : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(record)}>
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Attendance Details Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Absensi</DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Karyawan</p>
                  <p>{selectedRecord.user_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tanggal & Waktu</p>
                  <p>
                    {formatDate(selectedRecord.timestamp)} {formatTime(selectedRecord.timestamp)}
                  </p>
                  {selectedRecord.isLate && selectedRecord.type === 'CHECK_IN' && (
                    <p className="text-amber-600 text-sm mt-1">
                      {selectedRecord.lateMessage || `Terlambat ${selectedRecord.lateMinutes} menit`}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className={selectedRecord.is_successful ? "text-green-600" : "text-red-600"}>
                    {selectedRecord.is_successful ? "Berhasil" : "Gagal"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Skor Kecocokan</p>
                  <p>
                    {selectedRecord.face_match_score ? `${Math.round(selectedRecord.face_match_score * 100)}%` : "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Lokasi</p>
                <div className="h-40 bg-gray-100 rounded-md flex items-center justify-center">
                  <p className="text-sm text-gray-500">
                    Lat: {selectedRecord.location_lat?.toFixed(6) || selectedRecord.latitude.toFixed(6)}, 
                    Lng: {selectedRecord.location_lng?.toFixed(6) || selectedRecord.longitude.toFixed(6)}
                  </p>
                </div>
              </div>

              {selectedRecord.face_snapshot_path && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Foto Wajah</p>
                  <div className="bg-gray-100 rounded-md p-2 flex justify-center">
                    <img
                      src={selectedRecord.face_snapshot_path || "/placeholder.svg"}
                      alt="Foto wajah"
                      className="max-h-40 rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
