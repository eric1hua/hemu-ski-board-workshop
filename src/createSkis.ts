// A pair of all-mountain skis — procedural Three.js factory functions.
// Zero textures, flat colours, one geometric stripe — the workshop rules
// (see README). Built from one bent grid per ski: topsheet, base and
// sidewall can never poke through each other where the tip rocker bends.
//
// Spec (from src/riderSpec.ts): length 1.70 m fixed (intermediate band for
// the game's ~1.75 m riders), dimensions 132 / 105 / 118 mm — the waist is
// a touch wide on purpose so the game's chunky boots (0.17 m wide) do not
// visually swallow the ski. Frame: origin at the pair's centre on the snow,
// nose toward -z, each ski offset by RIDER.skiStance. Only dependency: three.

import * as THREE from 'three';
import { applySurfaceGradient } from './surfaceGradient';
import { RIDER, SKI_LENGTH } from './riderSpec';

export interface SkiOptions {
  length?: number;
  tipWidth?: number;
  waistWidth?: number;
  tailWidth?: number;
  thickness?: number;
  topsheetColor?: string;
  stripeColor?: string;
  accentColor?: string;
  baseColor?: string;
  topsheetTailColor?: string;
  baseTailColor?: string;
  sidewallColor?: string;
  segments?: [number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

const DEFAULTS: Required<SkiOptions> = {
  length: SKI_LENGTH,
  tipWidth: 0.132,
  waistWidth: 0.105,
  tailWidth: 0.118,
  thickness: 0.011,
  topsheetColor: '#2f5d8a',
  stripeColor: '#b9d4ee',
  accentColor: '#f2a7b9',
  baseColor: '#1f2a44',
  sidewallColor: '#232327',
  segments: [140, 18],
  castShadow: true,
  receiveShadow: true,
};

function halfWidthAt(t: number, o: typeof DEFAULTS): number {
  const tip = o.tipWidth / 2, w = o.waistWidth / 2, tl = o.tailWidth / 2;
  const pts: Array<[number, number]> = [
    [0.0, 0.004], [0.04, tip * 0.62], [0.09, tip * 0.97], [0.13, tip],
    [0.25, w + (tip - w) * 0.42], [0.5, w], [0.72, w + (tl - w) * 0.3],
    [0.9, tl * 0.98], [1.0, tl],
  ];
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t1, w1] = pts[i - 1], [t2, w2] = pts[i];
      const p0 = pts[Math.max(0, i - 2)], p3 = pts[Math.min(pts.length - 1, i + 1)];
      const u = (t - t1) / (t2 - t1);
      const v = 0.5 * ((2 * w1) + (-p0[1] + w2) * u + (2 * p0[1] - 5 * w1 + 4 * w2 - p3[1]) * u * u + (-p0[1] + 3 * w1 - 3 * w2 + p3[1]) * u * u * u);
      return Math.max(0.002, v);
    }
  }
  return tl;
}

function liftAt(t: number): number {
  let y = 0;
  if (t < 0.17) { const u = (0.17 - t) / 0.17; y += 0.075 * u * u; }       // tip rocker / splay
  if (t > 0.25 && t < 0.85) y += 0.004 * Math.sin(Math.PI * (t - 0.25) / 0.6); // camber
  if (t > 0.93) { const u = (t - 0.93) / 0.07; y += 0.018 * u * u; }         // tail kick
  return y;
}

function thicknessFactor(t: number, sAbs: number): number {
  const ends = (0.5 + 0.5 * THREE.MathUtils.smoothstep(t, 0.0, 0.08)) * (1 - 0.35 * THREE.MathUtils.smoothstep(t, 0.94, 1.0));
  const edge = 1 - 0.35 * THREE.MathUtils.smoothstep(sAbs, 0.75, 1.0);
  return ends * edge;
}

interface Grid { topPos: Float32Array; botPos: Float32Array; xArr: Float32Array; tArr: Float32Array; topIdx: number[] }

function buildGrid(o: typeof DEFAULTS): Grid {
  const [NL, NC] = o.segments;
  const count = (NL + 1) * (NC + 1);
  const topPos = new Float32Array(count * 3), botPos = new Float32Array(count * 3);
  const xArr = new Float32Array(count), tArr = new Float32Array(count);
  for (let i = 0; i <= NL; i++) {
    const t = i / NL, hw = halfWidthAt(t, o);
    for (let j = 0; j <= NC; j++) {
      const k = i * (NC + 1) + j, s = j / NC * 2 - 1, x = s * hw;
      const half = (o.thickness / 2) * thicknessFactor(t, Math.abs(s));
      const ym = liftAt(t), z = t * o.length - o.length / 2;
      topPos.set([x, ym + half + 0.0004, z], k * 3);
      botPos.set([x, ym - half - 0.0004, z], k * 3);
      xArr[k] = x; tArr[k] = t;
    }
  }
  const topIdx: number[] = [], row = NC + 1;
  for (let i = 0; i < NL; i++) for (let j = 0; j < NC; j++) {
    const a = i * row + j, b = a + 1, c = a + row, d = c + 1;
    topIdx.push(a, c, b, b, c, d);
  }
  return { topPos, botPos, xArr, tArr, topIdx };
}

