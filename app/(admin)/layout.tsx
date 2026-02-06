import Navbar from "./components/navbar";
import Sidebar from "./components/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-950 text-white">
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
  );
}