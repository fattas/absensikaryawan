"use client"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, CalendarDays, Clock, User, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

export function AdminLeaveManagement() {
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    fetchLeaveRequests()
  }, [activeTab])

  const fetchLeaveRequests = async () => {
    setLoading(true)
    try {
      const params = activeTab === "pending" ? "?pending=true" : ""
      const response = await fetch(`/api/leave/admin${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengambil data permohonan")
      }

      setRequests(data.data)
    } catch (error: any) {
      console.error("Error fetching leave requests:", error)
      toast.error(error.message || "Gagal mengambil data permohonan")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (request: LeaveRequest) => {
    setProcessing(request.id)
    try {
      const response = await fetch("/api/leave/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: request.id,
          status: "APPROVED",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyetujui permohonan")
      }

      toast.success(`Permohonan ${request.user.name} berhasil disetujui`)
      fetchLeaveRequests()
    } catch (error: any) {
      console.error("Error approving request:", error)
      toast.error(error.message || "Gagal menyetujui permohonan")
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error("Harap berikan alasan penolakan")
      return
    }

    setProcessing(selectedRequest.id)
    try {
      const response = await fetch("/api/leave/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          status: "REJECTED",
          rejectionReason: rejectionReason.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Gagal menolak permohonan")
      }

      toast.success(`Permohonan ${selectedRequest.user.name} berhasil ditolak`)
      setRejectDialogOpen(false)
      setRejectionReason("")
      setSelectedRequest(null)
      fetchLeaveRequests()
    } catch (error: any) {
      console.error("Error rejecting request:", error)
      toast.error(error.message || "Gagal menolak permohonan")
    } finally {
      setProcessing(null)
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
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Cuti/Izin Karyawan</CardTitle>
          <CardDescription>
            Kelola permohonan cuti dan izin dari karyawan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">Menunggu Persetujuan</TabsTrigger>
              <TabsTrigger value="all">Semua Permohonan</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {requests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {activeTab === "pending" 
                    ? "Tidak ada permohonan yang menunggu persetujuan"
                    : "Tidak ada permohonan cuti/izin"}
                </p>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{request.user.name}</span>
                            <span className="text-sm text-muted-foreground">
                              ({request.user.email})
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{getLeaveTypeName(request.leaveType)}</Badge>
                            {getStatusBadge(request.status)}
                          </div>
                        </div>
                        {request.status === "PENDING" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(request)}
                              disabled={processing === request.id}
                            >
                              {processing === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedRequest(request)
                                setRejectDialogOpen(true)
                              }}
                              disabled={processing === request.id}
                            >
                              <X className="h-4 w-4" />
                              Tolak
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="h-4 w-4" />
                          <span>
                            {format(new Date(request.startDate), "dd MMM yyyy")} -
                            {format(new Date(request.endDate), "dd MMM yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{request.totalDays} hari kerja</span>
                        </div>
                      </div>

                      {request.reason && (
                        <div className="text-sm">
                          <span className="font-medium">Alasan:</span>{" "}
                          <span className="text-muted-foreground">{request.reason}</span>
                        </div>
                      )}

                      {request.rejectionReason && (
                        <div className="text-sm text-destructive">
                          <span className="font-medium">Alasan penolakan:</span>{" "}
                          {request.rejectionReason}
                        </div>
                      )}

                      {request.approvedAt && (
                        <p className="text-xs text-muted-foreground">
                          {request.status === "APPROVED" ? "Disetujui" : "Diproses"} pada{" "}
                          {format(new Date(request.approvedAt), "dd MMM yyyy HH:mm")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Permohonan</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan untuk permohonan {selectedRequest?.user.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Alasan Penolakan *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Jelaskan alasan penolakan permohonan ini..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false)
                setRejectionReason("")
                setSelectedRequest(null)
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processing === selectedRequest?.id}
            >
              {processing === selectedRequest?.id && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Tolak Permohonan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 