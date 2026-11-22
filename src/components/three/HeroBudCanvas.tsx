import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { SITE_CONFIG } from '../../config';
import { createNailTipGeometry } from '../../utils/nailTipGeometry';
import { ActiveViewBox } from '../HandStage';

export type BudPhase = 'closed' | 'dragging' | 'blooming' | 'landing' | 'revealed';

interface HeroBudCanvasProps {
  phase: BudPhase;
  progressRef: React.MutableRefObject<number>;
  windRef: React.MutableRefObject<{ x: number; y: number }>;
  handViewBox: ActiveViewBox;
  onReady: () => void;
  onFingerLanded: (fingerIdx: number) => void;
  onRevealComplete: () => void;
}

interface PetalSpec {
  id: number;
  ring: 'outer' | 'middle' | 'inner';
  destinyFingerIndex: number | null;
  baseAngle: number;
  ringRadius: number;
  baseY: number;
  cupTiltX: number; // positive = leans gracefully outward from bud top, negative = cups softly inward
  scale: number;
  color: string;
  emissive: string;
  opacity: number;
  detachThreshold: number;
  driftSeed: number;
}

function buildPetalSpecs(): PetalSpec[] {
  const specs: PetalSpec[] = [];

  // 5 outer petals — lush translucent dusty-rose & sheer blush cupping outward like a lotus bud
  const outerColors = ['#D9AEB3', '#E8C9CB', '#D2A2A8', '#E5C3C6', '#DEC0C2'];
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2 + 0.3;
    specs.push({
      id: specs.length,
      ring: 'outer',
      destinyFingerIndex: null,
      baseAngle: angle,
      ringRadius: 0.44,
      baseY: -0.18,
      cupTiltX: 0.36, // gracefully flared petals
      scale: 0.95,
      color: outerColors[i],
      emissive: '#B87A82',
      opacity: 0.84,
      detachThreshold: 0.05 + i * 0.05,
      driftSeed: i * 1.7 + 0.5,
    });
  }

  // 5 middle petals — milky-blush & soft champagne pearl alternating around the bud
  const midColors = ['#F2DDD8', '#E9C7C8', '#F4E5DF', '#E3BCC0', '#F0D8D4'];
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2 + 0.92;
    specs.push({
      id: specs.length,
      ring: 'middle',
      destinyFingerIndex: null,
      baseAngle: angle,
      ringRadius: 0.3,
      baseY: -0.02,
      cupTiltX: 0.16,
      scale: 0.9,
      color: midColors[i],
      emissive: '#C99699',
      opacity: 0.88,
      detachThreshold: 0.22 + i * 0.055,
      driftSeed: i * 2.1 + 2.4,
    });
  }

  // 5 inner Destiny Petals — luminous sheer milk-beige (#EAD8C8) forming the delicate flower heart
  // These 5 detach last and land directly onto the 5 fingernails!
  const innerColors = ['#F1E0D2', '#EAD6C7', '#F4E5D9', '#E8D3C3', '#EFE0D3'];
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2 + 0.05;
    specs.push({
      id: specs.length,
      ring: 'inner',
      destinyFingerIndex: i,
      baseAngle: angle,
      ringRadius: 0.17,
      baseY: 0.12,
      cupTiltX: -0.06, // gently cupped inward at the crown
      scale: 0.82,
      color: innerColors[i],
      emissive: '#C8A596',
      opacity: 0.92,
      detachThreshold: 0.54,
      driftSeed: i * 1.4,
    });
  }

  return specs;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

