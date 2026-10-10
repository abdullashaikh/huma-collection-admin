import React from 'react';
import { Menu, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAdminAuth } from '../../context/AuthContext';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, title }) => {
  const { user } = useAdminAuth();

  return (
    <header className="h-16 bg-brand-surface border-b border-brand-border px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-brand-card"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* System Health Indicators */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>MySQL 8.0 Live</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-card border border-brand-border text-slate-300 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>API v1 Healthy</span>
          </div>
        </div>

        {/* Security Role Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-brand-border text-xs text-slate-400">
          <ShieldAlert className="w-4 h-4 text-brand-gold" />
          <span className="hidden sm:inline">Signed in as:</span>
          <span className="text-white font-medium">{user?.email}</span>
        </div>
      </div>
    </header>
  );
};
