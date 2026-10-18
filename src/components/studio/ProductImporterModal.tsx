import React, { useState } from 'react';
import { Product, ProductCategory } from '../../types';
import {
  Upload,
  Link2,
  X,
  Sparkles,
  AlertCircle,
  Check,
  RefreshCw,
  Info,
  ExternalLink,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProductImported: (product: Product) => void;
}

export const ProductImporterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onProductImported,
}) => {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');

  // File upload state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [productName, setProductName] = useState<string>('');
  const [category, setCategory] = useState<ProductCategory>('clothing');
  const [estimatedPrice, setEstimatedPrice] = useState<string>('250');
  const [sellerName, setSellerName] = useState<string>('External Import');

  // URL state
  const [urlInput, setUrlInput] = useState<string>('');
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|avif)$/)) {
      alert('Please upload an image in JPG, PNG, or WebP format.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('File size exceeds 8MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
      if (!productName) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setProductName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleScrapeUrl = async () => {
    if (!urlInput.trim()) return;

    try {
      new URL(urlInput);
    } catch {
      setScrapeError('Please enter a valid HTTP or HTTPS product URL.');
      return;
    }

    setIsScraping(true);
    setScrapeError(null);

    try {
      const response = await fetch('/api/products/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Could not extract product details. Some websites block external scrapers.'
        );
      }

      if (data.product) {
        setUploadedImage(data.product.image);
        setProductName(data.product.title || 'Imported Fashion Item');
        setCategory(data.product.category || 'clothing');
        if (data.product.price) setEstimatedPrice(data.product.price.toString());
        if (data.product.brand) setSellerName(data.product.brand);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to import product from URL.';
      setScrapeError(msg);
    } finally {
      setIsScraping(false);
    }
  };

  const handleApply = () => {
    if (!uploadedImage) return;

    const importedProduct: Product = {
      id: `imported-${Date.now()}`,
      name: productName.trim() || 'Custom Imported Garment',
      tagline: 'Custom external import',
      category: category,
      subcategory: category === 'eyewear' ? 'aviator' : 'jacket',
      description: `User-imported product from ${sellerName}. 2D photography preview rendered in VFit Studio.`,
      priceSample: parseFloat(estimatedPrice) || 0,
      currency: 'USD',
      image: uploadedImage,
      has3DModel: false, // 2D image import is clearly distinguished from genuine 3D model
      isCustomUpload: true,
      sellerName: sellerName,
      sellerUrl: tab === 'url' ? urlInput : undefined,
    };

    onProductImported(importedProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">
              Import Product to VFit
            </h3>
            <p className="text-xs text-slate-500">
              Try on eyewear or garments from external stores or your own files.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 px-6 pt-3 gap-4">
          <button
            onClick={() => setTab('upload')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
              tab === 'upload'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image File</span>
          </button>
          <button
            onClick={() => setTab('url')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
              tab === 'url'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Paste Product URL</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {tab === 'upload' ? (
            <div>
              {!uploadedImage ? (
                <label className="flex flex-col items-center justify-center w-full h-44 rounded-xl border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50/50 hover:bg-sky-50/20 cursor-pointer transition-colors p-4 text-center">
                  <Upload className="w-8 h-8 text-sky-500 mb-2" />
                  <span className="text-xs font-semibold text-slate-700">
                    Click to browse or drop product photo here
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Supports JPG, PNG, WebP up to 8MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <img
                    src={uploadedImage}
                    alt="Preview"
                    className="w-20 h-20 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {productName || 'Product Image Loaded'}
                    </div>
                    <div className="text-[11px] text-slate-500">Ready to preview in Studio</div>
                  </div>
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="text-xs text-rose-600 hover:underline px-2 py-1"
                  >
                    Replace
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  External Store Product Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://brand.com/products/merino-jacket"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    onClick={handleScrapeUrl}
                    disabled={isScraping || !urlInput.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {isScraping ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Extract</span>
                    )}
                  </button>
                </div>
              </div>

              {scrapeError && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div>{scrapeError}</div>
                    <div className="text-[11px] text-amber-700 mt-1">
                      Tip: If direct import is blocked, please take a quick screenshot or save the image, then switch to the "Upload Image File" tab.
                    </div>
                  </div>
                </div>
              )}

              {uploadedImage && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <img
                    src={uploadedImage}
                    alt="Scraped"
                    className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {productName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{sellerName}</div>
                  </div>
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
              )}
            </div>
          )}

          {/* Product Metadata Inputs */}
          {uploadedImage && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Category
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('clothing')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      category === 'clothing'
                        ? 'bg-sky-50 border-sky-500 text-sky-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Clothing / Apparel
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('eyewear')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      category === 'eyewear'
                        ? 'bg-sky-50 border-sky-500 text-sky-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Eyewear / Sunglasses
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Italian Wool Trench"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Distinction Banner: 2D Image vs 3D Model per prompt mandate */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>2D Photographic Asset:</strong> External uploads remain high-fidelity 2D images used for AI virtual garment try-on. Rotatable 3D product inspection is reserved for verified 3D assets in the catalogue.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/70">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!uploadedImage}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            Add to Studio
          </button>
        </div>
      </div>
    </div>
  );
};
