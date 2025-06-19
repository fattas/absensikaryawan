'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Trophy, Medal, Award, Star, Crown, Gem, Target, Calendar, 
  TrendingUp, Clock, Gift, Info, HelpCircle, Zap, CheckCircle2,
  AlertCircle, Users, BookOpen
} from 'lucide-react'

interface PointActivity {
  activityCode: string
  activityName: string
  description: string
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
}

export function PointsSystemGuide() {
  const [pointActivities, setPointActivities] = useState<PointActivity[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [activitiesRes, rewardsRes] = await Promise.all([
        fetch('/api/admin/points/activities'),
        fetch('/api/rewards/available/enhanced')
      ])
      
      if (activitiesRes.ok) {
        const data = await activitiesRes.json()
        setPointActivities(data.data || [])
      }
      
      if (rewardsRes.ok) {
        const data = await rewardsRes.json()
        setRewards(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching guide data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBadgeIcon = (level: string) => {
    switch (level) {
      case 'BRONZE':
        return <Medal className="h-4 w-4 text-orange-600" />
      case 'SILVER':
        return <Medal className="h-4 w-4 text-gray-400" />
      case 'GOLD':
        return <Trophy className="h-4 w-4 text-yellow-500" />
      case 'PLATINUM':
        return <Crown className="h-4 w-4 text-blue-400" />
      case 'DIAMOND':
        return <Gem className="h-4 w-4 text-purple-500" />
      default:
        return <Star className="h-4 w-4 text-gray-400" />
    }
  }

  const rewardTiers = [
    { points: 50, tier: 'BRONZE', icon: <Medal className="h-5 w-5 text-orange-600" />, rewards: rewards.filter(r => r.pointsCost <= 100) },
    { points: 100, tier: 'SILVER', icon: <Medal className="h-5 w-5 text-gray-400" />, rewards: rewards.filter(r => r.pointsCost > 100 && r.pointsCost <= 250) },
    { points: 250, tier: 'GOLD', icon: <Trophy className="h-5 w-5 text-yellow-500" />, rewards: rewards.filter(r => r.pointsCost > 250 && r.pointsCost <= 500) },
    { points: 500, tier: 'PLATINUM', icon: <Crown className="h-5 w-5 text-blue-400" />, rewards: rewards.filter(r => r.pointsCost > 500) }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl text-blue-900">
            <BookOpen className="h-6 w-6" />
            Panduan Sistem Poin & Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800 mb-4">
            Sistem poin dirancang untuk memberikan reward kepada karyawan yang konsisten dalam kehadiran dan performa. 
            Dapatkan poin setiap hari dan tukarkan dengan berbagai reward menarik!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-blue-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>Poin otomatis diberikan</span>
            </div>
            <div className="flex items-center gap-2 text-blue-700">
              <Trophy className="h-4 w-4" />
              <span>Kompetisi fair & transparan</span>
            </div>
            <div className="flex items-center gap-2 text-blue-700">
              <Gift className="h-4 w-4" />
              <span>Reward menarik tersedia</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="earning" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="earning">Cara Dapat Poin</TabsTrigger>
          <TabsTrigger value="rewards">Reward Tiers</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="tips">Tips & Strategi</TabsTrigger>
        </TabsList>

        <TabsContent value="earning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Aktivitas yang Memberikan Poin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Regular Activities */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Aktivitas Harian
                  </h3>
                  <div className="grid gap-3">
                    {pointActivities.filter(activity => activity.isActive).map((activity) => (
                      <div key={activity.activityCode} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <p className="font-medium text-green-900">{activity.activityName}</p>
                          <p className="text-xs text-green-700">{activity.description}</p>
                        </div>
                        <Badge className="bg-green-600 text-white">
                          +{activity.basePoints} poin
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Bonus Activities */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    Bonus Poin Spesial
                  </h3>
                  <div className="space-y-3">
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-semibold text-yellow-800">Early Bird Bonus</p>
                          <p className="text-yellow-700">Check-in sebelum jam 06:30 mendapat <strong>+5 poin bonus</strong> di atas poin check-in reguler</p>
                        </div>
                      </AlertDescription>
                    </Alert>

                    <Alert className="border-blue-200 bg-blue-50">
                      <Award className="h-4 w-4 text-blue-600" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-semibold text-blue-800">Perfect Week Streak</p>
                          <p className="text-blue-700">5 hari berturut-turut on-time check-in mendapat <strong>+25 poin bonus</strong></p>
                        </div>
                      </AlertDescription>
                    </Alert>

                    <Alert className="border-purple-200 bg-purple-50">
                      <Crown className="h-4 w-4 text-purple-600" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-semibold text-purple-800">Perfect Month Achievement</p>
                          <p className="text-purple-700">20+ hari on-time check-in dalam sebulan mendapat <strong>+50 poin bonus</strong></p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                <Separator />

                {/* Point Rules */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    Aturan Penting
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Poin diberikan secara otomatis setelah setiap aktivitas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Check-in terlambat masih mendapat poin, namun berkurang sesuai durasi keterlambatan</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Poin tidak memiliki tanggal kedaluwarsa</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Maksimal satu kali bonus per kategori per hari</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-600" />
                Tingkatan Reward
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {rewardTiers.map((tier, index) => (
                  <div key={tier.tier}>
                    <div className="flex items-center gap-3 mb-3">
                      {tier.icon}
                      <h3 className="text-lg font-semibold">{tier.tier} TIER</h3>
                      <Badge variant="outline">{tier.points}+ poin</Badge>
                    </div>
                    
                    {tier.rewards.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {tier.rewards.slice(0, 4).map((reward) => (
                          <div key={reward.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                            <div>
                              <p className="font-medium">{reward.name}</p>
                              <p className="text-xs text-muted-foreground">{reward.description}</p>
                            </div>
                            <Badge variant="secondary">{reward.pointsCost} poin</Badge>
                          </div>
                        ))}
                        {tier.rewards.length > 4 && (
                          <div className="col-span-2 text-center text-sm text-muted-foreground">
                            +{tier.rewards.length - 4} reward lainnya...
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">Reward akan ditambahkan segera</p>
                    )}
                    
                    {index < rewardTiers.length - 1 && <Separator className="mt-6" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Cara Kerja Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Periode Evaluasi</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900">All Time</h4>
                      <p className="text-sm text-blue-700">Peringkat berdasarkan total poin sepanjang waktu</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900">Monthly</h4>
                      <p className="text-sm text-green-700">Peringkat untuk bulan berjalan, reset setiap awal bulan</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-medium text-purple-900">Weekly</h4>
                      <p className="text-sm text-purple-700">Peringkat mingguan, reset setiap hari Senin</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <h4 className="font-medium text-orange-900">Daily</h4>
                      <p className="text-sm text-orange-700">Peringkat untuk hari ini saja</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Kriteria Ranking</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <ol className="space-y-2 text-sm">
                      <li className="flex gap-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        <span><strong>Total Poin:</strong> User dengan poin tertinggi menempati peringkat teratas</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <span><strong>Total Earned:</strong> Jika poin sama, total poin yang pernah diperoleh menjadi tiebreaker</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        <span><strong>Update Real-time:</strong> Ranking diperbarui setiap kali ada aktivitas baru</span>
                      </li>
                    </ol>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Fitur Leaderboard</h3>
                  <div className="space-y-3">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Klik pada profil user</strong> di leaderboard untuk melihat detail performa mereka including badges, streaks, dan pencapaian lainnya.
                      </AlertDescription>
                    </Alert>
                    <Alert>
                      <Trophy className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Top 3 performer</strong> mendapat ikon khusus (trophy untuk #1, medal untuk #2 dan #3).
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Tips Memaksimalkan Poin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 text-green-700">🌅 Strategi Harian</h3>
                  <div className="space-y-3">
                    <div className="flex gap-3 p-3 bg-green-50 rounded-lg">
                      <Clock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">Check-in Pagi</p>
                        <p className="text-sm text-green-700">Datang sebelum 06:30 untuk mendapat early bird bonus +5 poin</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Konsistensi adalah Kunci</p>
                        <p className="text-sm text-blue-700">Check-in tepat waktu setiap hari untuk membangun streak</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3 text-orange-700">🎯 Smart Redemption</h3>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <ul className="space-y-2 text-sm text-orange-800">
                      <li className="flex items-start gap-2">
                        <Gift className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span>Simpan poin untuk reward yang lebih berharga daripada menukar segera</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span>Perhatikan stok reward - item populer cepat habis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span>Gunakan progress bar untuk merencanakan target reward berikutnya</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 