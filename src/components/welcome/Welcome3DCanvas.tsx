import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildGlassesModel } from '../../utils/threeGlassesBuilder';

export const Welcome3DCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const targetCameraPosRef = useRef({ x: 0, y: 0.6 });
  const currentCameraPosRef = useRef({ x: 0, y: 0.6 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.6, 15);

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      console.warn('WebGL initialization fallback');
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment for high-specular glass & titanium reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting rig (Key, Fill, Rim)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(6, 12, 10);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 1.8);
    fillLight.position.set(-6, 5, 8);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
    rimLight.position.set(0, 10, -12);
    scene.add(rimLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe0f2fe, 0.9);
    scene.add(hemiLight);

    // Master Composition Group
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    // 1. Procedural 3D Eyewear Model (Matches Hero3DCanvas style)
    const glasses = buildGlassesModel(
      'aviator',
      '#e2e8f0', // Platinum Silver Titanium
      0.95,
      0.15,
      '#38bdf8', // Gradient Ice Blue Lens
      0.9,
      0.03
    );
    glasses.group.position.set(0, 1.6, 0.4);
    glasses.group.scale.set(0.9, 0.9, 0.9);
    stageGroup.add(glasses.group);

    // 2. Procedural 3D Tailored Garment / Atelier Form (Shirt / Blazer Torso)
    const garmentGroup = new THREE.Group();

    // Fabric material with soft micro-sheen
    const garmentFabricMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xf1f5f9), // Slate White Wool
      roughness: 0.75,
      metalness: 0.08,
      bumpScale: 0.02,
    });

    const garmentAccentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x38bdf8), // Sky Blue Lapel Trim
      roughness: 0.4,
      metalness: 0.3,
    });

    const buttonMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xd1d5db), // Silver buttons
      metalness: 0.9,
      roughness: 0.2,
    });

    // Torso Body
    const torsoShape = new THREE.Shape();
    torsoShape.moveTo(-2.2, 0);
    torsoShape.lineTo(-1.8, -3.8);
    torsoShape.quadraticCurveTo(0, -4.0, 1.8, -3.8);
    torsoShape.lineTo(2.2, 0);
    torsoShape.quadraticCurveTo(1.6, 0.8, 1.2, 1.2); // Shoulder
    torsoShape.lineTo(-1.2, 1.2);
    torsoShape.quadraticCurveTo(-1.6, 0.8, -2.2, 0);

    const torsoGeo = new THREE.ExtrudeGeometry(torsoShape, {
      depth: 1.2,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.2,
      bevelThickness: 0.25,
    });
    torsoGeo.center();
    const torsoMesh = new THREE.Mesh(torsoGeo, garmentFabricMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    garmentGroup.add(torsoMesh);

    // Tailored Collar & Lapels
    const collarCurveLeft = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.0, 1.3, 0.65),
      new THREE.Vector3(-0.6, 0.4, 0.72),
      new THREE.Vector3(0, -0.6, 0.75),
    ]);
    const collarGeoLeft = new THREE.TubeGeometry(collarCurveLeft, 16, 0.16, 8, false);
    const collarMeshLeft = new THREE.Mesh(collarGeoLeft, garmentAccentMat);
    garmentGroup.add(collarMeshLeft);

    const collarCurveRight = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.0, 1.3, 0.65),
      new THREE.Vector3(0.6, 0.4, 0.72),
      new THREE.Vector3(0, -0.6, 0.75),
    ]);
    const collarGeoRight = new THREE.TubeGeometry(collarCurveRight, 16, 0.16, 8, false);
    const collarMeshRight = new THREE.Mesh(collarGeoRight, garmentAccentMat);
    garmentGroup.add(collarMeshRight);

    // Center Buttons
    [-1.2, -2.2, -3.2].forEach((yPos) => {
      const bGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
      bGeo.rotateX(Math.PI / 2);
      const bMesh = new THREE.Mesh(bGeo, buttonMat);
      bMesh.position.set(0, yPos, 0.75);
      garmentGroup.add(bMesh);
    });

    garmentGroup.position.set(0, -1.2, -0.2);
    garmentGroup.scale.set(0.85, 0.85, 0.85);
    stageGroup.add(garmentGroup);

    // Soft grounded contact shadow
    const shadowGeo = new THREE.PlaneGeometry(16, 16);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -5.0;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Parallax interaction handlers
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (prefersReducedMotion) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const normX = (clientX / window.innerWidth) * 2 - 1;
      const normY = -(clientY / window.innerHeight) * 2 + 1;

      pointerPosRef.current = { x: normX, y: normY };
      targetCameraPosRef.current = {
        x: normX * 1.5,
        y: 0.6 + normY * 0.8,
      };
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const delta = Math.min(clock.getDelta(), 0.1);

      // Smooth camera parallax damping
      currentCameraPosRef.current.x = THREE.MathUtils.damp(
        currentCameraPosRef.current.x,
        targetCameraPosRef.current.x,
        4,
        delta
      );
      currentCameraPosRef.current.y = THREE.MathUtils.damp(
        currentCameraPosRef.current.y,
        targetCameraPosRef.current.y,
        4,
        delta
      );

      camera.position.x = currentCameraPosRef.current.x;
      camera.position.y = currentCameraPosRef.current.y;
      camera.lookAt(0, 0, 0);

      if (!prefersReducedMotion) {
        // Gentle, elegant floating oscillation of the eyewear
        glasses.group.position.y = 1.6 + Math.sin(elapsedTime * 1.4) * 0.18;
        glasses.group.rotation.y = elapsedTime * 0.35 + pointerPosRef.current.x * 0.4;
        glasses.group.rotation.x = Math.sin(elapsedTime * 0.9) * 0.08 + pointerPosRef.current.y * 0.2;

        // Subtle counter-float of the garment form
        garmentGroup.position.y = -1.2 + Math.sin(elapsedTime * 1.0 + 1.0) * 0.1;
        garmentGroup.rotation.y = Math.sin(elapsedTime * 0.4) * 0.15 + pointerPosRef.current.x * 0.2;
      }

      renderer.render(scene, camera);
    };

    animate();

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
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      glasses.dispose();
      torsoGeo.dispose();
      collarGeoLeft.dispose();
      collarGeoRight.dispose();
      garmentFabricMat.dispose();
      garmentAccentMat.dispose();
      buttonMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full pointer-events-none select-none" />;
};
