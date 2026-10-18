import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const WelcomeClothing3DCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const targetCamPosRef = useRef({ x: 0, y: 0 });
  const currentCamPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 180;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0, 11);

    // Renderer matching Welcome3DCanvas exactly
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting matching glasses canvas
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 10, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 1.8);
    fillLight.position.set(-5, 4, 6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.2);
    rimLight.position.set(0, 8, -10);
    scene.add(rimLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe0f2fe, 0.8);
    scene.add(hemiLight);

    // Garment Group
    const garmentGroup = new THREE.Group();
    scene.add(garmentGroup);

    // PBR Fabric Materials
    const fabricMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xf8fafc), // Ice white tailored wool
      roughness: 0.65,
      metalness: 0.1,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x38bdf8), // Sky blue lapel trim
      roughness: 0.35,
      metalness: 0.25,
    });

    const buttonMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xd1d5db), // Titanium silver buttons
      metalness: 0.95,
      roughness: 0.15,
    });

    // 1. Torso Silhouette
    const torsoShape = new THREE.Shape();
    torsoShape.moveTo(-1.6, -0.2);
    torsoShape.lineTo(-1.3, -2.6);
    torsoShape.quadraticCurveTo(0, -2.8, 1.3, -2.6);
    torsoShape.lineTo(1.6, -0.2);
    torsoShape.quadraticCurveTo(1.2, 0.6, 0.9, 0.9); // Shoulder
    torsoShape.lineTo(-0.9, 0.9);
    torsoShape.quadraticCurveTo(-1.2, 0.6, -1.6, -0.2);

    const torsoGeo = new THREE.ExtrudeGeometry(torsoShape, {
      depth: 0.9,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.15,
      bevelThickness: 0.18,
    });
    torsoGeo.center();
    const torsoMesh = new THREE.Mesh(torsoGeo, fabricMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    garmentGroup.add(torsoMesh);

    // 2. Tailored Collar & Lapels
    const leftLapelCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.75, 0.95, 0.5),
      new THREE.Vector3(-0.45, 0.25, 0.54),
      new THREE.Vector3(0, -0.45, 0.56),
    ]);
    const leftLapelGeo = new THREE.TubeGeometry(leftLapelCurve, 16, 0.12, 8, false);
    const leftLapelMesh = new THREE.Mesh(leftLapelGeo, accentMat);
    garmentGroup.add(leftLapelMesh);

    const rightLapelCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.75, 0.95, 0.5),
      new THREE.Vector3(0.45, 0.25, 0.54),
      new THREE.Vector3(0, -0.45, 0.56),
    ]);
    const rightLapelGeo = new THREE.TubeGeometry(rightLapelCurve, 16, 0.12, 8, false);
    const rightLapelMesh = new THREE.Mesh(rightLapelGeo, accentMat);
    garmentGroup.add(rightLapelMesh);

    // 3. Buttons
    [-0.8, -1.5, -2.1].forEach((y) => {
      const bGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16);
      bGeo.rotateX(Math.PI / 2);
      const bMesh = new THREE.Mesh(bGeo, buttonMat);
      bMesh.position.set(0, y + 0.6, 0.58);
      garmentGroup.add(bMesh);
    });

    garmentGroup.position.set(0, 0.1, 0);

    // Parallax mouse move
    const handlePointerMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      pointerPosRef.current = { x: normX, y: normY };
      targetCamPosRef.current = { x: normX * 1.2, y: normY * 0.6 };
    };
    window.addEventListener('mousemove', handlePointerMove);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const delta = Math.min(clock.getDelta(), 0.1);

      // Camera smooth damping
      currentCamPosRef.current.x = THREE.MathUtils.damp(
        currentCamPosRef.current.x,
        targetCamPosRef.current.x,
        3.5,
        delta
      );
      currentCamPosRef.current.y = THREE.MathUtils.damp(
        currentCamPosRef.current.y,
        targetCamPosRef.current.y,
        3.5,
        delta
      );

      camera.position.x = currentCamPosRef.current.x;
      camera.position.y = currentCamPosRef.current.y;
      camera.lookAt(0, 0, 0);

      // Gentle floating and 360 rotation matching glasses animation
      if (!prefersReducedMotion) {
        garmentGroup.position.y = 0.1 + Math.sin(elapsedTime * 1.4) * 0.12;
        garmentGroup.rotation.y = elapsedTime * 0.45;
        garmentGroup.rotation.x = Math.sin(elapsedTime * 0.8) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
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
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full relative cursor-grab active:cursor-grabbing" />;
};
