import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Star,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';
import { api } from '../api/client';
import { Category, Product, AudienceScope } from '../types';
import { ImageUploader } from '../components/common/ImageUploader';
import { getMediaUrl } from '../utils/media';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: Product | null;
}

interface ImageItem {
  s3Url: string;
  s3Key?: string;
  altText: string;
  viewType: 'FRONT' | 'BACK' | 'SIDE' | 'DETAIL' | 'COVER';
  isPrimary: boolean;
  sortOrder: number;
}

interface VariantFormItem {
  id?: number;
  sku: string;
  size: string;
  color: string;
  price: number;
  compareAtPrice?: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Form Fields
  const [categoryId, setCategoryId] = useState<number>(1);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [audience, setAudience] = useState<AudienceScope>('WOMEN');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [skuBase, setSkuBase] = useState('');
  const [fabric, setFabric] = useState('Premium Saudi Crepe');
  const [materials, setMaterials] = useState('');
  const [pattern, setPattern] = useState('Embroidered');
  const [style, setStyle] = useState('Front Open');
  const [colors, setColors] = useState('Obsidian Black, Deep Emerald');
  const [tags, setTags] = useState('Wudu-Friendly, Modest, Luxury');
  const [careInstructions, setCareInstructions] = useState('Dry clean or delicate hand wash in cold water.');
  const [basePrice, setBasePrice] = useState<number>(3499);
  const [salePrice, setSalePrice] = useState<number>(2999);
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ACTIVE');

