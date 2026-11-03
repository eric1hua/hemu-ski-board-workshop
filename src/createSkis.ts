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
//
// SHAPE (2026-11-03): the outline and the rocker profile are no longer
// hand-fitted curves. They are DATA TABLES pixel-scanned from product
// photos of a real ski in exactly this dimension class — the Blizzard
// Zero G 105, whose 172 cm size measures 132-105-118 (evo product
// photos: base-side plan view for the outline, base-to-base side view
// for the lift profile). Same method, scanner and acceptance as the
// swallowtail board's measured outline: published dimensions anchor
// the scan (waist plateau calibrated to 105/132, tail reads 0.894 =
// 118/132 uncalibrated), and the rendered silhouette is re-scanned
// against the photo before the version ships.

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

// MEASURED OUTLINE — half-width as a fraction of the max half-width,
// pixel-scanned from the Zero G 105 base-side product photo (both skis
// of the pair scanned and averaged, rows binned at 0.005 t near the
// ends). Max width (the shovel) sits at t = 0.075, the waist plateau
// runs t ~ 0.44-0.62, the tail holds ~0.89 until t ~ 0.93 then rounds
// off. One declared deviation: the t=0 station is 0.120, not the
// scanned 0.405 — the photo's first row catches the tip's skin-notch
// edges and shadow; the zoom panel shows a round cap whose first row
// is a sliver, and a 0.405 start renders as a flat-cut tip (the same
// call the board's v32 tip made, with the same disclosure).
const SKI_OUTLINE: Array<[number, number]> = [
  [0.000, 0.120], [0.005, 0.613], [0.010, 0.730], [0.015, 0.804], [0.020, 0.857],
  [0.025, 0.895], [0.030, 0.921], [0.035, 0.940], [0.040, 0.957], [0.045, 0.963],
  [0.050, 0.975], [0.055, 0.985], [0.060, 0.994], [0.065, 0.995], [0.070, 0.999],
  [0.075, 1.000], [0.080, 1.000], [0.100, 0.995], [0.120, 0.982], [0.140, 0.969],
  [0.160, 0.959], [0.180, 0.940], [0.200, 0.924], [0.220, 0.906], [0.240, 0.896],
  [0.260, 0.881], [0.280, 0.864], [0.300, 0.849], [0.320, 0.839], [0.340, 0.830],
  [0.360, 0.823], [0.380, 0.813], [0.400, 0.811], [0.420, 0.803], [0.440, 0.795],
  [0.460, 0.792], [0.480, 0.788], [0.500, 0.789], [0.520, 0.790], [0.540, 0.788],
  [0.560, 0.784], [0.580, 0.784], [0.600, 0.787], [0.620, 0.789], [0.640, 0.794],
  [0.660, 0.794], [0.680, 0.794], [0.700, 0.798], [0.720, 0.805], [0.740, 0.813],
  [0.760, 0.826], [0.780, 0.834], [0.800, 0.843], [0.820, 0.853], [0.840, 0.865],
  [0.860, 0.872], [0.880, 0.882], [0.900, 0.894], [0.920, 0.895], [0.940, 0.890],
  [0.945, 0.881], [0.950, 0.878], [0.955, 0.869], [0.960, 0.854], [0.965, 0.838],
  [0.970, 0.823], [0.975, 0.806], [0.980, 0.772], [0.985, 0.739], [0.990, 0.688],
  [0.995, 0.611], [1.000, 0.448],
];

// MEASURED LIFT — base deviation from the contact plane, read off the
// base-to-base side photo (inner-edge deviation of the pair, scaled to
// the 1.70 m game length). The shovel's rise is a long low early rise
// with the curl concentrated in the last 3% (43 mm at the tip, contact
// at t ~ 0.07); the tail stays flat until t ~ 0.95 and ends 14 mm up.
// Camber is added separately below (the side photo's mid-body reads
// ~4-5 mm, matching the sine the old hand profile used).
const SKI_LIFT: Array<[number, number]> = [
  [0.000, 0.043], [0.010, 0.034], [0.020, 0.025], [0.030, 0.018], [0.050, 0.007],
  [0.070, 0.000], [0.930, 0.000], [0.960, 0.001], [0.980, 0.006], [1.000, 0.014],
];

function tableAt(tab: Array<[number, number]>, t: number): number {
  if (t <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) {
    if (t <= tab[i][0]) {
      const [t1, v1] = tab[i - 1], [t2, v2] = tab[i];
      return v1 + (v2 - v1) * ((t - t1) / (t2 - t1));
    }
  }
  return tab[tab.length - 1][1];
}

