import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { Category } from '../types';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface VariantFormItem {
  sku: string;
  size: string;
  color: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  lowStockThreshold: number;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [categoryId, setCategoryId] = useState<number>(1);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [skuBase, setSkuBase] = useState('');
  const [fabric, setFabric] = useState('Premium Saudi Crepe');
  const [pattern, setPattern] = useState('Embroidered');
  const [style, setStyle] = useState('Front Open');
  const [careInstructions, setCareInstructions] = useState('Dry clean or delicate hand wash in cold water.');
  const [basePrice, setBasePrice] = useState<number>(3499);
  const [salePrice, setSalePrice] = useState<number>(2999);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);

  // Images
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1584282479901-705a6104bc99?auto=format&fit=crop&w=800&q=80');

  // Variant Matrix
  const [variants, setVariants] = useState<VariantFormItem[]>([
    { sku: '', size: '54', color: 'Obsidian Black', price: 2999, compareAtPrice: 3499, stockQuantity: 25, lowStockThreshold: 5 },
    { sku: '', size: '56', color: 'Obsidian Black', price: 2999, compareAtPrice: 3499, stockQuantity: 20, lowStockThreshold: 5 },
  ]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get('/categories');
        setCategories(res || []);
        if (res && res.length > 0) {
          setCategoryId(res[0].id);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(generatedSlug);

    const generatedSku = 'HHC-' + val.slice(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
    setSkuBase(generatedSku);

    // Auto update variant SKUs
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        sku: `${generatedSku}-${v.size}`,
      }))
    );
  };

  const handleAddVariant = () => {
    const nextSize = variants.length === 0 ? '52' : String(Number(variants[variants.length - 1].size) + 2 || '58');
    setVariants([
      ...variants,
      {
        sku: `${skuBase || 'HHC'}-${nextSize}`,
        size: nextSize,
        color: 'Obsidian Black',
        price: salePrice || basePrice,
        compareAtPrice: basePrice,
        stockQuantity: 15,
        lowStockThreshold: 5,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        categoryId,
        name,
        slug,
        skuBase,
        shortDescription: shortDescription || `${name} handcrafted with supreme elegance and modesty.`,
        description: description || `Experience unrivaled luxury and modest modesty with the ${name}. Features premium ${fabric} tailored for timeless everyday and festive grace.`,
        fabric,
        pattern,
        style,
        careInstructions,
        basePrice,
        salePrice: salePrice || undefined,
        isFeatured,
        isBestseller,
        isNewArrival,
        status: 'ACTIVE',
        seoTitle: `${name} | Huma Hijab Collection`,
        seoDescription: `Shop the exquisite ${name} in luxury ${fabric}. Modest fashion crafted for sophistication and comfort.`,
        images: [
          {
            s3Url: imageUrl,
            altText: name,
            isPrimary: true,
          },
        ],
        variants: variants.map((v) => ({
          sku: v.sku || `${skuBase}-${v.size}`,
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
          stockQuantity: Number(v.stockQuantity),
          lowStockThreshold: Number(v.lowStockThreshold) || 5,
        })),
      };

      await api.post('/products', payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create product.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-brand-border flex items-center justify-between sticky top-0 bg-brand-surface z-10">
          <div>
            <span className="text-xs uppercase tracking-wider text-brand-gold font-medium">Catalog Authoring</span>
            <h3 className="text-lg font-bold text-white font-serif mt-0.5">
              Add New Modest Wear Product
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-brand-card">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Royal Emirati Gold-Trim Front Open Burqa"
                className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-gold"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">URL Slug</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-slate-400 focus:outline-none focus:border-brand-gold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SKU Base Code *</label>
              <input
                type="text"
                required
                value={skuBase}
                onChange={(e) => setSkuBase(e.target.value)}
                placeholder="e.g. HHC-BRQ-011"
                className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-gold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fabric Material</label>
              <input
                type="text"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                placeholder="e.g. Saudi Nidah / Korean Crepe"
                className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          {/* Pricing & Attributes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-brand-card/40 border border-brand-border/60 rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Base Price (₹) *</label>
              <input
                type="number"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-lg text-xs text-white focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Sale Price (₹)</label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-lg text-xs text-brand-gold font-bold focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Style Cut</label>
              <input
                type="text"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="Front Open, Butterfly..."
                className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-lg text-xs text-white focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Pattern</label>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Embroidered, Solid..."
                className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-lg text-xs text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          {/* Primary Media URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Image URL (S3 / CDN)</label>
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-gold font-mono"
            />
          </div>

          {/* Variant Matrix Table */}
          <div className="border border-brand-border rounded-xl p-4 bg-brand-card/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Variant Matrix & Opening Stock
                </h4>
                <p className="text-[11px] text-slate-400">
                  Each size variant maintains its own isolated inventory ledger row.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="px-2.5 py-1 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold hover:text-brand-dark border border-brand-gold/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Size Variant</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-border text-slate-400 uppercase text-[10px]">
                    <th className="pb-2">Size</th>
                    <th className="pb-2">SKU</th>
                    <th className="pb-2">Price (₹)</th>
                    <th className="pb-2">Stock Qty</th>
                    <th className="pb-2">Alert Min</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {variants.map((v, idx) => (
                    <tr key={idx}>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, size: val, sku: `${skuBase}-${val}` } : item))
                            );
                          }}
                          className="w-16 px-2 py-1 bg-brand-surface border border-brand-border rounded text-xs text-white"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, sku: val } : item))
                            );
                          }}
                          className="w-32 px-2 py-1 bg-brand-surface border border-brand-border rounded text-xs text-white font-mono"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, price: val } : item))
                            );
                          }}
                          className="w-20 px-2 py-1 bg-brand-surface border border-brand-border rounded text-xs text-white"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          value={v.stockQuantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, stockQuantity: val } : item))
                            );
                          }}
                          className="w-20 px-2 py-1 bg-brand-surface border border-brand-border rounded text-xs text-white"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          value={v.lowStockThreshold}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, lowStockThreshold: val } : item))
                            );
                          }}
                          className="w-16 px-2 py-1 bg-brand-surface border border-brand-border rounded text-xs text-white"
                        />
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="p-1 text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-brand-card hover:bg-brand-border text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-brand-gold hover:bg-brand-gold-light text-brand-dark text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-gold/10 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Creating Catalog Item...' : 'Publish Product to Storefront'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