function surface(grid: Grid, side: 1 | -1): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(side > 0 ? grid.topPos.slice() : grid.botPos.slice(), 3));
  if (side > 0) g.setIndex(grid.topIdx);
  else {
    const idx: number[] = [];
    for (let i = 0; i < grid.topIdx.length; i += 3) idx.push(grid.topIdx[i], grid.topIdx[i + 2], grid.topIdx[i + 1]);
    g.setIndex(idx);
  }
  g.computeVertexNormals();
  return g;
}

function sidewall(grid: Grid): THREE.BufferGeometry {
  const use = new Map<string, { a: number; b: number; n: number }>();
  const add = (a: number, b: number) => {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    const e = use.get(key); if (e) e.n++; else use.set(key, { a, b, n: 1 });
  };
  for (let i = 0; i < grid.topIdx.length; i += 3) { add(grid.topIdx[i], grid.topIdx[i + 1]); add(grid.topIdx[i + 1], grid.topIdx[i + 2]); add(grid.topIdx[i + 2], grid.topIdx[i]); }
  const pos: number[] = [];
  const P = (arr: Float32Array, k: number) => [arr[k * 3], arr[k * 3 + 1], arr[k * 3 + 2]];
  for (const e of use.values()) {
    if (e.n !== 1) continue;
    const ta = P(grid.topPos, e.a), tb = P(grid.topPos, e.b), ba = P(grid.botPos, e.a), bb = P(grid.botPos, e.b);
    pos.push(...ta, ...ba, ...bb, ...ta, ...bb, ...tb);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** Geometric inlay: deck triangles whose centre passes `test`, +0.7 mm. */
function inlay(grid: Grid, test: (x: number, t: number) => boolean): THREE.BufferGeometry | null {
  const pos: number[] = [];
  for (let i = 0; i < grid.topIdx.length; i += 3) {
    const [a, b, c] = [grid.topIdx[i], grid.topIdx[i + 1], grid.topIdx[i + 2]];
    const cx = (grid.xArr[a] + grid.xArr[b] + grid.xArr[c]) / 3;
    const ct = (grid.tArr[a] + grid.tArr[b] + grid.tArr[c]) / 3;
    if (!test(cx, ct)) continue;
    for (const k of [a, b, c]) pos.push(grid.topPos[k * 3], grid.topPos[k * 3 + 1] + 0.0007, grid.topPos[k * 3 + 2]);
  }
  if (!pos.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** One ski, origin at its centre on the snow, tip toward -z. */
export function createSki(options: SkiOptions = {}): THREE.Group {
  const o: typeof DEFAULTS = { ...DEFAULTS, ...options };
  const grid = buildGrid(o);
  const flat = (color: string, rough = 0.5) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
  const g = new THREE.Group();
  g.name = 'Ski';
  const wall = new THREE.Mesh(sidewall(grid), flat(o.sidewallColor, 0.62));
  wall.material.side = THREE.DoubleSide;
  g.add(wall);
  const top = new THREE.Mesh(surface(grid, 1), flat(o.topsheetColor));
  const base = new THREE.Mesh(surface(grid, -1), flat(o.baseColor, 0.32));
  applySurfaceGradient(top, options.topsheetTailColor);
  applySurfaceGradient(base, options.baseTailColor);
  g.add(top, base);
  const stripe = inlay(grid, (x) => Math.abs(x) < 0.011);
  if (stripe) { const m = new THREE.Mesh(stripe, flat(o.stripeColor)); m.name = 'stripe'; g.add(m); }
  const accents = inlay(grid, (x, t) => (t > 0.07 && t < 0.13 && Math.abs(x) < 0.02) || (t > 0.86 && t < 0.9 && Math.abs(x) < 0.02));
  if (accents) { const m = new THREE.Mesh(accents, flat(o.accentColor)); m.name = 'accents'; g.add(m); }
  g.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = o.castShadow; m.receiveShadow = o.receiveShadow; } });
  g.userData.skiSpec = { length: o.length, tipWidth: o.tipWidth, waistWidth: o.waistWidth, tailWidth: o.tailWidth };
  return g;
}

/** The pair, at the game's stance (each ski RIDER.skiStance out). */
export function createSkis(options: SkiOptions = {}): THREE.Group {
  const pair = new THREE.Group();
  pair.name = 'Skis';
  const l = createSki(options); l.position.x = -RIDER.skiStance; l.name = 'SkiL';
  const r = createSki(options); r.position.x = RIDER.skiStance; r.name = 'SkiR';
  pair.add(l, r);
  return pair;
}

export default createSkis;
