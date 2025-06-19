'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Trophy, Medal, Award, Star, Crown, Gem, ChevronDown, ChevronUp, 
  Info, History, Target, Calendar, TrendingUp, Clock, Gift, 
  HelpCircle, Users, Zap, AlertCircle, CheckCircle2, BookOpen
} from 'lucide-react'
import { toast } from 'sonner'
import { PointsSystemGuide } from '@/components/points-system-guide'

interface LeaderboardEntry {
  userId: string
  userName: string
  points: number
  totalEarned: number
  currentStreak: number
  badges: number
  rank: number
}

interface UserPointsDetail {
  userId: string
  points: number
  totalEarned: number
  currentStreak: number
  longestStreak: number
  badges: Array<{
    id: string
    name: string
    description: string
    icon: string
    level: string
    earnedAt: Date
  }>
  history: Array<{
    id: string
    points: number
    reason: string
    activityCode?: string
    metadata?: any
    date: Date
  }>
  nextReward?: {
    reward: Reward
    pointsNeeded: number
    progress: number
  }
}

interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  quantity: number
  isActive: boolean
  category?: string
  userRedemptionCount?: number
}

interface PointTerms {
  id: string
  title: string
  content: string
  category: 'earning' | 'redemption' | 'general'
  displayOrder: number
}

