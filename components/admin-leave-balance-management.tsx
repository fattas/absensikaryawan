"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { User, Save, RefreshCw, Calendar } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface LeaveBalance {
  id: string
  totalDays: number
  usedDays: number
  remainingDays: number
  year: number
}

interface UserWithBalance {
  id: string
  name: string
  email: string
  leaveBalance: LeaveBalance
}

export function AdminLeaveBalanceManagement() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserWithBalance[]>([])
  const [selectedUser, setSelectedUser] = useState<UserWithBalance | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [totalDays, setTotalDays] = useState("")
  const [remainingDays, setRemainingDays] = useState("")
  const [saving, setSaving] = useState(false)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    fetchLeaveBalances()
  }, [])

  const fetchLeaveBalances = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/leave/admin/balance?year=${currentYear}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengambil data saldo cuti")
      }

      setUsers(data.data)
    } catch (error: any) {
      console.error("Error fetching leave balances:", error)
      toast.error(error.message || "Gagal mengambil data saldo cuti")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user: UserWithBalance) => {
    setSelectedUser(user)
    setTotalDays(user.leaveBalance.totalDays.toString())
    setRemainingDays(user.leaveBalance.remainingDays.toString())
    setEditDialogOpen(true)
  }

  const handleSave = async () => {
    if (!selectedUser) return

    const totalDaysNum = parseInt(totalDays)
    const remainingDaysNum = parseInt(remainingDays)

    // Validation
    if (isNaN(totalDaysNum) || isNaN(remainingDaysNum)) {
      toast.error("Harap masukkan angka yang valid")
      return
    }

    if (totalDaysNum < 0 || remainingDaysNum < 0) {
      toast.error("Jumlah hari tidak boleh negatif")
      return
    }

    if (remainingDaysNum > totalDaysNum) {
      toast.error("Sisa hari tidak boleh melebihi total hari")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/leave/admin/balance", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          year: currentYear,
          totalDays: totalDaysNum,
          remainingDays: remainingDaysNum,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Gagal memperbarui saldo cuti")
      }

      toast.success(data.message || "Saldo cuti berhasil diperbarui")
      setEditDialogOpen(false)
      fetchLeaveBalances()
    } catch (error: any) {
      console.error("Error saving leave balance:", error)
      toast.error(error.message || "Gagal memperbarui saldo cuti")
    } finally {
      setSaving(false)
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manajemen Saldo Cuti Karyawan</CardTitle>
              <CardDescription>
                Kelola saldo cuti tahunan karyawan untuk tahun {currentYear}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLeaveBalances}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Karyawan</TableHead>
                  <TableHead className="text-center">Total Cuti</TableHead>
                  <TableHead className="text-center">Terpakai</TableHead>
                  <TableHead className="text-center">Sisa</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {user.leaveBalance.totalDays} hari
                    </TableCell>
                    <TableCell className="text-center">
                      {user.leaveBalance.usedDays} hari
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-medium ${
                        user.leaveBalance.remainingDays === 0 
                          ? 'text-red-600' 
                          : user.leaveBalance.remainingDays <= 3 
                          ? 'text-orange-600' 
                          : 'text-green-600'
                      }`}>
                        {user.leaveBalance.remainingDays} hari
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Data untuk tahun {currentYear}</span>
            </div>
            <span>Total: {users.length} karyawan</span>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Saldo Cuti</DialogTitle>
            <DialogDescription>
              Ubah saldo cuti untuk {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="total-days">Total Hari Cuti</Label>
              <Input
                id="total-days"
                type="number"
                min="0"
                value={totalDays}
                onChange={(e) => setTotalDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Jumlah total hari cuti yang diberikan untuk tahun ini
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remaining-days">Sisa Hari Cuti</Label>
              <Input
                id="remaining-days"
                type="number"
                min="0"
                max={totalDays}
                value={remainingDays}
                onChange={(e) => setRemainingDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Jumlah hari cuti yang masih tersisa
              </p>
            </div>

            {selectedUser && totalDays && remainingDays && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p>Hari terpakai: {parseInt(totalDays) - parseInt(remainingDays)} hari</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 