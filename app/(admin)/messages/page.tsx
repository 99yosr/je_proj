'use client'

import { useEffect, useState, useRef } from 'react'
import { Send } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import './style.css'

type User = {
  id: string
  name: string | null
  email: string
}

type Message = {
  id: string
  content: string
  senderId: string
  receiverId: string
  isRead: boolean
  createdAt: string
  User_Message_senderIdToUser?: User
  User_Message_receiverIdToUser?: User
}

export default function MessagesPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [userSearch, setUserSearch] = useState('')
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchCurrentUser()
    fetchUsers()
  }, [])

  // Fetch initial unread counts for all users
  useEffect(() => {
    if (currentUserId && users.length > 0) {
      fetchAllUnreadCounts()
    }
  }, [currentUserId, users])

  // Socket.IO connection
  useEffect(() => {
    if (!currentUserId) return

    console.log('🔌 Connecting to socket with userId:', currentUserId)
    const socket = io('http://localhost:3000', {
      query: { userId: currentUserId }
    })

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id)
    })

    socket.on('new-message', (message: Message) => {
      console.log('📨 Received new message via socket:', message)
      
      // Only add message if it's part of current conversation
      if (selectedUser && 
          (message.senderId === selectedUser.id || message.receiverId === selectedUser.id)) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.id === message.id)) return prev
          return [...prev, message]
        })
      } else if (message.receiverId === currentUserId && message.senderId !== currentUserId) {
        // Message received but not in current conversation - increment unread count
        setUnreadCounts(prev => ({
          ...prev,
          [message.senderId]: (prev[message.senderId] || 0) + 1
        }))
        
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification('New Message', {
            body: `${message.User_Message_senderIdToUser?.name || 'Someone'}: ${message.content}`,
            icon: '/favicon.ico'
          })
        }
      }
    })

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected')
    })

    socketRef.current = socket

    return () => {
      console.log('🔌 Disconnecting socket')
      socket.disconnect()
    }
  }, [currentUserId, selectedUser])

  useEffect(() => {
    if (selectedUser && currentUserId) {
      fetchMessages(selectedUser.id)
      // Clear unread count when selecting user
      setUnreadCounts(prev => {
        const updated = { ...prev }
        delete updated[selectedUser.id]
        return updated
      })
      // Mark messages as read from this user
      markMessagesAsRead(selectedUser.id)
    }
  }, [selectedUser, currentUserId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Filter users based on search
  const filteredUsers = users
    .filter(u => u.id !== currentUserId)
    .filter(u => {
      if (!userSearch) return true
      const search = userSearch.toLowerCase()
      return (
        (u.name?.toLowerCase().includes(search)) ||
        u.email.toLowerCase().includes(search)
      )
    })

  const fetchCurrentUser = async () => {
    console.log('🟢 Fetching current user...')
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        console.log('🟢 Current user:', data.email, 'ID:', data.id)
        setCurrentUserId(data.id)
      } else {
        console.error('❌ Failed to fetch current user, status:', res.status)
      }
    } catch (error) {
      console.error('❌ Error fetching current user:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (otherUserId: string) => {
    console.log('🟢 Fetching messages with user:', otherUserId)
    try {
      const res = await fetch(`/api/messages?otherUserId=${otherUserId}`, { 
        credentials: 'include' 
      })
      console.log('🟢 Fetch messages response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('🟢 Messages received:', data.messages?.length || 0)
        setMessages(data.messages)
      } else {
        console.error('❌ Failed to fetch messages:', await res.json())
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error)
    }
  }

  const markMessagesAsRead = async (senderId: string) => {
    try {
      await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ senderId })
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const fetchAllUnreadCounts = async () => {
    try {
      const res = await fetch('/api/messages/unread-by-sender', { 
        credentials: 'include' 
      })
      if (res.ok) {
        const data = await res.json()
        setUnreadCounts(data.counts || {})
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser || sending) return

    console.log('🟢 Sending message:', { to: selectedUser.email, content: newMessage.trim() })
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: newMessage.trim()
        })
      })

      console.log('🟢 Response status:', res.status)
      const data = await res.json()
      console.log('🟢 Response data:', data)

      if (res.ok) {
        console.log('✅ Message sent successfully')
        setNewMessage('')
        await fetchMessages(selectedUser.id)
      } else {
        console.error('❌ Failed to send message:', data)
        alert(`Failed to send message: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Error sending message:', error)
      alert('Error sending message. Check console for details.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="messages-page">
        <div className="messages-container">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="messages-page">
      <div className="messages-container">
        <div className="messages-header">
          <h1 className="messages-title">Messages</h1>
          <p className="messages-subtitle">Send and receive messages with other users</p>
        </div>

        <div className="messages-layout">
          {/* Users List */}
          <div className="users-list">
            <h2 className="users-list-title">Users</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="user-search-input"
              />
            </div>
            <div className="users-list-content">
              {filteredUsers.length === 0 ? (
                <div className="no-users-found">
                  <p>{userSearch ? 'No users found' : 'No other users'}</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="user-avatar">
                      {(user.name || user.email)[0].toUpperCase()}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{user.name || 'No Name'}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                    {unreadCounts[user.id] > 0 && (
                      <div className="unread-badge">{unreadCounts[user.id]}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Conversation */}
          <div className="conversation">
            {selectedUser ? (
              <>
                <div className="conversation-header">
                  <div className="conversation-user">
                    <div className="user-avatar">
                      {(selectedUser.name || selectedUser.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="conversation-user-name">
                        {selectedUser.name || 'No Name'}
                      </div>
                      <div className="conversation-user-email">{selectedUser.email}</div>
                    </div>
                  </div>
                </div>

                <div className="messages-list">
                  {messages.length === 0 ? (
                    <div className="no-messages">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map(message => (
                        <div
                          key={message.id}
                          className={`message ${message.senderId === currentUserId ? 'sent' : 'received'}`}
                        >
                          <div className="message-content">{message.content}</div>
                          <div className="message-time">
                            {new Date(message.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                <form className="message-input-form" onSubmit={sendMessage}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="message-input"
                    disabled={sending}
                  />
                  <button 
                    type="submit" 
                    className="send-button"
                    disabled={!newMessage.trim() || sending}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="no-conversation">
                <p>Select a user to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
