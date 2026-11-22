import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei';
import { NailDesignItem } from '../../types/nail';

interface VanityTrayCanvasProps {
  designs: NailDesignItem[];
  activeIndex: number;
  onSelectIndex: (idx: number) => void;
  /** External wheel angle reference driven by pointer drag & momentum in parent */
  rotationRef: React.MutableRefObject<number>;
  targetRotationRef: React.MutableRefObject<number>;
  isDraggingRef: React.MutableRefObject<boolean>;
  isMobile: boolean;
}

const STEP_ANGLE = (Math.PI * 2) / 12;
const RING_RADIUS = 2.04;

/**
 * Generates crisp high-DPI bottle paper label texture with Garamond number + verbatim Japanese design name.
 */
function createBottleLabelTexture(design: NailDesignItem): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 176;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Luxury warm ivory Japanese cosmetics paper
    ctx.fillStyle = '#FBF7F4';
    ctx.fillRect(0, 0, 256, 176);

    // Subtle champagne-gold hairline frame
    ctx.strokeStyle = 'rgba(199, 169, 127, 0.72)';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, 240, 160);

    // Brand whisper at top
    ctx.fillStyle = '#7E6B6C';
    ctx.font = '400 17px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('soū', 128, 36);

    // Number in deeper antique champagne gold for crisp legibility on glass
    ctx.fillStyle = '#9D7B4A';
    ctx.font = '500 24px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(`No.${design.number}`, 128, 70);

    // Verbatim Japanese design name wrapped cleanly with crisp rose-brown ink
    ctx.fillStyle = '#2A1D1F';
    const ja = design.name.ja;
    if (ja.length <= 7) {
      ctx.font = '500 24px "Zen Old Mincho", "Shippori Mincho B1", serif';
      ctx.fillText(ja, 128, 120);
    } else {
      ctx.font = '500 20px "Zen Old Mincho", "Shippori Mincho B1", serif';
      const mid = Math.ceil(ja.length / 2);
      ctx.fillText(ja.slice(0, mid), 128, 108);
      ctx.fillText(ja.slice(mid), 128, 136);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Shared Lathe geometries for luxury minimalist Japanese glass nail polish bottles */
function buildBottleGeometries() {
  // Outer crystal glass profile (thick weighted glass base -> smooth vertical body -> soft shoulder -> neck)
  const outerPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.24, 0.0),
    new THREE.Vector2(0.275, 0.03),
    new THREE.Vector2(0.285, 0.14),
    new THREE.Vector2(0.285, 0.56),
    new THREE.Vector2(0.265, 0.64),
    new THREE.Vector2(0.145, 0.72),
    new THREE.Vector2(0.105, 0.76),
    new THREE.Vector2(0.105, 0.87),
    new THREE.Vector2(0.085, 0.87),
  ];
  const glassGeo = new THREE.LatheGeometry(outerPts, 28);

  // Inner gel liquid profile (leaves visible thick glass floor at bottom!)
  const liquidPts = [
    new THREE.Vector2(0.0, 0.095),
    new THREE.Vector2(0.225, 0.095),
    new THREE.Vector2(0.242, 0.135),
    new THREE.Vector2(0.242, 0.54),
    new THREE.Vector2(0.215, 0.605),
    new THREE.Vector2(0.0, 0.61),
  ];
  const liquidGeo = new THREE.LatheGeometry(liquidPts, 24);

  // Sleek cylindrical cap with softly beveled crown
  const capPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.118, 0.0),
    new THREE.Vector2(0.118, 0.41),
    new THREE.Vector2(0.106, 0.43),
    new THREE.Vector2(0.0, 0.432),
  ];
  const capGeo = new THREE.LatheGeometry(capPts, 24);

  // Front curved paper label patch hugging cylinder outer radius 0.289
  const labelGeo = new THREE.CylinderGeometry(
    0.29,
    0.29,
    0.29,
    18,
    1,
    true,
    -0.68,
    1.36
  );

  // Champagne-gold thin neck collar ring
  const collarGeo = new THREE.CylinderGeometry(0.122, 0.122, 0.03, 24);

  return { glassGeo, liquidGeo, capGeo, labelGeo, collarGeo };
}

