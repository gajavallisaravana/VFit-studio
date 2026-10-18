import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, FlipHorizontal } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  title?: string;
  description?: string;
  overlayType?: 'face' | 'item' | 'none';
}

export const CameraCaptureModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Take a Photo',
  description = 'Position yourself or the item in the frame and click capture.',
  overlayType = 'face',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const startStream = async (mode: 'user' | 'environment') => {
    setIsInitializing(true);
    setCameraError(null);

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsInitializing(false);
    } catch (err) {
      console.warn('Camera error:', err);
      setIsInitializing(false);
      setCameraError(
        'Unable to access camera. Please ensure camera permissions are allowed in your browser.'
      );
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedPreview(null);
      startStream(facingMode);
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startStream(nextMode);
  };

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedPreview(dataUrl);
  };

  const handleConfirm = () => {
    if (capturedPreview) {
      onCapture(capturedPreview);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    if (!streamRef.current) {
      startStream(facingMode);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-sky-400" />
            <h3 className="font-display font-bold text-sm text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
          {cameraError ? (
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
              <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
              <button
                onClick={() => startStream(facingMode)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl"
              >
                Retry Camera
              </button>
            </div>
          ) : capturedPreview ? (
            <img
              src={capturedPreview}
              alt="Captured"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'transform -scale-x-100' : ''
                }`}
              />

              {/* Guidelines Overlay */}
              {overlayType === 'face' && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-64 border-2 border-dashed border-sky-400/60 rounded-[50%] shadow-[0_0_20px_rgba(56,189,248,0.2)]" />
                </div>
              )}

              {overlayType === 'item' && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-48 border-2 border-dashed border-sky-400/60 rounded-2xl shadow-[0_0_20px_rgba(56,189,248,0.2)]" />
                </div>
              )}

              {isInitializing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
                </div>
              )}
            </>
          )}

          {/* Flip Camera Button */}
          {!capturedPreview && !cameraError && (
            <button
              onClick={toggleFacingMode}
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 transition-colors"
              title="Flip Camera"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400 hidden sm:block">{description}</p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {capturedPreview ? (
              <>
                <button
                  onClick={handleRetake}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  Retake
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Use This Photo</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleTakeSnapshot}
                disabled={isInitializing || !!cameraError}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Snapshot</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
