import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, ThreeEvent, useFrame, useLoader } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { NailDesignItem } from '../../types/nail';
import { createNailTipGeometry } from '../../utils/nailTipGeometry';
import { resolveAssetUrl } from '../../utils/assetUrl';

interface TipSampleCanvasProps {
  designs: NailDesignItem[];
  focusedIndex: number;
  inspectedId: string | null;
  onFocusIndex: (idx: number) => void;
  onInspect: (designId: string | null) => void;
  rotationRef: React.MutableRefObject<number>;
  targetRotationRef: React.MutableRefObject<number>;
  isDraggingRef: React.MutableRefObject<boolean>;
  isMobile: boolean;
}

export const TIP_STEP_ANGLE = (Math.PI * 2) / 12;
const RING_RADIUS = 2.45;

interface TipPieceProps {
  design: NailDesignItem;
  index: number;
  isInspected: boolean;
  anyInspected: boolean;
  isMobile: boolean;
  onSelectTip: (design: NailDesignItem, idx: number) => void;
}

const TipPiece: React.FC<TipPieceProps> = ({
  design,
  index,
  isInspected,
  anyInspected,
  isMobile,
  onSelectTip,
}) => {
  const groupRef = useRef<THREE.Group | null>(null);
  const nailMeshRef = useRef<THREE.Mesh | null>(null);
  const [hovered, setHovered] = useState(false);

  const texture = useLoader(THREE.TextureLoader, resolveAssetUrl(design.tipImage));
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }, [texture]);

  // Shape-authentic curved 3D gel nail tip geometry (refined jewel-like salon scale)
  const tipGeometry = useMemo(
    () =>
      createNailTipGeometry(design.shape, {
        width: 0.52,
        length: design.shape.startsWith('medium') ? 0.92 : 0.78,
        cCurveDepth: 0.105,
        apexHeight: 0.045,
        segX: 28,
        segY: 32,
      }),
    [design.shape]
  );

  const tipMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: texture,
        roughness: 0.08,
        metalness: design.opticalEffect === 'mirror' ? 0.14 : 0.02,
        clearcoat: 1.0,
        clearcoatRoughness: 0.045,
        reflectivity: 1.0,
        sheen: design.opticalEffect === 'pearl' || design.opticalEffect === 'magnet' ? 0.45 : 0.15,
        sheenColor: new THREE.Color(design.shimmerHex),
        side: THREE.DoubleSide,
        envMapIntensity: 1.45,
      }),
    [texture, design.opticalEffect, design.shimmerHex]
  );

  useEffect(() => {
    return () => {
      tipGeometry.dispose();
      tipMaterial.dispose();
    };
  }, [tipGeometry, tipMaterial]);

  const slotAngle = index * TIP_STEP_ANGLE;
  const ringX = Math.sin(slotAngle) * RING_RADIUS;
  const ringZ = Math.cos(slotAngle) * RING_RADIUS;

  useFrame((state, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const k = 1 - Math.exp(-dt * 8.5);
    const t = state.clock.elapsedTime;

    if (!groupRef.current) return;

    if (isInspected) {
      // Bring smoothly forward along its ring ray (which spins dead-center front) and scale up gracefully
      const targetPos = new THREE.Vector3(
        Math.sin(slotAngle) * (RING_RADIUS + (isMobile ? 0.85 : 1.1)),
        0.16,
        Math.cos(slotAngle) * (RING_RADIUS + (isMobile ? 0.85 : 1.1))
      );
      groupRef.current.position.lerp(targetPos, k);
      const targetScale = isMobile ? 1.48 : 1.62;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), k);

      // Slow graceful back-and-forth luster turn so specular gloss glides across C-curve
      if (nailMeshRef.current) {
        const swayY = Math.sin(t * 1.15) * 0.42;
        const swayX = Math.cos(t * 0.85) * 0.1 - 0.06;
        nailMeshRef.current.rotation.y += (swayY - nailMeshRef.current.rotation.y) * k;
        nailMeshRef.current.rotation.x += (swayX - nailMeshRef.current.rotation.x) * k;
      }
    } else {
      const hoverLift = hovered && !anyInspected ? 0.24 : 0;
      const pushOut = hovered && !anyInspected ? 0.2 : 0;
      const targetPos = new THREE.Vector3(
        ringX + Math.sin(slotAngle) * pushOut,
        hoverLift,
        ringZ + Math.cos(slotAngle) * pushOut
      );
      groupRef.current.position.lerp(targetPos, k);
      const targetScale = anyInspected ? 0.84 : hovered ? 1.08 : 1.0;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), k);

      if (nailMeshRef.current) {
        const targetRotX = hovered && !anyInspected ? -0.14 : -0.05;
        nailMeshRef.current.rotation.y += (0 - nailMeshRef.current.rotation.y) * k;
        nailMeshRef.current.rotation.x += (targetRotX - nailMeshRef.current.rotation.x) * k;
      }
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelectTip(design, index);
  };

  return (
    <group
      ref={groupRef}
      position={[ringX, 0, ringZ]}
      rotation={[0, slotAngle, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = '';
      }}
    >
      {/* Delicate champagne-gold salon sample pin holding the nail tip */}
      {!isInspected && (
        <mesh position={[0, -0.64, -0.015]}>
          <cylinderGeometry args={[0.009, 0.009, 0.52, 10]} />
          <meshStandardMaterial color="#C7A97F" metalness={0.85} roughness={0.24} />
        </mesh>
      )}

      {/* Curved real-texture 3D gel nail tip */}
      <mesh ref={nailMeshRef} geometry={tipGeometry} material={tipMaterial} />
    </group>
  );
};

