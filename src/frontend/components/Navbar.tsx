import React from 'react';
import { 
  LayoutDashboard, FolderKanban, TrendingUp, Search, Key, Sparkles, Layers, Users, LogOut, Shield, User, BarChart3, BookOpen
} from 'lucide-react';
import { ActiveTab, ApiKeyItem, UserItem } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  apiKeys: ApiKeyItem[];
  currentUser: UserItem;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  apiKeys,
  currentUser,
  onLogout
}) => {
  const activeCount = apiKeys.filter(k => k.is_active === 1).length;
  const isAdmin = currentUser.role === 'admin';

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard Analitik', icon: <LayoutDashboard size={18} /> },
    { id: 'analytics', label: 'Analitik & Laporan', icon: <BarChart3 size={18} /> },
    { id: 'projects', label: 'Projects & Keywords', icon: <FolderKanban size={18} /> },
    { id: 'categories', label: 'Kategori Induk', icon: <Layers size={18} /> },
    { id: 'logbooks', label: 'Lembar Kerja', icon: <BookOpen size={18} /> },
    { id: 'daytoday', label: 'Laporan Day-to-Day', icon: <TrendingUp size={18} /> },
    { id: 'explorer', label: 'Live SERP Explorer', icon: <Search size={18} /> },
    { id: 'apikeys', label: 'API Keys', icon: <Key size={18} /> },
    { id: 'users', label: 'Manajemen User', icon: <Users size={18} />, adminOnly: true }
  ];

  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Search size={20} className="text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold brand-font text-white tracking-wide">CEK<span className="text-indigo-400">SERP</span></h1>
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded uppercase tracking-widest">Multi-User</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">SerpApi Rotator & Role-Based Tracker</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right User & Logout Badge */}
          <div className="flex items-center gap-3">
            
            {/* User Profile Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs">
                {currentUser.name.substring(0, 1).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-bold text-white text-[12px] leading-none flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  {isAdmin ? (
                    <span className="badge badge-indigo text-[9px] py-0 px-1">ADMIN</span>
                  ) : (
                    <span className="badge badge-gray text-[9px] py-0 px-1">USER</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">{currentUser.email}</div>
              </div>
            </div>

            {/* Prominent Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/30 transition-all shadow-sm cursor-pointer"
              title="Keluar dari Akun"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>

          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex overflow-x-auto py-2 gap-1 border-t border-slate-900 no-scrollbar">
          {visibleNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
