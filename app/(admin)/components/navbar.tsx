"use client";

import { Bell, Menu } from "lucide-react";
import NotificationBell from "@/app/components/NotificationBell";

type NavbarProps = {
  onToggleSidebar?: () => void;
};

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  return (
    <nav className="relative bg-gray-800/50 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Mobile sidebar toggle */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <button
              onClick={onToggleSidebar}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Left */}
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center">
              {/* <img
                src=""
                alt="Logo"
                width={32}
                height={32}
              /> */}
            </div>

            {/* Desktop links */}
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                <NavLink active>Dashboard</NavLink>
                <NavLink>Team</NavLink>
                <NavLink>Projects</NavLink>
                <NavLink>Calendar</NavLink>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0 gap-3">
            {/* Notification */}
            <NotificationBell />

            {/* Profile (visual only) */}
            <button className="relative flex rounded-full focus:outline-none">
              {/* <img
                src=""
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full bg-gray-800 outline outline-1 -outline-offset-1 outline-white/10"
              /> */}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu (static, no JS) */}
      <div className="sm:hidden border-t border-white/10">
        <div className="space-y-1 px-2 pb-3 pt-2">
          <MobileLink active>Dashboard</MobileLink>
          <MobileLink>Team</MobileLink>
          <MobileLink>Projects</MobileLink>
          <MobileLink>Calendar</MobileLink>
        </div>
      </div>
    </nav>
  );
}

/* ---------- helpers ---------- */

function NavLink({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <a
      href="#"
      className={`rounded-md px-3 py-2 text-sm font-medium ${
        active
          ? "bg-gray-950/50 text-white"
          : "text-gray-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      {children}
    </a>
  );
}

function MobileLink({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <a
      href="#"
      className={`block rounded-md px-3 py-2 text-base font-medium ${
        active
          ? "bg-gray-950/50 text-white"
          : "text-gray-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      {children}
    </a>
  );
}
