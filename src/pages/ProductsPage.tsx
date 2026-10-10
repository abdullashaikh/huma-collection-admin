import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import { Product, Category } from '../types';
import { CreateProductModal } from './CreateProductModal';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get<{ products: Product[]; total: number }>(`/products/admin/all?${params.toString()}`);
      setProducts(Array.isArray(res) ? res : (res as any)?.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get<Category[]>('/categories');
      setCategories(res || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [categoryFilter, statusFilter]);

  const handleToggleStatus = async (product: Product) => {
    const nextStatus = product.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    try {
      await api.patch(`/products/admin/${product.id}/status`, { status: nextStatus });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to remove "${product.name}" from catalog?`)) {
      return;
    }
    try {
      await api.delete(`/products/admin/${product.id}`);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
              placeholder="Search products & SKUs..."
              className="w-full pl-9 pr-4 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-gold"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-gold"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {/* Add Product Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full md:w-auto px-4 py-2.5 bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-bold text-xs rounded-xl transition-all shadow-md shadow-brand-gold/10 flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Modest Product</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brand-border bg-brand-card/40 text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Product</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Pricing</th>
                <th className="py-3.5 px-4 font-semibold">Variants</th>
                <th className="py-3.5 px-4 font-semibold">Total Stock</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading catalog...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-brand-card/30 transition-colors">
                    {/* Thumbnail & Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.primary_image_url || 'https://images.unsplash.com/photo-1584282479901-705a6104bc99?auto=format&fit=crop&w=200&q=80'}
                          alt={product.name}
                          className="w-10 h-14 object-cover rounded-md bg-brand-card border border-brand-border shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-xs">{product.name}</p>
                          <p className="text-[10px] font-mono text-brand-gold mt-0.5">{product.sku_base}</p>
                          {product.fabric && (
                            <span className="text-[9px] text-slate-400 bg-brand-card px-1.5 py-0.5 rounded border border-brand-border">
                              {product.fabric}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {product.category_name || 'Burqa'}
                    </td>

                    {/* Pricing */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">
                        ₹{parseFloat(product.sale_price as any || product.base_price).toLocaleString('en-IN')}
                      </div>
                      {product.sale_price && (
                        <div className="text-[10px] text-slate-400 line-through">
                          ₹{parseFloat(product.base_price as any).toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>

                    {/* Variants Count */}
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {product.variant_count || 1} sizes
                    </td>

                    {/* Total Stock */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          Number(product.total_stock) > 10
                            ? 'bg-emerald-950/70 border border-emerald-500/30 text-emerald-400'
                            : Number(product.total_stock) > 0
                            ? 'bg-amber-950/70 border border-amber-500/30 text-amber-400'
                            : 'bg-rose-950/70 border border-rose-500/30 text-rose-400'
                        }`}
                      >
                        {product.total_stock || 0} in stock
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          product.status === 'ACTIVE'
                            ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-400'
                            : product.status === 'DRAFT'
                            ? 'bg-amber-950/70 border-amber-500/30 text-amber-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(product)}
                          title={`Toggle ${product.status === 'ACTIVE' ? 'Draft' : 'Active'}`}
                          className="px-2.5 py-1 bg-brand-card hover:bg-brand-border border border-brand-border rounded-lg text-slate-300 text-[11px] font-medium transition-colors"
                        >
                          {product.status === 'ACTIVE' ? 'Unpublish' : 'Publish'}
                        </button>
                        <a
                          href={`http://localhost:3000/burqa/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on Storefront"
                          className="p-1.5 text-slate-400 hover:text-brand-gold bg-brand-card border border-brand-border rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          title="Soft delete product"
                          className="p-1.5 text-slate-400 hover:text-red-400 bg-brand-card border border-brand-border rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchProducts();
        }}
      />
    </div>
  );
};
