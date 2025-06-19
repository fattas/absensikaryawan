"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function LeaveRequestForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [leaveType, setLeaveType] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [reason, setReason] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!leaveType || !startDate || !endDate) {
      toast.error("Harap lengkapi semua field yang diperlukan")
      return
    }

    if (startDate > endDate) {
      toast.error("Tanggal mulai tidak boleh setelah tanggal selesai")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/leave/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leaveType,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengajukan cuti/izin")
      }

      toast.success("Permohonan cuti/izin berhasil diajukan")
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error submitting leave request:", error)
      toast.error(error.message || "Gagal mengajukan cuti/izin")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Form Permohonan Cuti/Izin</CardTitle>
        <CardDescription>
          Ajukan permohonan cuti atau izin dengan mengisi form di bawah ini
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="leaveType">Jenis Cuti/Izin *</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger id="leaveType">
                <SelectValue placeholder="Pilih jenis cuti/izin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANNUAL_LEAVE">Cuti Tahunan</SelectItem>
                <SelectItem value="PERMISSION">Izin</SelectItem>
                <SelectItem value="SICK_LEAVE">Sakit</SelectItem>
                <SelectItem value="EMERGENCY">Darurat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Mulai *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Selesai *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => 
                      date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                      (startDate ? date < startDate : false)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Alasan/Keterangan</Label>
            <Textarea
              id="reason"
              placeholder="Jelaskan alasan permohonan cuti/izin Anda"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajukan Permohonan
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 