/** Row placement warp — the board's ROW_T, reused: rows concentrate at
 *  the two ends where the outline and the lift curve bend. */
const ROW_T: Array<[number, number]> = [
  [0.00, 0.00], [0.14, 0.06], [0.76, 0.88], [1.00, 1.00],
];
function rowT(u: number): number {
  return tableAt(ROW_T, u);
}

/** Column warp — the board's colWarp: columns concentrate toward the
 *  edges, where the thickness roll lives. */
function colWarp(v: number): number {
  return Math.sign(v) * (1 - Math.pow(1 - Math.abs(v), 1.55));
}

function halfWidthAt(t: number, o: typeof DEFAULTS): number {
  return Math.max(0.0015, tableAt(SKI_OUTLINE, t) * (o.tipWidth / 2));
}

function liftAt(t: number): number {
  let y = tableAt(SKI_LIFT, t);
  if (t > 0.25 && t < 0.85) y += 0.004 * Math.sin(Math.PI * (t - 0.25) / 0.6); // camber (measured ~4-5 mm)
  return y;
}

/** Analytic surface normal at (t, s) — the board's deckNormal ported:
 *  normals come from the height field's own gradients, so shading is
 *  not tied to tessellation density. */
function skiNormal(o: typeof DEFAULTS, t: number, s: number, side: 1 | -1, out: THREE.Vector3): void {
  const P = (tt: number, ss: number): [number, number, number] => {
    const tc = Math.min(1, Math.max(0, tt));
    const half = (o.thickness / 2) * thicknessFactor(tc, Math.abs(ss));
    return [ss * halfWidthAt(tc, o), liftAt(tc) + side * (half + 0.0004), tc * o.length - o.length / 2];
  };
  const et = 0.0015, es = 0.01;
  const [tx1, ty1, tz1] = P(t + et, s), [tx0, ty0, tz0] = P(t - et, s);
  const [sx1, sy1, sz1] = P(t, s + es), [sx0, sy0, sz0] = P(t, s - es);
  const dT = [tx1 - tx0, ty1 - ty0, tz1 - tz0];
  const dS = [sx1 - sx0, sy1 - sy0, sz1 - sz0];
  out.set(
    dS[1] * dT[2] - dS[2] * dT[1],
    dS[2] * dT[0] - dS[0] * dT[2],
    dS[0] * dT[1] - dS[1] * dT[0],
  );
  if (out.y * side < 0) out.negate();
  out.normalize();
}

function thicknessFactor(t: number, sAbs: number): number {
  const ends = (0.5 + 0.5 * THREE.MathUtils.smoothstep(t, 0.0, 0.08)) * (1 - 0.35 * THREE.MathUtils.smoothstep(t, 0.94, 1.0));
  const edge = 1 - 0.35 * THREE.MathUtils.smoothstep(sAbs, 0.75, 1.0);
  return ends * edge;
}

interface Grid { topPos: Float32Array; botPos: Float32Array; topN: Float32Array; botN: Float32Array; xArr: Float32Array; tArr: Float32Array; topIdx: number[] }

function buildGrid(o: typeof DEFAULTS): Grid {
  const [NL, NC] = o.segments;
  const count = (NL + 1) * (NC + 1);
  const topPos = new Float32Array(count * 3), botPos = new Float32Array(count * 3);
  const topN = new Float32Array(count * 3), botN = new Float32Array(count * 3);
  const xArr = new Float32Array(count), tArr = new Float32Array(count), sArr = new Float32Array(count);
  const cols: number[] = [];
  for (let j = 0; j <= NC; j++) cols.push(colWarp(j / NC * 2 - 1));
  for (let i = 0; i <= NL; i++) {
    const t = rowT(i / NL), hw = halfWidthAt(t, o);
    for (let j = 0; j <= NC; j++) {
      const k = i * (NC + 1) + j, s = cols[j], x = s * hw;
      const half = (o.thickness / 2) * thicknessFactor(t, Math.abs(s));
      const ym = liftAt(t), z = t * o.length - o.length / 2;
      topPos.set([x, ym + half + 0.0004, z], k * 3);
      botPos.set([x, ym - half - 0.0004, z], k * 3);
      xArr[k] = x; tArr[k] = t; sArr[k] = s;
    }
  }
  const n = new THREE.Vector3();
  for (let k = 0; k < count; k++) {
    skiNormal(o, tArr[k], sArr[k], 1, n);
    topN.set([n.x, n.y, n.z], k * 3);
    skiNormal(o, tArr[k], sArr[k], -1, n);
    botN.set([n.x, n.y, n.z], k * 3);
  }
  const topIdx: number[] = [], row = NC + 1;
  for (let i = 0; i < NL; i++) for (let j = 0; j < NC; j++) {
    const a = i * row + j, b = a + 1, c = a + row, d = c + 1;
    topIdx.push(a, c, b, b, c, d);
  }
  return { topPos, botPos, topN, botN, xArr, tArr, topIdx };
}

