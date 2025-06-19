'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, XCircle, Package, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Redemption {
  id: string
  userId: string
  rewardId: string
  pointsSpent: number
  status: 'PENDING' | 'APPROVED' | 'DELIVERED' | 'REJECTED'
  redeemedAt: string
  processedAt?: string
  notes?: string
  userName: string
  userEmail: string
  rewardName: string
  rewardDescription: string
}

const statusConfig = {
  PENDING: { label: 'Pending', color: 'yellow', icon: Clock },
  APPROVED: { label: 'Approved', color: 'blue', icon: CheckCircle },
  DELIVERED: { label: 'Delivered', color: 'green', icon: Package },
  REJECTED: { label: 'Rejected', color: 'red', icon: XCircle }
}

export default function AdminRedemptionsPage() {
  const router = useRouter()
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [filteredRedemptions, setFilteredRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchRedemptions()
  }, [])

  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredRedemptions(redemptions)
    } else {
      setFilteredRedemptions(redemptions.filter(r => r.status === statusFilter))
    }
  }, [statusFilter, redemptions])

  const fetchRedemptions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/redemptions')
      if (response.ok) {
        const data = await response.json()
        setRedemptions(data.data || [])
      } else {
        toast.error('Gagal memuat data redemptions')
      }
    } catch (error) {
      console.error('Error fetching redemptions:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessRedemption = async (
    redemptionId: string,
    status: 'APPROVED' | 'DELIVERED' | 'REJECTED'
  ) => {
    try {
      setProcessingId(redemptionId)
      
      const response = await fetch('/api/admin/redemptions/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          redemptionId,
          status,
          notes
        })
      })
      
      if (response.ok) {
        toast.success(`Redemption ${status.toLowerCase()} successfully`)
        fetchRedemptions()
        setSelectedRedemption(null)
        setNotes('')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal memproses redemption')
      }
    } catch (error) {
      console.error('Error processing redemption:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Memuat data redemptions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Redemptions Management</h1>
          <p className="text-muted-foreground">Kelola permintaan penukaran reward</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
          Kembali ke Dashboard
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filter Status</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Redemptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRedemptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Tidak ada redemption ditemukan
              </p>
            ) : (
              filteredRedemptions.map((redemption) => {
                const config = statusConfig[redemption.status]
                const Icon = config.icon
                
                return (
                  <div
                    key={redemption.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedRedemption(redemption)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{redemption.rewardName}</h3>
                          <Badge variant={redemption.status === 'PENDING' ? 'default' : 'secondary'}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {redemption.rewardDescription}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{redemption.userName}</span>
                          <span className="text-muted-foreground">{redemption.userEmail}</span>
                          <span className="font-medium">{redemption.pointsSpent} poin</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ditukar: {new Date(redemption.redeemedAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRedemption} onOpenChange={() => setSelectedRedemption(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detail Redemption</DialogTitle>
          </DialogHeader>
          {selectedRedemption && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Reward</p>
                <p className="text-lg font-semibold">{selectedRedemption.rewardName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRedemption.rewardDescription}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">User</p>
                  <p>{selectedRedemption.userName}</p>
                  <p className="text-xs text-muted-foreground">{selectedRedemption.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Points</p>
                  <p className="text-lg font-semibold">{selectedRedemption.pointsSpent}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge>
                  {statusConfig[selectedRedemption.status].label}
                </Badge>
              </div>
              
              {selectedRedemption.notes && (
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm">{selectedRedemption.notes}</p>
                </div>
              )}
              
              {selectedRedemption.status === 'PENDING' && (
                <>
                  <div>
                    <p className="text-sm font-medium mb-2">Notes (optional)</p>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tambahkan catatan..."
                      rows={3}
                    />
                  </div>
                  
                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleProcessRedemption(selectedRedemption.id, 'REJECTED')}
                      disabled={processingId === selectedRedemption.id}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleProcessRedemption(selectedRedemption.id, 'APPROVED')}
                      disabled={processingId === selectedRedemption.id}
                    >
                      Approve
                    </Button>
                  </DialogFooter>
                </>
              )}
              
              {selectedRedemption.status === 'APPROVED' && (
                <DialogFooter>
                  <Button
                    onClick={() => handleProcessRedemption(selectedRedemption.id, 'DELIVERED')}
                    disabled={processingId === selectedRedemption.id}
                  >
                    Mark as Delivered
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 