// Snowboard binding (one foot) — procedural Three.js factory function.
// Zero textures, flat colours, necessary structure only.
//
// v26 — ROUNDED pass (user: "太方正了，要更圆润；背板要再薄"). Everything
// that was a raw box is now a rounded plate (extruded rounded rect with
// bevel), a flattened capsule bar, or a pillow segment; the highback
// frame is built from thin flattened capsules (~9–12 mm thick where v24
// used 14–20 mm boxes). Identity from the v22–v24 reference redesign is
// kept: ivory chassis with side windows, X-frame highback with the dark
// triangular pad, segmented black straps, frame buckles, black footbed.
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
  padColor?: string;     // highback triangle pad + inner heel pad
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

/** Trace a centred rounded rectangle onto a Shape or Path. */
function traceRR<T extends THREE.Shape | THREE.Path>(t: T, w: number, h: number, r: number): T {
  const x = -w / 2, y = -h / 2;
  t.moveTo(x + r, y);
  t.lineTo(x + w - r, y); t.quadraticCurveTo(x + w, y, x + w, y + r);
  t.lineTo(x + w, y + h - r); t.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  t.lineTo(x + r, y + h); t.quadraticCurveTo(x, y + h, x, y + h - r);
  t.lineTo(x, y + r); t.quadraticCurveTo(x, y, x + r, y);
  return t;
}

/** Rounded plate: plan w x d, height h, corner radius r, bevelled top and
 *  bottom edges. Centre-origin, so it drops in wherever a box went. */
function plate(w: number, h: number, d: number, r = 0.01, bev = 0.003): THREE.BufferGeometry {
  const b = Math.min(bev, h * 0.45, w * 0.45, d * 0.45);
  const shape = traceRR(new THREE.Shape(), w - 2 * b, d - 2 * b, Math.max(0.0015, r - b));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.0008, h - 2 * b), bevelEnabled: true,
    bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 4,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -(h - 2 * b) / 2, 0);
  return geo;
}

/** Capsule bar along +Y (total length len + 2r). Flatten with mesh.scale. */
function bar(r: number, len: number): THREE.BufferGeometry {
  return new THREE.CapsuleGeometry(r, len, 3, 10);
}

/** A buckle frame: rounded-rect ring facing +x. d = depth (z), h = height. */
function frameRing(d: number, h: number, t: number, wall: number): THREE.BufferGeometry {
  const shape = traceRR(new THREE.Shape(), d, h, Math.min(0.009, h * 0.32));
  shape.holes.push(traceRR(new THREE.Path(), d - wall * 2, h - wall * 2, Math.max(0.002, Math.min(0.009, h * 0.32) - wall * 0.6)));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: t, bevelEnabled: true, bevelThickness: 0.0012, bevelSize: 0.0012, bevelSegments: 1, curveSegments: 5,
  });
  geo.rotateY(Math.PI / 2);
  geo.translate(-t / 2, 0, 0);
  return geo;
}

/** A strap as N pillow segments along a half-ellipse arc — overlapping
 *  ellipsoids, so the seams still read as the reference's ribbed padding
 *  but the silhouette is soft. */
function segmentedStrap(parent: THREE.Object3D, m: Mat, opt: {
  cx: number; cy: number; cz: number; rx: number; ry: number; n: number;
  segRx: number; segRy: number; segRz: number;
}) {
  const geo = new THREE.SphereGeometry(1, 10, 7);
  for (let i = 0; i < opt.n; i++) {
    const th = Math.PI * (0.08 + 0.84 * ((i + 0.5) / opt.n)); // 14°..166°
    const x = opt.cx + opt.rx * Math.cos(th);
    const y = opt.cy + opt.ry * Math.sin(th);
    const seg = part(geo, m, parent, x, y, opt.cz, 0, 0, th + Math.PI / 2);
    seg.scale.set(opt.segRx, opt.segRy, opt.segRz);
  }
}

