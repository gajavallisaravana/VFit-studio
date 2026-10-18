import React, { useState, useEffect } from 'react';
import { Product, FrameColor, LensTint } from '../../types';
import { DEMO_PRODUCTS, FRAME_COLORS, LENS_TINTS } from '../../data/products';
import { Glasses3DInspector } from './Glasses3DInspector';
import { FaceTrackingCanvas } from './FaceTrackingCanvas';
import {
  Eye,
  Camera,
  ExternalLink,
  Sparkles,
  Check,
  ArrowRight,
  CircleDot,
  Layers,
} from 'lucide-react';

interface Props {
  initialPhotoUrl?: string | null;
  onSendToOutfitStudio: (
    eyewear: Product,
    frameColor?: FrameColor,
    lensTint?: LensTint,
    faceSnapshot?: string
  ) => void;
}

export const EyewearStudio: React.FC<Props> = ({
  initialPhotoUrl,
  onSendToOutfitStudio,
}) => {
  const eyewearList = DEMO_PRODUCTS.filter((p) => p.category === 'eyewear');

  // Five target frame shapes: Round, Rectangle, Cat-eye, Aviator, Transparent frames
  const sampleFrames = [
    {
      shape: 'round',
      label: 'Round',
      desc: 'Minimalist circular wireframe',
      product: eyewearList.find((p) => p.frameShape === 'round') || eyewearList[2],
    },
    {
      shape: 'rectangle',
      label: 'Rectangle',
      desc: 'Architectural clean lines',
      product: eyewearList.find((p) => p.frameShape === 'rectangle') || eyewearList[3],
    },
    {
      shape: 'cat-eye',
      label: 'Cat-Eye',
      desc: 'Sculpted upward-swept apex',
      product: eyewearList.find((p) => p.frameShape === 'cat-eye') || eyewearList[1],
    },
    {
      shape: 'aviator',
      label: 'Aviator',
      desc: 'Aerospace beta-titanium teardrop',
      product: eyewearList.find((p) => p.frameShape === 'aviator') || eyewearList[0],
    },
    {
      shape: 'transparent',
      label: 'Transparent',
      desc: 'Ultra-clear polished crystal',
      product: eyewearList.find((p) => p.frameShape === 'transparent') || eyewearList[4],
    },
  ];

  const [selectedProduct, setSelectedProduct] = useState<Product>(sampleFrames[3].product);
  // Default to Virtual Try-On per requirement 5
  const [activeTab, setActiveTab] = useState<'tryon' | 'inspect'>('tryon');

  const [selectedFrame, setSelectedFrame] = useState<FrameColor>(
    FRAME_COLORS[0]
  );
  const [selectedLens, setSelectedLens] = useState<LensTint>(
    LENS_TINTS[0]
  );
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleCapture = (snapshotUrl: string) => {
    setCapturedSnapshot(snapshotUrl);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="text-xs font-semibold text-sky-600 tracking-wider uppercase mb-1">
            Virtual Fitting Room
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            Eyewear Try-On
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Place procedural 3D frames on your face photo or camera stream. Choose frame silhouettes and colours with live precision positioning.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('tryon')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'tryon'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-sky-600" />
            <span>Virtual Try-On</span>
          </button>
          <button
            onClick={() => setActiveTab('inspect')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'inspect'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-sky-600" />
            <span>3D Product Inspector</span>
          </button>
        </div>
      </div>

      {/* Frame Selection & Colour Palette Quick Bar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        {/* Row 1: Sample Frames Collection (Round, Rectangle, Cat-eye, Aviator, Transparent) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Choose Eyewear Frame
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Active: <strong className="text-slate-800">{selectedProduct.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {sampleFrames.map((frame) => {
              const isSelected = selectedProduct.id === frame.product.id;
              return (
                <button
                  key={frame.shape}
                  onClick={() => handleSelectProduct(frame.product)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/70 shadow-sm ring-1 ring-sky-500'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-xs text-slate-900">
                      {frame.label}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{frame.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Frame Colours (Black, Silver, Gold, Tortoise / Brown, Transparent) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap">
              2. Frame Colour:
            </span>
            <div className="flex items-center gap-2">
              {FRAME_COLORS.map((fc) => {
                const isSelected = selectedFrame.id === fc.id;
                return (
                  <button
                    key={fc.id}
                    onClick={() => setSelectedFrame(fc)}
                    title={fc.name}
                    className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 shadow-sm ring-1 ring-sky-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/15 shadow-inner shrink-0"
                      style={{ backgroundColor: fc.hex }}
                    />
                    <span className="text-xs font-medium text-slate-700">{fc.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Lens Tint Palette */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Lens Tint:</span>
            <div className="flex items-center gap-1.5">
              {LENS_TINTS.slice(0, 4).map((tint) => (
                <button
                  key={tint.id}
                  onClick={() => setSelectedLens(tint)}
                  title={tint.name}
                  className={`w-6 h-6 rounded-full border transition-all ${
                    selectedLens.id === tint.id
                      ? 'ring-2 ring-sky-500 scale-110 shadow-sm'
                      : 'border-slate-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: tint.color }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Dominant central 3D viewport + Curated side catalogue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Dominant 3D Viewport (Column 8) */}
        <div className="lg:col-span-8 space-y-4">
          {activeTab === 'inspect' ? (
            <Glasses3DInspector
              product={selectedProduct}
              selectedFrameColor={selectedFrame}
              selectedLensTint={selectedLens}
              onFrameColorChange={setSelectedFrame}
              onLensTintChange={setSelectedLens}
            />
          ) : (
            <FaceTrackingCanvas
              product={selectedProduct}
              selectedFrameColor={selectedFrame}
              selectedLensTint={selectedLens}
              initialPhotoUrl={initialPhotoUrl}
              onCaptureLook={handleCapture}
            />
          )}

          {/* Snapshot Confirmation Bar if captured */}
          {capturedSnapshot && (
            <div className="p-4 rounded-xl bg-sky-50/80 border border-sky-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={capturedSnapshot}
                  alt="Captured Look Preview"
                  className="w-12 h-12 rounded-lg object-cover border border-sky-200"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-900">Look Captured Successfully</div>
                  <div className="text-[11px] text-slate-500">Ready to coordinate with apparel in the Virtual Outfit Studio</div>
                </div>
              </div>
              <button
                onClick={() =>
                  onSendToOutfitStudio(selectedProduct, selectedFrame, selectedLens, capturedSnapshot)
                }
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <span>Continue to Outfit Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Product Details & Selection Column (Column 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Selected Product Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-sky-600 tracking-wide uppercase">
                  {selectedProduct.subcategory} · {selectedProduct.frameShape || 'Eyewear'}
                </span>
                <h3 className="text-lg font-display font-bold text-slate-900">
                  {selectedProduct.name}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-900 tabular-nums">
                  ${selectedProduct.priceSample}
                </div>
                <div className="text-[10px] text-slate-400">USD Sample</div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedProduct.description}
            </p>

            {/* Sizes */}
            {selectedProduct.sizes && (
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Available Bridge & Temple Sizes
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProduct.sizes.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-md"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-2 border-t border-slate-100">
              <button
                onClick={() =>
                  onSendToOutfitStudio(selectedProduct, selectedFrame, selectedLens, capturedSnapshot || undefined)
                }
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Style in Complete Outfit Studio</span>
              </button>

              {selectedProduct.sellerUrl && (
                <a
                  href={selectedProduct.sellerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition-colors"
                >
                  <span>Visit {selectedProduct.sellerName || 'Original Atelier'}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              )}
            </div>
          </div>

          {/* Curated Eyewear Silhouette Selector */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Complete Eyewear Collection ({eyewearList.length})
            </h4>

            <div className="space-y-2">
              {eyewearList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectProduct(item)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    selectedProduct.id === item.id
                      ? 'border-sky-500 bg-sky-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{item.name}</div>
                    <div className="text-[11px] text-slate-500">{item.tagline}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-900 tabular-nums">
                      ${item.priceSample}
                    </div>
                    {selectedProduct.id === item.id && (
                      <span className="text-[10px] text-sky-600 font-medium">Active</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