function surface(grid: Grid, side: 1 | -1): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(side > 0 ? grid.topPos.slice() : grid.botPos.slice(), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(side > 0 ? grid.topN.slice() : grid.botN.slice(), 3));
  if (side > 0) g.setIndex(grid.topIdx);
  else {
    const idx: number[] = [];
    for (let i = 0; i < grid.topIdx.length; i += 3) idx.push(grid.topIdx[i], grid.topIdx[i + 2], grid.topIdx[i + 1]);
    g.setIndex(idx);
  }
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

/** Geometric inlay: deck triangles whose centre passes `test`, +0.7 mm.
 *  Carries the deck's analytic normals, like the board's pattern layers. */
function inlay(grid: Grid, test: (x: number, t: number) => boolean): THREE.BufferGeometry | null {
  const pos: number[] = [];
  const nor: number[] = [];
  for (let i = 0; i < grid.topIdx.length; i += 3) {
    const [a, b, c] = [grid.topIdx[i], grid.topIdx[i + 1], grid.topIdx[i + 2]];
    const cx = (grid.xArr[a] + grid.xArr[b] + grid.xArr[c]) / 3;
    const ct = (grid.tArr[a] + grid.tArr[b] + grid.tArr[c]) / 3;
    if (!test(cx, ct)) continue;
    for (const k of [a, b, c]) {
      pos.push(grid.topPos[k * 3], grid.topPos[k * 3 + 1] + 0.0007, grid.topPos[k * 3 + 2]);
      nor.push(grid.topN[k * 3], grid.topN[k * 3 + 1], grid.topN[k * 3 + 2]);
    }
  }
  if (!pos.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}

/** The centre stripe as a dedicated strip hugging the deck — the board
 *  factory's lesson: a lengthwise band tessellated from the grid
 *  feathers badly where the tip bends, so its vertices sit exactly on
 *  the band edges, one pair per (warped) grid row. */
function stripeGeometry(o: typeof DEFAULTS, halfW: number): THREE.BufferGeometry | null {
  const NL = o.segments[0];
  const pos: number[] = [];
  const nor: number[] = [];
  const nVec = new THREE.Vector3();
  const surfY = (x: number, t: number) => {
    const hw = Math.max(halfWidthAt(t, o), 1e-4);
    return liftAt(t) + (o.thickness / 2) * thicknessFactor(t, Math.abs(x) / hw) + 0.0011;
  };
  const surfN = (x: number, t: number): number[] => {
    const hw = Math.max(halfWidthAt(t, o), 1e-4);
    skiNormal(o, t, x / hw, 1, nVec);
    return [nVec.x, nVec.y, nVec.z];
  };
  let prev: { p: number[]; n: number[] }[] | null = null;
  for (let i = 0; i <= NL; i++) {
    const t = rowT(i / NL);
    const hw = halfWidthAt(t, o);
    const xa = Math.max(-halfW, -hw + 0.003), xb = Math.min(halfW, hw - 0.003);
    if (xb - xa < 0.002) { prev = null; continue; }
    const z = t * o.length - o.length / 2;
    const cur = [
      { p: [xa, surfY(xa, t), z], n: surfN(xa, t) },
      { p: [xb, surfY(xb, t), z], n: surfN(xb, t) },
    ];
    if (prev) {
      const quad = [prev[0], cur[0], prev[1], prev[1], cur[0], cur[1]];
      for (const e of quad) { pos.push(...e.p); nor.push(...e.n); }
    }
    prev = cur;
  }
  if (!pos.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
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
  const stripeG = stripeGeometry(o, 0.011);
  if (stripeG) { const m = new THREE.Mesh(stripeG, flat(o.stripeColor)); m.name = 'stripe'; g.add(m); }
  // Accents flank the centre stripe instead of straddling it: two
  // overlapping inlay layers at near-equal heights tear through each
  // other on the bends (seen at the tip once the stripe became a strip).
  const accents = inlay(grid, (x, t) => ((t > 0.07 && t < 0.13) || (t > 0.86 && t < 0.9)) && Math.abs(x) > 0.0125 && Math.abs(x) < 0.021);
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
