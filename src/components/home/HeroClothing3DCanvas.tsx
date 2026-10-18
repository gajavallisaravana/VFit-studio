import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const HeroClothing3DCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 10.5);

    // WebGL Renderer
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
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment for high-end fabric & metallic sheen
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting matching eyewear hero
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(6, 10, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 1.6);
    fillLight.position.set(-6, 4, 6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
    rimLight.position.set(0, 8, -10);
    scene.add(rimLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe0f2fe, 0.8);
    scene.add(hemiLight);

    // Garment Group
    const garmentGroup = new THREE.Group();
    scene.add(garmentGroup);

    // Materials
    // Tailored merino wool blazer with subtle sheen
    const fabricMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xf1f5f9), // Slate white fine wool
      roughness: 0.6,
      metalness: 0.12,
    });

    const satinLapelMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x38bdf8), // Sky blue satin trim
      roughness: 0.28,
      metalness: 0.35,
    });

    const buttonMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xcfd8dc), // Titanium buttons
      metalness: 0.95,
      roughness: 0.15,
    });

    const hangerMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xd4af37), // Polished brass atelier hanger
      metalness: 0.9,
      roughness: 0.2,
    });

    // 1. Atelier Brass Hanger
    const hangerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.8, 1.4, 0),
      new THREE.Vector3(-0.9, 1.8, 0),
      new THREE.Vector3(0, 2.05, 0),
      new THREE.Vector3(0.9, 1.8, 0),
      new THREE.Vector3(1.8, 1.4, 0),
    ]);
    const hangerGeo = new THREE.TubeGeometry(hangerCurve, 32, 0.05, 12, false);
    const hangerMesh = new THREE.Mesh(hangerGeo, hangerMat);
    garmentGroup.add(hangerMesh);

    // Hanger hook
    const hookCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2.05, 0),
      new THREE.Vector3(0, 2.5, 0),
      new THREE.Vector3(0.2, 2.7, 0),
      new THREE.Vector3(0.1, 2.9, 0),
      new THREE.Vector3(-0.15, 2.85, 0),
    ]);
    const hookGeo = new THREE.TubeGeometry(hookCurve, 24, 0.04, 12, false);
    const hookMesh = new THREE.Mesh(hookGeo, hangerMat);
    garmentGroup.add(hookMesh);

    // 2. Sculpted Torso / Tailored Jacket Silhouette
    const torsoShape = new THREE.Shape();
    torsoShape.moveTo(-1.6, 0.4);
    torsoShape.lineTo(-1.3, -2.5);
    torsoShape.quadraticCurveTo(0, -2.75, 1.3, -2.5);
    torsoShape.lineTo(1.6, 0.4);
    torsoShape.quadraticCurveTo(1.3, 1.4, 0.85, 1.7); // Shoulder apex right
    torsoShape.lineTo(-0.85, 1.7); // Shoulder apex left
    torsoShape.quadraticCurveTo(-1.3, 1.4, -1.6, 0.4);

    const torsoGeo = new THREE.ExtrudeGeometry(torsoShape, {
      depth: 0.85,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 2,
      bevelSize: 0.16,
      bevelThickness: 0.18,
    });
    torsoGeo.center();
    const torsoMesh = new THREE.Mesh(torsoGeo, fabricMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    garmentGroup.add(torsoMesh);

    // 3. Peak Lapels (Sculpted Tubes with Satin Finish)
    const leftLapel = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.7, 1.5, 0.48),
      new THREE.Vector3(-0.4, 0.7, 0.52),
      new THREE.Vector3(0, -0.2, 0.54),
    ]);
    const leftLapelGeo = new THREE.TubeGeometry(leftLapel, 20, 0.11, 10, false);
    const leftLapelMesh = new THREE.Mesh(leftLapelGeo, satinLapelMat);
    garmentGroup.add(leftLapelMesh);

    const rightLapel = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.7, 1.5, 0.48),
      new THREE.Vector3(0.4, 0.7, 0.52),
      new THREE.Vector3(0, -0.2, 0.54),
    ]);
    const rightLapelGeo = new THREE.TubeGeometry(rightLapel, 20, 0.11, 10, false);
    const rightLapelMesh = new THREE.Mesh(rightLapelGeo, satinLapelMat);
    garmentGroup.add(rightLapelMesh);

    // 4. Tailored Sleeve Accents
    const leftSleeveGeo = new THREE.CylinderGeometry(0.38, 0.32, 2.6, 20);
    leftSleeveGeo.rotateZ(0.28);
    const leftSleeveMesh = new THREE.Mesh(leftSleeveGeo, fabricMat);
    leftSleeveMesh.position.set(-1.6, 0.1, 0);
    garmentGroup.add(leftSleeveMesh);

    const rightSleeveGeo = new THREE.CylinderGeometry(0.38, 0.32, 2.6, 20);
    rightSleeveGeo.rotateZ(-0.28);
    const rightSleeveMesh = new THREE.Mesh(rightSleeveGeo, fabricMat);
    rightSleeveMesh.position.set(1.6, 0.1, 0);
    garmentGroup.add(rightSleeveMesh);

    // 5. Titanium Center Buttons
    [-0.3, -0.9, -1.5].forEach((y) => {
      const bGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16);
      bGeo.rotateX(Math.PI / 2);
      const bMesh = new THREE.Mesh(bGeo, buttonMat);
      bMesh.position.set(0, y, 0.54);
      garmentGroup.add(bMesh);
    });

    // 6. Chest Pocket Welting
    const pocketGeo = new THREE.BoxGeometry(0.55, 0.07, 0.08);
    pocketGeo.rotateZ(-0.06);
    const pocketMesh = new THREE.Mesh(pocketGeo, satinLapelMat);
    pocketMesh.position.set(0.65, 0.3, 0.5);
    garmentGroup.add(pocketMesh);

    // Initial positioning
    garmentGroup.position.set(0, -0.2, 0);

    // Animation Loop with smooth oscillation and slow rotation
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle floating breathing motion
      garmentGroup.position.y = -0.2 + Math.sin(elapsedTime * 1.1) * 0.18;
      garmentGroup.rotation.y = elapsedTime * 0.42;
      garmentGroup.rotation.x = Math.sin(elapsedTime * 0.7) * 0.06;

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
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full pointer-events-none" />;
};
