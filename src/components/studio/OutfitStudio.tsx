import React, { useState } from 'react';
import { Product, FrameColor, LensTint, SavedLook } from '../../types';
import { DEMO_PRODUCTS, DEMO_MODEL_IMAGE } from '../../data/products';
import {
  Sparkles,
  Layers,
  Heart,
  RotateCcw,
  Plus,
  Check,
  Split,
  Eye,
  Shirt,
  Upload,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface Props {
  initialEyewear?: Product;
  initialClothing?: Product;
  initialFrameColor?: FrameColor;
  initialLensTint?: LensTint;
  initialTryonResult?: string;
  onSaveLook: (look: SavedLook) => void;
  onOpenProductImporter: () => void;
}

export const OutfitStudio: React.FC<Props> = ({
  initialEyewear,
  initialClothing,
  initialFrameColor,
  initialLensTint,
  initialTryonResult,
  onSaveLook,
  onOpenProductImporter,
}) => {
  const eyewearList = DEMO_PRODUCTS.filter((p) => p.category === 'eyewear');
  const clothingList = DEMO_PRODUCTS.filter((p) => p.category === 'clothing');

  // Look A state
  const [eyewearA, setEyewearA] = useState<Product>(initialEyewear || eyewearList[0]);
  const [clothingA, setClothingA] = useState<Product>(initialClothing || clothingList[0]);
  const [frameColorA, setFrameColorA] = useState<FrameColor | undefined>(
    initialFrameColor || eyewearA.frameColors?.[0]
  );
  const [lensTintA, setLensTintA] = useState<LensTint | undefined>(
    initialLensTint || eyewearA.lensTints?.[0]
  );
  const [tryonResultA, setTryonResultA] = useState<string | null>(initialTryonResult || null);

  // Look B state (for dual comparison)
  const [eyewearB, setEyewearB] = useState<Product>(eyewearList[1] || eyewearList[0]);
  const [clothingB, setClothingB] = useState<Product>(clothingList[1] || clothingList[0]);
  const [frameColorB, setFrameColorB] = useState<FrameColor | undefined>(
    eyewearB.frameColors?.[1] || eyewearB.frameColors?.[0]
  );
  const [lensTintB, setLensTintB] = useState<LensTint | undefined>(
    eyewearB.lensTints?.[1] || eyewearB.lensTints?.[0]
  );
  const [tryonResultB, setTryonResultB] = useState<string | null>(null);

  // View state: 'singleA', 'singleB', 'compare'
  const [viewMode, setViewMode] = useState<'singleA' | 'singleB' | 'compare'>('singleA');

  // Saving state
  const [lookTitle, setLookTitle] = useState<string>('Refined Editorial Ensemble');
  const [isSavedFeedback, setIsSavedFeedback] = useState<boolean>(false);

  const activeLook = viewMode === 'singleB' ? 'B' : 'A';
  const currentEyewear = activeLook === 'A' ? eyewearA : eyewearB;
  const currentClothing = activeLook === 'A' ? clothingA : clothingB;
  const currentFrameColor = activeLook === 'A' ? frameColorA : frameColorB;
  const currentLensTint = activeLook === 'A' ? lensTintA : lensTintB;
  const currentPreview = activeLook === 'A' ? tryonResultA : tryonResultB;

  const handleSaveCurrentLook = () => {
    const newLook: SavedLook = {
      id: `look-${Date.now()}`,
      title: lookTitle || `${currentEyewear.name} + ${currentClothing.name}`,
      createdAt: new Date().toISOString(),
      userPhoto: DEMO_MODEL_IMAGE,
      resultImage: currentPreview || DEMO_MODEL_IMAGE,
      eyewearProduct: currentEyewear,
      clothingProduct: currentClothing,
      frameColor: currentFrameColor?.name,
      lensTint: currentLensTint?.name,
      clothingSize: currentClothing.sizes?.[0] || 'M',
      notes: `Coordinated styling ensemble configured in VFit Outfit Studio.`,
    };

    onSaveLook(newLook);
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 3000);
  };

  const handleResetSession = () => {
    setEyewearA(eyewearList[0]);
    setClothingA(clothingList[0]);
    setFrameColorA(eyewearList[0].frameColors?.[0]);
    setLensTintA(eyewearList[0].lensTints?.[0]);
    setTryonResultA(null);
    setTryonResultB(null);
    setViewMode('singleA');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="text-xs font-semibold text-sky-600 tracking-wider uppercase mb-1">
            Virtual Outfit Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            Harmonized Eyewear & Apparel Styling
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Coordinate eyewear silhouettes and apparel pieces into a single complete look. Compare alternate styling combinations side by side.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setViewMode('singleA')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'singleA'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Look 1
          </button>
          <button
            onClick={() => setViewMode('singleB')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'singleB'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Look 2 (Alternative)
          </button>
          <button
            onClick={() => setViewMode('compare')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'compare'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Split className="w-3.5 h-3.5 text-sky-600" />
            <span>Side-by-Side Compare</span>
          </button>
        </div>
      </div>

      {/* Main Studio Area */}
      {viewMode === 'compare' ? (
        /* Side-by-Side Comparison Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Look A Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                Look 1: Primary Selection
              </span>
              <span className="text-xs font-semibold text-slate-900 tabular-nums">
                Total: ${(eyewearA.priceSample + clothingA.priceSample).toLocaleString()}
              </span>
            </div>

            <div className="w-full h-80 rounded-xl overflow-hidden bg-slate-950 relative flex items-center justify-center">
              <img
                src={tryonResultA || clothingA.image}
                alt="Look 1 Preview"
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] flex items-center justify-between">
                <div>
                  <span className="font-semibold">{eyewearA.name}</span> +{' '}
                  <span className="text-slate-300">{clothingA.name}</span>
                </div>
                {frameColorA && (
                  <span className="text-sky-300 text-[10px]">{frameColorA.name}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Eyewear</div>
                <div className="font-semibold text-slate-800">{eyewearA.name}</div>
                <div className="text-[11px] text-slate-500">${eyewearA.priceSample} USD</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Apparel</div>
                <div className="font-semibold text-slate-800">{clothingA.name}</div>
                <div className="text-[11px] text-slate-500">${clothingA.priceSample} USD</div>
              </div>
            </div>
          </div>

          {/* Look B Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                Look 2: Alternative Selection
              </span>
              <span className="text-xs font-semibold text-slate-900 tabular-nums">
                Total: ${(eyewearB.priceSample + clothingB.priceSample).toLocaleString()}
              </span>
            </div>

            <div className="w-full h-80 rounded-xl overflow-hidden bg-slate-950 relative flex items-center justify-center">
              <img
                src={tryonResultB || clothingB.image}
                alt="Look 2 Preview"
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] flex items-center justify-between">
                <div>
                  <span className="font-semibold">{eyewearB.name}</span> +{' '}
                  <span className="text-slate-300">{clothingB.name}</span>
                </div>
                {frameColorB && (
                  <span className="text-sky-300 text-[10px]">{frameColorB.name}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Eyewear</div>
                <div className="font-semibold text-slate-800">{eyewearB.name}</div>
                <div className="text-[11px] text-slate-500">${eyewearB.priceSample} USD</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Apparel</div>
                <div className="font-semibold text-slate-800">{clothingB.name}</div>
                <div className="text-[11px] text-slate-500">${clothingB.priceSample} USD</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Unified Active Workspace (Look A or Look B) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Dominant Composite Viewport (Column 8) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative w-full h-[520px] md:h-[620px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl flex items-center justify-center">
              {/* Studio Canvas Model */}
              <img
                src={currentPreview || currentClothing.image}
                alt="Styling Preview"
                className="w-full h-full object-contain"
              />

              {/* Eyewear Floating Composite Overlay */}
              <div className="absolute top-6 left-6 z-20 flex items-center gap-3 p-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs">
                <img
                  src={currentEyewear.image}
                  alt={currentEyewear.name}
                  className="w-10 h-10 rounded-lg object-contain bg-white/10 border border-white/20 p-1"
                />
                <div>
                  <div className="font-semibold">{currentEyewear.name}</div>
                  <div className="text-[10px] text-slate-300">
                    {currentFrameColor?.name} · {currentLensTint?.name}
                  </div>
                </div>
              </div>

              {/* Garment Floating Composite Overlay */}
              <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3 p-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs">
                <img
                  src={currentClothing.image}
                  alt={currentClothing.name}
                  className="w-10 h-10 rounded-lg object-cover border border-white/20"
                />
                <div>
                  <div className="font-semibold">{currentClothing.name}</div>
                  <div className="text-[10px] text-slate-300">
                    Category: {currentClothing.subcategory}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Dock */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={lookTitle}
                  onChange={(e) => setLookTitle(e.target.value)}
                  placeholder="Name this look..."
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 w-64"
                />
                <button
                  onClick={handleSaveCurrentLook}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  {isSavedFeedback ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Saved to Collection</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-3.5 h-3.5" />
                      <span>Save Look</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetSession}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Studio</span>
                </button>
              </div>
            </div>
          </div>

          {/* Product Switching & Coordination Controls (Column 4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Eyewear Component Box */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Selected Eyewear
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-900 tabular-nums">
                  ${currentEyewear.priceSample}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-sm font-semibold text-slate-900">{currentEyewear.name}</div>
                <div className="text-xs text-slate-500">{currentEyewear.tagline}</div>
              </div>

              {/* Frame Color Selection */}
              {currentEyewear.frameColors && (
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Frame Finish
                  </div>
                  <div className="flex items-center gap-2">
                    {currentEyewear.frameColors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => {
                          if (activeLook === 'A') setFrameColorA(color);
                          else setFrameColorB(color);
                        }}
                        style={{ backgroundColor: color.hex }}
                        className={`w-6 h-6 rounded-full border transition-transform ${
                          currentFrameColor?.id === color.id
                            ? 'ring-2 ring-sky-500 scale-110 border-white'
                            : 'border-slate-300'
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Eyewear Quick Switcher */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Switch Silhouette
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {eyewearList.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (activeLook === 'A') {
                          setEyewearA(item);
                          setFrameColorA(item.frameColors?.[0]);
                          setLensTintA(item.lensTints?.[0]);
                        } else {
                          setEyewearB(item);
                          setFrameColorB(item.frameColors?.[0]);
                          setLensTintB(item.lensTints?.[0]);
                        }
                      }}
                      className={`p-2 text-left rounded-lg text-xs font-medium border transition-colors truncate ${
                        currentEyewear.id === item.id
                          ? 'border-sky-500 bg-sky-50 text-sky-800'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clothing Component Box */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Selected Garment
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-900 tabular-nums">
                  ${currentClothing.priceSample}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-sm font-semibold text-slate-900">{currentClothing.name}</div>
                <div className="text-xs text-slate-500">{currentClothing.tagline}</div>
              </div>

              {/* Garment Quick Switcher */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Switch Garment
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {clothingList.map((garment) => (
                    <button
                      key={garment.id}
                      onClick={() => {
                        if (activeLook === 'A') setClothingA(garment);
                        else setClothingB(garment);
                      }}
                      className={`p-2 text-left rounded-lg text-xs font-medium border transition-colors truncate ${
                        currentClothing.id === garment.id
                          ? 'border-sky-500 bg-sky-50 text-sky-800'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {garment.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={onOpenProductImporter}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-sky-600" />
                <span>Upload Custom Product</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
