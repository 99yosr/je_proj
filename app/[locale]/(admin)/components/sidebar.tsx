"use client";

import { useState, useEffect } from "react";
import { X, Menu, LayoutDashboard, Users, Calendar, MessageSquare, Briefcase, Newspaper, Building2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { io } from "socket.io-client";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
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
    const socket = io('http://localhost:3000', { query: { userId: currentUserId } });
    socket.on('new-message', (message: any) => {
      if (message.receiverId === currentUserId && !pathname.includes('/messages')) {
        setUnreadCount(prev => prev + 1);
      }
    });
    socket.on('messages-read', () => fetchUnreadCount(currentUserId));
    return () => { socket.disconnect(); };
  }, [currentUserId, pathname]);

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
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/users", icon: Users, label: "Utilisateurs" },
    { href: "/juniors", icon: Building2, label: "Juniors" },
    { href: "/events", icon: Calendar, label: "Événements" },
    { href: "/projects", icon: Briefcase, label: "Projets" },
    { href: "/news", icon: Newspaper, label: "Actualités" },
    { href: "/messages", icon: MessageSquare, label: "Messages", badge: unreadCount > 0 ? unreadCount : undefined },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 lg:hidden text-gray-600 dark:text-gray-300"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static shadow-sm ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center border-b border-gray-100 dark:border-gray-700 px-6">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            JET<span className="text-[#E60000] dark:text-red-500">unisie</span>
          </span>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative ${isActive
                  ? 'bg-red-50 dark:bg-red-900/20 text-[#E60000] dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                onClick={() => {
                  setIsOpen(false);
                  if (item.href === '/messages' && currentUserId) {
                    setTimeout(() => fetchUnreadCount(currentUserId), 500);
                  }
                }}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#E60000] dark:text-red-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                {item.label}
                {item.badge && item.badge > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#E60000] dark:bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}