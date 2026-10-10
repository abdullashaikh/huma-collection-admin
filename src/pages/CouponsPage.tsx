import React, { useEffect, useState } from 'react';
import { Tag, Plus, CheckCircle, XCircle, AlertCircle, X, Percent, Calendar } from 'lucide-react';
import { api } from '../api/client';
import { Coupon } from '../types';

export const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Coupon Form
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(15);
  const [minOrderValue, setMinOrderValue] = useState<number>(1499);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(500);
  const [validUntil, setValidUntil] = useState<string>('2026-12-31T23:59');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get<Coupon[]>('/coupons/admin');
      setCoupons(res || []);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggle = async (coupon: Coupon) => {
    try {
      await api.patch(`/coupons/admin/${coupon.id}/toggle`);
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: c.is_active ? 0 : 1 } : c))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to toggle coupon status');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/coupons/admin', {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: Number(minOrderValue),
        maxDiscountAmount: discountType === 'PERCENTAGE' ? Number(maxDiscountAmount) : null,
        validUntil: new Date(validUntil).toISOString(),
      });

      setIsModalOpen(false);
      setCode('');
      fetchCoupons();
    } catch (err: any) {
      setError(err?.message || 'Failed to create coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Promotional Coupons</h3>
          <p className="text-xs text-slate-400">Manage discounts and checkout incentives</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-bold text-xs rounded-xl transition-all shadow-md shadow-brand-gold/10 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brand-border bg-brand-card/40 text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Coupon Code</th>
                <th className="py-3.5 px-4 font-semibold">Discount</th>
                <th className="py-3.5 px-4 font-semibold">Min Order</th>
                <th className="py-3.5 px-4 font-semibold">Usage Limit</th>
                <th className="py-3.5 px-4 font-semibold">Valid Until</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading promotion coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No coupons configured yet.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-brand-card/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-gold text-sm">
                      {coupon.code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {coupon.discount_type === 'PERCENTAGE'
                        ? `${coupon.discount_value}% OFF`
                        : `₹${parseFloat(coupon.discount_value as any).toLocaleString('en-IN')} OFF`}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      ₹{parseFloat(coupon.min_order_value as any).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {coupon.times_used} / {coupon.usage_limit_total || '∞'} used
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(coupon.valid_until).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          coupon.is_active
                            ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-950/70 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        {coupon.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggle(coupon)}
                        className="px-2.5 py-1 bg-brand-card hover:bg-brand-border border border-brand-border rounded-lg text-slate-300 text-[11px] font-medium transition-colors"
                      >
                        {coupon.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-brand-gold font-bold">
                  Promotions
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">Create New Coupon</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-brand-card"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. EIDSPECIAL"
                  className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white font-mono uppercase focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Discount Type *</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-gold"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(Number(e.target.value))}
                    disabled={discountType === 'FIXED'}
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-gold disabled:opacity-40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Valid Until *</label>
                <input
                  type="datetime-local"
                  required
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-brand-card hover:bg-brand-border text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-gold hover:bg-brand-gold-light text-brand-dark text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-gold/10 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
