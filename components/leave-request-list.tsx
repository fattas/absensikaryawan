"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
// Temporarily removed date-fns imports
// import { format } from "date-fns"
// import { id } from "date-fns/locale/id"

// Temporary format function
const format = (date: Date, formatStr: string, options?: any) => {
  return new Date(date).toLocaleDateString('id-ID');
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDays, Clock, Loader2, X, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface LeaveRequest {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  reason?: string
  status: string
  totalDays: number
  createdAt: string
  approvedAt?: string
  rejectionReason?: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface LeaveBalance {
  totalDays: number
  usedDays: number
  remainingDays: number
  year: number
}

export function LeaveRequestList() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [balance, setBalance] = useState<LeaveBalance | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaveData()
  }, [])

  const fetchLeaveData = async () => {
    try {
      const response = await fetch("/api/leave/request")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengambil data cuti")
      }

      setRequests(data.data.requests)
      setBalance(data.data.balance)
    } catch (error: any) {
      console.error("Error fetching leave data:", error)
      toast.error(error.message || "Gagal mengambil data cuti")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    setCancelling(requestId)
    try {
      const response = await fetch(`/api/leave/cancel?requestId=${requestId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Gagal membatalkan permohonan")
      }

      toast.success("Permohonan berhasil dibatalkan")
      fetchLeaveData()
    } catch (error: any) {
      console.error("Error cancelling request:", error)
      toast.error(error.message || "Gagal membatalkan permohonan")
    } finally {
      setCancelling(null)
      setCancelDialogOpen(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Menunggu</Badge>
      case "APPROVED":
        return <Badge variant="default">Disetujui</Badge>
      case "REJECTED":
        return <Badge variant="destructive">Ditolak</Badge>
      case "CANCELLED":
        return <Badge variant="outline">Dibatalkan</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getLeaveTypeName = (type: string) => {
    switch (type) {
      case "ANNUAL_LEAVE":
        return "Cuti Tahunan"
      case "PERMISSION":
        return "Izin"
      case "SICK_LEAVE":
        return "Sakit"
      case "EMERGENCY":
        return "Darurat"
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Leave Balance Card */}
      {balance && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Sisa Cuti Tahunan {balance.year}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total: {balance.totalDays} hari</p>
                <p className="text-sm text-muted-foreground">Terpakai: {balance.usedDays} hari</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{balance.remainingDays}</p>
                <p className="text-sm text-muted-foreground">hari tersisa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Permohonan Cuti/Izin</CardTitle>
          <CardDescription>
            Daftar semua permohonan cuti dan izin yang telah Anda ajukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada permohonan cuti/izin
            </p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{getLeaveTypeName(request.leaveType)}</h4>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                                                 {format(new Date(request.startDate), "dd MMM yyyy")} -
                         {format(new Date(request.endDate), "dd MMM yyyy")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {request.totalDays} hari
                      </div>
                    </div>
                    {request.reason && (
                      <p className="text-sm text-muted-foreground">Alasan: {request.reason}</p>
                    )}
                    {request.rejectionReason && (
                      <p className="text-sm text-destructive">
                        Alasan penolakan: {request.rejectionReason}
                      </p>
                    )}
                  </div>
                  {request.status === "PENDING" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRequestId(request.id)
                        setCancelDialogOpen(true)
                      }}
                      disabled={cancelling === request.id}
                    >
                      {cancelling === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      Batalkan
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Permohonan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan permohonan cuti/izin ini? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tidak</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequestId && handleCancelRequest(selectedRequestId)}
            >
              Ya, Batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 