import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingBag,
  Layers,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { api } from '../api/client';
import { DashboardStats } from '../types';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await api.get<DashboardStats>('/admin/dashboard/stats');
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load executive statistics.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-950/30 border border-red-500/20 rounded-2xl text-red-300">
        <p className="font-semibold">Unable to fetch dashboard metrics</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const { kpis, recentOrders, lowStockList, statusBreakdown } = stats;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-950/70 border-emerald-500/30 text-emerald-400';
      case 'SHIPPED':
        return 'bg-sky-950/70 border-sky-500/30 text-sky-400';
      case 'PROCESSING':
      case 'PACKED':
        return 'bg-amber-950/70 border-amber-500/30 text-amber-400';
      case 'CONFIRMED':
        return 'bg-indigo-950/70 border-indigo-500/30 text-indigo-400';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-rose-950/70 border-rose-500/30 text-rose-400';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 relative overflow-hidden group hover:border-brand-gold/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center border border-brand-gold/20">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white tracking-tight">
              ₹{kpis.totalRevenue.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Real-time settled sales</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 relative overflow-hidden group hover:border-brand-gold/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-card text-brand-gold flex items-center justify-center border border-brand-border">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white tracking-tight">
              {kpis.totalOrders}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
              <Package className="w-3.5 h-3.5 text-brand-gold" />
              <span>Lifetime transactions</span>
            </div>
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 relative overflow-hidden group hover:border-brand-gold/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Products
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-card text-emerald-400 flex items-center justify-center border border-brand-border">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white tracking-tight">
              {kpis.totalProducts}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live modest catalog items</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Stock Warnings
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-950/60 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-amber-400 tracking-tight">
              {kpis.lowStockCount}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-300">
              <Clock className="w-3.5 h-3.5" />
              <span>Variants at or below threshold</span>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Status Pipeline */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
          Order Pipeline Status
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => {
            const found = statusBreakdown.find((item) => item.order_status === st);
            const count = found ? found.count : 0;
            return (
              <div
                key={st}
                className="bg-brand-card border border-brand-border/60 rounded-xl p-3 flex flex-col justify-between"
              >
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  {st}
                </span>
                <span className="text-lg font-bold text-white mt-1">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dual Column: Recent Orders & Low Stock Alert List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders (2 Columns) */}
        <div className="lg:col-span-2 bg-brand-surface border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Recent Orders</h3>
              <p className="text-xs text-slate-400">Latest customer transactions from storefront</p>
            </div>
            <Link
              to="/orders"
              className="text-xs font-semibold text-brand-gold hover:text-brand-gold-light flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Order Number</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No customer orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-brand-card/50 transition-colors">
                      <td className="py-3 font-mono font-medium text-brand-gold">
                        {ord.order_number}
                      </td>
                      <td className="py-3 text-slate-200">
                        <div>{ord.customer_name}</div>
                        <div className="text-[10px] text-slate-500">{ord.customer_phone}</div>
                      </td>
                      <td className="py-3 font-semibold text-white">
                        ₹{parseFloat(ord.total_amount as any).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                            ord.order_status
                          )}`}
                        >
                          {ord.order_status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            ord.payment_status === 'PAID'
                              ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-400'
                              : 'bg-amber-950/70 border-amber-500/30 text-amber-400'
                          }`}
                        >
                          {ord.payment_status} ({ord.payment_method})
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts (1 Column) */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Low Stock Items</h3>
              <p className="text-xs text-slate-400">Restock needed immediately</p>
            </div>
            <Link
              to="/inventory"
              className="text-xs font-semibold text-brand-gold hover:text-brand-gold-light flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {lowStockList.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                All catalog variants are well-stocked.
              </div>
            ) : (
              lowStockList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-brand-card border border-brand-border rounded-xl flex items-center justify-between"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-medium text-white truncate">{item.product_name}</p>
                    <p className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold text-xs">
                      {item.stock_quantity} left
                    </span>
                    <p className="text-[9px] text-slate-500 mt-0.5">Min: {item.low_stock_threshold}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
