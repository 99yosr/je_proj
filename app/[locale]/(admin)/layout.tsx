'use client'

import Navbar from "./components/navbar";
import Sidebar from "./components/sidebar";
import { SearchProvider } from "./components/SearchContext";
import { ThemeProvider } from "@/app/contexts/ThemeContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <SearchProvider>
        <div className="flex h-screen bg-[#F5F5F7] dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
          {/* Sidebar - fixed width on desktop, hidden on mobile */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Navbar at top */}
            <Navbar />

            {/* Page content */}
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </SearchProvider>
    </ThemeProvider>
  );
}