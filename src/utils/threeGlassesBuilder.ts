import * as THREE from 'three';

export interface Glasses3DBuildResult {
  group: THREE.Group;
  updateMaterials: (frameHex: string, metalness: number, roughness: number, lensColor: string, lensTransmission: number, lensRoughness: number) => void;
  setExploded: (progress: number) => void; // 0 (normal) to 1 (fully exploded)
  dispose: () => void;
}

/**
 * Procedural 3D Eyewear Builder using Three.js
 * Builds authentic multi-component 3D glasses with frames, bridge, brow bar,
 * dual physical lenses, hinges, nose pads, screws, and temples.
 */
export function buildGlassesModel(
  style: 'aviator' | 'hex' | 'minimal_oval' | 'shield_visor' | 'wayfarer' = 'aviator',
  initialFrameColor: string = '#d1d5db',
  initialMetalness: number = 0.9,
  initialRoughness: number = 0.2,
  initialLensColor: string = '#38bdf8',
  initialLensTransmission: number = 0.85,
  initialLensRoughness: number = 0.05
): Glasses3DBuildResult {
  const rootGroup = new THREE.Group();
  rootGroup.name = `GlassesModel_${style}`;

  // Shared reusable materials
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialFrameColor),
    metalness: initialMetalness,
    roughness: initialRoughness,
  });

  const lensMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(initialLensColor),
    metalness: 0.05,
    roughness: initialLensRoughness,
    transmission: initialLensTransmission,
    thickness: 0.8,
    ior: 1.52,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });

  const screwMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xa0aec0),
    metalness: 0.95,
    roughness: 0.1,
  });

  const nosePadMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xf1f5f9),
    roughness: 0.3,
    transmission: 0.8,
    transparent: true,
    opacity: 0.7,
  });

  const templeTipMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x1e293b),
    metalness: 0.1,
    roughness: 0.6,
  });

  // Track sub-parts for exploded view
  const explodedParts: {
    object: THREE.Object3D;
    basePos: THREE.Vector3;
    explodedOffset: THREE.Vector3;
  }[] = [];

  function registerExploded(object: THREE.Object3D, offset: THREE.Vector3) {
    explodedParts.push({
      object,
      basePos: object.position.clone(),
      explodedOffset: offset,
    });
  }

  // Dimension constants (in cm-scale units)
  const eyeDistance = style === 'shield_visor' ? 0 : 3.4;
  const rimRadius = style === 'hex' ? 2.3 : style === 'minimal_oval' ? 2.1 : style === 'wayfarer' ? 2.4 : 2.5;

  // 1. LEFT & RIGHT RIM / FRAMES
  if (style === 'shield_visor') {
    // Continuous curved wrap visor
    const visorShape = new THREE.Shape();
    visorShape.moveTo(-6.5, -2.0);
    visorShape.quadraticCurveTo(-7.0, 1.8, -4.0, 2.2);
    visorShape.lineTo(4.0, 2.2);
    visorShape.quadraticCurveTo(7.0, 1.8, 6.5, -2.0);
    visorShape.quadraticCurveTo(3.5, -1.2, 0, -1.8);
    visorShape.quadraticCurveTo(-3.5, -1.2, -6.5, -2.0);

    const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };
    const visorGeo = new THREE.ExtrudeGeometry(visorShape, extrudeSettings);
    visorGeo.center();

    // Cylindrical warp for aerodynamic wrap
    const pos = visorGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setZ(i, z - (x * x) * 0.04);
    }
    visorGeo.computeVertexNormals();

    const visorMesh = new THREE.Mesh(visorGeo, lensMaterial);
    visorMesh.castShadow = true;
    rootGroup.add(visorMesh);
    registerExploded(visorMesh, new THREE.Vector3(0, 0, 1.2));

    // Brow bar across top
    const browGeo = new THREE.BoxGeometry(13.2, 0.35, 0.4);
    const browMesh = new THREE.Mesh(browGeo, frameMaterial);
    browMesh.position.set(0, 1.8, -0.6);
    rootGroup.add(browMesh);
    registerExploded(browMesh, new THREE.Vector3(0, 1.0, 0.5));
  } else {
    // Dual rim frame (Aviator, Hex, Oval, Wayfarer)
    const createRim = (isLeft: boolean) => {
      const rimGroup = new THREE.Group();
      const xSign = isLeft ? -1 : 1;
      const xCenter = xSign * (eyeDistance / 2 + 1.2);

      let rimShape = new THREE.Shape();
      if (style === 'hex') {
        // Hexagonal shape
        const sides = 6;
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides + Math.PI / 6;
          const px = Math.cos(angle) * rimRadius * 1.05;
          const py = Math.sin(angle) * (rimRadius * 0.85);
          if (i === 0) rimShape.moveTo(px, py);
          else rimShape.lineTo(px, py);
        }
        rimShape.closePath();
      } else if (style === 'wayfarer') {
        // Sculpted rectangular wayfarer shape
        rimShape.moveTo(-rimRadius * 1.1, rimRadius * 0.7);
        rimShape.lineTo(rimRadius * 1.1, rimRadius * 0.75);
        rimShape.quadraticCurveTo(rimRadius * 1.15, -rimRadius * 0.7, rimRadius * 0.8, -rimRadius * 0.75);
        rimShape.quadraticCurveTo(0, -rimRadius * 0.85, -rimRadius * 0.8, -rimRadius * 0.75);
        rimShape.quadraticCurveTo(-rimRadius * 1.15, -rimRadius * 0.7, -rimRadius * 1.1, rimRadius * 0.7);
      } else if (style === 'minimal_oval') {
        // Rounded soft ellipse
        rimShape.absellipse(0, 0, rimRadius * 1.1, rimRadius * 0.8, 0, Math.PI * 2, false, 0);
      } else {
        // Classic Teardrop Aviator
        rimShape.moveTo(-rimRadius * 0.9, rimRadius * 0.7);
        rimShape.lineTo(rimRadius * 0.9, rimRadius * 0.7);
        rimShape.quadraticCurveTo(rimRadius * 1.15, 0, rimRadius * 0.7, -rimRadius * 0.95);
        rimShape.quadraticCurveTo(0, -rimRadius * 1.1, -rimRadius * 0.7, -rimRadius * 0.95);
        rimShape.quadraticCurveTo(-rimRadius * 1.15, 0, -rimRadius * 0.9, rimRadius * 0.7);
      }

      // Outer rim extrusion
      const thickness = style === 'wayfarer' ? 0.35 : 0.16;
      const rimPath = new THREE.Path(rimShape.getPoints(32));
      const rimHole = new THREE.Path(rimShape.getPoints(32).map(p => new THREE.Vector2(p.x * 0.91, p.y * 0.91)));
      rimShape.holes.push(rimHole);

      const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
        depth: thickness,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.04,
        bevelThickness: 0.04,
      });
      rimGeo.center();

      const rimMesh = new THREE.Mesh(rimGeo, frameMaterial);
      rimMesh.castShadow = true;
      rimMesh.receiveShadow = true;
      rimGroup.add(rimMesh);

      // Lens inner mesh
      const innerLensShape = new THREE.Shape(rimHole.getPoints(32));
      const lensGeo = new THREE.ExtrudeGeometry(innerLensShape, {
        depth: 0.08,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.02,
        bevelThickness: 0.02,
      });
      lensGeo.center();
      const lensMesh = new THREE.Mesh(lensGeo, lensMaterial);
      lensMesh.castShadow = false;
      rimGroup.add(lensMesh);

      rimGroup.position.set(xCenter, 0, 0);
      rootGroup.add(rimGroup);
      registerExploded(rimGroup, new THREE.Vector3(xSign * 1.4, 0, 0.4));
    };

    createRim(true);  // Left
    createRim(false); // Right

    // 2. NOSE BRIDGE & BROW BAR
    const bridgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.2, 0.2, 0),
      new THREE.Vector3(0, 0.5, -0.1),
      new THREE.Vector3(1.2, 0.2, 0),
    ]);
    const bridgeGeo = new THREE.TubeGeometry(bridgeCurve, 16, 0.1, 8, false);
    const bridgeMesh = new THREE.Mesh(bridgeGeo, frameMaterial);
    bridgeMesh.castShadow = true;
    rootGroup.add(bridgeMesh);
    registerExploded(bridgeMesh, new THREE.Vector3(0, 0.4, 0.5));

    if (style === 'aviator') {
      // Top brow bar for aviator style
      const browCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.8, 1.8, 0),
        new THREE.Vector3(0, 1.9, 0),
        new THREE.Vector3(2.8, 1.8, 0),
      ]);
      const browGeo = new THREE.TubeGeometry(browCurve, 16, 0.09, 8, false);
      const browMesh = new THREE.Mesh(browGeo, frameMaterial);
      rootGroup.add(browMesh);
      registerExploded(browMesh, new THREE.Vector3(0, 0.8, 0.3));
    }

    // 3. NOSE PADS
    [-1, 1].forEach(xSign => {
      const padGroup = new THREE.Group();
      // Arm stem
      const armCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xSign * 0.8, 0.1, 0),
        new THREE.Vector3(xSign * 0.7, -0.4, -0.4),
      ]);
      const armGeo = new THREE.TubeGeometry(armCurve, 8, 0.05, 6, false);
      const armMesh = new THREE.Mesh(armGeo, frameMaterial);
      padGroup.add(armMesh);

      // Silicone pad
      const padGeo = new THREE.CapsuleGeometry(0.2, 0.4, 4, 8);
      const padMesh = new THREE.Mesh(padGeo, nosePadMaterial);
      padMesh.rotation.z = xSign * 0.3;
      padMesh.rotation.y = xSign * 0.2;
      padMesh.position.set(xSign * 0.7, -0.4, -0.45);
      padGroup.add(padMesh);

      rootGroup.add(padGroup);
      registerExploded(padGroup, new THREE.Vector3(xSign * 0.5, -0.5, -0.4));
    });
  }

  // 4. HINGES & TEMPLES (Left & Right Arms)
  [-1, 1].forEach(xSign => {
    const templeGroup = new THREE.Group();
    const xEdge = xSign * (eyeDistance / 2 + rimRadius * 1.05 + 0.9);

    // Hinge block
    const hingeGeo = new THREE.BoxGeometry(0.3, 0.4, 0.3);
    const hingeMesh = new THREE.Mesh(hingeGeo, frameMaterial);
    hingeMesh.position.set(xEdge, 0.7, -0.2);
    templeGroup.add(hingeMesh);

    // Hinge tiny screw
    const screwGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8);
    const screwMesh = new THREE.Mesh(screwGeo, screwMaterial);
    screwMesh.position.set(xEdge, 0.7, -0.2);
    templeGroup.add(screwMesh);

    // Temple arm curve (runs backward along -Z, wrapping over ear)
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xEdge, 0.7, -0.2),
      new THREE.Vector3(xSign * (Math.abs(xEdge) - 0.2), 0.65, -4.0),
      new THREE.Vector3(xSign * (Math.abs(xEdge) - 0.4), 0.6, -7.5),
      new THREE.Vector3(xSign * (Math.abs(xEdge) - 0.5), 0.2, -9.5),
      new THREE.Vector3(xSign * (Math.abs(xEdge) - 0.6), -0.8, -10.5),
    ]);
    const templeGeo = new THREE.TubeGeometry(armCurve, 32, 0.12, 8, false);
    const templeMesh = new THREE.Mesh(templeGeo, frameMaterial);
    templeMesh.castShadow = true;
    templeGroup.add(templeMesh);

    // Acetate ear stem tip
    const tipCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xSign * (Math.abs(xEdge) - 0.45), 0.4, -8.0),
      new THREE.Vector3(xSign * (Math.abs(xEdge) - 0.5), 0.2, -9.5),
      new THREE.Vector3(xSign * (Math.abs(xEdge) - 0.6), -0.8, -10.5),
    ]);
    const tipGeo = new THREE.TubeGeometry(tipCurve, 16, 0.18, 8, false);
    const tipMesh = new THREE.Mesh(tipGeo, templeTipMaterial);
    templeGroup.add(tipMesh);

    rootGroup.add(templeGroup);
    registerExploded(templeGroup, new THREE.Vector3(xSign * 1.8, 0, -1.5));
  });

  // Center model at bridge
  rootGroup.position.set(0, 0, 0);

  return {
    group: rootGroup,
    updateMaterials: (frameHex, metalness, roughness, lensColor, lensTransmission, lensRoughness) => {
      frameMaterial.color.set(frameHex);
      frameMaterial.metalness = metalness;
      frameMaterial.roughness = roughness;
      frameMaterial.needsUpdate = true;

      lensMaterial.color.set(lensColor);
      lensMaterial.transmission = lensTransmission;
      lensMaterial.roughness = lensRoughness;
      lensMaterial.needsUpdate = true;
    },
    setExploded: (progress: number) => {
      const p = Math.max(0, Math.min(1, progress));
      for (const item of explodedParts) {
        item.object.position.copy(item.basePos).addScaledVector(item.explodedOffset, p);
      }
    },
    dispose: () => {
      rootGroup.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
        }
      });
      frameMaterial.dispose();
      lensMaterial.dispose();
      screwMaterial.dispose();
      nosePadMaterial.dispose();
      templeTipMaterial.dispose();
    },
  };
}