const BudScene: React.FC<HeroBudCanvasProps> = ({
  phase,
  progressRef,
  windRef,
  handViewBox,
  onReady,
  onFingerLanded,
  onRevealComplete,
}) => {
  const { size, viewport } = useThree();
  const specs = useMemo(() => buildPetalSpecs(), []);

  // Graceful slender curved 3D gel nail tips (same curved nail tip geometry as Section 03)
  const petalGeometry = useMemo(
    () =>
      createNailTipGeometry('short-almond', {
        width: 0.44,
        length: 1.04,
        cCurveDepth: 0.135,
        apexHeight: 0.048,
        segX: 24,
        segY: 28,
      }),
    []
  );

  const materials = useMemo(
    () =>
      specs.map(
        (s) =>
          new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(s.color),
            emissive: new THREE.Color(s.emissive),
            emissiveIntensity: 0.12,
            roughness: 0.07,
            metalness: 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            reflectivity: 1.0,
            sheen: 0.55,
            sheenColor: new THREE.Color('#FFF4F0'),
            transparent: true,
            opacity: s.opacity,
            side: THREE.DoubleSide,
            envMapIntensity: 1.25,
          })
      ),
    [specs]
  );

  useEffect(() => {
    return () => {
      petalGeometry.dispose();
      materials.forEach((m) => m.dispose());
    };
  }, [petalGeometry, materials]);

  const pivotRefs = useRef<(THREE.Group | null)[]>([]);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const budGroupRef = useRef<THREE.Group | null>(null);
  const readyFiredRef = useRef(false);

  const landingClockRef = useRef(0);
  const landingStartsRef = useRef<
    { pos: THREE.Vector3; rot: THREE.Euler; scale: number }[] | null
  >(null);
  const landedFlagsRef = useRef<boolean[]>([false, false, false, false, false]);
  const revealCompletedRef = useRef(false);

  useEffect(() => {
    if (phase === 'closed' || phase === 'dragging') {
      landingClockRef.current = 0;
      landingStartsRef.current = null;
      landedFlagsRef.current = [false, false, false, false, false];
      revealCompletedRef.current = false;
      specs.forEach((s, idx) => {
        if (materials[idx]) materials[idx].opacity = s.opacity;
      });
    }
  }, [phase, materials, specs]);

  // Exact projection from HandStage active viewBox -> 3D world plane at z = 0
  const fingerWorldTargets = useMemo(() => {
    const W = size.width;
    const H = size.height;
    if (W <= 0 || H <= 0) return [];

    const scale = Math.max(W / handViewBox.w, H / handViewBox.h);
    const offsetX = (W - handViewBox.w * scale) * 0.5;
    const offsetY = (H - handViewBox.h * scale) * 0.5;
    const pxToWorldX = viewport.width / W;
    const pxToWorldY = viewport.height / H;

    return SITE_CONFIG.fingerCalibrations.map((cal) => {
      const sx = (cal.cx - handViewBox.x) * scale + offsetX;
      const sy = (cal.cy - handViewBox.y) * scale + offsetY;

      const ndcX = (sx / W) * 2 - 1;
      const ndcY = -((sy / H) * 2 - 1);

      const worldX = ndcX * (viewport.width * 0.5);
      const worldY = ndcY * (viewport.height * 0.5);

      const nailWorldW = cal.rx * 2 * scale * pxToWorldX;
      const nailWorldH = cal.ry * 2 * scale * pxToWorldY;

      return {
        x: worldX,
        y: worldY,
        scaleX: nailWorldW / 0.44,
        scaleY: nailWorldH / 1.04,
        rotZ: (-cal.angleDeg * Math.PI) / 180,
      };
    });
  }, [size.width, size.height, viewport.width, viewport.height, handViewBox]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const t = state.clock.elapsedTime;

    if (!readyFiredRef.current) {
      readyFiredRef.current = true;
      onReady();
    }

    const p = progressRef.current;
    const wind = windRef.current;

    if (budGroupRef.current) {
      if (phase === 'closed' || phase === 'dragging') {
        const breathe = Math.sin(t * 1.45) * 0.026 * (1 - p * 0.7);
        budGroupRef.current.position.y = Math.sin(t * 1.15) * 0.045 * (1 - p) + 0.08;
        budGroupRef.current.scale.setScalar(1 + breathe);
      } else {
        budGroupRef.current.position.y *= 0.88;
        budGroupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.14);
      }
    }

    if (phase === 'landing') {
      if (!landingStartsRef.current) {
        const tempPos = new THREE.Vector3();
        const tempQuat = new THREE.Quaternion();
        const tempScale = new THREE.Vector3();
        landingStartsRef.current = specs
          .filter((s) => s.destinyFingerIndex !== null)
          .map((s) => {
            const m = meshRefs.current[s.id];
            if (m) {
              m.updateWorldMatrix(true, false);
              m.matrixWorld.decompose(tempPos, tempQuat, tempScale);
              return {
                pos: tempPos.clone(),
                rot: new THREE.Euler().setFromQuaternion(tempQuat),
                scale: tempScale.x,
              };
            }
            return {
              pos: new THREE.Vector3(0, 0.15, 0.2),
              rot: new THREE.Euler(0, 0, 0),
              scale: 0.82,
            };
          });
      }
      landingClockRef.current += dt;
    }

    for (let i = 0; i < specs.length; i += 1) {
      const s = specs[i];
      const pivot = pivotRefs.current[i];
      const mesh = meshRefs.current[i];
      const mat = materials[i];
      if (!pivot || !mesh || !mat) continue;

      if (s.destinyFingerIndex === null) {
        // Outer & middle petals: radial blossom cupping -> graceful wind-swept falling petals
        const localOpen = Math.max(0, Math.min(1, (p - s.detachThreshold) / 0.56));
        const extraDrift =
          phase === 'landing' || phase === 'revealed' ? landingClockRef.current * 0.9 : 0;
        const drift = localOpen + extraDrift;

        const angle = s.baseAngle + t * 0.11 * (1 - localOpen) + drift * 0.42;
        const radial = s.ringRadius + easeOutCubic(Math.min(1, drift)) * 1.48 + extraDrift * 0.95;

        pivot.position.set(
          Math.sin(angle) * radial + wind.x * drift * 1.4,
          s.baseY +
            Math.sin(t * 1.3 + s.driftSeed) * 0.022 -
            Math.pow(drift, 1.5) * 1.85 +
            wind.y * drift * 0.65,
          Math.cos(angle) * radial + drift * 0.45 * Math.cos(s.driftSeed)
        );

        // Rotate pivot outward along radial direction; cupTiltX tilts petal cleanly outward/inward!
        pivot.rotation.set(0, angle, 0);
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(
          s.cupTiltX + drift * (1.28 + (s.id % 3) * 0.25),
          drift * 0.65,
          drift * (s.id % 2 === 0 ? 0.72 : -0.68)
        );
        mesh.scale.setScalar(s.scale * (1 - Math.min(0.32, drift * 0.18)));

        mat.opacity = Math.max(0, s.opacity * (1 - Math.max(0, (drift - 0.54) / 0.5)));
        mesh.visible = mat.opacity > 0.01;
        continue;
      }

      // Inner 5 Destiny Petals
      const fIdx = s.destinyFingerIndex;
      if (phase === 'landing' || phase === 'revealed') {
        const target = fingerWorldTargets[fIdx];
        const startSnap = landingStartsRef.current?.[fIdx];
        if (!target || !startSnap) continue;

        const staggerDelay = fIdx * 0.14;
        const flightDur = 0.72;
        const elapsed = Math.max(0, landingClockRef.current - staggerDelay);
        const u = Math.min(1, elapsed / flightDur);
        const e = easeInOutQuart(u);

        const arcLift = Math.sin(u * Math.PI) * 0.64;
        const midX = (startSnap.pos.x + target.x) * 0.5 + (fIdx - 2) * 0.1;
        const midY = (startSnap.pos.y + target.y) * 0.5 + 0.2;

        const inv = 1 - e;
        const wx = inv * inv * startSnap.pos.x + 2 * inv * e * midX + e * e * target.x;
        const wy = inv * inv * startSnap.pos.y + 2 * inv * e * midY + e * e * target.y;
        const wz = inv * startSnap.pos.z + arcLift;

        // Place directly in world space (zero out pivot rotation)
        pivot.position.set(wx, wy, wz);
        pivot.rotation.set(0, 0, 0);
        mesh.position.set(0, 0, 0);

        const flipSpin = Math.sin(u * Math.PI) * 0.32;
        mesh.rotation.set(
          THREE.MathUtils.lerp(startSnap.rot.x, 0, e) + flipSpin,
          THREE.MathUtils.lerp(startSnap.rot.y, 0, e),
          THREE.MathUtils.lerp(startSnap.rot.z, target.rotZ, e)
        );

        mesh.scale.set(
          THREE.MathUtils.lerp(startSnap.scale, target.scaleX, e),
          THREE.MathUtils.lerp(startSnap.scale, target.scaleY, e),
          THREE.MathUtils.lerp(startSnap.scale, 0.25, e)
        );

        if (u >= 0.88 && !landedFlagsRef.current[fIdx]) {
          landedFlagsRef.current[fIdx] = true;
          onFingerLanded(fIdx);
          try {
            if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
              navigator.vibrate(8);
            }
          } catch {
            // Ignore
          }
        }

        const fadeU = Math.max(0, Math.min(1, (elapsed - flightDur * 0.85) / 0.22));
        mat.opacity = s.opacity * (1 - fadeU);
        mesh.visible = mat.opacity > 0.01;
      } else {
        const openBloom = easeOutCubic(Math.min(1, p * 1.15));
        const angle = s.baseAngle + t * 0.11 * (1 - openBloom * 0.6);
        const radial = s.ringRadius + openBloom * 0.36;

        pivot.position.set(
          Math.sin(angle) * radial,
          s.baseY + openBloom * 0.1 + Math.sin(t * 1.45 + fIdx) * 0.018,
          Math.cos(angle) * radial
        );
        pivot.rotation.set(0, angle, 0);
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(s.cupTiltX + openBloom * 0.32, 0, 0);
        mesh.scale.setScalar(s.scale * (1 - openBloom * 0.06));
        mat.opacity = s.opacity;
        mesh.visible = true;
      }
    }

    if (
      phase === 'landing' &&
      !revealCompletedRef.current &&
      landingClockRef.current > 4 * 0.14 + 0.72 + 0.24
    ) {
      revealCompletedRef.current = true;
      onRevealComplete();
    }
  });

  return (
    <>
      {/* Balanced directional daylight so every blush/rose petal shows sculpted 3D curvature */}
      <ambientLight intensity={0.62} color="#FFF6F3" />
      <directionalLight position={[2.8, 4.4, 4.5]} intensity={1.15} color="#FFFDFB" />
      <directionalLight position={[-3.4, -1.8, 2.2]} intensity={0.62} color="#EABDC4" />
      <directionalLight position={[0, -3.5, -2.0]} intensity={0.4} color="#F3D6D9" />

      {/* Local procedural softbox reflections — ZERO external HDR downloads */}
      <Environment resolution={128}>
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#FFFFFF"
          position={[0.8, 4.2, 3.6]}
          scale={[3.2, 5.5, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.35}
          color="#F7DCE0"
          position={[-4.5, 0.8, 2.2]}
          scale={[3, 6, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          color="#EFE0D9"
          position={[4.5, -0.5, 2.2]}
          scale={[3, 5, 1]}
          target={[0, 0, 0]}
        />
      </Environment>

      <group ref={budGroupRef} rotation={[0.14, 0, 0]}>
        {specs.map((s, idx) => (
          <group
            key={s.id}
            ref={(el) => {
              pivotRefs.current[idx] = el;
            }}
          >
            <mesh
              ref={(el) => {
                meshRefs.current[idx] = el;
              }}
              geometry={petalGeometry}
              material={materials[idx]}
            />
          </group>
        ))}
      </group>
    </>
  );
};

export const HeroBudCanvas: React.FC<HeroBudCanvasProps> = (props) => {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.15, 4.6], fov: 34 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <BudScene {...props} />
    </Canvas>
  );
};
