'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, Trophy, Gift, BarChart3, Users, TrendingUp, Target, 
  Edit, Plus, Save, ArrowLeft, AlertTriangle, Info
} from 'lucide-react'
import { toast } from 'sonner'

interface PointActivity {
  id: string
  activityCode: string
  activityName: string
  description?: string
  basePoints: number
  isActive: boolean
}

interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  quantity: number
  category?: string
  imageUrl?: string
  stockAlertThreshold?: number
  maxPerUser?: number
  isActive: boolean
}

interface PointsAnalytics {
  totalUsers: number
  totalPointsDistributed: number
  activeUsers: number
  topActivities: Array<{
    activity_name: string
    count: number
    totalPoints: number
  }>
  redemptionStats: Array<{
    status: string
    count: number
    totalPoints: number
  }>
}

export default function PointsSystemAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pointActivities, setPointActivities] = useState<PointActivity[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [analytics, setAnalytics] = useState<PointsAnalytics | null>(null)
  const [editingActivity, setEditingActivity] = useState<PointActivity | null>(null)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [newReward, setNewReward] = useState({
    name: '',
    description: '',
    pointsCost: '',
    quantity: '',
    category: 'general',
    stockAlertThreshold: '5',
    maxPerUser: '-1'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])



  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [activitiesRes, rewardsRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/points/activities'),
        fetch('/api/admin/rewards'),
        fetch('/api/admin/points/analytics')
      ])
      
      if (activitiesRes.ok) {
        const data = await activitiesRes.json()
        setPointActivities(data.data || [])
      }
      
      if (rewardsRes.ok) {
        const data = await rewardsRes.json()
        setRewards(data.data || [])
      }
      
      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setAnalytics(data.data || null)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveActivity = async () => {
    if (!editingActivity) return
    
    try {
      setSaving(true)
      const response = await fetch('/api/admin/points/activities', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activityCode: editingActivity.activityCode,
          basePoints: editingActivity.basePoints,
          isActive: editingActivity.isActive
        })
      })
      
      if (response.ok) {
        toast.success('Activity berhasil diperbarui')
        setEditingActivity(null)
        fetchData()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal memperbarui activity')
      }
    } catch (error) {
      console.error('Error saving activity:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateReward = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReward)
      })
      
      if (response.ok) {
        toast.success('Reward berhasil dibuat')
        setNewReward({
          name: '',
          description: '',
          pointsCost: '',
          quantity: '',
          category: 'general',
          stockAlertThreshold: '5',
          maxPerUser: '-1'
        })
        fetchData()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal membuat reward')
      }
    } catch (error) {
      console.error('Error creating reward:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateReward = async () => {
    if (!editingReward) return
    
    try {
      setSaving(true)
      const response = await fetch('/api/admin/rewards', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingReward)
      })
      
      if (response.ok) {
        toast.success('Reward berhasil diperbarui')
        setEditingReward(null)
        fetchData()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal memperbarui reward')
      }
    } catch (error) {
      console.error('Error updating reward:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Memuat sistem poin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Points System Management
          </h1>
          <p className="text-muted-foreground">Kelola konfigurasi sistem poin dan reward</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Dashboard
        </Button>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{analytics.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Points Distributed</p>
                  <p className="text-2xl font-bold">{analytics.totalPointsDistributed.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Users (30d)</p>
                  <p className="text-2xl font-bold">{analytics.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Redemptions (30d)</p>
                  <p className="text-2xl font-bold">
                    {analytics.redemptionStats.reduce((sum, stat) => sum + stat.count, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="activities" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activities">Point Activities</TabsTrigger>
          <TabsTrigger value="rewards">Rewards Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Konfigurasi Nilai Poin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pointActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{activity.activityName}</h3>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <Badge variant={activity.isActive ? 'default' : 'secondary'} className="mt-1">
                        {activity.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">{activity.basePoints}</p>
                        <p className="text-xs text-muted-foreground">poin</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingActivity(activity)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Manajemen Rewards
                </span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Reward
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Tambah Reward Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nama Reward</Label>
                        <Input
                          id="name"
                          value={newReward.name}
                          onChange={(e) => setNewReward({...newReward, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                          id="description"
                          value={newReward.description}
                          onChange={(e) => setNewReward({...newReward, description: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="pointsCost">Biaya Poin</Label>
                          <Input
                            id="pointsCost"
                            type="number"
                            value={newReward.pointsCost}
                            onChange={(e) => setNewReward({...newReward, pointsCost: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="quantity">Stok</Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={newReward.quantity}
                            onChange={(e) => setNewReward({...newReward, quantity: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="category">Kategori</Label>
                        <Select value={newReward.category} onValueChange={(value) => setNewReward({...newReward, category: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="gift-card">Gift Card</SelectItem>
                            <SelectItem value="merchandise">Merchandise</SelectItem>
                            <SelectItem value="voucher">Voucher</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateReward} disabled={saving}>
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {rewards.map((reward) => (
                  <Card key={reward.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{reward.name}</h3>
                          {reward.category && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {reward.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{reward.pointsCost} poin</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingReward(reward)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{reward.description}</p>
                      <div className="flex justify-between items-center text-xs">
                        <span>Stok: {reward.quantity === -1 ? 'Unlimited' : reward.quantity}</span>
                        <Badge variant={reward.isActive ? 'default' : 'secondary'}>
                          {reward.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {reward.quantity !== -1 && reward.quantity <= (reward.stockAlertThreshold || 5) && (
                        <div className="flex items-center gap-1 mt-2 text-orange-600">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="text-xs">Stok rendah!</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Activities (30 hari terakhir)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics?.topActivities.map((activity, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm">{activity.activity_name}</span>
                      <div className="text-right">
                        <p className="font-semibold">{activity.totalPoints} poin</p>
                        <p className="text-xs text-muted-foreground">{activity.count}x</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Redemptions (30 hari terakhir)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics?.redemptionStats.map((stat, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm capitalize">{stat.status.toLowerCase()}</span>
                      <div className="text-right">
                        <p className="font-semibold">{stat.count}</p>
                        <p className="text-xs text-muted-foreground">{stat.totalPoints} poin</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Leaderboard Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold">Reset Leaderboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Reset leaderboard data based on different criteria. Use with caution!
                  </p>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100">
                          Reset Weekly
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reset Weekly Leaderboard</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            This will reset current streaks for users who haven't been active in the last 7 days.
                          </p>
                          <div>
                            <Label>Reason for Reset</Label>
                            <Input placeholder="e.g., Weekly period ended" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline">Cancel</Button>
                          <Button className="bg-orange-600 hover:bg-orange-700">
                            Reset Weekly
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100">
                          Reset Monthly
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reset Monthly Leaderboard</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            This will reset current streaks for users who haven't been active in the last 30 days.
                          </p>
                          <div>
                            <Label>Reason for Reset</Label>
                            <Input placeholder="e.g., Monthly period ended" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline">Cancel</Button>
                          <Button className="bg-red-600 hover:bg-red-700">
                            Reset Monthly
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Advanced Reset Options</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete system resets for special occasions or system maintenance.
                  </p>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Reset All Points
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Danger: Reset All Points
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800 font-semibold">
                              ⚠️ This action cannot be undone!
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                              This will reset all user points to 0 while keeping their earning history.
                            </p>
                          </div>
                          <div>
                            <Label>Reason for Reset *</Label>
                            <Input placeholder="e.g., New year reset, System migration" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline">Cancel</Button>
                          <Button variant="destructive">
                            I Understand, Reset All Points
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Full System Reset
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Danger: Full System Reset
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800 font-semibold">
                              ⚠️ This action cannot be undone!
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                              This will reset ALL user data including points, streaks, and earning history.
                            </p>
                          </div>
                          <div>
                            <Label>Reason for Reset *</Label>
                            <Input placeholder="e.g., Complete system migration" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline">Cancel</Button>
                          <Button variant="destructive">
                            I Understand, Full Reset
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Activity Dialog */}
      <Dialog open={!!editingActivity} onOpenChange={() => setEditingActivity(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Activity: {editingActivity?.activityName}</DialogTitle>
          </DialogHeader>
          {editingActivity && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="basePoints">Nilai Poin</Label>
                <Input
                  id="basePoints"
                  type="number"
                  value={editingActivity.basePoints}
                  onChange={(e) => setEditingActivity({
                    ...editingActivity,
                    basePoints: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={editingActivity.isActive}
                  onCheckedChange={(checked) => setEditingActivity({
                    ...editingActivity,
                    isActive: checked
                  })}
                />
                <Label htmlFor="isActive">Aktif</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingActivity(null)}>
              Batal
            </Button>
            <Button onClick={handleSaveActivity} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Reward Dialog */}
      <Dialog open={!!editingReward} onOpenChange={() => setEditingReward(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Reward</DialogTitle>
          </DialogHeader>
          {editingReward && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="rewardName">Nama</Label>
                <Input
                  id="rewardName"
                  value={editingReward.name}
                  onChange={(e) => setEditingReward({
                    ...editingReward,
                    name: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="rewardPointsCost">Biaya Poin</Label>
                <Input
                  id="rewardPointsCost"
                  type="number"
                  value={editingReward.pointsCost}
                  onChange={(e) => setEditingReward({
                    ...editingReward,
                    pointsCost: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              <div>
                <Label htmlFor="rewardQuantity">Stok</Label>
                <Input
                  id="rewardQuantity"
                  type="number"
                  value={editingReward.quantity}
                  onChange={(e) => setEditingReward({
                    ...editingReward,
                    quantity: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="rewardActive"
                  checked={editingReward.isActive}
                  onCheckedChange={(checked) => setEditingReward({
                    ...editingReward,
                    isActive: checked
                  })}
                />
                <Label htmlFor="rewardActive">Aktif</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReward(null)}>
              Batal
            </Button>
            <Button onClick={handleUpdateReward} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 