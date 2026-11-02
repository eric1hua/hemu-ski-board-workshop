// Snowboard binding (one foot) — procedural Three.js factory function.
// Zero textures, flat colours, necessary structure only.
//
// Anatomy follows current two-strap bindings (researched 2026-11-03 from
// Salomon District / Tactics anatomy guides): mounting disc, baseplate with
// side rails, footbed + toe ramp, heel cup, highback with forward lean,
// ankle strap, toe cap strap, ratchet buckles + ladders.
//
// USER REQUIREMENT: the two straps are SEPARATE, detachable assemblies.
// `strap-ankle` and `strap-toe` are their own named groups; the review page
// (and later the game) can hide them, detach them (lift off), or swap their
// colour without touching the chassis. Everything else is one chassis group.
//
// Sized for the game's boot (src/riderSpec.ts): boot outer 0.17 wide x
// 0.33 long. Inner width 0.19, footbed length 0.36 — chunky-boot clearance.
// Frame: origin at the disc centre on the board's topsheet, +z = toe
// direction, +x = outer (ratchet) side, metres. Only dependency: three.

import * as THREE from 'three';

export interface SnowboardBindingOptions {
  chassisColor?: string;
  strapColor?: string;
  accentColor?: string; // ratchets, highback pad
  footbedColor?: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

const DEFAULTS: Required<SnowboardBindingOptions> = {
  chassisColor: '#26262b',
  strapColor: '#3a3a41',
  accentColor: '#e86a1c', // the game's classic binding orange
  footbedColor: '#454b58',
  castShadow: true,
  receiveShadow: true,
};

type Mat = THREE.MeshStandardMaterial;
const mat = (color: string, rough = 0.55): Mat => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05 });

function part(geo: THREE.BufferGeometry, m: Mat, parent: THREE.Object3D, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  parent.add(mesh);
  return mesh;
}
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

export function createSnowboardBinding(options: SnowboardBindingOptions = {}): THREE.Group {
  const o: typeof DEFAULTS = { ...DEFAULTS, ...options };
  const chassis = mat(o.chassisColor), strapM = mat(o.strapColor, 0.7), accent = mat(o.accentColor, 0.4), bed = mat(o.footbedColor, 0.8);
  const steel = mat('#8f979e', 0.35);

  const root = new THREE.Group();
  root.name = 'SnowboardBinding';

  // ---- chassis (one group, stays when straps are detached) ----
  const base = new THREE.Group();
  base.name = 'chassis';
  root.add(base);
  // mounting disc
  part(new THREE.CylinderGeometry(0.058, 0.058, 0.008, 24), steel, base, 0, 0.004, 0.01);
  // baseplate + side rails
  part(box(0.20, 0.010, 0.36), chassis, base, 0, 0.013, 0.015);
  for (const sx of [-1, 1]) part(box(0.014, 0.038, 0.33), chassis, base, sx * 0.096, 0.032, 0.01);
  // footbed + toe ramp
  part(box(0.182, 0.007, 0.335), bed, base, 0, 0.0215, 0.012);
  part(box(0.182, 0.006, 0.075), bed, base, 0, 0.025, 0.175, -0.12);
  // heel cup: open cylinder arc around the heel
  const cup = part(new THREE.CylinderGeometry(0.104, 0.104, 0.07, 20, 1, true, Math.PI - 1.15, 2.3), chassis, base, 0, 0.055, -0.052);
  cup.material = chassis; cup.material.side = THREE.DoubleSide;
  cup.name = 'heelcup';

  // highback: panel with ~10 degrees of forward lean + top pad + lean adjuster
  const hb = new THREE.Group();
  hb.name = 'highback';
  hb.position.set(0, 0.055, -0.148);
  hb.rotation.x = 0.17;
  base.add(hb);
  part(box(0.155, 0.235, 0.016), chassis, hb, 0, 0.115, 0);
  part(box(0.15, 0.07, 0.026), accent, hb, 0, 0.205, -0.004);
  part(box(0.05, 0.045, 0.022), accent, base, 0, 0.045, -0.168); // lean adjuster block

  // ---- ankle strap: DETACHABLE assembly ----
  const ankle = new THREE.Group();
  ankle.name = 'strap-ankle';
  ankle.userData.detachable = true;
  root.add(ankle);
  const band = part(new THREE.TorusGeometry(0.089, 0.021, 10, 22, Math.PI), strapM, ankle, 0, 0.062, -0.005);
  band.scale.set(1, 1.05, 1.9); // flatten the tube into a wide strap
  part(box(0.028, 0.05, 0.075), accent, ankle, 0.108, 0.075, -0.005);       // ratchet buckle (outer)
  part(box(0.02, 0.02, 0.05), steel, ankle, 0.108, 0.108, -0.005);          // ratchet lever
  part(box(0.008, 0.02, 0.09), chassis, ankle, -0.104, 0.07, -0.005);       // ladder (inner)

  // ---- toe strap: DETACHABLE assembly (cap style, wraps the toe box) ----
  const toe = new THREE.Group();
  toe.name = 'strap-toe';
  toe.userData.detachable = true;
  root.add(toe);
  const capBand = part(new THREE.TorusGeometry(0.078, 0.017, 10, 20, Math.PI), strapM, toe, 0, 0.05, 0.128);
  capBand.scale.set(1, 1, 1.7);
  part(box(0.145, 0.055, 0.018), strapM, toe, 0, 0.055, 0.183, 0.35);        // toe cap panel
  part(box(0.026, 0.042, 0.06), accent, toe, 0.104, 0.06, 0.128);           // ratchet
  part(box(0.008, 0.018, 0.07), chassis, toe, -0.102, 0.055, 0.128);        // ladder

  root.traverse((m) => {
    if ((m as THREE.Mesh).isMesh) { m.castShadow = o.castShadow; m.receiveShadow = o.receiveShadow; }
  });
  root.userData.bindingSpec = {
    fitsBoot: { width: 0.17, length: 0.33 },
    innerWidth: 0.19, footbedLength: 0.36, highbackHeight: 0.24,
    detachable: ['strap-ankle', 'strap-toe'],
  };
  return root;
}

export default createSnowboardBinding;