const TipRingScene: React.FC<TipSampleCanvasProps> = ({
  designs,
  inspectedId,
  onFocusIndex,
  onInspect,
  rotationRef,
  targetRotationRef,
  isDraggingRef,
  isMobile,
}) => {
  const ringRef = useRef<THREE.Group | null>(null);

  useFrame((_, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    if (!isDraggingRef.current) {
      const k = 1 - Math.exp(-dt * 8.2);
      rotationRef.current += (targetRotationRef.current - rotationRef.current) * k;
    }
    if (ringRef.current) {
      ringRef.current.rotation.y = rotationRef.current;
    }
  });

  const handleSelectTip = (design: NailDesignItem, idx: number) => {
    onFocusIndex(idx);
    onInspect(inspectedId === design.id ? null : design.id);
  };

  return (
    <>
      <ambientLight intensity={1.08} color="#FFF9F6" />
      <directionalLight position={[2.6, 5.2, 5.4]} intensity={1.32} color="#FFFFFF" />
      <directionalLight position={[-3.5, 1.5, 3.0]} intensity={0.48} color="#F7DFE3" />

      {/* Local procedural softbox reflections — ZERO external HDR downloads */}
      <Environment resolution={128}>
        <Lightformer
          form="rect"
          intensity={2.5}
          color="#FFFFFF"
          position={[0.6, 4.5, 4]}
          scale={[6, 3.5, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.5}
          color="#F7EAE4"
          position={[-4.5, 1.2, 2.5]}
          scale={[3, 6, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.3}
          color="#EFE1DC"
          position={[4.5, 0.8, 2.5]}
          scale={[3, 6, 1]}
          target={[0, 0, 0]}
        />
      </Environment>

      <group
        ref={ringRef}
        position={[0, isMobile ? 0.08 : 0.05, 0]}
        scale={isMobile ? 0.86 : 1.0}
      >
        {/* Whisper-thin champagne-gold circular sample ring connecting the 12 pins */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.88, 0]}>
          <torusGeometry args={[RING_RADIUS, 0.013, 12, 72]} />
          <meshStandardMaterial color="#C7A97F" metalness={0.86} roughness={0.22} />
        </mesh>

        {designs.map((design, idx) => (
          <TipPiece
            key={design.id}
            design={design}
            index={idx}
            isInspected={inspectedId === design.id}
            anyInspected={inspectedId !== null}
            isMobile={isMobile}
            onSelectTip={handleSelectTip}
          />
        ))}
      </group>
    </>
  );
};

export const TipSampleCanvas: React.FC<TipSampleCanvasProps> = (props) => {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{
        position: props.isMobile ? [0, 0.72, 8.85] : [0, 0.78, 8.4],
        fov: props.isMobile ? 28 : 26,
      }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      onCreated={({ camera }) => {
        camera.lookAt(0, -0.1, 0.4);
      }}
      onPointerMissed={() => {
        if (props.inspectedId) props.onInspect(null);
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <TipRingScene {...props} />
    </Canvas>
  );
};