interface BottleMeshProps {
  design: NailDesignItem;
  index: number;
  isSelected: boolean;
  geometries: ReturnType<typeof buildBottleGeometries>;
  glassMaterial: THREE.MeshPhysicalMaterial;
  onClickBottle: (idx: number) => void;
}

const PolishBottle: React.FC<BottleMeshProps> = ({
  design,
  index,
  isSelected,
  geometries,
  glassMaterial,
  onClickBottle,
}) => {
  const rootRef = useRef<THREE.Group | null>(null);
  const capRef = useRef<THREE.Group | null>(null);

  const labelTex = useMemo(() => createBottleLabelTexture(design), [design]);

  const liquidMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(design.liquidHex),
        roughness: design.opticalEffect === 'none' ? 0.14 : 0.1,
        metalness: design.opticalEffect === 'mirror' ? 0.28 : 0.06,
        clearcoat: 0.9,
        clearcoatRoughness: 0.08,
        sheen: design.opticalEffect === 'magnet' || design.opticalEffect === 'pearl' ? 0.85 : 0.2,
        sheenColor: new THREE.Color(design.shimmerHex),
        transparent: design.isSheer,
        opacity: design.isSheer ? 0.88 : 0.98,
      }),
    [design]
  );

  const capColor =
    design.capFinish === 'deep-bordeaux'
      ? '#3A2327'
      : design.capFinish === 'rose-gold'
        ? '#D3A9A4'
        : '#C9AE84';

  const capMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(capColor),
        metalness: design.capFinish === 'deep-bordeaux' ? 0.35 : 0.84,
        roughness: design.capFinish === 'deep-bordeaux' ? 0.18 : 0.24,
      }),
    [capColor, design.capFinish]
  );

  const collarMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#C7A97F'),
        metalness: 0.86,
        roughness: 0.22,
      }),
    []
  );

  useEffect(() => {
    return () => {
      labelTex.dispose();
      liquidMat.dispose();
      capMat.dispose();
      collarMat.dispose();
    };
  }, [labelTex, liquidMat, capMat, collarMat]);

  const angle = index * STEP_ANGLE;
  const bx = Math.sin(angle) * RING_RADIUS;
  const bz = Math.cos(angle) * RING_RADIUS;

  useFrame((_, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const k = 1 - Math.exp(-dt * 9.5);

    if (rootRef.current) {
      // Selected front bottle glides gently up ~8–10px visually
      const targetY = isSelected ? 0.24 : 0.0;
      rootRef.current.position.y += (targetY - rootRef.current.position.y) * k;
    }
    if (capRef.current) {
      // Selected bottle cap subtly unscrews & lifts slightly open
      const targetCapY = isSelected ? 0.89 : 0.77;
      const targetCapRot = isSelected ? 0.65 : 0.0;
      capRef.current.position.y += (targetCapY - capRef.current.position.y) * k;
      capRef.current.rotation.y += (targetCapRot - capRef.current.rotation.y) * k;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClickBottle(index);
  };

  return (
    <group
      ref={rootRef}
      position={[bx, 0, bz]}
      rotation={[0, angle, 0]}
      onClick={handleClick}
    >
      {/* Inner gel polish liquid */}
      <mesh geometry={geometries.liquidGeo} material={liquidMat} castShadow />

      {/* Outer translucent crystal glass vessel */}
      <mesh geometry={geometries.glassGeo} material={glassMaterial} renderOrder={2} />

      {/* Front paper label with verbatim Japanese design name */}
      <mesh geometry={geometries.labelGeo} position={[0, 0.34, 0]} renderOrder={3}>
        <meshStandardMaterial
          map={labelTex}
          roughness={0.62}
          metalness={0.0}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* Neck gold ring */}
      <mesh geometry={geometries.collarGeo} material={collarMat} position={[0, 0.76, 0]} />

      {/* Twistable metallic cap */}
      <group ref={capRef} position={[0, 0.77, 0]}>
        <mesh geometry={geometries.capGeo} material={capMat} castShadow />
      </group>
    </group>
  );
};

