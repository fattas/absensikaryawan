'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Gift, Trophy, Star, X, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface RewardNotification {
  id: string
  type: 'REWARD_ELIGIBLE' | 'BADGE_EARNED' | 'STREAK_BONUS' | 'POINTS_EARNED'
  title: string
  message: string
  points?: number
  rewardId?: string
  rewardName?: string
  badgeName?: string
  timestamp: Date
  isRead: boolean
}

interface RewardNotificationProps {
  userId: string
  onNotificationRead?: (notificationId: string) => void
}

export function RewardNotificationSystem({ userId, onNotificationRead }: RewardNotificationProps) {
  const [notifications, setNotifications] = useState<RewardNotification[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [currentNotification, setCurrentNotification] = useState<RewardNotification | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check for new notifications every 30 seconds
    const interval = setInterval(checkForNotifications, 30000)
    checkForNotifications() // Initial check
    
    return () => clearInterval(interval)
  }, [userId])

  const checkForNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications/user?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const newNotifications = data.data || []
        
        // Show toast for new unread notifications
        newNotifications.forEach((notification: RewardNotification) => {
          if (!notification.isRead && !notifications.find(n => n.id === notification.id)) {
            showNotificationToast(notification)
          }
        })
        
        setNotifications(newNotifications)
      }
    } catch (error) {
      console.error('Error checking notifications:', error)
    }
  }

  const showNotificationToast = (notification: RewardNotification) => {
    const icon = getNotificationIcon(notification.type)
    
    toast.custom((t) => (
      <Card className="w-80 border-l-4 border-l-primary bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {icon}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{notification.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
              {notification.points && (
                <Badge variant="secondary" className="mt-2">
                  +{notification.points} poin
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCurrentNotification(notification)
                  setShowDialog(true)
                  toast.dismiss(t)
                }}
                className="h-6 w-6 p-0"
              >
                <Gift className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  markAsRead(notification.id)
                  toast.dismiss(t)
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    ), {
      duration: 8000,
      position: 'top-right'
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'REWARD_ELIGIBLE':
        return <Gift className="h-5 w-5 text-purple-500" />
      case 'BADGE_EARNED':
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 'STREAK_BONUS':
        return <Star className="h-5 w-5 text-blue-500" />
      case 'POINTS_EARNED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Gift className="h-5 w-5 text-gray-500" />
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId })
      })
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
      
      onNotificationRead?.(notificationId)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleRedeemReward = async () => {
    if (!currentNotification?.rewardId) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rewardId: currentNotification.rewardId })
      })
      
      if (response.ok) {
        toast.success('Reward berhasil ditukar!')
        setShowDialog(false)
        markAsRead(currentNotification.id)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menukar reward')
      }
    } catch (error) {
      console.error('Error redeeming reward:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Notification Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {currentNotification && getNotificationIcon(currentNotification.type)}
              {currentNotification?.title}
            </DialogTitle>
          </DialogHeader>
          {currentNotification && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {currentNotification.message}
              </p>
              
              {currentNotification.points && (
                <div className="flex items-center justify-center">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    +{currentNotification.points} poin
                  </Badge>
                </div>
              )}
              
              {currentNotification.rewardName && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                  <h4 className="font-semibold text-center">Reward Tersedia!</h4>
                  <p className="text-center text-lg font-bold text-purple-600 mt-1">
                    {currentNotification.rewardName}
                  </p>
                </div>
              )}
              
              {currentNotification.badgeName && (
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border">
                  <h4 className="font-semibold text-center">Badge Baru!</h4>
                  <p className="text-center text-lg font-bold text-yellow-600 mt-1">
                    {currentNotification.badgeName}
                  </p>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground text-center">
                {new Date(currentNotification.timestamp).toLocaleString('id-ID')}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (currentNotification) markAsRead(currentNotification.id)
                setShowDialog(false)
              }}
            >
              Tutup
            </Button>
            {currentNotification?.type === 'REWARD_ELIGIBLE' && (
              <Button
                onClick={handleRedeemReward}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? 'Menukar...' : 'Tukar Sekarang'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Notification Bell Component for Header
export function NotificationBell({ userId }: { userId: string }) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const checkUnreadCount = async () => {
      try {
        const response = await fetch(`/api/notifications/unread-count?userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.count || 0)
        }
      } catch (error) {
        console.error('Error checking unread count:', error)
      }
    }

    checkUnreadCount()
    const interval = setInterval(checkUnreadCount, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [userId])

  if (unreadCount === 0) return null

  return (
    <div className="relative">
      <Badge
        variant="destructive"
        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
      >
        {unreadCount > 9 ? '9+' : unreadCount}
      </Badge>
    </div>
  )
} 