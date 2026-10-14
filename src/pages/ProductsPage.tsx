import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Layers,
  Sparkles,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { api } from '../api/client';
import { Product, Category, AudienceScope } from '../types';
import { CreateProductModal } from './CreateProductModal';
import { getMediaUrl } from '../utils/media';

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Pagination State - 10 items per chunk to prevent page slowdown
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchProducts = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (search.trim()) params.append('search', search.trim());
      if (categoryFilter) params.append('category', categoryFilter);
      if (audienceFilter) params.append('audience', audienceFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.getWithMeta<Product[]>(
        `/products/admin/all?${params.toString()}`
      );

      const productList: Product[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : (res as any)?.products || [];

      const totalCount =
        typeof res?.meta?.total === 'number'
          ? res.meta.total
          : typeof (res as any)?.total === 'number'
          ? (res as any).total
          : productList.length;

      setProducts(productList);
      setTotalProducts(totalCount);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get<Category[]>('/categories/admin/all');
      setCategories(res || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage, pageSize);
  }, [currentPage, pageSize, categoryFilter, audienceFilter, statusFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const getAudienceBadge = (audience: AudienceScope) => {
    switch (audience) {
      case 'MEN':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Men
          </span>
        );
      case 'WOMEN':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Women
          </span>
        );
      case 'ALL':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Shared
          </span>
        );
      default:
        return null;
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Bar */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-gold" />
            <h1 className="font-serif text-xl font-bold text-white">Product Management</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic audience scoping (Men, Women, Shared), multi-view image management, and publication control.
          </p>
        </div>

        <button
          onClick={() => {
            setProductToEdit(null);
            setIsModalOpen(true);
          }}
          className="w-full md:w-auto px-5 py-2.5 bg-brand-gold hover:bg-yellow-600 text-brand-dark rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/10 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Dynamic Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setCurrentPage(1);
                  fetchProducts(1, pageSize);
                }
              }}
              placeholder="Search products & SKUs..."
              className="w-full pl-9 pr-4 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
            />
          </div>

          {/* Audience Filter */}
          <select
            value={audienceFilter}
            onChange={(e) => {
              setAudienceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-gold"
          >
            <option value="">All Audiences</option>
            <option value="WOMEN">Women's Products</option>
            <option value="MEN">Men's Products</option>
            <option value="ALL">Common / Both (Shared)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-gold"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name} ({c.audience})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-gold"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE (Published)</option>
            <option value="DRAFT">DRAFT (Unpublished)</option>
            <option value="ARCHIVED">ARCHIVED (Deactivated)</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 self-end md:self-auto">
          Found <strong className="text-white">{totalProducts}</strong> items
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-brand-card/70 border-b border-brand-border uppercase tracking-wider text-[10px] text-slate-400">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Product</th>
                <th className="px-5 py-3.5 font-semibold">Audience</th>
                <th className="px-5 py-3.5 font-semibold">Category / Subcategory</th>
                <th className="px-5 py-3.5 font-semibold">Base Price</th>
                <th className="px-5 py-3.5 font-semibold">Total Stock</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-card/40 transition-colors">
                    {/* Product Name & Image */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 rounded-xl overflow-hidden bg-brand-card border border-brand-border shrink-0">
                          {p.primary_image_url ? (
                            <img
                              src={getMediaUrl(p.primary_image_url)}
                              alt={p.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Layers className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate text-sm">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-400">{p.sku_base}</span>
                            {p.is_featured ? (
                              <span className="text-[9px] font-bold text-brand-gold bg-brand-gold/15 px-1.5 py-0.2 rounded border border-brand-gold/30">
                                Featured
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Audience Scope */}
                    <td className="px-5 py-4">{getAudienceBadge(p.audience)}</td>

                    {/* Category & Subcategory */}
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-white block">
                          {p.category_name || 'Uncategorized'}
                        </span>
                        {p.subcategory_name && (
                          <span className="text-[10px] text-slate-400 block">
                            ↳ {p.subcategory_name}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-4 font-mono">
                      <div>
                        <span className="font-bold text-brand-gold text-sm">
                          ₹{p.sale_price || p.base_price}
                        </span>
                        {p.sale_price && (
                          <span className="text-[10px] text-slate-400 line-through block">
                            ₹{p.base_price}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="px-5 py-4 font-mono">
                      <span
                        className={`font-semibold ${
                          (p.total_stock || 0) < 10 ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        {p.total_stock || 0} units
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleStatus(p)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                        }`}
                      >
                        {p.status === 'ACTIVE' ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-amber-400" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`http://localhost:3000/burqa/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-gold hover:bg-brand-card transition-colors"
                          title="View on Storefront"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => {
                            setProductToEdit(p);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-brand-card transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-brand-card transition-colors"
                          title="Archive Product"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Pagination Bar - Chunking into 10 items per page */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300 shadow-lg">
        {/* Showing X to Y of Z products */}
        <div className="flex flex-wrap items-center gap-3">
          <span>
            Showing{' '}
            <strong className="text-white">
              {totalProducts === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-white">
              {Math.min(currentPage * pageSize, totalProducts)}
            </strong>{' '}
            of <strong className="text-white">{totalProducts}</strong> products
          </span>

          <span className="text-slate-600 hidden sm:inline">•</span>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const nextSize = Number(e.target.value);
                setPageSize(nextSize);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 bg-brand-card border border-brand-border rounded-lg text-white font-medium focus:outline-none focus:border-brand-gold text-xs cursor-pointer"
            >
              <option value={10}>10 items</option>
              <option value={20}>20 items</option>
              <option value={50}>50 items</option>
            </select>
          </div>
        </div>

        {/* Page Nav controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || loading}
              className="p-1.5 rounded-lg border border-brand-border bg-brand-card hover:bg-brand-card/80 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="p-1.5 rounded-lg border border-brand-border bg-brand-card hover:bg-brand-card/80 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-slate-500 select-none">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(Number(p))}
                    disabled={loading}
                    className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                      currentPage === p
                        ? 'bg-brand-gold text-brand-dark font-bold shadow-md shadow-brand-gold/20'
                        : 'border border-brand-border bg-brand-card hover:bg-brand-card/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="p-1.5 rounded-lg border border-brand-border bg-brand-card hover:bg-brand-card/80 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages || loading}
              className="p-1.5 rounded-lg border border-brand-border bg-brand-card hover:bg-brand-card/80 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <CreateProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchProducts(currentPage, pageSize)}
        productToEdit={productToEdit}
      />
    </div>
  );
};