const VanityScene: React.FC<VanityTrayCanvasProps> = ({
  designs,
  activeIndex,
  onSelectIndex,
  rotationRef,
  targetRotationRef,
  isDraggingRef,
  isMobile,
}) => {
  const carouselRef = useRef<THREE.Group | null>(null);
  const geometries = useMemo(() => buildBottleGeometries(), []);

  const glassMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#FFFDFB'),
        roughness: 0.05,
        metalness: 0.02,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        ior: 1.5,
        reflectivity: 1.0,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        envMapIntensity: 1.65,
      }),
    []
  );

  useEffect(() => {
    return () => {
      geometries.glassGeo.dispose();
      geometries.liquidGeo.dispose();
      geometries.capGeo.dispose();
      geometries.labelGeo.dispose();
      geometries.collarGeo.dispose();
      glassMaterial.dispose();
    };
  }, [geometries, glassMaterial]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    if (!isDraggingRef.current) {
      // Silky critically-damped snap toward target bottle angle
      const lerpFactor = 1 - Math.exp(-dt * 8.5);
      rotationRef.current += (targetRotationRef.current - rotationRef.current) * lerpFactor;
    }
    if (carouselRef.current) {
      carouselRef.current.rotation.y = rotationRef.current;
    }
  });

  return (
    <>
      <ambientLight intensity={0.95} color="#FFF8F5" />
      <directionalLight position={[3, 6, 5]} intensity={1.35} color="#FFFDFB" />
      <directionalLight position={[-4, 3, 2]} intensity={0.5} color="#F5DCE0" />

      {/* Local procedural luxury beauty softboxes — ZERO external HDR fetch */}
      <Environment resolution={128}>
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#FFFFFF"
          position={[0, 5, 3]}
          scale={[8, 4, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.5}
          color="#F7E5DF"
          position={[-5, 2, 2]}
          scale={[4, 6, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.3}
          color="#F0DDD6"
          position={[5, 1, 3]}
          scale={[4, 6, 1]}
          target={[0, 0, 0]}
        />
      </Environment>

      {/* Carousel group holding the mirrored tray + 12 polish bottles */}
      <group
        ref={carouselRef}
        position={[0, isMobile ? -0.36 : -0.32, 0]}
        scale={isMobile ? 0.92 : 1.0}
      >
        {/* Mirrored circular vanity surface */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
          <circleGeometry args={[2.56, 64]} />
          <MeshReflectorMaterial
            mirror={0.48}
            blur={[260, 80]}
            resolution={isMobile ? 256 : 512}
            mixBlur={0.92}
            mixStrength={0.62}
            roughness={0.22}
            metalness={0.18}
            color="#F5ECE8"
          />
        </mesh>

        {/* Subtle beveled porcelain-blush base plinth */}
        <mesh position={[0, -0.055, 0]}>
          <cylinderGeometry args={[2.59, 2.52, 0.11, 64]} />
          <meshStandardMaterial color="#EFE3DE" roughness={0.42} metalness={0.08} />
        </mesh>

        {/* Whisper-thin brushed champagne-gold rim around the circular tray */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <torusGeometry args={[2.58, 0.022, 16, 72]} />
          <meshStandardMaterial color="#C7A97F" metalness={0.86} roughness={0.22} />
        </mesh>

        {/* Decorative soft inner gold inlay ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
          <ringGeometry args={[1.56, 1.578, 64]} />
          <meshStandardMaterial
            color="#C7A97F"
            metalness={0.8}
            roughness={0.3}
            transparent
            opacity={0.5}
          />
        </mesh>

        {/* All 12 3D luxury glass nail polish bottles */}
        {designs.map((design, idx) => (
          <PolishBottle
            key={design.id}
            design={design}
            index={idx}
            isSelected={idx === activeIndex}
            geometries={geometries}
            glassMaterial={glassMaterial}
            onClickBottle={onSelectIndex}
          />
        ))}
      </group>

      {/* Soft grounded studio contact shadow under tray */}
      <ContactShadows
        position={[0, isMobile ? -0.49 : -0.45, 0]}
        opacity={0.24}
        scale={7.2}
        blur={2.4}
        far={2.2}
        color="#5B4446"
      />
    </>
  );
};

export const VanityTrayCanvas: React.FC<VanityTrayCanvasProps> = (props) => {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{
        position: props.isMobile ? [0, 1.65, 5.25] : [0, 1.72, 4.95],
        fov: props.isMobile ? 35 : 32,
      }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      onCreated={({ camera }) => {
        camera.lookAt(0, 0.08, 0.9);
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <VanityScene {...props} />
    </Canvas>
  );
};

export { STEP_ANGLE };
