import React, { useState } from 'react';
import { Product, ProductCategory } from '../../types';
import { DEMO_PRODUCTS } from '../../data/products';
import {
  Search,
  Filter,
  Eye,
  Camera,
  ExternalLink,
  Sparkles,
  Rotate3d,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

interface Props {
  onSelectEyewear: (product: Product, mode: 'inspect' | 'tryon') => void;
  onSelectClothing: (product: Product) => void;
  onOpenProductImporter: () => void;
}

export const ProductCatalogue: React.FC<Props> = ({
  onSelectEyewear,
  onSelectClothing,
  onOpenProductImporter,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | ProductCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  // Filter products
  const filteredProducts = DEMO_PRODUCTS.filter((product) => {
    const matchesCategory =
      activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.priceSample - b.priceSample;
    if (sortBy === 'price-desc') return b.priceSample - a.priceSample;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Catalogue Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="text-xs font-semibold text-sky-600 tracking-wider uppercase mb-1">
            Curated Atelier Collection
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            Designer Eyewear & Tailored Apparel
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Explore 3D-engineered eyewear silhouettes and minimalist luxury garments. Every piece can be experienced in virtual 3D or fitted onto your photo.
          </p>
        </div>

        <button
          onClick={onOpenProductImporter}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-sm transition-all self-start md:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>Upload External Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Filter Tabs (Clean segmented control per rules) */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeCategory === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Pieces ({DEMO_PRODUCTS.length})
          </button>
          <button
            onClick={() => setActiveCategory('eyewear')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeCategory === 'eyewear'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Eyewear (3D)
          </button>
          <button
            onClick={() => setActiveCategory('clothing')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeCategory === 'clothing'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clothing
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by silhouette, style..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
          <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-900">No products found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  {product.has3DModel && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-950/80 text-white backdrop-blur-md flex items-center gap-1">
                      <Rotate3d className="w-3 h-3 text-sky-400" />
                      3D Model Available
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 text-slate-700 shadow-sm backdrop-blur-sm uppercase tracking-wide">
                    {product.subcategory}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="text-sm font-bold text-slate-900 tabular-nums">
                      ${product.priceSample}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Available Colors or Sizes indicator */}
                {product.category === 'eyewear' && product.frameColors && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400">Finishes:</span>
                    <div className="flex items-center gap-1">
                      {product.frameColors.slice(0, 4).map((c) => (
                        <div
                          key={c.id}
                          style={{ backgroundColor: c.hex }}
                          className="w-3.5 h-3.5 rounded-full border border-slate-300"
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {product.category === 'clothing' && product.sizes && (
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                    <span className="text-[10px] text-slate-400">Sizes:</span>
                    <span>{product.sizes.slice(0, 4).join(', ')}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  {product.category === 'eyewear' ? (
                    <>
                      <button
                        onClick={() => onSelectEyewear(product, 'inspect')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                        <span>Inspect 3D</span>
                      </button>
                      <button
                        onClick={() => onSelectEyewear(product, 'tryon')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-xl border border-sky-200 transition-all"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Try On</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onSelectClothing(product)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Virtual Try-On</span>
                    </button>
                  )}

                  {product.sellerUrl && (
                    <a
                      href={product.sellerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                      title="View original seller website"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
