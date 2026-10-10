import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs tracking-wider uppercase text-brand-gold font-medium">
          Verifying security session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const getPageTitle = (path: string): string => {
    switch (path) {
      case '/':
        return 'Executive Overview';
      case '/orders':
        return 'Orders Lifecycle Management';
      case '/products':
        return 'Product Catalog & Variant Matrix';
      case '/inventory':
        return 'Real-Time Inventory Ledger';
      case '/coupons':
        return 'Promotions & Coupons';
      case '/audit-logs':
        return 'Security Audit Trail';
      default:
        return 'Admin Portal';
    }
  };

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          title={getPageTitle(location.pathname)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
