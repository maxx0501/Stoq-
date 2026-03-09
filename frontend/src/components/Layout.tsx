import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  active: 'dashboard' | 'products' | 'sales' | 'customers' | 'team' | 'stock' | 'reports' | 'settings' | 'subscription' | 'admin' | 'cashflow' | 'expenses';
  onNavigate: (page: any) => void;
  onLogout: () => void;
  user?: any;
  storeName?: string;
  setUser?: any;
  children: React.ReactNode;
}

export const Layout = ({ active, onNavigate, onLogout, user, storeName, setUser, children }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans">
      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      <Sidebar 
        active={active} 
        onNavigate={(page: any) => { setIsSidebarOpen(false); onNavigate(page); }} 
        onLogout={() => { setIsSidebarOpen(false); onLogout(); }} 
        user={user}
        isMobileOpen={isSidebarOpen}
        onMobileClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-0">
        <Header 
          user={user} 
          storeName={storeName} 
          onLogout={onLogout} 
          setUser={setUser}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
