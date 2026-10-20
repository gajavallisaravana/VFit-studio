import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Product, FrameColor, LensTint } from '../../types';
import { buildGlassesModel, Glasses3DBuildResult } from '../../utils/threeGlassesBuilder';
import { StoredPhoto, getAllPhotos, saveLook } from '../../utils/indexedDb';
import { DEMO_MODEL_IMAGE } from '../../data/products';
import {
  Camera,
  Upload,
  RefreshCw,
  Sliders,
  ShieldCheck,
  AlertCircle,
  Eye,
  CameraOff,
  Check,
  Sparkles,
  Download,
  Trash2,
  Image as ImageIcon,
  Heart,
  RotateCw,
  RotateCcw,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
} from 'lucide-react';
import { CameraCaptureModal } from '../common/CameraCaptureModal';

interface Props {
  product: Product;
  selectedFrameColor?: FrameColor;
  selectedLensTint?: LensTint;
  initialPhotoUrl?: string | null;
  onCaptureLook?: (snapshotUrl: string) => void;
}

export const FaceTrackingCanvas: React.FC<Props> = ({
  product,
  selectedFrameColor,
  selectedLensTint,
  initialPhotoUrl,
  onCaptureLook,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement>(null);
  const threeMountRef = useRef<HTMLDivElement>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const glassesModelRef = useRef<Glasses3DBuildResult | null>(null);

  // Tracking state
  const [mode, setMode] = useState<'idle' | 'camera' | 'photo'>(
    initialPhotoUrl ? 'photo' : 'idle'
  );
  const [cameraStatus, setCameraStatus] = useState<
    'idle' | 'requesting' | 'active' | 'denied' | 'no-face' | 'error'
  >('idle');
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(initialPhotoUrl || null);

  // Before/After comparison toggle
  const [showGlassesOverlay, setShowGlassesOverlay] = useState<boolean>(true);

  // Upload own glasses state (Section 5)
  const [ownGlassesImage, setOwnGlassesImage] = useState<string | null>(null);
  const [useOwnGlasses, setUseOwnGlasses] = useState<boolean>(false);
  const [ownGlassesPos, setOwnGlassesPos] = useState({ x: 50, y: 38, scale: 100, rotation: 0 });

  // Saved photos from IndexedDB modal
  const [savedPhotos, setSavedPhotos] = useState<StoredPhoto[]>([]);
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);

  // Manual alignment adjustments (allows fine-tuning for any face shape)
  const [scaleAdjust, setScaleAdjust] = useState<number>(1.0);
  const [verticalOffset, setVerticalOffset] = useState<number>(0);
  const [horizontalOffset, setHorizontalOffset] = useState<number>(0);
  const [rotationAdjust, setRotationAdjust] = useState<number>(0); // -25 to +25 degrees
  const [showAdjustments, setShowAdjustments] = useState<boolean>(false);

  // Notification feedback
  const [feedback, setFeedback] = useState<string | null>(null);

  // Animation frame
  const animFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isDestroyedRef = useRef(false);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Load photos from IndexedDB for reuse
  useEffect(() => {
    getAllPhotos().then(setSavedPhotos).catch(console.warn);
  }, []);

  // Update photo if initialPhotoUrl changes
  useEffect(() => {
    if (initialPhotoUrl) {
      setUploadedPhotoUrl(initialPhotoUrl);
      setMode('photo');
      setIsFaceDetected(true);
    }
  }, [initialPhotoUrl]);

  // 1. Initialize Three.js scene for overlay
  useEffect(() => {
    isDestroyedRef.current = false;
    const mount = threeMountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 640;
    const height = mount.clientHeight || 480;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting for face try-on
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(0, 4, 8);
    scene.add(dirLight);

    const ambLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambLight);

    // Initial Glasses
    const frameHex = selectedFrameColor?.hex || '#d1d5db';
    const metalness = selectedFrameColor?.metalness ?? 0.9;
    const roughness = selectedFrameColor?.roughness ?? 0.15;
    const lensHex = selectedLensTint?.color || '#38bdf8';
    const transmission = selectedLensTint?.transmission ?? 0.85;
    const lensRoughness = selectedLensTint?.roughness ?? 0.05;

// 3D glasses model disabled.
// User-uploaded glasses will be handled separately.
glassesModelRef.current = null;

// 3D glasses placement disabled.

// Render loop
const renderTick = () => {
  if (isDestroyedRef.current) return;
  animFrameId.current = requestAnimationFrame(renderTick);

  renderer.clear();
};
    renderTick();

    const handleResize = () => {
      if (!mount || !renderer || !camera) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isDestroyedRef.current = true;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', handleResize);
      model.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [product.id, product.model3DType, showGlassesOverlay, useOwnGlasses]);

  // Update materials when user selects color/tint
  useEffect(() => {
    if (glassesModelRef.current) {
      glassesModelRef.current.updateMaterials(
        selectedFrameColor?.hex || '#d1d5db',
        selectedFrameColor?.metalness ?? 0.9,
        selectedFrameColor?.roughness ?? 0.15,
        selectedLensTint?.color || '#38bdf8',
        selectedLensTint?.transmission ?? 0.85,
        selectedLensTint?.roughness ?? 0.05
      );
    }
  }, [selectedFrameColor, selectedLensTint]);

  // Synchronize 3D glasses model position, rotation, and scale in photo mode
  useEffect(() => {
    if (glassesModelRef.current && mode === 'photo') {
      const glasses = glassesModelRef.current.group;
      glasses.position.set(horizontalOffset, 0.35 + verticalOffset, 0);
      glasses.rotation.set(0, 0, (rotationAdjust * Math.PI) / 180);
      glasses.scale.set(0.6 * scaleAdjust, 0.6 * scaleAdjust, 0.6 * scaleAdjust);
    }
  }, [mode, scaleAdjust, verticalOffset, horizontalOffset, rotationAdjust]);

  // 2. Camera Handling
  const startCamera = async () => {
    setCameraStatus('requesting');
    setMode('camera');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (isDestroyedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraStatus('active');
        initTrackerLoop();
      }
    } catch (err: unknown) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraStatus('denied');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStatus('idle');
    setMode('idle');
    setIsFaceDetected(false);
  };

  // 3. Face Tracker Loop (MediaPipe Tasks Vision with optical alignment fallback)
  const initTrackerLoop = async () => {
    let faceLandmarker: unknown = null;
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const filesetResolver = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      faceLandmarker = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: 'GPU',
        },
        outputFaceBlendshapes: false,
        runningMode: 'VIDEO',
        numFaces: 1,
      });
    } catch {
      // Fallback
    }

    let lastVideoTime = -1;

    const track = () => {
      if (isDestroyedRef.current || mode !== 'camera' || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState >= 2) {
        if (faceLandmarker && video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const results = (faceLandmarker as any).detectForVideo(video, performance.now());
            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0];
              setIsFaceDetected(true);
              alignGlassesWithLandmarks(landmarks, video.videoWidth, video.videoHeight);
            } else {
              setIsFaceDetected(false);
            }
          } catch {
            simulateOpticalAlignment();
          }
        } else {
          simulateOpticalAlignment();
        }
      }

      requestAnimationFrame(track);
    };

    track();
  };

  // Align glasses group in Three.js based on MediaPipe landmarks
  const alignGlassesWithLandmarks = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    landmarks: any[],
    vidWidth: number,
    vidHeight: number
  ) => {
    if (!glassesModelRef.current || !cameraRef.current) return;
    const glasses = glassesModelRef.current.group;

    const bridge = landmarks[168] || landmarks[6];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    if (!bridge || !leftEye || !rightEye) return;

    const normX = -(bridge.x - 0.5) * 2;
    const normY = -(bridge.y - 0.5) * 2;

    const fovRad = (cameraRef.current.fov * Math.PI) / 180;
    const planeDist = 10;
    const viewHeight = 2 * Math.tan(fovRad / 2) * planeDist;
    const viewWidth = viewHeight * (vidWidth / vidHeight);

    const targetX = normX * (viewWidth / 2) + horizontalOffset;
    const targetY = normY * (viewHeight / 2) + verticalOffset;

    const eyeDx = rightEye.x - leftEye.x;
    const eyeDy = rightEye.y - leftEye.y;
    const eyeDist = Math.sqrt(eyeDx * eyeDx + eyeDy * eyeDy);

    const roll = Math.atan2(eyeDy, eyeDx);
    const yaw = (bridge.x - (leftEye.x + rightEye.x) / 2) * 4;

    glasses.position.x = THREE.MathUtils.lerp(glasses.position.x, targetX, 0.4);
    glasses.position.y = THREE.MathUtils.lerp(glasses.position.y, targetY, 0.4);
    glasses.position.z = 0;

    glasses.rotation.z = THREE.MathUtils.lerp(
      glasses.rotation.z,
      -roll + (rotationAdjust * Math.PI) / 180,
      0.3
    );
    glasses.rotation.y = THREE.MathUtils.lerp(glasses.rotation.y, yaw, 0.3);

    const baseScale = eyeDist * 22 * scaleAdjust;
    glasses.scale.set(baseScale, baseScale, baseScale);
  };

  const simulateOpticalAlignment = () => {
    if (!glassesModelRef.current) return;
    setIsFaceDetected(true);
    const glasses = glassesModelRef.current.group;

    glasses.position.x = horizontalOffset;
    glasses.position.y = 0.4 + verticalOffset;
    glasses.position.z = 0;
    glasses.rotation.set(0, 0, (rotationAdjust * Math.PI) / 180);

    const currentScale = 0.58 * scaleAdjust;
    glasses.scale.set(currentScale, currentScale, currentScale);
  };

  // 4. Photo Upload Handling
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|avif)$/)) {
      alert('Please upload a valid JPEG, PNG, or WebP photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setUploadedPhotoUrl(url);
      setMode('photo');
      stopCamera();
      setIsFaceDetected(true);

      if (glassesModelRef.current) {
        const glasses = glassesModelRef.current.group;
        glasses.position.set(horizontalOffset, 0.35 + verticalOffset, 0);
        glasses.rotation.set(0, 0, 0);
        glasses.scale.set(0.6 * scaleAdjust, 0.6 * scaleAdjust, 0.6 * scaleAdjust);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Upload own glasses image
  const handleOwnGlassesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setOwnGlassesImage(event.target?.result as string);
      setUseOwnGlasses(true);
      showToast('Custom glasses uploaded! Adjust size and position below.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Composite snapshot for saving & downloading
  const generateCompositeDataUrl = async (): Promise<string | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw background
    if (mode === 'camera' && videoRef.current) {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else if (mode === 'photo' && uploadedPhotoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = uploadedPhotoUrl;
      });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw glasses if enabled
    if (showGlassesOverlay) {
      if (useOwnGlasses && ownGlassesImage) {
        const glassesImg = new Image();
        glassesImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          glassesImg.onload = () => resolve();
          glassesImg.onerror = () => resolve();
          glassesImg.src = ownGlassesImage;
        });
        const gw = (canvas.width * (ownGlassesPos.scale / 100)) * 0.45;
        const gh = gw * (glassesImg.height / glassesImg.width || 0.4);
        const gx = (canvas.width * (ownGlassesPos.x / 100)) - gw / 2;
        const gy = (canvas.height * (ownGlassesPos.y / 100)) - gh / 2;

        ctx.save();
        ctx.translate(gx + gw / 2, gy + gh / 2);
        ctx.rotate((ownGlassesPos.rotation * Math.PI) / 180);
        ctx.drawImage(glassesImg, -gw / 2, -gh / 2, gw, gh);
        ctx.restore();
      } else if (rendererRef.current && sceneRef.current && cameraRef.current) {
        // Force fresh render tick for preserveDrawingBuffer
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        ctx.drawImage(rendererRef.current.domElement, 0, 0, canvas.width, canvas.height);
      }
    }

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const handleDownloadSnapshot = async () => {
    const dataUrl = await generateCompositeDataUrl();
    if (!dataUrl) return;

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `vfit-${product.name.toLowerCase().replace(/\s+/g, '-')}-tryon.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Look downloaded to your device!');
  };

  const handleSaveToMyLooks = async () => {
    const dataUrl = await generateCompositeDataUrl();
    if (!dataUrl) return;

    try {
      await saveLook({
        id: `look-${Date.now()}`,
        title: `${product.name} Eyewear Fit`,
        createdAt: new Date().toISOString(),
        resultImage: dataUrl,
        originalImage: uploadedPhotoUrl || undefined,
        eyewearName: product.name,
        frameColor: selectedFrameColor?.name || 'Classic Black',
        notes: `Try-on snapshot saved from Eyewear Studio.`,
      });
      showToast('Saved to My Looks in your browser!');
    } catch (err) {
      console.warn('Save look error:', err);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[520px] md:h-[620px] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-center select-none"
    >
      {/* Toast Feedback */}
      {feedback && (
        <div className="absolute top-4 z-40 px-4 py-2 bg-slate-950/90 text-white text-xs font-semibold rounded-xl border border-white/20 backdrop-blur-md shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 1. Camera Video Feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 ${
          mode === 'camera' && cameraStatus === 'active' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 2. Uploaded Photo View */}
      {mode === 'photo' && uploadedPhotoUrl && (
        <img
          src={uploadedPhotoUrl}
          alt="Uploaded Portrait"
          className="absolute inset-0 w-full h-full object-contain bg-slate-950"
        />
      )}

      {/* 3. Idle / Welcome State */}
      {mode === 'idle' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/95 text-white space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 shadow-inner">
            <Camera className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-display font-semibold text-white">
              Virtual Eyewear Fitting
            </h3>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              Detect face landmarks and align 3D frames with your eyes. Use your camera or upload a face portrait.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl shadow-lg transition-all transform active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Enable Camera</span>
            </button>

            <label className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl border border-white/15 transition-all cursor-pointer transform active:scale-95">
              <Upload className="w-4 h-4" />
              <span>Upload Face Photo</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>

            <button
              onClick={() => {
                setUploadedPhotoUrl(DEMO_MODEL_IMAGE);
                setMode('photo');
                setIsFaceDetected(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold rounded-xl border border-sky-500/30 transition-all transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Try Sample Face</span>
            </button>

            {savedPhotos.length > 0 && (
              <button
                onClick={() => setShowPhotoPicker(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <span>My Saved Photos ({savedPhotos.length})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Privacy First · Images processed in your browser</span>
          </div>
        </div>
      )}

      {/* Camera Denied Warning */}
      {cameraStatus === 'denied' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-900/95 text-white space-y-3">
          <CameraOff className="w-12 h-12 text-rose-400" />
          <h4 className="text-base font-semibold">Camera Access Blocked</h4>
          <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
            Camera permission was not granted. You can still upload any face photo to experience virtual eyewear fitting.
          </p>
          <label className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Upload Photo Instead</span>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>
      )}

      {/* 4. Three.js Overlaid Canvas (when using 3D procedural glasses) */}
      <div
        ref={threeMountRef}
        className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-300 ${
          mode !== 'idle' && showGlassesOverlay && !useOwnGlasses ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 5. Custom Uploaded 2D Glasses Layer */}
      {mode !== 'idle' && showGlassesOverlay && useOwnGlasses && ownGlassesImage && (
        <div
          className="absolute z-10 pointer-events-none transition-transform"
          style={{
            left: `${ownGlassesPos.x}%`,
            top: `${ownGlassesPos.y}%`,
            transform: `translate(-50%, -50%) scale(${ownGlassesPos.scale / 100}) rotate(${ownGlassesPos.rotation}deg)`,
          }}
        >
          <img
            src={ownGlassesImage}
            alt="Uploaded Glasses"
            className="max-w-[280px] drop-shadow-lg"
          />
        </div>
      )}

      {/* Active Studio Controls HUD */}
      {mode !== 'idle' && (
        <>
          {/* Top Status Bar */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 text-xs font-medium text-white/90 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
            {isFaceDetected ? (
              <span className="flex items-center gap-1.5 text-emerald-300">
                <Check className="w-3.5 h-3.5" />
                Face Aligned
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-300">
                <AlertCircle className="w-3.5 h-3.5" />
                Positioning Mode Active
              </span>
            )}
            <span aria-hidden="true" className="text-white/30">·</span>
            <span className="text-white/80">
              {useOwnGlasses ? 'Custom Uploaded Glasses' : product.name}
            </span>
          </div>

          {/* Top-Right Tools */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {/* Before/After Toggle */}
            <button
              onClick={() => setShowGlassesOverlay(!showGlassesOverlay)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border transition-colors ${
                !showGlassesOverlay
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-black/40 text-white/90 border-white/10 hover:bg-black/60'
              }`}
            >
              {showGlassesOverlay ? 'Before / After' : 'Showing Before (No Glasses)'}
            </button>

            {/* Adjustments Panel Toggle */}
            <button
              onClick={() => setShowAdjustments(!showAdjustments)}
              className={`p-2 rounded-xl text-xs font-medium backdrop-blur-md border transition-colors ${
                showAdjustments
                  ? 'bg-sky-500 text-white border-sky-400'
                  : 'bg-black/40 text-white/80 border-white/10 hover:bg-black/60'
              }`}
              title="Adjust Fit & Position"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Replace / Exit Photo */}
            <label
              className="p-2 rounded-xl text-xs font-medium bg-black/40 text-white/80 border border-white/10 hover:bg-black/60 transition-colors cursor-pointer"
              title="Replace Face Photo"
            >
              <Upload className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>

            <button
              onClick={() => {
                stopCamera();
                setUploadedPhotoUrl(null);
                setMode('idle');
              }}
              className="p-2 rounded-xl text-xs font-medium bg-black/40 text-rose-400 border border-white/10 hover:bg-black/60 transition-colors"
              title="Remove Photo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Precision Adjustment Panel (For 3D Model or Uploaded Glasses) */}
          {showAdjustments && (
            <div className="absolute top-16 right-4 z-30 w-72 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-lg border border-white/15 text-white text-xs space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-semibold text-slate-200">
                  {useOwnGlasses ? 'Adjust Custom Glasses' : '3D Glasses Fine-Tuning'}
                </span>
                <button
                  onClick={() => {
                    setScaleAdjust(1.0);
                    setVerticalOffset(0);
                    setHorizontalOffset(0);
                    setRotationAdjust(0);
                    setOwnGlassesPos({ x: 50, y: 38, scale: 100, rotation: 0 });
                  }}
                  className="text-[10px] text-sky-400 hover:underline"
                >
                  Reset Fit
                </button>
              </div>

              {useOwnGlasses ? (
                <>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Horizontal Position</span>
                      <span>{ownGlassesPos.x}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="80"
                      value={ownGlassesPos.x}
                      onChange={(e) =>
                        setOwnGlassesPos({ ...ownGlassesPos, x: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1 bg-slate-700 rounded appearance-none accent-sky-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Vertical Position</span>
                      <span>{ownGlassesPos.y}%</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="65"
                      value={ownGlassesPos.y}
                      onChange={(e) =>
                        setOwnGlassesPos({ ...ownGlassesPos, y: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1 bg-slate-700 rounded appearance-none accent-sky-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Size / Scale</span>
                      <span>{ownGlassesPos.scale}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="160"
                      value={ownGlassesPos.scale}
                      onChange={(e) =>
                        setOwnGlassesPos({ ...ownGlassesPos, scale: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1 bg-slate-700 rounded appearance-none accent-sky-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Tilt Angle</span>
                      <span>{ownGlassesPos.rotation}°</span>
                    </div>
                    <input
                      type="range"
                      min="-25"
                      max="25"
                      value={ownGlassesPos.rotation}
                      onChange={(e) =>
                        setOwnGlassesPos({ ...ownGlassesPos, rotation: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1 bg-slate-700 rounded appearance-none accent-sky-400"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Frame Scale</span>
                      <span className="font-mono">{Math.round(scaleAdjust * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.7"
                      max="1.4"
                      step="0.02"
                      value={scaleAdjust}
                      onChange={(e) => setScaleAdjust(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-700 rounded appearance-none accent-sky-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Horizontal Position</span>
                      <span className="font-mono">
                        {horizontalOffset > 0 ? `+${horizontalOffset.toFixed(2)}` : horizontalOffset.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-0.8"
                      max="0.8"
                      step="0.02"
                      value={horizontalOffset}
                      onChange={(e) => setHorizontalOffset(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-700 rounded appearance-none accent-sky-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Vertical Position (Bridge)</span>
                      <span className="font-mono">
                        {verticalOffset > 0 ? `+${verticalOffset.toFixed(2)}` : verticalOffset.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-0.8"
                      max="0.8"
                      step="0.02"
                      value={verticalOffset}
                      onChange={(e) => setVerticalOffset(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-700 rounded appearance-none accent-sky-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Frame Scale (Size)</span>
                      <span className="font-mono">{Math.round(scaleAdjust * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.7"
                      max="1.4"
                      step="0.02"
                      value={scaleAdjust}
                      onChange={(e) => setScaleAdjust(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-700 rounded appearance-none accent-sky-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Tilt Angle (Rotation)</span>
                      <span className="font-mono">{rotationAdjust}°</span>
                    </div>
                    <input
                      type="range"
                      min="-25"
                      max="25"
                      step="1"
                      value={rotationAdjust}
                      onChange={(e) => setRotationAdjust(parseInt(e.target.value, 10))}
                      className="w-full h-1 bg-slate-700 rounded appearance-none accent-sky-400"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Quick Fit Controls Floating Bar (Move, Size, Tilt, Reset) */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 text-white shadow-2xl">
            {/* Position Controls */}
            <div className="flex items-center gap-1 px-1 border-r border-white/10">
              <span className="text-[10px] text-slate-400 font-medium px-1 hidden sm:inline">Position:</span>
              <button
                onClick={() => {
                  if (useOwnGlasses) {
                    setOwnGlassesPos((p) => ({ ...p, x: Math.max(20, p.x - 2) }));
                  } else {
                    setHorizontalOffset((h) => Math.max(-0.8, h - 0.04));
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors"
                title="Move Left"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (useOwnGlasses) {
                    setOwnGlassesPos((p) => ({ ...p, y: Math.max(15, p.y - 2) }));
                  } else {
                    setVerticalOffset((v) => Math.min(0.8, v + 0.04));
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors"
                title="Move Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (useOwnGlasses) {
                    setOwnGlassesPos((p) => ({ ...p, y: Math.min(65, p.y + 2) }));
                  } else {
                    setVerticalOffset((v) => Math.max(-0.8, v - 0.04));
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors"
                title="Move Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (useOwnGlasses) {
                    setOwnGlassesPos((p) => ({ ...p, x: Math.min(80, p.x + 2) }));
                  } else {
                    setHorizontalOffset((h) => Math.min(0.8, h + 0.04));
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors"
                title="Move Right"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Size Controls */}
            <div className="flex items-center gap-1 px-1 border-r border-white/10">
              <span className="text-[10px] text-slate-400 font-medium px-1 hidden sm:inline">Size:</span>
              <button
                onClick={() => {
                  if (useOwnGlasses) {
                    setOwnGlassesPos((p) => ({ ...p, scale: Math.max(50, p.scale - 5) }));
                  } else {
                    setScaleAdjust((s) => Math.max(0.7, s - 0.04));
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors"
                title="Scale Down"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (useOwnGlasses) {
                    setOwnGlassesPos((p) => ({ ...p, scale: Math.min(160, p.scale + 5) }));
                  } else {
                    setScaleAdjust((s) => Math.min(1.4, s + 0.04));
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors"
                title="Scale Up"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rotation / Tilt Controls */}
            <div className="flex items-center gap-1 px-1 border-r border-white/10">
              <span className="text-[10px] text-slate-400 font-medium px-1 hidden sm:inline">Tilt:</span>
              <button
                onClick={() => {
                  if (useOwnGlasses) {
                    setOwnGlassesPos((p) => ({ ...p, rotation: Math.max(-25, p.rotation - 3) }));
                  } else {
                    setRotationAdjust((r) => Math.max(-25, r - 3));
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors"
                title="Tilt Left"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (useOwnGlasses) {
                    setOwnGlassesPos((p) => ({ ...p, rotation: Math.min(25, p.rotation + 3) }));
                  } else {
                    setRotationAdjust((r) => Math.min(25, r + 3));
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors"
                title="Tilt Right"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reset Fit */}
            <button
              onClick={() => {
                setScaleAdjust(1.0);
                setVerticalOffset(0);
                setHorizontalOffset(0);
                setRotationAdjust(0);
                setOwnGlassesPos({ x: 50, y: 38, scale: 100, rotation: 0 });
                showToast('Default fit restored');
              }}
              className="px-2.5 py-1.5 text-[11px] font-semibold text-sky-400 hover:text-white hover:bg-white/15 rounded-lg transition-colors flex items-center gap-1"
              title="Reset to default position and size"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Bottom Action Dock (Section 5: Download & Save) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={handleSaveToMyLooks}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/90 hover:bg-white text-slate-900 text-xs font-semibold rounded-xl backdrop-blur-md shadow-lg transition-all"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Save to My Looks</span>
            </button>

            <button
              onClick={handleDownloadSnapshot}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Try-On Image</span>
            </button>

            {/* Upload own glasses trigger */}
            <label className="flex items-center gap-1.5 px-3 py-2 bg-black/50 hover:bg-black/70 text-white/90 text-xs font-medium rounded-xl border border-white/15 backdrop-blur-md transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>{useOwnGlasses ? 'Replace Custom Glasses' : 'Upload Own Glasses'}</span>
              <input type="file" accept="image/*" onChange={handleOwnGlassesUpload} className="hidden" />
            </label>

            {useOwnGlasses && (
              <button
                onClick={() => setUseOwnGlasses(false)}
                className="px-2.5 py-2 bg-black/50 hover:bg-black/70 text-slate-300 text-xs font-medium rounded-xl border border-white/15 backdrop-blur-md"
              >
                Use 3D Frames
              </button>
            )}
          </div>
        </>
      )}

      {/* Select Photo from IndexedDB Modal */}
      {showPhotoPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-sm text-slate-900">
                Choose from Saved Photos
              </h3>
              <button
                onClick={() => setShowPhotoPicker(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 max-h-72 overflow-y-auto">
              {savedPhotos.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setUploadedPhotoUrl(p.dataUrl);
                    setMode('photo');
                    setIsFaceDetected(true);
                    setShowPhotoPicker(false);
                  }}
                  className="aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 hover:border-sky-500 cursor-pointer relative group"
                >
                  <img src={p.dataUrl} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-sky-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                    Select
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <canvas ref={photoCanvasRef} className="hidden" />
    </div>
  );
};
