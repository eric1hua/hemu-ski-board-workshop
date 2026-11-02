// Snowboard binding (one foot) — procedural Three.js factory function.
// Zero textures, flat colours, necessary structure only.
//
// v22 redesign — matched to the user's reference illustration (cream
// open-frame binding): ivory chassis with sculpted side windows, an
// X-frame highback with a dark triangular top pad, wide BLACK straps built
// from segments (reads as the reference's ribbed padding), and light
// frame buckles. Anatomy still follows current two-strap bindings:
// mounting disc, baseplate + rails, footbed + toe ramp, heel cup,
// highback, ankle strap, toe cap strap, buckles + ladders.
//
// USER REQUIREMENT (unchanged): the two straps are SEPARATE, detachable
// assemblies — `strap-ankle` and `strap-toe` are named groups the review
// page (and later the game) can hide, detach, or recolour on their own.
//
// Sized for the game's boot (src/riderSpec.ts): boot outer 0.17 wide x
// 0.33 long. Inner width 0.19, footbed length 0.36 — chunky-boot clearance.
// Frame: origin at the disc centre on the board's topsheet, +z = toe
// direction, +x = outer (buckle) side, metres. Only dependency: three.

import * as THREE from 'three';

export interface SnowboardBindingOptions {
  chassisColor?: string;  // ivory frame in the reference
  strapColor?: string;    // black straps in the reference
  accentColor?: string;   // buckle frames (light metal)
  padColor?: string;      // highback triangle pad + inner heel pad
  footbedColor?: string;  // black footbed in the reference
  castShadow?: boolean;
  receiveShadow?: boolean;
}

