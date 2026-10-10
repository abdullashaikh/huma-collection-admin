import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  MapPin,
  Calendar,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { Order } from '../types';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Status update modal state
  const [newStatus, setNewStatus] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [carrierName, setCarrierName] = useState<string>('Delhivery');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());

      const data = await api.get<{ orders: Order[]; total: number }>(`/orders/admin?${params.toString()}`);
      // api.get unwraps data property, if array or object
      setOrders(Array.isArray(data) ? data : (data as any)?.orders || []);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleOpenOrder = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.order_status);
    setTrackingNumber(order.tracking_number || '');
    setCarrierName(order.carrier_name || 'Delhivery');
    setFeedbackMsg(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    setFeedbackMsg(null);

    try {
      await api.patch(`/orders/admin/${selectedOrder.id}/status`, {
        status: newStatus,
        trackingNumber: trackingNumber.trim() || undefined,
        carrierName: carrierName.trim() || undefined,
      });

      setFeedbackMsg({ type: 'success', text: `Order updated to ${newStatus} successfully.` });
      // Update local state
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              order_status: newStatus as any,
              tracking_number: trackingNumber || prev.tracking_number,
              carrier_name: carrierName || prev.carrier_name,
            }
          : null
      );
      fetchOrders();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update order status.' });
    } finally {
      setIsUpdating(false);
    }
  };

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
      {/* Search & Filter Header */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer or phone..."
            className="w-full pl-10 pr-4 py-2 bg-brand-card border border-brand-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold transition-colors"
          />
        </form>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'bg-brand-gold text-brand-dark font-semibold'
                  : 'bg-brand-card text-slate-300 hover:text-white border border-brand-border'
              }`}
            >
              {st === '' ? 'All Orders' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brand-border bg-brand-card/40 text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Order Details</th>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Total Amount</th>
                <th className="py-3.5 px-4 font-semibold">Payment</th>
                <th className="py-3.5 px-4 font-semibold">Lifecycle Status</th>
                <th className="py-3.5 px-4 font-semibold">Date</th>
                <th className="py-3.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading order records...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-brand-card/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-brand-gold">
                      <div>{order.order_number}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {order.item_count || 1} items
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      <div className="font-medium text-white">{order.customer_name}</div>
                      <div className="text-[11px] text-slate-400">{order.customer_phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      ₹{parseFloat(order.total_amount as any).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          order.payment_status === 'PAID'
                            ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-400'
                            : 'bg-amber-950/70 border-amber-500/30 text-amber-400'
                        }`}
                      >
                        {order.payment_status} ({order.payment_method})
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                          order.order_status
                        )}`}
                      >
                        {order.order_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenOrder(order)}
                        className="px-3 py-1.5 bg-brand-card hover:bg-brand-gold hover:text-brand-dark border border-brand-border rounded-lg text-slate-300 font-medium transition-all"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail & Lifecycle Stepper Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            {/* Header */}
            <div className="p-6 border-b border-brand-border flex items-center justify-between sticky top-0 bg-brand-surface z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-slate-400">Order Management</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(selectedOrder.order_status)}`}>
                    {selectedOrder.order_status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white font-mono mt-1">
                  {selectedOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-brand-card"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {feedbackMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    feedbackMsg.type === 'success'
                      ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {feedbackMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                  <span>{feedbackMsg.text}</span>
                </div>
              )}

              {/* Status Transition Control */}
              <div className="bg-brand-card border border-brand-border rounded-xl p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-3">
                  Update Lifecycle Status
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">New Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-lg text-xs text-white focus:outline-none focus:border-brand-gold"
                    >
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="PACKED">PACKED</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="REFUNDED">REFUNDED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Carrier Name</label>
                    <input
                      type="text"
                      value={carrierName}
                      onChange={(e) => setCarrierName(e.target.value)}
                      placeholder="e.g. Delhivery / BlueDart"
                      className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-lg text-xs text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Tracking Number / AWB</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. DEL12345678"
                      className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-lg text-xs text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleUpdateStatus}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Apply Status Update'}
                  </button>
                </div>
              </div>

              {/* Order Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer & Address */}
                <div className="bg-brand-card/40 border border-brand-border/60 rounded-xl p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                    <span>Customer & Delivery Address</span>
                  </h4>
                  <div className="space-y-1 text-xs text-slate-300">
                    <p className="font-semibold text-white">{selectedOrder.customer_name}</p>
                    <p>Phone: {selectedOrder.customer_phone}</p>
                    {selectedOrder.customer_email && <p>Email: {selectedOrder.customer_email}</p>}
                    <div className="pt-2 text-slate-400 border-t border-brand-border/40 mt-2">
                      {typeof selectedOrder.shipping_address === 'object' ? (
                        <>
                          <p>{selectedOrder.shipping_address.addressLine1}</p>
                          {selectedOrder.shipping_address.addressLine2 && <p>{selectedOrder.shipping_address.addressLine2}</p>}
                          <p>
                            {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} - {selectedOrder.shipping_address.pincode}
                          </p>
                        </>
                      ) : (
                        <p>{selectedOrder.shipping_address}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-brand-card/40 border border-brand-border/60 rounded-xl p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Payment Breakdown
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span className="text-slate-200">₹{parseFloat(selectedOrder.subtotal as any || selectedOrder.total_amount).toLocaleString('en-IN')}</span>
                    </div>
                    {Number(selectedOrder.discount_amount) > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Coupon Discount:</span>
                        <span>-₹{parseFloat(selectedOrder.discount_amount as any).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400">
                      <span>Shipping Fee:</span>
                      <span className="text-slate-200">₹{parseFloat(selectedOrder.shipping_fee as any || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-brand-border/40">
                      <span>Total Amount:</span>
                      <span className="text-brand-gold">₹{parseFloat(selectedOrder.total_amount as any).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Payment Method:</span>
                      <span className="text-white font-medium">{selectedOrder.payment_method}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
