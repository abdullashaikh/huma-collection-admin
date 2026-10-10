import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  FolderTree,
  Sparkles,
  Layers,
  ArrowUpDown,
  Filter,
  Eye,
  ShoppingBag,
} from 'lucide-react';
import { api } from '../api/client';
import { Category, AudienceScope, Product } from '../types';
import { CategoryModal } from './CategoryModal';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<string>('ALL_SCOPES');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  // Products belonging to category modal state
  const [viewingCategoryProducts, setViewingCategoryProducts] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get<Category[]>('/categories/admin/all');
      setCategories(res || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleToggleStatus = async (cat: Category) => {
    const nextStatus = !cat.is_active;
    try {
      await api.patch(`/categories/admin/${cat.id}/status`, { isActive: nextStatus });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: nextStatus } : c))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update category status');
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }
    try {
      await api.delete(`/categories/admin/${cat.id}`);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const handleOpenProductsModal = async (cat: Category) => {
    setViewingCategoryProducts(cat);
    setLoadingProducts(true);
    try {
      const res = await api.get<any[]>(`/categories/${cat.id}/products`);
      setCategoryProducts(res || []);
    } catch (err) {
      console.error('Failed to load category products:', err);
      setCategoryProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Filtered categories
  const filteredCategories = categories.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      (c.parent_name && c.parent_name.toLowerCase().includes(search.toLowerCase()));

    const matchesAudience =
      audienceFilter === 'ALL_SCOPES' || c.audience === audienceFilter;

    return matchesSearch && matchesAudience;
  });

  const getAudienceBadge = (audience: AudienceScope) => {
    switch (audience) {
      case 'MEN':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase tracking-wide">
            Men
          </span>
        );
      case 'WOMEN':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
            Women
          </span>
        );
      case 'ALL':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
            Common / Both
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Bar */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-brand-gold" />
            <h1 className="font-serif text-xl font-bold text-white">Category Management</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic audience-based hierarchies (Men, Women, Shared) with subcategory and order control.
          </p>
        </div>

        <button
          onClick={() => {
            setCategoryToEdit(null);
            setIsModalOpen(true);
          }}
          className="w-full md:w-auto px-5 py-2.5 bg-brand-gold hover:bg-yellow-600 text-brand-dark rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/10 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Category</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category or slug..."
              className="w-full pl-9 pr-4 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
            />
          </div>

          {/* Audience Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-gold"
            >
              <option value="ALL_SCOPES">All Audiences</option>
              <option value="WOMEN">Women's Categories</option>
              <option value="MEN">Men's Categories</option>
              <option value="ALL">Common / Both (Shared)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 self-end sm:self-auto">
          Showing <strong className="text-white">{filteredCategories.length}</strong> of{' '}
          {categories.length} categories
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-brand-card/70 border-b border-brand-border uppercase tracking-wider text-[10px] text-slate-400">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Category</th>
                <th className="px-5 py-3.5 font-semibold">Audience</th>
                <th className="px-5 py-3.5 font-semibold">Hierarchy / Parent</th>
                <th className="px-5 py-3.5 font-semibold">Order</th>
                <th className="px-5 py-3.5 font-semibold">Live Products</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Loading dynamic categories from database...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No categories found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-brand-card/40 transition-colors">
                    {/* Category name & image */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-card border border-brand-border shrink-0">
                          {cat.image_url || cat.imageUrl ? (
                            <img
                              src={cat.image_url || cat.imageUrl}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <FolderTree className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate text-sm">
                            {cat.name}
                          </p>
                          <a
                            href={`http://localhost:3000/category/${cat.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[10px] text-slate-400 hover:text-brand-gold flex items-center gap-1 transition-colors mt-0.5"
                          >
                            <span>/{cat.slug}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Audience Scope */}
                    <td className="px-5 py-4">{getAudienceBadge(cat.audience)}</td>

                    {/* Hierarchy */}
                    <td className="px-5 py-4">
                      {cat.parent_name ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-card border border-brand-border text-slate-300">
                          <span className="text-[10px] text-slate-500">Subcategory of:</span>
                          <span className="font-semibold text-white">{cat.parent_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-medium text-[11px]">
                          Top-Level Category
                        </span>
                      )}
                    </td>

                    {/* Order */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-brand-card border border-brand-border text-slate-300">
                        {cat.display_order}
                      </span>
                    </td>

                    {/* Products count button */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleOpenProductsModal(cat)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-card hover:bg-brand-border border border-brand-border text-brand-gold text-xs font-semibold transition-colors"
                        title="Click to view assigned products"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{cat.product_count} products</span>
                      </button>
                    </td>

                    {/* Status Toggle */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleStatus(cat)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                          cat.is_active
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                        }`}
                      >
                        {cat.is_active ? (
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
                        <button
                          onClick={() => {
                            setCategoryToEdit(cat);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-brand-card transition-colors"
                          title="Edit Category"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-brand-card transition-colors"
                          title="Delete Category"
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

      {/* Category Create/Edit Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchCategories()}
        categoryToEdit={categoryToEdit}
        existingCategories={categories}
      />

      {/* Category Products Modal */}
      {viewingCategoryProducts && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-white">
                  Products in {viewingCategoryProducts.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {viewingCategoryProducts.product_count} items currently assigned to this category
                </p>
              </div>
              <button
                onClick={() => setViewingCategoryProducts(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {loadingProducts ? (
                <p className="text-center py-8 text-xs text-slate-400">Loading products...</p>
              ) : categoryProducts.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No products have been assigned to this category yet.
                </div>
              ) : (
                categoryProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-brand-card border border-brand-border rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {p.primary_image_url && (
                        <img
                          src={p.primary_image_url}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-900 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{p.sku_base}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-brand-gold">
                        ₹{p.sale_price || p.base_price}
                      </span>
                      <span
                        className={`block text-[9px] font-bold ${
                          p.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-brand-border text-right">
              <button
                onClick={() => setViewingCategoryProducts(null)}
                className="px-4 py-2 bg-brand-card hover:bg-brand-border text-white text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