  // Multi-view Images
  const [images, setImages] = useState<ImageItem[]>([
    {
      s3Url: 'https://images.unsplash.com/photo-1584282479901-705a6104bc99?auto=format&fit=crop&w=800&q=80',
      altText: 'Front View',
      viewType: 'FRONT',
      isPrimary: true,
      sortOrder: 1,
    },
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageViewType, setNewImageViewType] = useState<'FRONT' | 'BACK' | 'SIDE' | 'DETAIL' | 'COVER'>('BACK');

  // Variant Matrix
  const [variants, setVariants] = useState<VariantFormItem[]>([
    { sku: '', size: '54', color: 'Obsidian Black', price: 2999, compareAtPrice: 3499, stockQuantity: 25, lowStockThreshold: 5 },
    { sku: '', size: '56', color: 'Obsidian Black', price: 2999, compareAtPrice: 3499, stockQuantity: 20, lowStockThreshold: 5 },
  ]);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get<Category[]>('/categories/admin/all');
        const allCats = res || [];
        setCategories(allCats);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // Update subcategories when categoryId changes
  useEffect(() => {
    const subs = categories.filter((c) => c.parent_id === categoryId);
    setSubcategories(subs);
  }, [categoryId, categories]);

  // Populate data on edit or create
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setSlug(productToEdit.slug || '');
      setSkuBase(productToEdit.sku_base || '');
      setCategoryId(productToEdit.category_id || 1);
      setSubcategoryId(productToEdit.subcategory_id || null);
      setAudience(productToEdit.audience || 'WOMEN');
      setFabric(productToEdit.fabric || '');
      setMaterials(productToEdit.materials || '');
      setPattern(productToEdit.pattern || '');
      setStyle(productToEdit.style || '');
      let parsedColors = productToEdit.colors;
      if (typeof parsedColors === 'string') {
        try { parsedColors = JSON.parse(parsedColors); } catch {}
      }
      setColors(
        Array.isArray(parsedColors)
          ? parsedColors.join(', ')
          : (parsedColors || '')
      );

      let parsedTags = productToEdit.tags;
      if (typeof parsedTags === 'string') {
        try { parsedTags = JSON.parse(parsedTags); } catch {}
      }
      setTags(
        Array.isArray(parsedTags)
          ? parsedTags.join(', ')
          : (parsedTags || '')
      );
      setCareInstructions(productToEdit.care_instructions || '');
      setBasePrice(productToEdit.base_price || 0);
      setSalePrice(productToEdit.sale_price || 0);
      setDisplayOrder(productToEdit.display_order ?? 0);
      setShortDescription(productToEdit.short_description || '');
      setDescription(productToEdit.description || '');
      setIsFeatured(Boolean(productToEdit.is_featured));
      setIsBestseller(Boolean(productToEdit.is_bestseller));
      setIsNewArrival(Boolean(productToEdit.is_new_arrival));
      setStatus(productToEdit.status || 'ACTIVE');

      // Populate variants
      if (productToEdit.variants && productToEdit.variants.length > 0) {
        setVariants(
          productToEdit.variants.map((v: any) => {
            const skuParts = (v.sku || '').split('-');
            const guessedSize = skuParts.length > 1 ? skuParts[skuParts.length - 1] : '54';
            return {
              id: v.id,
              sku: v.sku || '',
              size: (v as any).size || guessedSize,
              color: (v as any).color || (Array.isArray(parsedColors) ? parsedColors[0] : 'Standard'),
              price: Number(v.price ?? productToEdit.sale_price ?? productToEdit.base_price ?? 0),
              compareAtPrice: v.compare_at_price ?? v.compareAtPrice ? Number(v.compare_at_price ?? v.compareAtPrice) : null,
              stockQuantity: Number(v.stock_quantity ?? v.stockQuantity ?? 0),
              lowStockThreshold: Number(v.low_stock_threshold ?? v.lowStockThreshold ?? 5),
            };
          })
        );
      } else {
        const baseSku = productToEdit.sku_base || 'HHC-BRQ';
        setVariants([
          {
            sku: `${baseSku}-54`,
            size: '54',
            color: 'Standard',
            price: Number(productToEdit.sale_price || productToEdit.base_price || 0),
            compareAtPrice: Number(productToEdit.base_price || 0),
            stockQuantity: 15,
            lowStockThreshold: 5,
          },
        ]);
      }

      // Populate images
      if (productToEdit.images && productToEdit.images.length > 0) {
        setImages(
          productToEdit.images.map((img: any, idx) => ({
            s3Url: img.s3_url || img.s3Url || '',
            s3Key: img.s3_key || img.s3Key || '',
            altText: img.alt_text || img.altText || productToEdit.name,
            viewType: (img.view_type || img.viewType || (idx === 0 ? 'FRONT' : 'BACK')) as any,
            isPrimary: Boolean(img.is_primary || img.isPrimary || idx === 0),
            sortOrder: img.sort_order || img.sortOrder || idx + 1,
          }))
        );
      } else if (productToEdit.primary_image_url) {
        setImages([
          {
            s3Url: productToEdit.primary_image_url,
            altText: productToEdit.name,
            viewType: 'FRONT',
            isPrimary: true,
            sortOrder: 1,
          },
        ]);
      }
    } else {
      // Create defaults
      setName('');
      setSlug('');
      const randomNum = Math.floor(100 + Math.random() * 900);
      const defaultSkuBase = `HHC-BRQ-${randomNum}`;
      setSkuBase(defaultSkuBase);
      setFabric('Premium Saudi Crepe');
      setMaterials('100% Imported Saudi Nida');
      setPattern('Embroidered');
      setStyle('Front Open');
      setColors('Obsidian Black');
      setTags('Wudu-Friendly, Modest, Luxury');
      setCareInstructions('Dry clean or delicate hand wash in cold water.');
      setBasePrice(3499);
      setSalePrice(2999);
      setDisplayOrder(0);
      setShortDescription('Exquisite luxury burqa tailored with authentic crepe fabric and graceful drape.');
      setDescription(
        'Master-crafted with authentic imported Korean Crepe and Saudi Nida matte fabrics. Generous modest flare, wudu-friendly snap cuffs, and discreet deep pockets for timeless elegance.'
      );
      setIsFeatured(true);
      setIsBestseller(false);
      setIsNewArrival(true);
      setStatus('ACTIVE');
      setImages([
        {
          s3Url: 'https://images.unsplash.com/photo-1584282479901-705a6104bc99?auto=format&fit=crop&w=800&q=80',
          altText: 'Front View',
          viewType: 'FRONT',
          isPrimary: true,
          sortOrder: 1,
        },
      ]);
      setVariants([
        { sku: `${defaultSkuBase}-54`, size: '54', color: 'Obsidian Black', price: 2999, compareAtPrice: 3499, stockQuantity: 25, lowStockThreshold: 5 },
        { sku: `${defaultSkuBase}-56`, size: '56', color: 'Obsidian Black', price: 2999, compareAtPrice: 3499, stockQuantity: 20, lowStockThreshold: 5 },
      ]);
    }
    setError(null);
    setActiveTab('edit');
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!productToEdit) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);

      const prefix = val.slice(0, 3).toUpperCase() || 'HHC';
      const generatedSku = `HHC-${prefix}-${Math.floor(100 + Math.random() * 900)}`;
      setSkuBase(generatedSku);

      setVariants((prev) =>
        prev.map((v) => ({
          ...v,
          sku: `${generatedSku}-${v.size}`,
        }))
      );
    }
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    const isFirst = images.length === 0;
    setImages([
      ...images,
      {
        s3Url: newImageUrl.trim(),
        altText: `${name} ${newImageViewType}`,
        viewType: newImageViewType,
        isPrimary: isFirst,
        sortOrder: images.length + 1,
      },
    ]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setImages(updated);
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages(images.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  const handleAddVariant = () => {
    const nextSize = variants.length === 0 ? '52' : String(Number(variants[variants.length - 1].size) + 2 || '58');
    setVariants([
      ...variants,
      {
        sku: `${skuBase || 'HHC'}-${nextSize}`,
        size: nextSize,
        color: colors.split(',')[0]?.trim() || 'Standard',
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
        categoryId: Number(categoryId),
        subcategoryId: subcategoryId ? Number(subcategoryId) : null,
        audience,
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        skuBase: skuBase.trim().toUpperCase(),
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        fabric: fabric.trim() || null,
        materials: materials.trim() || null,
        pattern: pattern.trim() || null,
        style: style.trim() || null,
        colors: colors ? colors.split(',').map((c) => c.trim()).filter(Boolean) : [],
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        careInstructions: careInstructions.trim() || null,
        basePrice: Number(basePrice),
        salePrice: salePrice ? Number(salePrice) : null,
        displayOrder: Number(displayOrder),
        isFeatured,
        isBestseller,
        isNewArrival,
        status,
        images: images
          .filter((img) => img.s3Url && img.s3Url.trim())
          .map((img, i) => ({
            s3Url: img.s3Url.trim(),
            s3Key: img.s3Key,
            altText: img.altText || name,
            viewType: img.viewType,
            isPrimary: img.isPrimary,
            sortOrder: i + 1,
          })),
        variants: variants
          .filter((v) => v.sku && v.sku.trim())
          .map((v) => ({
            id: v.id,
            sku: v.sku.trim(),
            price: Number(v.price),
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
            stockQuantity: Number(v.stockQuantity || 0),
            lowStockThreshold: Number(v.lowStockThreshold || 5),
          })),
      };

      if (productToEdit) {
        await api.patch(`/products/admin/${productToEdit.id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const primaryImage = images.find((i) => i.isPrimary) || images[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col my-6 max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-brand-card/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-gold/15 text-brand-gold flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-white">
                {productToEdit ? `Edit Product: ${productToEdit.name}` : 'Create Dynamic Product'}
              </h2>
              <p className="text-xs text-slate-400">
                Audience scoping, multi-angle images &amp; live publication control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        {/* Tab 1: Form */}
        {activeTab === 'edit' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
            {/* 1. Categorization & Audience */}
            <div className="p-4 bg-brand-card/50 border border-brand-border rounded-xl space-y-3">
              <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] block">
                1. Audience Scope &amp; Category Placement
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Audience Scope */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Audience Scope *
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as AudienceScope)}
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-gold"
                  >
                    <option value="WOMEN">Women's Catalogue</option>
                    <option value="MEN">Men's Catalogue</option>
                    <option value="ALL">Common / Both (Shared)</option>
                  </select>
                </div>

                {/* Primary Category */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Primary Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-gold"
                  >
                    {categories
                      .filter((c) => !c.parent_id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.audience})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Optional Subcategory */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Subcategory (Optional)
                  </label>
                  <select
                    value={subcategoryId || ''}
                    onChange={(e) => setSubcategoryId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-gold"
                  >
                    <option value="">None</option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Basic Info & Slug */}
            <div className="p-4 bg-brand-card/50 border border-brand-border rounded-xl space-y-3">
              <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] block">
                2. Identification &amp; Slug
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Royal Emirati Gold-Trim Burqa"
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">SKU Base *</label>
                  <input
                    type="text"
                    required
                    value={skuBase}
                    onChange={(e) => setSkuBase(e.target.value)}
                    placeholder="e.g. HHC-BRQ-101"
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-white font-mono uppercase focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">SEO URL Slug *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. royal-emirati-gold-trim-burqa"
                  className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-white font-mono focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Short Description *</label>
                <input
                  type="text"
                  required
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="One sentence summary for catalog cards"
                  className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed craftsmanship and fabric specifications..."
                  className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-gold"
                />
              </div>
            </div>

            {/* 3. Pricing & Specifications */}
            <div className="p-4 bg-brand-card/50 border border-brand-border rounded-xl space-y-3">
              <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] block">
                3. Pricing, Materials &amp; Attributes
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Sale Price (₹)</label>
                  <input
                    type="number"
                    value={salePrice || ''}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    min={0}
                    placeholder="Optional"
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Fabric</label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    placeholder="e.g. Korean Crepe"
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Materials</label>
                  <input
                    type="text"
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    placeholder="e.g. 100% Polyester Saudi Nida"
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Colors (comma separated)</label>
                  <input
                    type="text"
                    value={colors}
                    onChange={(e) => setColors(e.target.value)}
                    placeholder="e.g. Obsidian Black, Dusty Rose"
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. Bestseller, Wudu-Friendly"
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>
            </div>

            {/* 4. Multi-View Images */}
            <div className="p-4 bg-brand-card/50 border border-brand-border rounded-xl">
              <ImageUploader
                mode="multiple"
                folder="products"
                images={images}
                onImagesChange={setImages}
                label="4. Multi-View Product Images (AWS S3 & Storefront Sync)"
                hint="Upload multiple angles (Front, Back, Side, Detail). Star marks primary cover."
              />
            </div>

            {/* 5. Inventory & Variants */}
            <div className="p-4 bg-brand-card/50 border border-brand-border rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
                  5. Size &amp; Stock Matrix
                </span>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="text-brand-gold hover:underline font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Size</span>
                </button>
              </div>

              <div className="space-y-2">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-5 gap-2 items-center bg-brand-card p-2.5 rounded-xl border border-brand-border"
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 block">SKU</span>
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariants(variants.map((item, i) => (i === idx ? { ...item, sku: val } : item)));
                        }}
                        className="w-full bg-brand-surface border border-brand-border rounded px-2 py-1 text-white font-mono uppercase"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Size (Length)</span>
                      <input
                        type="text"
                        value={v.size}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariants(variants.map((item, i) => (i === idx ? { ...item, size: val } : item)));
                        }}
                        className="w-full bg-brand-surface border border-brand-border rounded px-2 py-1 text-white text-center font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Price (₹)</span>
                      <input
                        type="number"
                        value={v.price}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setVariants(variants.map((item, i) => (i === idx ? { ...item, price: val } : item)));
                        }}
                        className="w-full bg-brand-surface border border-brand-border rounded px-2 py-1 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Stock Qty</span>
                      <input
                        type="number"
                        value={v.stockQuantity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setVariants(variants.map((item, i) => (i === idx ? { ...item, stockQuantity: val } : item)));
                        }}
                        className="w-full bg-brand-surface border border-brand-border rounded px-2 py-1 text-white"
                      />
                    </div>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        disabled={variants.length <= 1}
                        className="text-slate-500 hover:text-red-400 disabled:opacity-30 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Visibility, Badges & Publication Status */}
            <div className="p-4 bg-brand-card/50 border border-brand-border rounded-xl space-y-3">
              <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] block">
                6. Publication Status &amp; Storefront Highlights
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-brand-card p-2 rounded-xl border border-brand-border">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded text-brand-gold focus:ring-0"
                  />
                  <span className="text-white font-medium">Feature on Homepage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-brand-card p-2 rounded-xl border border-brand-border">
                  <input
                    type="checkbox"
                    checked={isBestseller}
                    onChange={(e) => setIsBestseller(e.target.checked)}
                    className="rounded text-brand-gold focus:ring-0"
                  />
                  <span className="text-white font-medium">Bestseller Tag</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-brand-card p-2 rounded-xl border border-brand-border">
                  <input
                    type="checkbox"
                    checked={isNewArrival}
                    onChange={(e) => setIsNewArrival(e.target.checked)}
                    className="rounded text-brand-gold focus:ring-0"
                  />
                  <span className="text-white font-medium">New Arrival</span>
                </label>

                <div>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-white font-bold"
                  >
                    <option value="ACTIVE">ACTIVE (Published)</option>
                    <option value="DRAFT">DRAFT (Unpublished)</option>
                    <option value="ARCHIVED">ARCHIVED (Deactivated)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-brand-border">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-brand-border text-slate-300 font-semibold hover:bg-brand-card"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-brand-gold hover:bg-yellow-600 text-brand-dark font-bold shadow-lg shadow-brand-gold/10 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Saving Product...' : productToEdit ? 'Save Changes' : 'Publish Product'}
              </button>
            </div>
          </form>
        ) : (
          /* Tab 2: Live Storefront Card Preview */
          <div className="p-8 space-y-6 overflow-y-auto flex-1">
            <div className="text-center space-y-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold">
                Live Storefront Card Preview
              </span>
              <h3 className="text-base font-serif font-bold text-white">
                How customers will view this product in the catalogue
              </h3>
            </div>

            <div className="max-w-xs mx-auto">
              <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-xl">
                {/* Image */}
                <div className="relative aspect-[3/4] w-full bg-stone-100 overflow-hidden">
                  {primaryImage ? (
                    <img
                      src={getMediaUrl(primaryImage.s3Url)}
                      alt={name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}

                  {/* Badge */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <span className="px-2.5 py-1 text-[10px] font-bold bg-brand-obsidian text-brand-gold rounded-full shadow">
                      {audience === 'ALL' ? 'Shared' : audience}
                    </span>
                    {isBestseller && (
                      <span className="px-2.5 py-0.5 text-[9px] font-bold bg-amber-500 text-black rounded-full shadow">
                        Bestseller
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 text-brand-obsidian space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold-dark block">
                    {categories.find((c) => c.id === categoryId)?.name || 'Category'}
                  </span>
                  <h4 className="font-serif text-sm font-bold truncate">
                    {name || 'Product Title'}
                  </h4>
                  <p className="text-[11px] text-stone-500 line-clamp-1">{fabric}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-brand-obsidian">
                        ₹{salePrice || basePrice}
                      </span>
                      {salePrice && (
                        <span className="text-[11px] text-stone-400 line-through">₹{basePrice}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-stone-500">
                      {variants.length} Sizes
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="text-xs text-brand-gold underline font-semibold"
              >
                ← Return to editor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
