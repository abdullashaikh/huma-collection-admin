import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, Image as ImageIcon, Eye } from 'lucide-react';
import { api } from '../api/client';
import { Category, AudienceScope } from '../types';
import { ImageUploader } from '../components/common/ImageUploader';
import { getMediaUrl } from '../utils/media';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryToEdit?: Category | null;
  existingCategories: Category[];
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categoryToEdit,
  existingCategories,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [audience, setAudience] = useState<AudienceScope>('WOMEN');
  const [parentId, setParentId] = useState<number | null>(null);
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name || '');
      setSlug(categoryToEdit.slug || '');
      setDescription(categoryToEdit.description || '');
      setImageUrl(categoryToEdit.image_url || categoryToEdit.imageUrl || '');
      setAudience(categoryToEdit.audience || 'WOMEN');
      setParentId(categoryToEdit.parent_id || null);
      setDisplayOrder(categoryToEdit.display_order ?? 0);
      setIsActive(Boolean(categoryToEdit.is_active));
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setImageUrl('https://images.unsplash.com/photo-1584282479901-705a6104bc99?auto=format&fit=crop&w=800&q=80');
      setAudience('WOMEN');
      setParentId(null);
      setDisplayOrder(existingCategories.length + 1);
      setIsActive(true);
    }
    setError(null);
    setActiveTab('edit');
  }, [categoryToEdit, isOpen, existingCategories]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!categoryToEdit) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || null,
        imageUrl: imageUrl.trim() || null,
        audience,
        parentId: parentId || null,
        displayOrder: Number(displayOrder),
        isActive,
      };

      if (categoryToEdit) {
        await api.patch(`/categories/admin/${categoryToEdit.id}`, payload);
      } else {
        await api.post('/categories', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  // Filter root categories for parent selection
  const rootCategories = existingCategories.filter(
    (c) => (!c.parent_id || c.parent_id === null) && (!categoryToEdit || c.id !== categoryToEdit.id)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-brand-card/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-gold/15 text-brand-gold flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-white">
                {categoryToEdit ? `Edit Category: ${categoryToEdit.name}` : 'Create New Category'}
              </h2>
              <p className="text-xs text-slate-400">
                Audience-scoped dynamic catalog hierarchy
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex items-center bg-brand-dark p-1 rounded-lg border border-brand-border text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'edit' ? 'bg-brand-gold text-brand-dark' : 'text-slate-400 hover:text-white'
                }`}
              >
                Form
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === 'preview' ? 'bg-brand-gold text-brand-dark' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Storefront Preview</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-brand-border transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'edit' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Designer Abayas"
                  className="w-full px-3.5 py-2.5 bg-brand-card border border-brand-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              {/* URL Slug */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. designer-abayas"
                  className="w-full px-3.5 py-2.5 bg-brand-card border border-brand-border rounded-xl text-sm text-white font-mono focus:outline-none focus:border-brand-gold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Public route: /category/{slug || '...'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Audience Scope */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Audience Scope *
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as AudienceScope)}
                  className="w-full px-3.5 py-2.5 bg-brand-card border border-brand-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-gold"
                >
                  <option value="WOMEN">Women's Collection</option>
                  <option value="MEN">Men's Collection</option>
                  <option value="ALL">Common / Both (Shared)</option>
                </select>
              </div>

              {/* Parent Category (Subcategory support) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Parent Category
                </label>
                <select
                  value={parentId || ''}
                  onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3.5 py-2.5 bg-brand-card border border-brand-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-gold"
                >
                  <option value="">None (Top-Level Category)</option>
                  {rootCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.audience})
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  min={0}
                  className="w-full px-3.5 py-2.5 bg-brand-card border border-brand-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-gold"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Exquisite fabrics, tailored drape, wudu-friendly design..."
                className="w-full px-3.5 py-2 bg-brand-card border border-brand-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>

            {/* Category Cover Image with AWS S3 Uploader */}
            <div className="p-3.5 bg-brand-card/40 border border-brand-border rounded-xl">
              <ImageUploader
                mode="single"
                folder="categories"
                singleUrl={imageUrl}
                onSingleUrlChange={setImageUrl}
                label="Category Cover Image (AWS S3 & Storefront Sync)"
                hint="Upload a high-resolution banner/cover image for this category"
              />
            </div>

            {/* Publication Status Toggle */}
            <div className="pt-2 flex items-center justify-between border-t border-brand-border">
              <div>
                <p className="text-sm font-semibold text-white">Publish Status</p>
                <p className="text-xs text-slate-400">
                  When published, category is immediately visible to visitors on the storefront.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className="ml-3 text-xs font-semibold text-white">
                  {isActive ? 'Published' : 'Draft / Hidden'}
                </span>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-brand-border">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-brand-border text-slate-300 text-xs font-semibold hover:bg-brand-card"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-brand-gold hover:bg-yellow-600 text-brand-dark font-bold text-xs shadow-md shadow-brand-gold/10 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Saving...' : categoryToEdit ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        ) : (
          /* Live Storefront Preview Tab */
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            <div className="text-center space-y-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold">
                Interactive Preview
              </span>
              <h3 className="text-base font-serif font-bold text-white">
                How this category appears on the public website
              </h3>
            </div>

            {/* Preview Card */}
            <div className="max-w-xs mx-auto">
              <div className="relative h-80 rounded-3xl overflow-hidden border border-brand-gold/40 shadow-2xl bg-brand-card group">
                {imageUrl ? (
                  <img src={getMediaUrl(imageUrl)} alt={name || 'Category'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Badges */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white uppercase tracking-wider">
                    {audience === 'ALL' ? 'Shared' : audience}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                    {isActive ? 'Published' : 'Draft'}
                  </span>
                </div>

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <span className="text-[11px] text-brand-gold font-medium tracking-wide uppercase block mb-1">
                    {categoryToEdit?.product_count || 0}+ Handcrafted Designs
                  </span>
                  <h4 className="font-serif text-lg font-bold text-white leading-tight">
                    {name || 'Category Name'}
                  </h4>
                  {description && (
                    <p className="text-xs text-slate-300 line-clamp-2 mt-1">
                      {description}
                    </p>
                  )}
                  <div className="w-8 h-0.5 bg-brand-gold mt-3" />
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="text-xs text-brand-gold underline font-semibold"
              >
                ← Return to edit form
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