interface PointActivity {
  activityCode: string
  activityName: string
  description: string
  basePoints: number
  isActive: boolean
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

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />
    case 3:
      return <Medal className="h-5 w-5 text-orange-600" />
    default:
      return null
  }
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userPoints, setUserPoints] = useState<UserPointsDetail | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [pointsTerms, setPointsTerms] = useState<PointTerms[]>([])
  const [pointActivities, setPointActivities] = useState<PointActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [redeemingReward, setRedeemingReward] = useState<string | null>(null)
  const [showPointsHistory, setShowPointsHistory] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('points')
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('all-time')
  const [selectedUserProfile, setSelectedUserProfile] = useState<LeaderboardEntry | null>(null)
  const [showSystemGuide, setShowSystemGuide] = useState(false)

  useEffect(() => {
    fetchData()
  }, [leaderboardPeriod])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [leaderboardRes, userPointsRes, rewardsRes, termsRes, activitiesRes] = await Promise.all([
        fetch(`/api/points/leaderboard?limit=20&period=${leaderboardPeriod}`),
        fetch('/api/points/user/detailed'),
        fetch('/api/rewards/available/enhanced'),
        fetch('/api/points/terms'),
        fetch('/api/admin/points/activities')
      ])
      
      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json()
        setLeaderboard(data.data)
      }
      
      if (userPointsRes.ok) {
        const data = await userPointsRes.json()
        setUserPoints(data.data)
      }
      
      if (rewardsRes.ok) {
        const data = await rewardsRes.json()
        setRewards(data.data)
      }
      
      if (termsRes.ok) {
        const data = await termsRes.json()
        setPointsTerms(data.data)
      }

      if (activitiesRes.ok) {
        const data = await activitiesRes.json()
        setPointActivities(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleRedeemReward = async (rewardId: string) => {
    try {
      setRedeemingReward(rewardId)
      
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rewardId })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message || 'Reward berhasil ditukar!')
        fetchData() // Refresh data
      } else {
        toast.error(data.error || 'Gagal menukar reward')
      }
    } catch (error) {
      console.error('Error redeeming reward:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setRedeemingReward(null)
    }
  }

  const getPointsBreakdown = () => {
    if (!userPoints?.history) return []
    
    const breakdown = new Map()
    userPoints.history.forEach(entry => {
      const key = entry.activityCode || 'other'
      if (!breakdown.has(key)) {
        breakdown.set(key, {
          activity: entry.reason,
          totalPoints: 0,
          count: 0,
          lastEarned: entry.date
        })
      }
      const current = breakdown.get(key)
      current.totalPoints += entry.points
      current.count += 1
      if (new Date(entry.date) > new Date(current.lastEarned)) {
        current.lastEarned = entry.date
      }
    })
    
    return Array.from(breakdown.values()).sort((a, b) => b.totalPoints - a.totalPoints)
  }

  const getMyRankInfo = () => {
    if (!userPoints) return null
    
    const myRank = leaderboard.find(entry => entry.userId === userPoints.userId)
    if (!myRank) return null
    
    const higherRankedUser = leaderboard.find(entry => entry.rank === myRank.rank - 1)
    const pointsToNextRank = higherRankedUser ? higherRankedUser.points - myRank.points : 0
    
    return {
      ...myRank,
      pointsToNextRank,
      higherRankedUser
    }
  }

  const filteredRewards = rewards.filter(reward => {
    if (filterCategory === 'all') return true
    return reward.category === filterCategory
  })

  const rewardCategories = [...new Set(rewards.map(r => r.category).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Memuat leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Leaderboard & Rewards</h1>
          <p className="text-muted-foreground">Lihat peringkat, kelola poin, dan tukar reward</p>
        </div>

        {/* Points System Information Panel */}
        <Alert className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900">📊 Sistem Poin - Periode: {leaderboardPeriod === 'all-time' ? 'Sepanjang Waktu' : leaderboardPeriod === 'monthly' ? 'Bulan Ini' : leaderboardPeriod === 'weekly' ? 'Minggu Ini' : 'Hari Ini'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span><strong>Update:</strong> Real-time setiap aktivitas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span><strong>Reset:</strong> {leaderboardPeriod === 'weekly' ? 'Setiap Minggu' : leaderboardPeriod === 'monthly' ? 'Setiap Bulan' : 'Tidak ada reset'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-purple-600" />
                  <span><strong>Rewards:</strong> {rewards.length} tersedia</span>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Points Criteria Display */}
        <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Target className="h-5 w-5" />
              Cara Mendapat Poin
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-green-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Poin diberikan secara otomatis berdasarkan aktivitas kehadiran Anda</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pointActivities.filter(activity => activity.isActive).map((activity) => (
                <div key={activity.activityCode} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-green-200">
                  <div>
                    <p className="font-medium text-green-900">{activity.activityName}</p>
                    <p className="text-xs text-green-700">{activity.description}</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-600 text-white">
                    +{activity.basePoints}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800">
                <Zap className="h-4 w-4" />
                <span className="font-semibold">Bonus Poin:</span>
              </div>
              <div className="mt-2 text-sm text-amber-700 space-y-1">
                <p>• <strong>Early Bird (sebelum 06:30):</strong> +5 poin bonus</p>
                <p>• <strong>Perfect Week (5 hari berturut-turut):</strong> +25 poin bonus</p>
                <p>• <strong>Perfect Month (20+ hari dalam sebulan):</strong> +50 poin bonus</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced User Stats Card */}
        {userPoints && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Dashboard Poin Anda</span>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-2xl font-bold text-yellow-600">{userPoints.points}</span>
                  <span className="text-sm text-muted-foreground">Poin Saat Ini</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1 text-xs">
                          <p>Poin Saat Ini: {userPoints.points}</p>
                          <p>Total Diperoleh: {userPoints.totalEarned}</p>
                          <p>Poin dapat digunakan untuk menukar reward</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* My Rank Information */}
              {(() => {
                const rankInfo = getMyRankInfo()
                return rankInfo && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                          {getRankIcon(rankInfo.rank) || (
                            <span className="text-lg font-bold text-purple-600">
                              #{rankInfo.rank}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-purple-900">Peringkat Anda: #{rankInfo.rank}</h3>
                          <p className="text-sm text-purple-700">
                            {rankInfo.pointsToNextRank > 0 
                              ? `${rankInfo.pointsToNextRank} poin lagi untuk naik peringkat`
                              : 'Anda di peringkat teratas!'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-purple-300 text-purple-700">
                        {rankInfo.points} poin
                      </Badge>
                    </div>
                  </div>
                )
              })()}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-xl font-semibold">{userPoints.totalEarned}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-xl font-semibold">{userPoints.currentStreak} hari</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Target className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">Best Streak</p>
                  <p className="text-xl font-semibold">{userPoints.longestStreak} hari</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Award className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">Badges</p>
                  <p className="text-xl font-semibold">{userPoints.badges.length}</p>
                </div>
              </div>

              {/* Progress to Next Reward */}
              {userPoints.nextReward && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">Progress to Next Reward</h3>
                    <Gift className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{userPoints.nextReward.reward.name}</span>
                      <span className="font-medium">
                        {userPoints.nextReward.pointsNeeded} poin lagi
                      </span>
                    </div>
                    <Progress value={userPoints.nextReward.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {userPoints.points}/{userPoints.nextReward.reward.pointsCost} poin
                    </p>
                  </div>
                </div>
              )}

              {/* Points Breakdown */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Rincian Perolehan Poin
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {getPointsBreakdown().map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                      <div>
                        <p className="font-medium text-sm">{item.activity}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.count}x • Terakhir: {formatDate(item.lastEarned)}
                        </p>
                      </div>
                      <Badge variant="secondary">+{item.totalPoints}</Badge>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Badges Display */}
              {userPoints.badges.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Badges Anda
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {userPoints.badges.map((badge) => (
                      <Badge key={badge.id} variant="secondary" className="flex items-center gap-1">
                        {getBadgeIcon(badge.level)}
                        {badge.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <History className="h-4 w-4 mr-2" />
                      Riwayat Poin
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Riwayat Perolehan Poin</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-96">
                      <div className="space-y-2">
                        {userPoints.history.map((entry) => (
                          <div key={entry.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{entry.reason}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(entry.date)}
                              </p>
                              {entry.metadata && (
                                <p className="text-xs text-blue-600">
                                  {JSON.stringify(entry.metadata)}
                                </p>
                              )}
                            </div>
                            <Badge variant={entry.points > 0 ? 'default' : 'destructive'}>
                              {entry.points > 0 ? '+' : ''}{entry.points}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Info className="h-4 w-4 mr-2" />
                      Syarat & Ketentuan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Syarat & Ketentuan Poin</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-96">
                      <div className="space-y-4">
                        {['earning', 'redemption', 'general'].map(category => {
                          const categoryTerms = pointsTerms.filter(t => t.category === category)
                          if (categoryTerms.length === 0) return null
                          
                          return (
                            <div key={category}>
                              <h3 className="font-semibold mb-2 capitalize">
                                {category === 'earning' ? 'Cara Mendapat Poin' : 
                                 category === 'redemption' ? 'Penukaran Reward' : 'Umum'}
                              </h3>
                              <div className="space-y-2">
                                {categoryTerms.map(term => (
                                  <div key={term.id} className="p-3 bg-muted/50 rounded-lg">
                                    <h4 className="font-medium text-sm">{term.title}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">{term.content}</p>
                                  </div>
                                ))}
                              </div>
                              <Separator className="my-4" />
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Top Performers</span>
                  <div className="flex items-center gap-4">
                    <select
                      value={leaderboardPeriod}
                      onChange={(e) => setLeaderboardPeriod(e.target.value)}
                      className="px-3 py-1 border rounded-md text-sm"
                    >
                      <option value="all-time">All Time</option>
                      <option value="monthly">This Month</option>
                      <option value="weekly">This Week</option>
                      <option value="daily">Today</option>
                    </select>
                    <div className="text-sm text-muted-foreground">
                      Updated setiap hari
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                        entry.userId === userPoints?.userId 
                          ? 'bg-primary/10 border-primary/20' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedUserProfile(entry)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10">
                          {getRankIcon(entry.rank) || (
                            <span className="text-lg font-bold text-muted-foreground">
                              {entry.rank}
                            </span>
                          )}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {entry.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {entry.userName}
                            {entry.userId === userPoints?.userId && (
                              <span className="text-xs text-primary ml-2 font-semibold">(Anda)</span>
                            )}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {entry.currentStreak} hari streak
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              {entry.badges} badges
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-yellow-600">{entry.points}</p>
                        <p className="text-xs text-muted-foreground">poin</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rewards">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tukar Poin Anda</span>
                  <div className="flex gap-2">
                    {rewardCategories.length > 0 && (
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-1 border rounded-md text-sm"
                      >
                        <option value="all">Semua Kategori</option>
                        {rewardCategories.map(cat => (
                          <option key={cat} value={cat} className="capitalize">
                            {cat}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredRewards.map((reward) => (
                    <Card key={reward.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">{reward.name}</h3>
                            {reward.category && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {reward.category}
                              </Badge>
                            )}
                          </div>
                          <Badge variant="secondary" className="font-bold">
                            {reward.pointsCost} poin
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {reward.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>
                              {reward.quantity === -1 
                                ? 'Unlimited' 
                                : `${reward.quantity} tersisa`}
                            </p>
                            {reward.userRedemptionCount !== undefined && reward.userRedemptionCount > 0 && (
                              <p className="text-blue-600">
                                Anda sudah menukar {reward.userRedemptionCount}x
                              </p>
                            )}
                          </div>
                          <Button
                            onClick={() => handleRedeemReward(reward.id)}
                            disabled={
                              !userPoints || 
                              userPoints.points < reward.pointsCost || 
                              reward.quantity === 0 ||
                              redeemingReward === reward.id
                            }
                            size="sm"
                            className="ml-2"
                          >
                            {redeemingReward === reward.id ? 'Menukar...' : 'Tukar'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

                 {/* User Profile Detail Dialog */}
         <Dialog open={!!selectedUserProfile} onOpenChange={() => setSelectedUserProfile(null)}>
           <DialogContent className="max-w-2xl">
             <DialogHeader>
               <DialogTitle className="flex items-center gap-3">
                 <Avatar className="h-12 w-12">
                   <AvatarFallback>
                     {selectedUserProfile?.userName.charAt(0).toUpperCase()}
                   </AvatarFallback>
                 </Avatar>
                 <div>
                   <h2 className="text-xl font-bold">{selectedUserProfile?.userName}</h2>
                   <p className="text-sm text-muted-foreground">Peringkat #{selectedUserProfile?.rank}</p>
                 </div>
               </DialogTitle>
             </DialogHeader>
             {selectedUserProfile && (
               <div className="space-y-4">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="text-center p-3 bg-muted/50 rounded-lg">
                     <Trophy className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                     <p className="text-sm text-muted-foreground">Current Points</p>
                     <p className="text-xl font-semibold">{selectedUserProfile.points}</p>
                   </div>
                   <div className="text-center p-3 bg-muted/50 rounded-lg">
                     <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
                     <p className="text-sm text-muted-foreground">Total Earned</p>
                     <p className="text-xl font-semibold">{selectedUserProfile.totalEarned}</p>
                   </div>
                   <div className="text-center p-3 bg-muted/50 rounded-lg">
                     <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                     <p className="text-sm text-muted-foreground">Current Streak</p>
                     <p className="text-xl font-semibold">{selectedUserProfile.currentStreak} hari</p>
                   </div>
                   <div className="text-center p-3 bg-muted/50 rounded-lg">
                     <Award className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                     <p className="text-sm text-muted-foreground">Badges</p>
                     <p className="text-xl font-semibold">{selectedUserProfile.badges}</p>
                   </div>
                 </div>

                 <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
                   <h3 className="font-semibold text-purple-900 mb-2">Performance Insights</h3>
                   <div className="space-y-2 text-sm text-purple-700">
                     <p>• Konsisten dalam kehadiran dengan streak {selectedUserProfile.currentStreak} hari</p>
                     <p>• Telah mengumpulkan {selectedUserProfile.totalEarned} total poin</p>
                     <p>• Meraih {selectedUserProfile.badges} badges pencapaian</p>
                     {selectedUserProfile.rank <= 3 && (
                       <p>• 🏆 Top performer - berada di peringkat {selectedUserProfile.rank}!</p>
                     )}
                   </div>
                 </div>
               </div>
             )}
           </DialogContent>
         </Dialog>

         {/* Points System Guide Dialog */}
         <Dialog open={showSystemGuide} onOpenChange={setShowSystemGuide}>
           <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                 <BookOpen className="h-5 w-5" />
                 Panduan Lengkap Sistem Poin
               </DialogTitle>
             </DialogHeader>
             <PointsSystemGuide />
           </DialogContent>
         </Dialog>

         {/* Floating Help Button */}
         <div className="fixed bottom-6 right-6 z-50">
           <Button
             onClick={() => setShowSystemGuide(true)}
             size="lg"
             className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-2 border-white"
           >
             <HelpCircle className="h-6 w-6" />
           </Button>
         </div>

         {/* Enhanced Help Tooltip */}
         <div className="fixed bottom-6 right-24 z-40 pointer-events-none">
           <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap animate-pulse">
             💡 Butuh bantuan? Klik untuk panduan lengkap!
           </div>
         </div>
        </div>
      </TooltipProvider>
    )
  } 