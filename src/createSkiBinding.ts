// Alpine ski binding (one ski) — procedural Three.js factory function.
// Zero textures, flat colours, necessary structure only.
//
// Anatomy follows current alpine bindings (researched 2026-11-03, Marker
// Griffon class): mounting rail, toe piece with two wings and a gliding
// AFD plate under the toe, heel piece with a long step-in lever (Pivot
// style), and a pair of brake arms beside the heel. No DIN dials, no screw
// heads — the shapes that read at game distance, nothing else.
//
// v26 — ROUNDED pass: boxes become bevelled rounded plates, the wings and
// step-in lever become capsule bars, brake arms become round wire (they
// always were wire in reality; the boxes were the placeholder).
//
// Sized for the game's ski boot (src/riderSpec.ts): sole 0.34 m long
// (toe lug at -0.17, heel lug at +0.17 from the boot centre), sole standing
// ~0.035 m over the ski. Frame: origin at the boot centre on the ski's
// topsheet, -z = toward the ski tip, metres. Only dependency: three.

import * as THREE from 'three';

export interface SkiBindingOptions {
  bodyColor?: string;
  steelColor?: string;
  accentColor?: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

const DEFAULTS: Required<SkiBindingOptions> = {
  bodyColor: '#232327',
  steelColor: '#a9b2b8',
  accentColor: '#e86a1c',
  castShadow: true,
  receiveShadow: true,
};

type Mat = THREE.MeshStandardMaterial;
const mat = (color: string, rough = 0.45): Mat => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.1 });

function part(geo: THREE.BufferGeometry, m: Mat, parent: THREE.Object3D, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  parent.add(mesh);
  return mesh;
}

/** Rounded plate: plan w x d, height h, corner radius r, bevelled edges.
 *  Centre-origin, drops in wherever a box went. */
function plate(w: number, h: number, d: number, r = 0.01, bev = 0.003): THREE.BufferGeometry {
  const b = Math.min(bev, h * 0.45, w * 0.45, d * 0.45);
  const s = new THREE.Shape();
  const x = -(w - 2 * b) / 2, y = -(d - 2 * b) / 2, sw = w - 2 * b, sd = d - 2 * b, sr = Math.max(0.0015, r - b);
  s.moveTo(x + sr, y);
  s.lineTo(x + sw - sr, y); s.quadraticCurveTo(x + sw, y, x + sw, y + sr);
  s.lineTo(x + sw, y + sd - sr); s.quadraticCurveTo(x + sw, y + sd, x + sw - sr, y + sd);
  s.lineTo(x + sr, y + sd); s.quadraticCurveTo(x, y + sd, x, y + sd - sr);
  s.lineTo(x, y + sr); s.quadraticCurveTo(x, y, x + sr, y);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.0008, h - 2 * b), bevelEnabled: true,
    bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 4,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -(h - 2 * b) / 2, 0);
  return geo;
}

export function createSkiBinding(options: SkiBindingOptions = {}): THREE.Group {
  const o: typeof DEFAULTS = { ...DEFAULTS, ...options };
  const body = mat(o.bodyColor), steel = mat(o.steelColor, 0.3), accent = mat(o.accentColor, 0.4);

  const root = new THREE.Group();
  root.name = 'SkiBinding';

  // mounting rail
  part(plate(0.07, 0.008, 0.46, 0.02, 0.003), steel, root, 0, 0.004, 0);

  // ---- toe piece ----
  const toe = new THREE.Group();
  toe.name = 'toe-piece';
  root.add(toe);
  part(plate(0.075, 0.012, 0.09, 0.012, 0.004), body, toe, 0, 0.012, -0.155);
  part(plate(0.06, 0.034, 0.068, 0.012, 0.008), body, toe, 0, 0.034, -0.158);
  const wingGeo = new THREE.CapsuleGeometry(0.0095, 0.033, 3, 10); wingGeo.rotateX(Math.PI / 2);
  for (const sx of [-1, 1]) part(wingGeo, steel, toe, sx * 0.036, 0.03, -0.185, 0, sx * -0.5); // wings
  part(new THREE.CylinderGeometry(0.011, 0.011, 0.012, 12), accent, toe, 0, 0.056, -0.158); // top cap
  part(plate(0.055, 0.004, 0.042, 0.008, 0.0016), steel, toe, 0, 0.014, -0.112); // gliding AFD under the toe lug

  // ---- heel piece ----
  const heel = new THREE.Group();
  heel.name = 'heel-piece';
  root.add(heel);
  part(plate(0.07, 0.012, 0.10, 0.012, 0.004), body, heel, 0, 0.012, 0.16);
  part(plate(0.055, 0.044, 0.06, 0.012, 0.009), body, heel, 0, 0.036, 0.168);
  part(plate(0.048, 0.02, 0.014, 0.005, 0.004), steel, heel, 0, 0.03, 0.132); // heel cup jaw
  part(new THREE.CapsuleGeometry(0.0105, 0.088, 3, 10), body, heel, 0, 0.085, 0.208, 0.5); // step-in lever, leaning back
  part(new THREE.CapsuleGeometry(0.011, 0.014, 3, 10), accent, heel, 0, 0.128, 0.232, 0.5); // lever tip

  // ---- brakes: round wire arms + pedal pads either side of the heel ----
  const brakes = new THREE.Group();
  brakes.name = 'brakes';
  root.add(brakes);
  const armGeo = new THREE.CylinderGeometry(0.0032, 0.0032, 0.052, 8); armGeo.rotateZ(Math.PI / 2);
  for (const sx of [-1, 1]) {
    part(armGeo, steel, brakes, sx * 0.048, 0.012, 0.155, 0, 0, sx * 0.15);                    // arm
    part(plate(0.032, 0.004, 0.052, 0.008, 0.0016), body, brakes, sx * 0.072, 0.003, 0.16);    // pedal pad
  }

  root.traverse((m) => {
    if ((m as THREE.Mesh).isMesh) { m.castShadow = o.castShadow; m.receiveShadow = o.receiveShadow; }
  });
  root.userData.bindingSpec = { bootSoleLength: 0.34, stackHeight: 0.035, brakeWidth: 0.145 };
  return root;
}

export default createSkiBinding;
