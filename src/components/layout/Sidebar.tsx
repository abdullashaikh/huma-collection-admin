import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  Boxes,
  Tag,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AuthContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAdminAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Orders Lifecycle', path: '/orders', icon: ShoppingBag },
    { name: 'Products & Variants', path: '/products', icon: Layers },
    { name: 'Inventory Ledger', path: '/inventory', icon: Boxes },
    { name: 'Coupons & Offers', path: '/coupons', icon: Tag },
    { name: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 bg-brand-surface border-r border-brand-border flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-brand-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-card border border-brand-gold/30 flex items-center justify-center text-brand-gold shadow-lg shadow-black/40">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-serif text-lg font-bold text-white tracking-wide leading-tight">
            HUMA
          </h1>
          <p className="text-[10px] tracking-widest uppercase text-brand-gold font-medium">
            Admin Suite
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-gold text-brand-dark font-semibold shadow-md shadow-brand-gold/10'
                    : 'text-slate-300 hover:text-white hover:bg-brand-card'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          External Links
        </div>
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-brand-gold hover:bg-brand-card transition-all"
        >
          <span className="flex items-center gap-3">
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>Storefront</span>
          </span>
          <span className="text-[10px] bg-brand-card px-1.5 py-0.5 rounded text-slate-400 border border-brand-border">
            3000
          </span>
        </a>
      </nav>

      {/* Logged in Admin Profile Footer */}
      <div className="p-4 border-t border-brand-border bg-brand-dark/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-gold/20 text-brand-gold font-bold text-xs flex items-center justify-center shrink-0 border border-brand-gold/30">
              {user?.firstName?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <span className="inline-block text-[9px] uppercase tracking-wider text-brand-gold bg-brand-card px-1.5 py-0.2 rounded border border-brand-gold/20">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Sign out of portal"
            className="p-1.5 text-slate-400 hover:text-brand-danger hover:bg-brand-card rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
