import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Product, FrameColor, LensTint } from '../../types';
import { buildGlassesModel, Glasses3DBuildResult } from '../../utils/threeGlassesBuilder';
import { RotateCw, ZoomIn, ZoomOut, Maximize2, Layers, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  product: Product;
  selectedFrameColor?: FrameColor;
  selectedLensTint?: LensTint;
  onFrameColorChange?: (color: FrameColor) => void;
  onLensTintChange?: (tint: LensTint) => void;
}

export const Glasses3DInspector: React.FC<Props> = ({
  product,
  selectedFrameColor,
  selectedLensTint,
  onFrameColorChange,
  onLensTintChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<Glasses3DBuildResult | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const [explodedVal, setExplodedVal] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isControlsExpanded, setIsControlsExpanded] = useState<boolean>(true);

  // Interaction tracking
  const isPointerDownRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0.1, y: 0.25 });
  const currentRotationRef = useRef({ x: 0.1, y: 0.25 });
  const targetZoomRef = useRef(15);
  const currentZoomRef = useRef(15);

  const frameColors = product.frameColors || [];
  const lensTints = product.lensTints || [];

  const activeFrame = selectedFrameColor || frameColors[0] || {
    id: 'titanium-silver',
    name: 'Brushed Silver',
    hex: '#d1d5db',
    metalness: 0.95,
    roughness: 0.15,
  };

  const activeLens = selectedLensTint || lensTints[0] || {
    id: 'ice-blue',
    name: 'Gradient Ice Blue',
    color: '#38bdf8',
    opacity: 0.65,
    transmission: 0.85,
    roughness: 0.05,
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.5, currentZoomRef.current);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Procedural Studio Environment for realistic metallic & optical reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting rig (Key, Fill, Rim)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(8, 12, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 1.2);
    fillLight.position.set(-8, 5, 6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf8fafc, 1.5);
    rimLight.position.set(0, 10, -12);
    scene.add(rimLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.8);
    scene.add(hemiLight);

    // Soft grounded contact shadow plane
    const shadowGeo = new THREE.PlaneGeometry(30, 30);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -3.2;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Build the 3D model
    const glasses = buildGlassesModel(
      product.model3DType || 'aviator',
      activeFrame.hex,
      activeFrame.metalness,
      activeFrame.roughness,
      activeLens.color,
      activeLens.transmission,
      activeLens.roughness
    );
    scene.add(glasses.group);
    modelRef.current = glasses;

    // Animation Loop with smooth exponential damping
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);

      if (autoRotate && !isPointerDownRef.current) {
        targetRotationRef.current.y += 0.008;
      }

      // Smooth damping on rotation & zoom
      currentRotationRef.current.x = THREE.MathUtils.damp(currentRotationRef.current.x, targetRotationRef.current.x, 8, delta);
      currentRotationRef.current.y = THREE.MathUtils.damp(currentRotationRef.current.y, targetRotationRef.current.y, 8, delta);
      currentZoomRef.current = THREE.MathUtils.damp(currentZoomRef.current, targetZoomRef.current, 8, delta);

      if (modelRef.current) {
        modelRef.current.group.rotation.x = currentRotationRef.current.x;
        modelRef.current.group.rotation.y = currentRotationRef.current.y;
      }

      camera.position.z = currentZoomRef.current;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Resize handling
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      glasses.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [product.id, product.model3DType]);

  // Update materials when color or lens changes
  useEffect(() => {
    if (modelRef.current && activeFrame && activeLens) {
      modelRef.current.updateMaterials(
        activeFrame.hex,
        activeFrame.metalness,
        activeFrame.roughness,
        activeLens.color,
        activeLens.transmission,
        activeLens.roughness
      );
    }
  }, [activeFrame, activeLens]);

  // Update exploded view slider
  const handleExplodedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setExplodedVal(val);
    if (modelRef.current) {
      modelRef.current.setExploded(val);
    }
  };

  // Pointer drag to inspect
  const handlePointerDown = (e: React.PointerEvent) => {
    isPointerDownRef.current = true;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    const dx = e.clientX - prevPointerRef.current.x;
    const dy = e.clientY - prevPointerRef.current.y;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };

    targetRotationRef.current.y += dx * 0.008;
    targetRotationRef.current.x = Math.max(-0.6, Math.min(0.6, targetRotationRef.current.x + dy * 0.008));
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
  };

  const handleZoom = (delta: number) => {
    targetZoomRef.current = Math.max(8, Math.min(24, targetZoomRef.current + delta));
  };

  const handleResetCamera = () => {
    targetRotationRef.current = { x: 0.1, y: 0.25 };
    targetZoomRef.current = 15;
    setExplodedVal(0);
    if (modelRef.current) {
      modelRef.current.setExploded(0);
    }
  };

  return (
    <div className="relative w-full h-[540px] md:h-[620px] rounded-2xl overflow-hidden bg-gradient-to-b from-slate-100/80 via-white to-slate-100/90 border border-slate-200/80 select-none shadow-sm">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Spec & Viewport HUD (Minimal, zero occlusion) */}
      <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span className="font-display font-semibold text-slate-900 tracking-tight text-sm">{product.name}</span>
        <span aria-hidden="true">·</span>
        <span>Real 3D PBR Asset</span>
        <span aria-hidden="true">·</span>
        <span>Drag to rotate</span>
      </div>

      {/* Quick Action Top-Right Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          title={autoRotate ? 'Pause auto-spin' : 'Auto-spin'}
          className={`p-2 rounded-lg text-xs transition-colors ${
            autoRotate ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-white/80 text-slate-700 border border-slate-200 hover:bg-white'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => handleZoom(-2)}
          title="Zoom in"
          className="p-2 rounded-lg bg-white/80 text-slate-700 border border-slate-200 hover:bg-white text-xs transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleZoom(2)}
          title="Zoom out"
          className="p-2 rounded-lg bg-white/80 text-slate-700 border border-slate-200 hover:bg-white text-xs transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleResetCamera}
          title="Reset viewpoint"
          className="p-2 rounded-lg bg-white/80 text-slate-700 border border-slate-200 hover:bg-white text-xs transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Collapsible Bottom Control Dock (Ergonomic layout per Three.js guidelines) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-[760px] z-10 transition-all duration-300">
        {/* Toggle drawer trigger */}
        <div className="flex justify-center -mb-2 relative z-20">
          <button
            onClick={() => setIsControlsExpanded(!isControlsExpanded)}
            className="flex items-center gap-1 px-3 py-1 text-[11px] font-medium text-slate-600 bg-white/95 rounded-t-lg border-t border-x border-slate-200 shadow-sm hover:text-slate-900 transition-colors"
          >
            {isControlsExpanded ? (
              <>
                <span>Hide Controls</span>
                <ChevronDown className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>Configure 3D Eyewear</span>
                <ChevronUp className="w-3 h-3" />
              </>
            )}
          </button>
        </div>

        {/* Dock Body */}
        {isControlsExpanded && (
          <div className="glass-panel p-4 rounded-2xl shadow-lg border border-white/70 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              {/* Frame Colors */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Frame Finish: <span className="text-slate-900 font-medium normal-case">{activeFrame.name}</span>
                </label>
                <div className="flex items-center gap-2">
                  {frameColors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => onFrameColorChange?.(color)}
                      title={color.name}
                      style={{ backgroundColor: color.hex }}
                      className={`w-6 h-6 rounded-full border transition-transform relative flex items-center justify-center ${
                        activeFrame.id === color.id
                          ? 'ring-2 ring-sky-500 scale-110 border-white'
                          : 'border-slate-300 hover:scale-105'
                      }`}
                    >
                      {activeFrame.id === color.id && (
                        <Check className="w-3 h-3 text-white drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lens Tints */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Lens Tint: <span className="text-slate-900 font-medium normal-case">{activeLens.name}</span>
                </label>
                <div className="flex items-center gap-2">
                  {lensTints.map((tint) => (
                    <button
                      key={tint.id}
                      onClick={() => onLensTintChange?.(tint)}
                      title={tint.name}
                      style={{ backgroundColor: tint.color }}
                      className={`w-6 h-6 rounded-full border transition-transform relative flex items-center justify-center ${
                        activeLens.id === tint.id
                          ? 'ring-2 ring-sky-500 scale-110 border-white'
                          : 'border-slate-300 hover:scale-105'
                      }`}
                    >
                      {activeLens.id === tint.id && (
                        <Check className="w-3 h-3 text-white drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exploded View Inspection Slider */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-sky-600" />
                    Exploded View
                  </span>
                  <span className="font-mono text-slate-900">{Math.round(explodedVal * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explodedVal}
                  onChange={handleExplodedChange}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
              </div>
            </div>

            {/* Multi-Angle Viewing Row (Section 11) */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
                Multi-Angle View:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: 'Front (0°)', rot: { x: 0, y: 0 } },
                  { label: '3/4 Left (-45°)', rot: { x: 0.1, y: -0.78 } },
                  { label: '3/4 Right (+45°)', rot: { x: 0.1, y: 0.78 } },
                  { label: 'Profile (90°)', rot: { x: 0, y: 1.57 } },
                  { label: 'Top Tilt', rot: { x: 0.5, y: 0 } },
                ].map((angle) => (
                  <button
                    key={angle.label}
                    onClick={() => {
                      setAutoRotate(false);
                      targetRotationRef.current = angle.rot;
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-sky-50 hover:text-sky-700 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                  >
                    {angle.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
