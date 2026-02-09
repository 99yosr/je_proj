'use client'

import Navbar from "./components/navbar";
import Sidebar from "./components/sidebar";
import { SearchProvider, useSearch } from "./components/SearchContext";
import SearchBar from "./components/SearchBar";

function SearchBarWrapper() {
  const { setSearchQuery } = useSearch();
  return (
    <div className="mb-6">
      <SearchBar 
        onSearch={setSearchQuery} 
        placeholder="Search across all dashboards..." 
      />
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SearchProvider>
      <div className="flex h-screen bg-gray-950 text-white">
        {/* Sidebar - fixed width on desktop, hidden on mobile */}
        <Sidebar />
        
        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Navbar at top */}
          <Navbar />
          
          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            <SearchBarWrapper />
            {children}
          </main>
        </div>
      </div>
    </SearchProvider>
  );
}