const DEFAULTS: Required<SnowboardBindingOptions> = {
  chassisColor: '#ece4d2',
  strapColor: '#20262f',
  accentColor: '#c9ccd1',
  padColor: '#26303c',
  footbedColor: '#22262c',
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

/** A strap as N padded segments along a half-ellipse arc — the segments'
 *  seams read as the ribbing on the reference's straps, and each segment
 *  is honest geometry (no texture tricks). */
function segmentedStrap(parent: THREE.Object3D, m: Mat, opt: {
  cx: number; cy: number; cz: number; rx: number; ry: number; n: number;
  segW: number; thick: number; depth: number;
}) {
  for (let i = 0; i < opt.n; i++) {
    const th = Math.PI * (0.08 + 0.84 * ((i + 0.5) / opt.n)); // 14°..166°
    const x = opt.cx + opt.rx * Math.cos(th);
    const y = opt.cy + opt.ry * Math.sin(th);
    part(box(opt.segW, opt.thick, opt.depth), m, parent, x, y, opt.cz, 0, 0, th + Math.PI / 2);
  }
}

/** A light frame buckle: outer frame box + dark inset, on the +x side. */
function frameBuckle(parent: THREE.Object3D, frame: Mat, inset: Mat, x: number, y: number, z: number, h: number, d: number) {
  part(box(0.014, h, d), frame, parent, x, y, z);
  part(box(0.016, h * 0.62, d * 0.62), inset, parent, x, y, z);
}

export function createSnowboardBinding(options: SnowboardBindingOptions = {}): THREE.Group {
  const o: typeof DEFAULTS = { ...DEFAULTS, ...options };
  const chassis = mat(o.chassisColor, 0.5), strapM = mat(o.strapColor, 0.75);
  const accent = mat(o.accentColor, 0.3), pad = mat(o.padColor, 0.7), bed = mat(o.footbedColor, 0.85);
  const steel = mat('#8f979e', 0.35);

  const root = new THREE.Group();
  root.name = 'SnowboardBinding';

  // ---- chassis ----
  const base = new THREE.Group();
  base.name = 'chassis';
  root.add(base);
  part(new THREE.CylinderGeometry(0.058, 0.058, 0.008, 24), steel, base, 0, 0.004, 0.01); // disc
  part(box(0.20, 0.009, 0.36), chassis, base, 0, 0.012, 0.015);                              // baseplate
  // Side walls with a sculpted window: bottom rail + toe post + heel post +
  // a diagonal strut, the triangular opening between them left empty.
  for (const sx of [-1, 1]) {
    part(box(0.014, 0.02, 0.33), chassis, base, sx * 0.096, 0.026, 0.01);
    part(box(0.014, 0.05, 0.055), chassis, base, sx * 0.096, 0.045, 0.128);
    part(box(0.014, 0.055, 0.06), chassis, base, sx * 0.096, 0.048, -0.108);
    part(box(0.012, 0.015, 0.185), chassis, base, sx * 0.096, 0.062, 0.012, -0.16);
  }
  // footbed + toe ramp (black, as in the reference)
  part(box(0.182, 0.007, 0.335), bed, base, 0, 0.02, 0.012);
  part(box(0.182, 0.006, 0.075), bed, base, 0, 0.023, 0.175, -0.12);
  // heel cup: ivory arc around the heel
  const cup = part(new THREE.CylinderGeometry(0.104, 0.104, 0.055, 20, 1, true, Math.PI - 1.15, 2.3), chassis, base, 0, 0.047, -0.052);
  cup.material.side = THREE.DoubleSide;
  cup.name = 'heelcup';

  // ---- highback: open X frame + dark triangular pad (the reference's
  // signature). ~10° forward lean, as before. ----
  const hb = new THREE.Group();
  hb.name = 'highback';
  hb.position.set(0, 0.05, -0.148);
  hb.rotation.x = 0.17;
  base.add(hb);
  for (const sx of [-1, 1]) part(box(0.017, 0.205, 0.02), chassis, hb, sx * 0.072, 0.102, 0);  // side posts
  part(box(0.16, 0.028, 0.02), chassis, hb, 0, 0.205, 0);                                       // top bar
  for (const s of [-1, 1]) part(box(0.026, 0.225, 0.014), chassis, hb, 0, 0.102, 0.002, 0, 0, s * 0.60); // X struts
  { // dark triangle pad, apex down, set into the top of the frame
    const shape = new THREE.Shape();
    shape.moveTo(-0.058, 0.182); shape.lineTo(0.058, 0.182); shape.lineTo(0, 0.075); shape.closePath();
    const tri = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.01, bevelEnabled: false }), pad);
    tri.position.z = -0.009;
    hb.add(tri);
  }
  part(box(0.13, 0.07, 0.01), pad, hb, 0, 0.04, 0.012);                                          // inner heel pad
  part(box(0.05, 0.045, 0.022), chassis, base, 0, 0.045, -0.168);                               // lean adjuster

  // ---- ankle strap: DETACHABLE, segmented black band + frame buckle ----
  const ankle = new THREE.Group();
  ankle.name = 'strap-ankle';
  ankle.userData.detachable = true;
  root.add(ankle);
  segmentedStrap(ankle, strapM, { cx: 0, cy: 0.05, cz: -0.005, rx: 0.099, ry: 0.09, n: 7, segW: 0.042, thick: 0.015, depth: 0.086 });
  frameBuckle(ankle, accent, strapM, 0.105, 0.07, -0.005, 0.042, 0.06);
  part(box(0.008, 0.02, 0.09), chassis, ankle, -0.104, 0.062, -0.005);                          // ladder

  // ---- toe strap: DETACHABLE, segmented cap band + frame buckle ----
  const toe = new THREE.Group();
  toe.name = 'strap-toe';
  toe.userData.detachable = true;
  root.add(toe);
  segmentedStrap(toe, strapM, { cx: 0, cy: 0.04, cz: 0.128, rx: 0.089, ry: 0.064, n: 5, segW: 0.045, thick: 0.0135, depth: 0.056 });
  part(box(0.13, 0.045, 0.016), strapM, toe, 0, 0.048, 0.182, 0.35);                            // toe cap panel
  frameBuckle(toe, accent, strapM, 0.102, 0.062, 0.128, 0.036, 0.05);
  part(box(0.008, 0.018, 0.07), chassis, toe, -0.101, 0.05, 0.128);                             // ladder

  root.traverse((m) => {
    if ((m as THREE.Mesh).isMesh) { m.castShadow = o.castShadow; m.receiveShadow = o.receiveShadow; }
  });
  root.userData.bindingSpec = {
    fitsBoot: { width: 0.17, length: 0.33 },
    innerWidth: 0.19, footbedLength: 0.36, highbackHeight: 0.25,
    detachable: ['strap-ankle', 'strap-toe'],
    style: 'v24 reference: ivory X-frame highback, segmented straps',
  };
  return root;
}

export default createSnowboardBinding;
