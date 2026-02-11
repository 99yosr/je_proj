'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { Bell, X, Check, Calendar, FolderKanban, Newspaper, Activity } from 'lucide-react'
import './NotificationBell.css'

type Notification = {
  id: number
  message: string
  createdAt: string
  isRead: boolean
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Get user ID from session
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (res.ok) {
          const user = await res.json()
          console.log('[NotificationBell] Fetched user:', user)
          setUserId(String(user.id))
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      }
    }
    fetchUser()
  }, [])

  // Connect to Socket.IO when userId is available
  useEffect(() => {
    if (!userId) return

    console.log('[NotificationBell] Connecting socket with userId:', userId)
    
    const socketInstance = io({
      query: { userId }
    })

    socketInstance.on('connect', () => {
      console.log('[NotificationBell] Socket connected! Socket ID:', socketInstance.id)
    })

    socketInstance.on('notification', (notification: Notification) => {
      console.log('[NotificationBell] New notification received:', notification)
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('New Notification', {
          body: notification.message,
          icon: '/favicon.ico'
        })
      }
    })
    
    socketInstance.on('disconnect', () => {
      console.log('[NotificationBell] Socket disconnected')
    })
    
    socketInstance.on('connect_error', (error) => {
      console.error('[NotificationBell] Socket connection error:', error)
    })

    setSocket(socketInstance)

    return () => {
      console.log('[NotificationBell] Cleaning up socket connection')
      socketInstance.disconnect()
    }
  }, [userId])

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [])

  // Fetch notifications on mount
  useEffect(() => {
    if (!userId) return

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications', {
          headers: {
            'x-user-id': userId
          }
        })
        if (res.ok) {
          const data = await res.json()
          setNotifications(data)
          setUnreadCount(data.filter((n: Notification) => !n.isRead).length)
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }
    fetchNotifications()
  }, [userId])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const notificationToDelete = notifications.find(n => n.id === id)
      
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
        
        // If the deleted notification was unread, decrement the counter
        if (notificationToDelete && !notificationToDelete.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getNotificationType = (message: string): 'event' | 'project' | 'news' | 'activity' => {
    const lowerMessage = message.toLowerCase()
    if (lowerMessage.includes('event')) return 'event'
    if (lowerMessage.includes('project')) return 'project'
    if (lowerMessage.includes('news')) return 'news'
    if (lowerMessage.includes('activity') || lowerMessage.includes('activité')) return 'activity'
    return 'activity' // default
  }

  const getNotificationIcon = (type: 'event' | 'project' | 'news' | 'activity') => {
    switch (type) {
      case 'event':
        return <Calendar size={20} className="notification-icon notification-icon-event" />
      case 'project':
        return <FolderKanban size={20} className="notification-icon notification-icon-project" />
      case 'news':
        return <Newspaper size={20} className="notification-icon notification-icon-news" />
      case 'activity':
        return <Activity size={20} className="notification-icon notification-icon-activity" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="notification-bell-container">
      <button 
        className="notification-bell-button"
        onClick={handleToggle}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <button 
              className="notification-close"
              onClick={() => setIsOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={40} opacity={0.3} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => {
                const notificationType = getNotificationType(notification.message)
                return (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                >
                  <div className="notification-icon-wrapper">
                    {getNotificationIcon(notificationType)}
                  </div>
                  <div className="notification-content">
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  <div className="notification-actions">
                    {!notification.isRead && (
                      <button
                        className="notification-mark-read"
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        title="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      className="notification-delete"
                      onClick={() => handleDelete(notification.id)}
                      title="Delete"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )})
            )}
          </div>
        </div>
      )}
    </div>
  )
}
