import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  History,
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../api/client';
import { InventoryItem, InventoryTransaction } from '../types';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'TRANSACTIONS'>('STOCK');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Adjustment Modal
  const [selectedVariant, setSelectedVariant] = useState<InventoryItem | null>(null);
  const [quantityChange, setQuantityChange] = useState<number>(10);
  const [adjustmentType, setAdjustmentType] = useState<string>('RESTOCK');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (lowStockOnly) params.append('lowStockOnly', 'true');

      const res = await api.get<{ inventory: InventoryItem[]; total: number }>(`/admin/inventory?${params.toString()}`);
      setInventory(Array.isArray(res) ? res : (res as any)?.inventory || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get<InventoryTransaction[]>('/admin/inventory/transactions');
      setTransactions(res || []);
    } catch (err) {
      console.error('Failed to load ledger transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'STOCK') {
      fetchInventory();
    } else {
      fetchTransactions();
    }
  }, [activeTab, lowStockOnly]);

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedVariant(item);
    setQuantityChange(10);
    setAdjustmentType('RESTOCK');
    setNotes('');
    setModalFeedback(null);
  };

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;
    setIsSubmitting(true);
    setModalFeedback(null);

    try {
      await api.post('/admin/inventory/adjust', {
        variantId: selectedVariant.variant_id,
        quantityChange: Number(quantityChange),
        type: adjustmentType,
        notes: notes || undefined,
      });

      setModalFeedback({
        type: 'success',
        text: `Stock adjusted by ${quantityChange > 0 ? '+' : ''}${quantityChange} units.`,
      });

      setTimeout(() => {
        setSelectedVariant(null);
        fetchInventory();
      }, 1000);
    } catch (err: any) {
      setModalFeedback({ type: 'error', text: err.message || 'Failed to adjust stock.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-brand-border pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'STOCK'
                ? 'bg-brand-gold text-brand-dark shadow-md shadow-brand-gold/10'
                : 'text-slate-400 hover:text-white bg-brand-surface border border-brand-border'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Variant Stock Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'TRANSACTIONS'
                ? 'bg-brand-gold text-brand-dark shadow-md shadow-brand-gold/10'
                : 'text-slate-400 hover:text-white bg-brand-surface border border-brand-border'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Ledger</span>
          </button>
        </div>

        {activeTab === 'STOCK' && (
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-48 sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
                placeholder="Search variant SKU..."
                className="w-full pl-9 pr-3 py-1.5 bg-brand-surface border border-brand-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
              />
            </div>

            {/* Low stock filter toggle */}
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-brand-surface px-3 py-1.5 rounded-xl border border-brand-border">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="rounded border-brand-border text-brand-gold focus:ring-0"
              />
              <span>Low Stock Alerts</span>
            </label>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'STOCK' ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border bg-brand-card/40 text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Product & SKU</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Variant Price</th>
                  <th className="py-3.5 px-4 font-semibold">Current Stock</th>
                  <th className="py-3.5 px-4 font-semibold">Min Threshold</th>
                  <th className="py-3.5 px-4 font-semibold">Health Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span>Loading inventory ledger...</span>
                    </td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No inventory records found.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => {
                    const isLow = item.stock_quantity <= item.low_stock_threshold;
                    return (
                      <tr key={item.variant_id} className="hover:bg-brand-card/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{item.product_name}</div>
                          <div className="font-mono text-brand-gold text-[10px] mt-0.5">{item.sku}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{item.category_name}</td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          ₹{parseFloat(item.price as any).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-mono text-sm font-bold ${
                              isLow ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {item.stock_quantity} units
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          {item.low_stock_threshold}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              item.stock_quantity === 0
                                ? 'bg-rose-950/70 border-rose-500/30 text-rose-400'
                                : isLow
                                ? 'bg-amber-950/70 border-amber-500/30 text-amber-400'
                                : 'bg-emerald-950/70 border-emerald-500/30 text-emerald-400'
                            }`}
                          >
                            {item.stock_quantity === 0 ? 'Out of Stock' : isLow ? 'Low Stock Alert' : 'Healthy'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenAdjust(item)}
                            className="px-3 py-1.5 bg-brand-card hover:bg-brand-gold hover:text-brand-dark border border-brand-border rounded-lg text-slate-300 text-xs font-semibold transition-all"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Ledger Transactions Table */
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-brand-border flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Immutable Inventory Transactions Trail
            </h3>
            <span className="text-[11px] text-slate-400">Past stock adjustments and sales</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border bg-brand-card/40 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">SKU / Product</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Qty Change</th>
                  <th className="py-3 px-4 font-semibold">Stock (Before &rarr; After)</th>
                  <th className="py-3 px-4 font-semibold">Admin / Source</th>
                  <th className="py-3 px-4 font-semibold">Notes</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Loading audit ledger...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No stock transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-brand-card/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono text-brand-gold text-[11px] font-semibold">{tx.sku}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{tx.product_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-card border border-brand-border text-slate-300">
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-bold ${
                            tx.quantity_change > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {tx.previous_stock} &rarr; <span className="text-white font-bold">{tx.current_stock}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {tx.first_name ? `${tx.first_name} ${tx.last_name || ''}` : tx.reference_type}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">{tx.notes || '-'}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(tx.created_at).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {selectedVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-brand-gold font-bold">
                  Stock Ledger Adjustment
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedVariant.product_name}
                </h3>
                <p className="text-xs font-mono text-slate-400">SKU: {selectedVariant.sku}</p>
              </div>
              <button
                onClick={() => setSelectedVariant(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-brand-card"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalFeedback && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  modalFeedback.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
                }`}
              >
                {modalFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                <span>{modalFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleApplyAdjustment} className="space-y-4">
              <div className="p-3 bg-brand-card/50 rounded-xl border border-brand-border flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Stock Level:</span>
                <span className="font-mono text-base font-bold text-white">
                  {selectedVariant.stock_quantity} units
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adjustment Type *
                </label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-gold"
                >
                  <option value="RESTOCK">RESTOCK (Warehouse Intake)</option>
                  <option value="MANUAL_ADJUSTMENT">MANUAL ADJUSTMENT (Audit count)</option>
                  <option value="DAMAGE">DAMAGE / DEFECT (Write-off)</option>
                  <option value="RETURN">RETURN RESTOCK (Customer return)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Quantity Change (+ to add, - to deduct) *
                </label>
                <input
                  type="number"
                  required
                  value={quantityChange}
                  onChange={(e) => setQuantityChange(Number(e.target.value))}
                  placeholder="e.g. 25 or -2"
                  className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-gold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  New stock will be:{' '}
                  <span className="text-brand-gold font-bold">
                    {Math.max(0, selectedVariant.stock_quantity + Number(quantityChange))} units
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Audit Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Received new shipment from Surat atelier"
                  className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setSelectedVariant(null)}
                  className="px-4 py-2 bg-brand-card hover:bg-brand-border text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-gold hover:bg-brand-gold-light text-brand-dark text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-gold/10 disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording Ledger...' : 'Commit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