/** Light frame buckle on the +x side: rounded ring + dark inset plate. */
function frameBuckle(parent: THREE.Object3D, frame: Mat, inset: Mat, x: number, y: number, z: number, h: number, d: number) {
  part(frameRing(d, h, 0.011, 0.0075), frame, parent, x, y, z);
  part(plate(0.013, h * 0.6, d * 0.6, 0.006, 0.003), inset, parent, x - 0.001, y, z);
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
  part(plate(0.20, 0.009, 0.36, 0.04, 0.0035), chassis, base, 0, 0.012, 0.015);             // baseplate
  // Side walls with a sculpted window: bottom rail + toe post + heel post +
  // a diagonal strut, the triangular opening between them left empty.
  for (const sx of [-1, 1]) {
    part(plate(0.015, 0.02, 0.33, 0.007, 0.004), chassis, base, sx * 0.096, 0.026, 0.01);
    part(plate(0.015, 0.05, 0.055, 0.006, 0.005), chassis, base, sx * 0.096, 0.045, 0.128);
    part(plate(0.015, 0.055, 0.06, 0.006, 0.005), chassis, base, sx * 0.096, 0.048, -0.108);
    const strut = part(bar(0.0085, 0.165), chassis, base, sx * 0.096, 0.062, 0.012, -0.16 + Math.PI / 2);
    strut.scale.set(1, 1, 0.62); // local z ≈ world vertical after the rx tilt: thin, not short
  }
  // footbed + toe ramp (black, as in the reference)
  part(plate(0.182, 0.007, 0.335, 0.03, 0.003), bed, base, 0, 0.02, 0.012);
  part(plate(0.182, 0.006, 0.075, 0.02, 0.0025), bed, base, 0, 0.023, 0.175, -0.12);
  // heel cup: ivory arc around the heel + a soft torus lip on its top edge
  const cup = part(new THREE.CylinderGeometry(0.104, 0.104, 0.055, 20, 1, true, Math.PI - 1.15, 2.3), chassis, base, 0, 0.047, -0.052);
  cup.material.side = THREE.DoubleSide;
  cup.name = 'heelcup';
  const lipGeo = new THREE.TorusGeometry(0.104, 0.0055, 8, 20, 2.3);
  lipGeo.rotateZ(-Math.PI / 2 - 1.15);
  lipGeo.rotateX(Math.PI / 2);
  part(lipGeo, chassis, base, 0, 0.0745, -0.052);

  // ---- highback: open X frame + dark triangular pad (the reference's
  // signature). THIN flattened capsule bars (v26). ~10° forward lean. ----
  const hb = new THREE.Group();
  hb.name = 'highback';
  hb.position.set(0, 0.05, -0.148);
  hb.rotation.x = 0.17;
  base.add(hb);
  for (const sx of [-1, 1]) {
    const post = part(bar(0.0105, 0.183), chassis, hb, sx * 0.072, 0.102, 0);
    post.scale.set(1, 1, 0.58); // ~12 mm thick
  }
  const topBarGeo = bar(0.0095, 0.144); topBarGeo.rotateZ(Math.PI / 2);
  const topBar = part(topBarGeo, chassis, hb, 0, 0.205, 0);
  topBar.scale.set(1, 1, 0.62);
  for (const s of [-1, 1]) {
    const strut = part(bar(0.0078, 0.209), chassis, hb, 0, 0.102, 0.002, 0, 0, s * 0.60);
    strut.scale.set(1, 1, 0.58); // ~9 mm thick
  }
  { // dark triangle pad, apex down, set into the top of the frame (thinner, bevelled)
    const shape = new THREE.Shape();
    shape.moveTo(-0.058, 0.182); shape.lineTo(0.058, 0.182); shape.lineTo(0, 0.075); shape.closePath();
    const tri = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {
      depth: 0.004, bevelEnabled: true, bevelThickness: 0.0016, bevelSize: 0.0016, bevelSegments: 1,
    }), pad);
    tri.position.z = -0.0062;
    hb.add(tri);
  }
  part(plate(0.13, 0.07, 0.007, 0.012, 0.003), pad, hb, 0, 0.04, 0.0105);                    // inner heel pad
  part(plate(0.05, 0.045, 0.02, 0.008, 0.005), chassis, base, 0, 0.045, -0.168);             // lean adjuster

  // ---- ankle strap: DETACHABLE, pillow-segment black band + frame buckle ----
  const ankle = new THREE.Group();
  ankle.name = 'strap-ankle';
  ankle.userData.detachable = true;
  root.add(ankle);
  segmentedStrap(ankle, strapM, { cx: 0, cy: 0.05, cz: -0.005, rx: 0.099, ry: 0.09, n: 7, segRx: 0.026, segRy: 0.0105, segRz: 0.044 });
  frameBuckle(ankle, accent, strapM, 0.105, 0.07, -0.005, 0.042, 0.06);
  part(plate(0.008, 0.02, 0.09, 0.004, 0.0025), chassis, ankle, -0.104, 0.062, -0.005);      // ladder

  // ---- toe strap: DETACHABLE, pillow-segment cap band + frame buckle ----
  const toe = new THREE.Group();
  toe.name = 'strap-toe';
  toe.userData.detachable = true;
  root.add(toe);
  segmentedStrap(toe, strapM, { cx: 0, cy: 0.04, cz: 0.128, rx: 0.089, ry: 0.064, n: 5, segRx: 0.027, segRy: 0.0095, segRz: 0.029 });
  part(plate(0.13, 0.045, 0.015, 0.012, 0.005), strapM, toe, 0, 0.048, 0.182, 0.35);         // toe cap panel
  frameBuckle(toe, accent, strapM, 0.102, 0.062, 0.128, 0.036, 0.05);
  part(plate(0.008, 0.018, 0.07, 0.004, 0.0025), chassis, toe, -0.101, 0.05, 0.128);         // ladder

  root.traverse((m) => {
    if ((m as THREE.Mesh).isMesh) { m.castShadow = o.castShadow; m.receiveShadow = o.receiveShadow; }
  });
  root.userData.bindingSpec = {
    fitsBoot: { width: 0.17, length: 0.33 },
    innerWidth: 0.19, footbedLength: 0.36, highbackHeight: 0.25,
    detachable: ['strap-ankle', 'strap-toe'],
    style: 'v26 rounded: thin capsule X highback, pillow straps, rounded plates',
  };
  return root;
}

export default createSnowboardBinding;
