import React, { useState, useEffect } from 'react';
import { StoredLookItem, getAllLooks, deleteLook } from '../../utils/indexedDb';
import {
  Heart,
  Trash2,
  Download,
  Split,
  Eye,
  Shirt,
  Calendar,
  X,
  Check,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface Props {
  onOpenInStudio?: (look: StoredLookItem) => void;
}

export const MyLooksPage: React.FC<Props> = ({ onOpenInStudio }) => {
  const [looks, setLooks] = useState<StoredLookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lookToDelete, setLookToDelete] = useState<StoredLookItem | null>(null);

  // Compare mode: select two looks to compare side-by-side
  const [compareLook1, setCompareLook1] = useState<StoredLookItem | null>(null);
  const [compareLook2, setCompareLook2] = useState<StoredLookItem | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const refreshLooks = async () => {
    setIsLoading(true);
    try {
      const items = await getAllLooks();
      setLooks(items);
    } catch (err) {
      console.warn('Failed to load looks from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshLooks();
  }, []);

  const handleConfirmDelete = async () => {
    if (!lookToDelete) return;
    try {
      await deleteLook(lookToDelete.id);
      await refreshLooks();
    } catch (err) {
      console.error('Delete look error:', err);
    } finally {
      setLookToDelete(null);
    }
  };

  const handleDownload = (look: StoredLookItem) => {
    const a = document.createElement('a');
    a.href = look.resultImage;
    a.download = `${look.title.replace(/\s+/g, '-').toLowerCase()}-vfit.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const startComparison = (initialLook: StoredLookItem) => {
    setCompareLook1(initialLook);
    // Find an alternative look to pair automatically
    const other = looks.find((l) => l.id !== initialLook.id) || null;
    setCompareLook2(other);
    setIsCompareModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="text-xs font-semibold text-sky-600 tracking-wider uppercase mb-1">
            Personal Lookbook & Archive
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            My Looks
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Review your completed eyewear and clothing try-on combinations, compare alternate styling options side by side, and export high-resolution lookbook previews.
          </p>
        </div>

        {looks.length >= 2 && (
          <button
            onClick={() => {
              setCompareLook1(looks[0]);
              setCompareLook2(looks[1]);
              setIsCompareModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-sm transition-all self-start md:self-auto"
          >
            <Split className="w-3.5 h-3.5 text-sky-600" />
            <span>Compare Any 2 Looks</span>
          </button>
        )}
      </div>

      {/* Looks Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 text-xs">
          Loading your lookbook...
        </div>
      ) : looks.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base text-slate-900">
              No saved looks yet
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Complete a virtual try-on session in the Eyewear or Clothing studio and tap “Save Look” to add it here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {looks.map((look) => (
            <div
              key={look.id}
              className="group rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Preview Image */}
              <div className="relative aspect-[3/4] bg-slate-950 overflow-hidden flex items-center justify-center">
                <img
                  src={look.resultImage}
                  alt={look.title}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-semibold text-white/90">
                  {new Date(look.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>

              {/* Look Info */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    {look.title}
                  </h3>
                  {look.notes && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{look.notes}</p>
                  )}
                </div>

                {/* Coordinated Specs */}
                <div className="space-y-1 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  {look.eyewearName && (
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500">Eyewear:</span>
                      <span className="font-medium text-slate-900">{look.eyewearName}</span>
                    </div>
                  )}
                  {look.frameColor && (
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500">Finish:</span>
                      <span className="font-medium">{look.frameColor}</span>
                    </div>
                  )}
                  {look.clothingName && (
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500">Garment:</span>
                      <span className="font-medium text-slate-900">{look.clothingName}</span>
                    </div>
                  )}
                  {look.size && (
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500">Size & Fit:</span>
                      <span className="font-medium">
                        {look.size} · {look.fitPreference || 'Regular'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                  <button
                    onClick={() => startComparison(look)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-xl border border-sky-200/80 transition-colors"
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span>Compare</span>
                  </button>

                  <button
                    onClick={() => handleDownload(look)}
                    className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                    title="Download look photo"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setLookToDelete(look)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                    title="Delete look"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Side-by-Side Compare Modal */}
      {isCompareModalOpen && compareLook1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Split className="w-4 h-4 text-sky-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Side-by-Side Look Comparison
                </h3>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Look 1 */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-700 uppercase">Look A</span>
                  <select
                    value={compareLook1.id}
                    onChange={(e) => {
                      const found = looks.find((l) => l.id === e.target.value);
                      if (found) setCompareLook1(found);
                    }}
                    className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-2 py-1"
                  >
                    {looks.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full h-80 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
                  <img
                    src={compareLook1.resultImage}
                    alt={compareLook1.title}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="text-xs space-y-1">
                  <div className="font-semibold text-slate-900">{compareLook1.title}</div>
                  {compareLook1.eyewearName && (
                    <div className="text-slate-500">Eyewear: {compareLook1.eyewearName}</div>
                  )}
                  {compareLook1.clothingName && (
                    <div className="text-slate-500">Garment: {compareLook1.clothingName}</div>
                  )}
                </div>
              </div>

              {/* Look 2 */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-700 uppercase">Look B</span>
                  <select
                    value={compareLook2?.id || ''}
                    onChange={(e) => {
                      const found = looks.find((l) => l.id === e.target.value);
                      if (found) setCompareLook2(found);
                    }}
                    className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-2 py-1"
                  >
                    {looks.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </div>

                {compareLook2 ? (
                  <>
                    <div className="w-full h-80 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
                      <img
                        src={compareLook2.resultImage}
                        alt={compareLook2.title}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="font-semibold text-slate-900">{compareLook2.title}</div>
                      {compareLook2.eyewearName && (
                        <div className="text-slate-500">Eyewear: {compareLook2.eyewearName}</div>
                      )}
                      {compareLook2.clothingName && (
                        <div className="text-slate-500">Garment: {compareLook2.clothingName}</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-80 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                    Save a second look to compare
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {lookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm">
                <Trash2 className="w-4 h-4" />
                <span>Delete Saved Look</span>
              </div>
              <button
                onClick={() => setLookToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong>{lookToDelete.title}</strong> from your saved looks?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setLookToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
