// A simple boot last (占位靴) in the game's own boot proportions, for
// checking that bindings actually fit the characters' feet in the review
// page. Not a game asset — a measuring tool shaped like the chunky boot
// from rider.js.
//
// v26 — ROUNDED pass (user: "鞋太方正了"): the old last was two boxes and
// a toe sphere. It is now all ellipsoids + an oval tapered shaft with a
// torus cuff roll: sole slab, heel ball, mid body, toe, instep, shaft.
// Snowboard boot: 0.17 wide x 0.33 long; ski boot sole: 0.34 long.
// Frame: origin at the sole centre on the ground plane, +z = toe direction
// for the snowboard boot; for the ski boot the toe points to -z (ski tip),
// matching createSkiBinding's frame. Only dependency: three.

import * as THREE from 'three';

export function createBootLast(kind: 'board' | 'ski' = 'board'): THREE.Group {
  const g = new THREE.Group();
  g.name = 'BootLast';
  const m = new THREE.MeshStandardMaterial({ color: '#e8e3d5', roughness: 0.85, transparent: true, opacity: 0.92 });
  const len = kind === 'board' ? 0.33 : 0.34;
  const dir = kind === 'board' ? 1 : -1; // ski boot toe faces -z
  const add = (geo: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z * dir);
    mesh.rotation.x = rx * dir;
    g.add(mesh);
    return mesh;
  };
  const ball = (sx: number, sy: number, sz: number, x: number, y: number, z: number) => {
    const mesh = add(new THREE.SphereGeometry(1, 14, 10), x, y, z);
    mesh.scale.set(sx, sy, sz);
    return mesh;
  };
  // sole slab (soft-edged ellipsoid, squashed flat)
  ball(0.084, 0.016, len / 2, 0, 0.016, -0.004);
  // body: heel ball + mid body + toe, overlapping into one soft mass
  ball(0.080, 0.052, 0.078, 0, 0.055, -(len / 2 - 0.075));
  ball(0.083, 0.046, 0.145, 0, 0.050, -0.01);
  ball(0.080, 0.046, 0.095, 0, 0.047, len / 2 - 0.088);
  // instep rising into the shaft
  ball(0.070, 0.062, 0.085, 0, 0.108, -0.038);
  // ankle shaft: oval tapered cylinder, slight forward lean
  const shaft = add(new THREE.CylinderGeometry(0.064, 0.076, 0.145, 20), 0, 0.1975, -0.048, 0.10);
  shaft.scale.set(0.94, 1, 1.10);
  // cuff roll at the shaft top (torus, ovalised to match, leaning with it)
  const cuff = add(new THREE.TorusGeometry(0.066, 0.0125, 10, 24), 0, 0.2696, -0.0408, Math.PI / 2 + 0.10);
  cuff.scale.set(0.94, 1.10, 1);
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
  g.userData.bootSpec = { kind, width: 0.17, length: len };
  return g;
}

export default createBootLast;
