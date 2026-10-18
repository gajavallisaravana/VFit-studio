import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { DEMO_PRODUCTS, DEMO_MODEL_IMAGE } from '../../data/products';
import {
  Upload,
  Sparkles,
  RefreshCw,
  Check,
  AlertCircle,
  ExternalLink,
  Split,
  Layers,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Info,
  RotateCcw,
  Camera,
  Heart,
  Download,
} from 'lucide-react';
import { CameraCaptureModal } from '../common/CameraCaptureModal';
import { saveLook, savePhoto } from '../../utils/indexedDb';

interface Props {
  initialPhotoUrl?: string | null;
  onSendToOutfitStudio: (clothing: Product, generatedTryonImage?: string) => void;
  onOpenProductImporter: () => void;
}

export const ClothingStudio: React.FC<Props> = ({
  initialPhotoUrl,
  onSendToOutfitStudio,
  onOpenProductImporter,
}) => {
  const clothingList = DEMO_PRODUCTS.filter((p) => p.category === 'clothing');
  const [selectedGarment, setSelectedGarment] = useState<Product>(clothingList[0]);
  const [selectedSize, setSelectedSize] = useState<string>(clothingList[0].sizes?.[1] || 'M');

  // Provider configuration state
  const [providerStatus, setProviderStatus] = useState<{
    configured: boolean;
    provider: 'gemini' | 'external' | 'none';
    message: string;
  } | null>(null);

  // User Model Photo state
  const [userPhoto, setUserPhoto] = useState<string>(initialPhotoUrl || DEMO_MODEL_IMAGE);
  const [isCustomPhoto, setIsCustomPhoto] = useState<boolean>(!!initialPhotoUrl);

  useEffect(() => {
    if (initialPhotoUrl) {
      setUserPhoto(initialPhotoUrl);
      setIsCustomPhoto(true);
      setGeneratedResult(null);
    }
  }, [initialPhotoUrl]);

  // Privacy & Consent state
  const [hasUserConsent, setHasUserConsent] = useState<boolean>(false);

  // Try-on generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<number>(1);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [generationInfo, setGenerationInfo] = useState<{
    serviceUsed?: string;
    executionTimeMs?: number;
    note?: string;
  } | null>(null);

  // Comparison mode: 'split' (interactive slider), 'sideBySide', 'toggle'
  const [compareMode, setCompareMode] = useState<'split' | 'sideBySide' | 'toggle'>('split');
  const [splitPos, setSplitPos] = useState<number>(50); // percentage 0-100
  const [showResultInToggle, setShowResultInToggle] = useState<boolean>(true);

  // Camera modals
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isGarmentCameraOpen, setIsGarmentCameraOpen] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  // Check provider status on mount
  useEffect(() => {
    fetch('/api/tryon/status')
      .then((res) => res.json())
      .then((data) => setProviderStatus(data))
      .catch(() =>
        setProviderStatus({
          configured: false,
          provider: 'none',
          message: 'Could not connect to try-on status endpoint.',
        })
      );
  }, []);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|avif)$/)) {
      alert('Please upload a clear JPEG, PNG, or WebP photo.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Photo exceeds 10MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setUserPhoto(url);
      setIsCustomPhoto(true);
      setGeneratedResult(null);
      setErrorMsg(null);
      setErrorCode(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Delete/Reset Photo
  const handleDeletePhoto = () => {
    setUserPhoto(DEMO_MODEL_IMAGE);
    setIsCustomPhoto(false);
    setGeneratedResult(null);
    setErrorMsg(null);
    setErrorCode(null);
  };

  // Upload Custom Garment Image directly
  const handleCustomGarmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const customItem: Product = {
        id: `garment-custom-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Custom Garment',
        tagline: 'Uploaded Custom Clothing',
        description: 'Custom garment uploaded for virtual fitting.',
        category: 'clothing',
        subcategory: 'dress',
        priceSample: 0,
        image: dataUrl,
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
      };
      setSelectedGarment(customItem);
      setSelectedSize('M');
      setGeneratedResult(null);
      showToast('Custom garment selected! Click "Try This Outfit" to fit.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Save to My Looks
  const handleSaveToMyLooks = async () => {
    if (!generatedResult) return;
    try {
      await saveLook({
        id: `look-${Date.now()}`,
        title: `${selectedGarment.name} Outfit Fit`,
        createdAt: new Date().toISOString(),
        resultImage: generatedResult,
        originalImage: userPhoto,
        clothingName: selectedGarment.name,
        size: selectedSize,
        notes: `Virtual fitting created in Clothing Studio.`,
      });
      showToast('Saved to My Looks in your browser!');
    } catch (err) {
      console.warn('Error saving look:', err);
    }
  };

  // Download Try-On Image
  const handleDownloadResult = () => {
    if (!generatedResult) return;
    const a = document.createElement('a');
    a.href = generatedResult;
    a.download = `vfit-${selectedGarment.name.toLowerCase().replace(/\s+/g, '-')}-tryon.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Look downloaded to your device!');
  };

  // Trigger Virtual Try-On API Call
  const handleGenerateTryOn = async () => {
    if (!hasUserConsent) {
      setErrorMsg('Please confirm your consent before processing your photo with the AI virtual try-on engine.');
      setErrorCode('CONSENT_REQUIRED');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(1);
    setErrorMsg(null);
    setErrorCode(null);

    // Simulate progressive processing feedback
    const stepTimer1 = setTimeout(() => setGenerationStep(2), 1200);
    const stepTimer2 = setTimeout(() => setGenerationStep(3), 2600);

    try {
      const response = await fetch('/api/tryon/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userImage: userPhoto,
          garmentImage: selectedGarment.image,
          garmentName: selectedGarment.name,
          garmentCategory: selectedGarment.subcategory,
          garmentDescription: selectedGarment.description,
          userConsent: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorCode(data.code || 'ERROR');
        throw new Error(data.error || 'Virtual try-on processing failed.');
      }

      setGeneratedResult(data.resultImage);
      setGenerationInfo({
        serviceUsed: data.serviceUsed,
        executionTimeMs: data.executionTimeMs,
        note: data.message,
      });
    } catch (err: unknown) {
      console.error('Try-on error:', err);
      const message = err instanceof Error ? err.message : 'Virtual try-on service unavailable.';
      setErrorMsg(message);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsGenerating(false);
    }
  };

  const isProviderActive = providerStatus?.configured === true;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl border border-white/20 shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="text-xs font-semibold text-sky-600 tracking-wider uppercase mb-1">
            AI Virtual Fitting Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            Realistic Virtual Clothing Try-On
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Upload your photo, select a luxury garment from the atelier or an external store, and preview authentic AI draping with realistic folds, lighting, and contours.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-sm transition-all cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-sky-600" />
            <span>Upload Garment File</span>
            <input type="file" accept="image/*" onChange={handleCustomGarmentUpload} className="hidden" />
          </label>

          <button
            onClick={() => setIsGarmentCameraOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-sm transition-all"
            title="Photograph a real garment using your camera"
          >
            <Camera className="w-3.5 h-3.5 text-sky-600" />
            <span>Capture Garment</span>
          </button>

          <button
            onClick={onOpenProductImporter}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 hover:border-sky-300 rounded-xl shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Import from Web URL</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Dominant Visual Studio Viewport (Column 8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative w-full h-[540px] md:h-[640px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl flex items-center justify-center select-none">
            {/* Split Comparison View */}
            {generatedResult && compareMode === 'split' && (
              <div
                className="relative w-full h-full overflow-hidden cursor-ew-resize"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                  setSplitPos((x / rect.width) * 100);
                }}
                onTouchMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const touch = e.touches[0];
                  if (touch) {
                    const x = Math.max(0, Math.min(rect.width, touch.clientX - rect.left));
                    setSplitPos((x / rect.width) * 100);
                  }
                }}
              >
                {/* Background: Generated Fitted Result */}
                <img
                  src={generatedResult}
                  alt="AI Fitted Result"
                  className="absolute inset-0 w-full h-full object-contain"
                />

                {/* Foreground: Original Photo clipped by split position */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${splitPos}%` }}
                >
                  <img
                    src={userPhoto}
                    alt="Original Photo"
                    className="absolute inset-0 w-full h-full object-contain max-w-none"
                    style={{ width: '100%', height: '100%' }}
                  />
                  <div className="absolute top-4 left-4 text-[11px] font-semibold text-white/90 bg-black/50 px-2.5 py-1 rounded-md backdrop-blur-sm">
                    Original
                  </div>
                </div>

                <div className="absolute top-4 right-4 text-[11px] font-semibold text-white/90 bg-sky-600/80 px-2.5 py-1 rounded-md backdrop-blur-sm">
                  AI Virtual Fit
                </div>

                {/* Split Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                  style={{ left: `${splitPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-md">
                    <Split className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )}

            {/* Side-by-Side Mode */}
            {generatedResult && compareMode === 'sideBySide' && (
              <div className="grid grid-cols-2 w-full h-full p-3 gap-3">
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <img src={userPhoto} alt="Original Photo" className="w-full h-full object-contain" />
                  <span className="absolute top-3 left-3 text-[11px] font-semibold text-white/90 bg-black/60 px-2.5 py-1 rounded-md">
                    Original Photo
                  </span>
                </div>
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <img src={generatedResult} alt="AI Fitted Result" className="w-full h-full object-contain" />
                  <span className="absolute top-3 left-3 text-[11px] font-semibold text-white/90 bg-sky-600/90 px-2.5 py-1 rounded-md">
                    AI Virtual Fit
                  </span>
                </div>
              </div>
            )}

            {/* Toggle Mode or Single Image View */}
            {(!generatedResult || compareMode === 'toggle') && (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={generatedResult && showResultInToggle ? generatedResult : userPhoto}
                  alt="Fitting Model"
                  className="w-full h-full object-contain"
                />

                {generatedResult && (
                  <button
                    onClick={() => setShowResultInToggle(!showResultInToggle)}
                    className="absolute top-4 right-4 px-3 py-1.5 text-xs font-semibold rounded-lg bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-black/80 transition-colors"
                  >
                    {showResultInToggle ? 'Hold to View Original' : 'Viewing Original'}
                  </button>
                )}
              </div>
            )}

            {/* Generating Loading Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-slate-950/85 backdrop-blur-md text-white">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 mb-4 animate-spin">
                  <RefreshCw className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-display font-semibold mb-1">
                  Synthesizing Virtual Try-On...
                </h4>
                <p className="text-xs text-slate-300 max-w-sm leading-relaxed mb-6">
                  {generationStep === 1 && 'Step 1/3: Analyzing body posture, lighting, and contours...'}
                  {generationStep === 2 && `Step 2/3: Segmenting ${selectedGarment.name} silhouette & fabric drape...`}
                  {generationStep === 3 && 'Step 3/3: Synthesizing photorealistic fit and natural creasing...'}
                </p>
                <div className="w-56 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{
                      width: generationStep === 1 ? '35%' : generationStep === 2 ? '70%' : '95%',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Top Left Status Badge */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 text-xs font-medium text-white/90 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <span>{isCustomPhoto ? 'Custom Photo' : 'Studio Reference Model'}</span>
              <span aria-hidden="true" className="text-white/30">·</span>
              <span className="text-sky-300">{selectedGarment.name}</span>
            </div>

            {/* Comparison Mode Toggles when result is available */}
            {generatedResult && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 bg-black/60 backdrop-blur-md rounded-xl border border-white/15">
                <button
                  onClick={() => setCompareMode('split')}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                    compareMode === 'split' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Slider Compare
                </button>
                <button
                  onClick={() => setCompareMode('sideBySide')}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                    compareMode === 'sideBySide' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Side by Side
                </button>
                <button
                  onClick={() => setCompareMode('toggle')}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                    compareMode === 'toggle' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Toggle
                </button>
              </div>
            )}
          </div>

          {/* Mandatory AI Preview Disclaimer per prompt instructions */}
          <div className="p-3 rounded-xl bg-slate-100/90 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong>Important notice:</strong> The generated try-on image is an AI-generated preview, not a guarantee of the garment's exact real-world fit, size or appearance.
            </span>
          </div>

          {/* Model Photo Source & Privacy Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Photos are processed in-memory and never stored permanently without your explicit consent.</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                title="Capture your photo using camera"
              >
                <Camera className="w-3.5 h-3.5 text-sky-600" />
                <span>Take Photo</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Clear Photo</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>

              {isCustomPhoto && (
                <button
                  onClick={handleDeletePhoto}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                  title="Reset to studio reference photo"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Reset Photo</span>
                </button>
              )}
            </div>
          </div>

          {/* Error & Retry Notice */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold">Virtual Try-On Notice:</div>
                  <div className="text-amber-700 mt-0.5">{errorMsg}</div>
                </div>
              </div>
              {errorCode !== 'CONSENT_REQUIRED' && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleGenerateTryOn}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retry Try-On</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Provider Unconfigured Guidance Banner */}
          {!isProviderActive && (
            <div className="p-4 rounded-xl bg-sky-50/80 border border-sky-200 text-slate-700 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Virtual Try-On Provider Setup Required: </span>
                  Authentic virtual try-on requires an image generation service (e.g. a paid Gemini API key with Image Generation enabled in Settings &gt; Secrets, or VIRTUAL_TRYON_API_KEY in the server environment). Simple overlays and simulated fits are strictly disabled to uphold photorealistic standards.
                </div>
              </div>
              <div className="text-[11px] text-slate-500 pl-6">
                All other features—including real-time 3D eyewear inspection, face tracking, wardrobe curation, and product imports—remain completely functional.
              </div>
            </div>
          )}
        </div>

        {/* Garment Controls & Wardrobe Selection (Column 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Selected Garment Detail Box */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-sky-600 tracking-wide uppercase">
                  {selectedGarment.subcategory}
                </span>
                <h3 className="text-lg font-display font-bold text-slate-900">
                  {selectedGarment.name}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-900 tabular-nums">
                  ${selectedGarment.priceSample}
                </div>
                <div className="text-[10px] text-slate-400">Sample USD</div>
              </div>
            </div>

            <div className="w-full h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={selectedGarment.image}
                alt={selectedGarment.name}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedGarment.description}
            </p>

            {/* Size Selector */}
            {selectedGarment.sizes && (
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Size
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedGarment.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        selectedSize === s
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy & Consent Checkbox */}
            <div className="pt-3 border-t border-slate-100">
              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasUserConsent}
                  onChange={(e) => setHasUserConsent(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>
                  I consent to processing my photo with the AI virtual try-on engine for fitting. Images are processed transiently and not stored permanently.
                </span>
              </label>
            </div>

            {/* Primary Try-On Action Button: "Try This Outfit" */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={handleGenerateTryOn}
                disabled={isGenerating || !isProviderActive}
                className={`w-full flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold rounded-xl shadow-md transition-all ${
                  !isProviderActive
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-sky-600 hover:bg-sky-500 text-white'
                }`}
                title={!isProviderActive ? 'Virtual try-on requires an active AI image provider' : ''}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering Virtual Fit...</span>
                  </>
                ) : !isProviderActive ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-slate-400" />
                    <span>Try This Outfit (Requires AI Provider)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Try This Outfit</span>
                  </>
                )}
              </button>

              {generatedResult && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleSaveToMyLooks}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold rounded-xl transition-all shadow-sm"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      <span>Save to Looks</span>
                    </button>

                    <button
                      onClick={handleDownloadResult}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Download</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onSendToOutfitStudio(selectedGarment, generatedResult)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                  >
                    <span>Pair with Eyewear in Outfit Studio</span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                  </button>
                </div>
              )}

              {selectedGarment.sellerUrl && (
                <a
                  href={selectedGarment.sellerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition-colors"
                >
                  <span>Visit {selectedGarment.sellerName || 'Original Atelier'}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              )}
            </div>
          </div>

          {/* Garment Catalogue Carousel/List */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Try Another Garment ({clothingList.length})
            </h4>

            <div className="space-y-2">
              {clothingList.map((garment) => (
                <button
                  key={garment.id}
                  onClick={() => {
                    setSelectedGarment(garment);
                    if (garment.sizes?.[0]) setSelectedSize(garment.sizes[0]);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    selectedGarment.id === garment.id
                      ? 'border-sky-500 bg-sky-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <img
                    src={garment.image}
                    alt={garment.name}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {garment.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{garment.tagline}</div>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 tabular-nums">
                    ${garment.priceSample}
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
