import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react"

interface AttendanceRecord {
  id: string
  timestamp: string
  type: 'CHECK_IN' | 'CHECK_OUT' | string
  isSuccessful?: boolean
  location?: string
  latitude?: number
  longitude?: number
  isLate?: boolean
  lateMinutes?: number
  lateMessage?: string
  user?: {
    name?: string
    email?: string
  }
}

interface AttendanceHistoryProps {
  history: AttendanceRecord[]
}

export function AttendanceHistory({ history = [] }: AttendanceHistoryProps) {
  if (!history || history.length === 0) {
    return <div className="text-center py-4 text-gray-500">Tidak ada catatan absensi ditemukan.</div>
  }

  // Sort by timestamp descending (most recent first)
  const sortedHistory = [...history].sort((a, b) => {
    try {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    } catch (e) {
      return 0;
    }
  })

  // Only show the 5 most recent records
  const recentHistory = sortedHistory.slice(0, 5)

  // Format date as DD-MM-YYYY
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const year = date.getFullYear()
      return `${day}-${month}-${year}`
    } catch (e) {
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
    } catch (e) {
      return "Invalid Time"
    }
  }

  // Format attendance type
  const formatType = (type: string) => {
    if (type === 'CHECK_IN') return 'Masuk'
    if (type === 'CHECK_OUT') return 'Pulang'
    return type || 'Absensi'
  }

  return (
    <div className="space-y-2">
      {recentHistory.map((record) => (
        <Card key={record.id} className="p-3 flex items-center justify-between shadow-sm">
          <div>
            <p className="font-medium">{formatDate(record.timestamp)}</p>
            <p className="text-xs text-gray-500">{formatTime(record.timestamp)}</p>
            <div className="flex items-center">
              <p className="text-xs text-gray-600">{formatType(record.type)}</p>
              {record.isLate && record.type === 'CHECK_IN' && (
                <span className="ml-2 inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                  {record.lateMessage || 'Terlambat'}
                </span>
              )}
            </div>
          </div>
          {(record.isSuccessful === undefined || record.isSuccessful) ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </Card>
      ))}
    </div>
  )
}
