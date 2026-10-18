import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildGlassesModel } from '../../utils/threeGlassesBuilder';

export const Hero3DCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 13);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment for high-specular glass & titanium reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(6, 10, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 1.5);
    fillLight.position.set(-6, 4, 6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
    rimLight.position.set(0, 8, -10);
    scene.add(rimLight);

    // Build the hero 3D eyewear model (Aero Titanium Aviator in Platinum with Ice Blue Lenses)
    const glasses = buildGlassesModel(
      'aviator',
      '#e2e8f0', // platinum silver
      0.95,
      0.15,
      '#38bdf8', // ice blue
      0.88,
      0.04
    );
    scene.add(glasses.group);

    // Subtle gentle float & slow rotation
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle floating oscillation
      glasses.group.position.y = Math.sin(elapsedTime * 1.2) * 0.25;
      glasses.group.rotation.y = elapsedTime * 0.45;
      glasses.group.rotation.x = Math.sin(elapsedTime * 0.8) * 0.1 + 0.1;

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
      glasses.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full pointer-events-none" />;
};
