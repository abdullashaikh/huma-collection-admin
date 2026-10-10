import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Star,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cloud,
  HardDrive,
  Link2,
  Plus,
} from 'lucide-react';
import { api } from '../../api/client';

export type ViewType = 'FRONT' | 'BACK' | 'SIDE' | 'DETAIL' | 'COVER';

export interface ImageItem {
  s3Url: string;
  s3Key?: string;
  altText: string;
  viewType: ViewType;
  isPrimary: boolean;
  sortOrder: number;
  storage?: 's3' | 'local_fallback';
}

interface ImageUploaderProps {
  mode?: 'multiple' | 'single';
  folder?: 'products' | 'categories' | 'banners';
  // Props for mode === 'multiple'
  images?: ImageItem[];
  onImagesChange?: (images: ImageItem[]) => void;
  // Props for mode === 'single'
  singleUrl?: string;
  onSingleUrlChange?: (url: string) => void;
  label?: string;
  hint?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  mode = 'multiple',
  folder = 'products',
  images = [],
  onImagesChange,
  singleUrl = '',
  onSingleUrlChange,
  label,
  hint,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Manual URL insertion fallback state
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [manualViewType, setManualViewType] = useState<ViewType>('FRONT');

  // Handle file drop / select
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)
    );

    if (fileArray.length === 0) {
      setError('Please select valid image files (JPG, PNG, WEBP, GIF).');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setUploading(true);

    try {
      if (mode === 'single') {
        const file = fileArray[0];
        setUploadProgress(`Uploading ${file.name}...`);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const res = await api.postFormData<any>('/media/upload', formData);
        const uploadedUrl = res.s3Url || res.url;
        if (onSingleUrlChange) {
          onSingleUrlChange(uploadedUrl);
        }
        setSuccessMsg(
          res.storage === 's3'
            ? 'Uploaded securely to AWS S3 bucket!'
            : 'Saved successfully (ready for storefront display).'
        );
      } else {
        // Multi-image upload for products
        setUploadProgress(`Uploading ${fileArray.length} asset${fileArray.length > 1 ? 's' : ''}...`);

        const formData = new FormData();
        fileArray.forEach((f) => formData.append('files', f));
        formData.append('folder', folder);

        const results = await api.postFormData<any[]>('/media/upload-multiple', formData);

        const newItems: ImageItem[] = results.map((r, idx) => {
          // Heuristic view-type from filename if possible
          const lowerName = (r.fileName || '').toLowerCase();
          let detectedView: ViewType = 'FRONT';
          if (lowerName.includes('back')) detectedView = 'BACK';
          else if (lowerName.includes('side')) detectedView = 'SIDE';
          else if (lowerName.includes('detail') || lowerName.includes('close')) detectedView = 'DETAIL';
          else if (lowerName.includes('cover') || (images.length === 0 && idx === 0)) detectedView = 'COVER';

          return {
            s3Url: r.s3Url || r.url,
            s3Key: r.s3Key,
            altText: r.fileName ? r.fileName.replace(/\.[^/.]+$/, '') : `${detectedView} View`,
            viewType: detectedView,
            isPrimary: images.length === 0 && idx === 0,
            sortOrder: images.length + idx + 1,
            storage: r.storage,
          };
        });

        const updated = [...images, ...newItems];
        // Ensure at least one image is primary
        if (!updated.some((i) => i.isPrimary) && updated.length > 0) {
          updated[0].isPrimary = true;
        }

        if (onImagesChange) {
          onImagesChange(updated);
        }

        const s3Count = results.filter((r) => r.storage === 's3').length;
        setSuccessMsg(
          s3Count > 0
            ? `${results.length} image(s) uploaded to AWS S3 & synced with catalog!`
            : `${results.length} image(s) processed and ready for storefront display!`
        );
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'File upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Set primary image
  const setPrimary = (index: number) => {
    if (!onImagesChange) return;
    const updated = images.map((img, idx) => ({
      ...img,
      isPrimary: idx === index,
    }));
    onImagesChange(updated);
  };

  // Remove image
  const removeImage = (index: number) => {
    if (!onImagesChange) return;
    const wasPrimary = images[index]?.isPrimary;
    const updated = images.filter((_, idx) => idx !== index);
    if (wasPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    onImagesChange(updated);
  };

  // Change view type
  const updateViewType = (index: number, viewType: ViewType) => {
    if (!onImagesChange) return;
    const updated = [...images];
    updated[index] = { ...updated[index], viewType };
    onImagesChange(updated);
  };

  // Manual URL Add
  const handleAddManualUrl = () => {
    if (!manualUrl.trim()) return;

    if (mode === 'single') {
      if (onSingleUrlChange) onSingleUrlChange(manualUrl.trim());
      setManualUrl('');
      setShowManualUrl(false);
      return;
    }

    const newItem: ImageItem = {
      s3Url: manualUrl.trim(),
      altText: `${manualViewType} View`,
      viewType: manualViewType,
      isPrimary: images.length === 0,
      sortOrder: images.length + 1,
    };

    const updated = [...images, newItem];
    if (onImagesChange) onImagesChange(updated);
    setManualUrl('');
    setShowManualUrl(false);
  };

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>, originalUrl: string) => {
    const target = e.currentTarget;
    if (!target.dataset.triedProxy && (originalUrl.includes('amazonaws.com') || originalUrl.includes('s3.'))) {
      const match = originalUrl.match(/amazonaws\.com\/(.+)$/);
      if (match) {
        target.dataset.triedProxy = 'true';
        const apiBase = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api/v1';
        target.src = `${apiBase.replace(/\/$/, '')}/media/file/${match[1]}`;
        return;
      }
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            {label}
          </label>
          {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
        </div>
      )}

      {/* Drag & Drop Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-brand-gold bg-brand-gold/10'
            : 'border-brand-border hover:border-slate-500 bg-brand-card/30 hover:bg-brand-card/60'
        } ${uploading ? 'pointer-events-none opacity-75' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple={mode === 'multiple'}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
              <p className="text-xs font-semibold text-white">
                {uploadProgress || 'Uploading assets to AWS S3...'}
              </p>
              <p className="text-[10px] text-slate-400">Processing &amp; optimizing image formats</p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  <span className="text-brand-gold hover:underline">Click to upload</span> or drag and drop
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  WEBP, JPG, PNG, GIF up to 20MB {mode === 'multiple' ? '• Batch multi-select supported' : ''}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Single Mode Preview */}
      {mode === 'single' && singleUrl && (
        <div className="p-3 bg-brand-card/70 border border-brand-border rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-900 border border-brand-border shrink-0">
              <img
                src={singleUrl}
                alt="Cover Preview"
                className="w-full h-full object-cover"
                onError={(e) => handleImgError(e, singleUrl)}
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{singleUrl.split('/').pop() || 'Cover Asset'}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{singleUrl}</p>
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Live on Storefront
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSingleUrlChange && onSingleUrlChange('')}
            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Remove image"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Multiple Mode: Gallery Grid with Angle Badges & Primary Selector */}
      {mode === 'multiple' && images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {images.length} Image{images.length > 1 ? 's' : ''} Attached
            </span>
            <span className="text-[11px] text-brand-gold">⭐ Star marks Cover image</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`group relative rounded-xl border p-2 bg-brand-card flex flex-col gap-2 transition-all ${
                  img.isPrimary
                    ? 'border-brand-gold shadow-md shadow-brand-gold/10'
                    : 'border-brand-border hover:border-slate-500'
                }`}
              >
                {/* Image Container */}
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-slate-900 relative">
                  <img
                    src={img.s3Url}
                    alt={img.altText || `Angle ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => handleImgError(e, img.s3Url)}
                  />

                  {/* Primary Cover Badge */}
                  {img.isPrimary && (
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-brand-gold text-brand-dark uppercase tracking-wider shadow">
                      Cover
                    </span>
                  )}

                  {/* Storage Indicator */}
                  {img.storage && (
                    <span
                      className="absolute top-1.5 right-1.5 p-1 rounded bg-black/70 text-slate-200"
                      title={img.storage === 's3' ? 'AWS S3 Cloud Storage' : 'Persistent Storage Fallback'}
                    >
                      {img.storage === 's3' ? (
                        <Cloud className="w-3 h-3 text-cyan-400" />
                      ) : (
                        <HardDrive className="w-3 h-3 text-emerald-400" />
                      )}
                    </span>
                  )}
                </div>

                {/* View Angle Selector Dropdown */}
                <div>
                  <select
                    value={img.viewType}
                    onChange={(e) => updateViewType(idx, e.target.value as ViewType)}
                    className="w-full px-2 py-1 bg-brand-dark border border-brand-border rounded-lg text-[10px] font-medium text-slate-200 focus:outline-none focus:border-brand-gold"
                  >
                    <option value="FRONT">Front Angle</option>
                    <option value="BACK">Back Angle</option>
                    <option value="SIDE">Side Angle</option>
                    <option value="DETAIL">Fabric Detail</option>
                    <option value="COVER">Cover</option>
                  </select>
                </div>

                {/* Actions: Set Cover / Delete */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-brand-border/60">
                  <button
                    type="button"
                    onClick={() => setPrimary(idx)}
                    className={`flex items-center gap-1 font-semibold text-[10px] transition-colors ${
                      img.isPrimary
                        ? 'text-brand-gold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Star className={`w-3 h-3 ${img.isPrimary ? 'fill-brand-gold' : ''}`} />
                    <span>{img.isPrimary ? 'Primary' : 'Make Cover'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Remove asset"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual URL Fallback Toggle */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-[11px] text-slate-400 hover:text-brand-gold flex items-center gap-1 transition-colors"
        >
          <Link2 className="w-3 h-3" />
          <span>{showManualUrl ? 'Hide manual URL input' : 'Or paste direct web image link'}</span>
        </button>

        {showManualUrl && (
          <div className="mt-2 p-3 bg-brand-card/40 border border-brand-border rounded-xl space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or https://..."
                className="flex-1 px-3 py-1.5 bg-brand-card border border-brand-border rounded-lg text-xs text-white focus:outline-none focus:border-brand-gold"
              />

              {mode === 'multiple' && (
                <select
                  value={manualViewType}
                  onChange={(e) => setManualViewType(e.target.value as ViewType)}
                  className="px-2.5 py-1.5 bg-brand-card border border-brand-border rounded-lg text-xs text-white focus:outline-none focus:border-brand-gold"
                >
                  <option value="FRONT">Front Angle</option>
                  <option value="BACK">Back Angle</option>
                  <option value="SIDE">Side Angle</option>
                  <option value="DETAIL">Fabric Detail</option>
                  <option value="COVER">Cover</option>
                </select>
              )}

              <button
                type="button"
                onClick={handleAddManualUrl}
                disabled={!manualUrl.trim()}
                className="px-3 py-1.5 bg-brand-gold hover:bg-brand-gold-light text-brand-dark rounded-lg font-semibold text-xs flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
