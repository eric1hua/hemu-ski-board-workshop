// A simple boot last (占位靴) in the game's own boot proportions, for
// checking that bindings actually fit the characters' feet in the review
// page. Not a game asset — a measuring tool shaped like the chunky boot
// from rider.js: a sole block, a rounded toe, and an ankle shaft.
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
  // sole + body block
  add(new THREE.BoxGeometry(0.17, 0.09, len - 0.06), 0, 0.045, -0.01);
  // rounded toe
  const toe = add(new THREE.SphereGeometry(0.085, 14, 10), 0, 0.05, len / 2 - 0.085);
  toe.scale.set(1, 0.62, 1.15);
  // ankle shaft (leans slightly forward, like a real boot)
  add(new THREE.BoxGeometry(0.145, 0.18, 0.16), 0, 0.17, -0.045, 0.1);
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
  g.userData.bootSpec = { kind, width: 0.17, length: len };
  return g;
}

export default createBootLast;
