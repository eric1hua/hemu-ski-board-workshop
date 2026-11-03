// The GAME's skis, brought into the workshop for side-by-side comparison:
// a faithful port of hemu-ski's src/player/rider-skis.js (clone HEAD
// 3da61a1) — the procedural placeholder pair the game itself ships:
// SKI = length 1.40, waist 0.11, tip 0.13, thick 0.02, sole 0.035.
//
// The vertex math, part list and palette are the game's own, copied
// expression for expression; only the shading differs (flat standard
// materials in the game's colours instead of its toon shader) and the
// frame: the game builds tip toward +z with the boot sole at the
// origin — here each ski is turned to the workshop frame (tips toward
// -z, bases on y = 0, pair centred on z = 0) so it can stand next to
// the workshop pair (1.70 m) and the 30 cm shows at both ends.

import * as THREE from 'three';

export const GAME_SKI = { length: 1.4, waist: 0.11, tip: 0.13, thick: 0.02, sole: 0.035 };
const STANCE = 0.125; // the game's, same as the workshop pair's

const C = {
  top: '#3d6fa6',
  stripe: '#b9d4ee',
  accent: '#f2a7b9',
  navy: '#1f2a44',
  binding: '#efe9dc',
};
const mat = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0 });

// The game's skiGeometry, verbatim: a subdivided box bent per-vertex —
// waisted, rounded at both ends, tip and tail turned up (tail lower).
function skiGeometry(width = 1, thick = GAME_SKI.thick): THREE.BufferGeometry {
  const SKI = GAME_SKI;
  const L = SKI.length, half = L / 2, rise = 0.2, round = 0.1;
  const g = new THREE.BoxGeometry(1, thick, L, 4, 1, 56).translate(0, thick / 2, 0);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i), a = Math.abs(z) / half;
    const end = Math.max(0, Math.abs(z) - (half - round)) / round;
    const w = (SKI.waist + (SKI.tip - SKI.waist) * a * a) * Math.sqrt(Math.max(0.05, 1 - end ** 4)) * width;
    pos.setX(i, pos.getX(i) * w);
    const over = Math.max(0, Math.abs(z) - (half - rise));
    pos.setY(i, pos.getY(i) + over * over * (z > 0 ? 1.9 : 1.6));
  }
  g.computeVertexNormals();
  return g;
}

function part(geo: THREE.BufferGeometry, color: string, parent: THREE.Group, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/** One game ski with its binding — the game's makeSki, verbatim parts. */
function makeGameSki(): THREE.Group {
  const SKI = GAME_SKI;
  const ski = new THREE.Group();
  ski.name = 'GameSki';
  const body = new THREE.Group();
  body.position.y = -SKI.sole;
  ski.add(body);
  part(skiGeometry(), C.top, body);
  part(skiGeometry(1.04, 0.007), C.navy, body, 0, -0.002, 0).castShadow = false; // base and edges
  const flat = SKI.length - 0.42;
  part(new THREE.BoxGeometry(0.026, 0.003, flat), C.stripe, body, 0, SKI.thick + 0.001, 0);
  for (const z of [-1, 1]) part(new THREE.BoxGeometry(0.06, 0.003, 0.05), C.accent, body, 0, SKI.thick + 0.002, z * (flat / 2 - 0.08));
  const b = new THREE.Group();
  b.position.y = SKI.thick;
  body.add(b);
  part(new THREE.BoxGeometry(0.075, 0.015, 0.44), C.binding, b, 0, 0.0075, 0);
  part(new THREE.BoxGeometry(0.09, 0.045, 0.07), C.binding, b, 0, 0.036, 0.205);
  part(new THREE.BoxGeometry(0.06, 0.012, 0.05), C.navy, b, 0, 0.064, 0.21);
  part(new THREE.BoxGeometry(0.095, 0.06, 0.085), C.binding, b, 0, 0.044, -0.2);
  part(new THREE.BoxGeometry(0.05, 0.016, 0.085), C.navy, b, 0, 0.08, -0.215).rotation.x = -0.25;
  for (const x of [-1, 1]) part(new THREE.BoxGeometry(0.012, 0.03, 0.07), C.navy, b, x * 0.052, 0.03, -0.15);
  return ski;
}

/** The game's pair in the workshop frame: tips toward -z, bases on
 *  y = 0, centred on z = 0, each ski STANCE out from the middle. */
export function createGameSkis(): THREE.Group {
  const pair = new THREE.Group();
  pair.name = 'GameSkis';
  for (const sx of [-1, 1]) {
    const ski = makeGameSki();
    ski.rotation.y = Math.PI;              // game tip +z -> workshop -z
    ski.position.set(sx * STANCE, GAME_SKI.sole, 0); // sole frame -> bases on the snow
    pair.add(ski);
  }
  return pair;
}

export default createGameSkis;
