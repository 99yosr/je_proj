// /app/(admin)/components/sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Menu, Home, Users, Settings, MessageSquare } from "lucide-react";
import Link from "next/link";
import { io } from "socket.io-client";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.id) {
          setCurrentUserId(data.id);
          fetchUnreadCount(data.id);
        }
      });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const socket = io('http://localhost:3000', {
      query: { userId: currentUserId }
    });

    socket.on('new-message', (message: any) => {
      // Increment unread count for messages received
      if (message.receiverId === currentUserId && !window.location.pathname.includes('/messages')) {
        setUnreadCount(prev => prev + 1);
      }
    });

    socket.on('messages-read', () => {
      // Refresh unread count when messages are marked as read
      fetchUnreadCount(currentUserId);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUserId]);

  const fetchUnreadCount = async (userId: string) => {
    try {
      const res = await fetch('/api/messages/unread-count', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const navItems = [
    { href: "/admin", icon: Home, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/messages", icon: MessageSquare, label: "Messages", badge: unreadCount > 0 ? unreadCount : undefined },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-md lg:hidden"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-white/10 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <span className="text-xl font-bold">Admin</span>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors relative"
              onClick={() => {
                setIsOpen(false);
                if (item.href === '/messages') {
                  // Refresh unread count when clicking messages
                  setTimeout(() => {
                    if (currentUserId) fetchUnreadCount(currentUserId);
                  }, 500);
                }
              }}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.badge && item.badge > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}