// Swallowtail powder snowboard — procedural Three.js factory function.
//
// Built following the img2threejs route (reference -> spec -> code), with the
// structural rules settled with the user (2026-11-03):
//
//   - Board length is FIXED: the game's riders have a fixed height
//     (bodies sized alike by trunk), board = height - 0.10. Anchor chosen
//     by the user 2026-11-03 (option A): the female rider, 1.80 - 0.10 =
//     1.70 m. See GAME_BOARD_LENGTH. Shape variants differ in width /
//     notch / rocker only, never in length.
//   - NO TEXTURES, anywhere. Every surface is a flat colour, and a board's
//     graphic is ABSTRACT GEOMETRY: thin pattern layers tessellated from the
//     same grid as the deck, floating 0.7 mm above it in a contrasting flat
//     colour (the way rider-skis.js already stripes its skis with geometry).
//     Changing a colourway = changing colour constants + picking a pattern
//     name. Texture memory is exactly zero; a new design costs one small
//     pattern layer of triangles.
//   - Layers: topsheet (flat colour) + optional pattern layers + a dark
//     detail layer (binding inserts and a waist mark, as geometry), a flat
//     base underneath (its own optional pattern), and a dark sidewall wall
//     joining the skins. All of it is built from ONE bent grid, so layers
//     can never poke through each other where the rocker bends.
//
// Frame: origin at board centre, +y up, nose toward -z, tail (swallowtail)
// toward +z. Units are metres. Only dependency: three.

import * as THREE from 'three';

export type BoardPattern = 'none' | 'lengthStripes' | 'diagonal' | 'chevrons' | 'split' | 'blocks';

export interface SwallowtailBoardOptions {
  /** Board length, m. Default GAME_BOARD_LENGTH (1.70) — fixed by the game's
   *  rider height; override only for lab comparisons. */
  length?: number;
  /** Max width (at t=0.18 of the measured outline), m. Default 0.352.
   *  The outline is a measured table (see OUTLINE); waistWidth and
   *  tailWidth below are informational, read off the same table. */
  noseWidth?: number;
  /** Waist (narrowest) width, m. Default 0.293. */
  waistWidth?: number;
  /** Width just before the swallowtail split, m. Default 0.308. */
  tailWidth?: number;
  /** Core thickness at the waist, m. Default 0.009. */
  thickness?: number;
  /** Swallowtail notch depth from the tail end, m. Default 0.21 (~13% of length, measured). */
  notchDepth?: number;
  /** Topsheet flat colour. Default '#f2f2f0' (the reference's white). */
  topsheetColor?: string;
  /** Abstract geometric pattern printed — as geometry — on the topsheet. */
  pattern?: BoardPattern;
  /** Pattern colour (main). Default red '#d82f2a'. */
  patternColor?: string;
  /** Pattern colour (secondary, where the pattern has one). Default '#17171a'. */
  patternColor2?: string;
  /** Base flat colour. Default '#d82f2a' (sampled from the reference photo). */
  baseColor?: string;
  /** Optional geometric pattern on the base, same vocabulary as `pattern`. */
  basePattern?: BoardPattern;
  /** Base pattern colour. Default '#f2f2f0'. */
  basePatternColor?: string;
  /** Sidewall / core colour. Default near-black '#232327'. */
  sidewallColor?: string;
  /** Include the geometric detail layer: binding insert packs + waist mark. Default true. */
  inserts?: boolean;
  /** Grid resolution [lengthSegments, acrossSegments]. Default [220, 44]
   *  (lab quality). A game build wants ~[96, 20]: same silhouette, ~1/5 the
   *  triangles — the rocker curve does not need lab density. */
  segments?: [number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/** The game's riders are sized alike (their bodies share one trunk length,
 *  0.591 m; the female specs 1.80 m overall, the male ~1.87 m including
 *  hair). Board length follows the rider, not a sizing chart:
 *  board = height - 0.10 m, anchored on the female rider (user decision,
 *  2026-11-03): 1.80 - 0.10 = 1.70 m, one fixed length for every board. */
export const GAME_BOARD_LENGTH = 1.7;

const DEFAULTS: Required<SwallowtailBoardOptions> = {
  length: GAME_BOARD_LENGTH,
  noseWidth: 0.478,
  waistWidth: 0.398,
  tailWidth: 0.418,
  thickness: 0.009,
  notchDepth: 0.22,
  topsheetColor: '#f2f2f0',
  pattern: 'none',
  patternColor: '#d82f2a',
  patternColor2: '#17171a',
  baseColor: '#d82f2a',
  basePattern: 'none',
  basePatternColor: '#f2f2f0',
  sidewallColor: '#232327',
  inserts: true,
  segments: [220, 44],
  castShadow: true,
  receiveShadow: true,
};

// ---------------------------------------------------------------------------
// Shape profile. t = 0 at the nose tip, 1 at the tail end.
// Half-width control points are anchored on the three width options.
// WIDTH RULE (user, 2026-11-03, CORRECTED at v31): use the RED reference
// board's own proportions AS THEY MEASURE IN THE USER'S IMAGE. A fresh
// pixel scan of that image (red bbox 865 px long x 243 px max width)
// gives aspect length/maxWidth = 3.56, so at the game's 1.70 m the widths
// are 478 / 398 / 418. The 4.83 aspect used in v29-v30 could NOT be
// reproduced from the image (it would need a 1174 px length inside an
// 880 px tall file) and left the board 26% too narrow; the normalised
// OUTLINE/NOTCH_GAP profiles were verified correct and are unchanged.
// Her boots (0.412 long, projecting ~0.45 across) overhang the stance
// widths (~0.40) by ~2.5 cm a side — the user picked this image's shape
// over containment, and said to ignore boot overhang for this pass.
// ---------------------------------------------------------------------------

// MEASURED OUTLINE — the user ordered the red reference board's shape
// copied exactly (2026-11-03: "一定要和红色板子样子一样"). Both tables are
// pixel-scanned from that product photo (red base board, rows averaged,
// fractions of the max half-width; max at t=0.18). They are data, not
// interpretation: do not "correct" the tail values for the photo's
// perspective — the user picked this image's shape as-is.
const OUTLINE: Array<[number, number]> = [
  [0.00, 0.102], [0.02, 0.380], [0.04, 0.563], [0.06, 0.694], [0.08, 0.793],
  [0.10, 0.876], [0.12, 0.934], [0.14, 0.969], [0.16, 0.990], [0.18, 1.000],
  [0.20, 0.993], [0.22, 0.988], [0.24, 0.983], [0.26, 0.964], [0.28, 0.956],
  [0.30, 0.938], [0.32, 0.930], [0.34, 0.913], [0.36, 0.903], [0.38, 0.889],
  [0.40, 0.880], [0.42, 0.870], [0.44, 0.864], [0.46, 0.855], [0.48, 0.849],
  [0.50, 0.840], [0.52, 0.841], [0.54, 0.834], [0.56, 0.830], [0.58, 0.830],
  [0.60, 0.828], [0.62, 0.830], [0.64, 0.830], [0.66, 0.830], [0.68, 0.830],
  [0.70, 0.830], [0.72, 0.834], [0.74, 0.835], [0.76, 0.846], [0.78, 0.851],
  [0.80, 0.851], [0.82, 0.859], [0.84, 0.870], [0.86, 0.876], [0.88, 0.881],
  [0.90, 0.896], [0.92, 0.900], [0.94, 0.909], [0.96, 0.915], [0.98, 0.771],
  [1.00, 0.508],
];
const NOTCH_GAP: Array<[number, number]> = [
  [0.86, 0.000], [0.88, 0.072], [0.90, 0.148], [0.92, 0.216], [0.94, 0.278],
  [0.96, 0.334], [0.98, 0.385], [1.00, 0.448],
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

function halfWidthAt(t: number, o: typeof DEFAULTS): number {
  return Math.max(0.0015, tableAt(OUTLINE, t) * (o.noseWidth / 2));
}

/** Centre-line height (rocker + camber), m above the resting plane. */
function liftAt(t: number): number {
  let y = 0;
  if (t < 0.32) { const u = (0.32 - t) / 0.32; y += 0.055 * u * u; }        // long powder nose rocker
  if (t > 0.30 && t < 0.88) y += 0.006 * Math.sin(Math.PI * (t - 0.30) / 0.58); // gentle camber
  if (t > 0.90) { const u = (t - 0.90) / 0.10; y += 0.010 * u * u; }          // slight tail kick on the prongs
  return y;
}

/** Thickness factor: full at the waist, tapered toward tips and side edges. */
function thicknessFactor(t: number, sAbs: number): number {
  const nose = 0.55 + 0.45 * THREE.MathUtils.smoothstep(t, 0.0, 0.09);
  const tail = 1 - 0.3 * THREE.MathUtils.smoothstep(t, 0.94, 1.0);
  const edge = 1 - 0.38 * THREE.MathUtils.smoothstep(sAbs, 0.78, 1.0);
  return nose * tail * edge;
}

/** Half-width of the swallowtail notch gap at station t — from the same
 *  measured scan (NOTCH_GAP table, fractions of the max half-width). */
function notchHalfAt(t: number, o: typeof DEFAULTS): number {
  return tableAt(NOTCH_GAP, t) * (o.noseWidth / 2);
}

// ---------------------------------------------------------------------------
// Abstract geometric patterns. A pattern is a region test in board space
// (x = metres across the centre line, t = 0 nose .. 1 tail). The pattern
// layer is tessellated from the deck grid: every deck triangle whose centre
// passes the test is re-emitted 0.7 mm above the deck in a flat colour.
// No textures, no UVs — the pattern IS geometry.
// ---------------------------------------------------------------------------

type RegionTest = (x: number, t: number) => boolean;

interface PatternLayer {
  color: string;
  test?: RegionTest;
  /** A lengthwise stripe [x0, x1] in metres: built as a dedicated strip
   *  (below), NOT by grid tessellation — a stripe boundary running along the
   *  grid's diagonal triangle split feathers badly at any sane resolution. */
  strip?: [number, number];
}

function patternLayers(kind: BoardPattern, o: typeof DEFAULTS, forBase: boolean): PatternLayer[] {
  const c1 = forBase ? o.basePatternColor : o.patternColor;
  const c2 = o.patternColor2;
  switch (kind) {
    case 'lengthStripes':
      return [
        { color: c1, strip: [-0.030, 0.030] },
        { color: c1, strip: [0.047, 0.057] },
        { color: c1, strip: [-0.057, -0.047] },
      ];
    case 'diagonal': {
      const band = (x: number, t: number) => {
        const p = (t * 5.0 + x * 2.4) % 1;
        return (p < 0 ? p + 1 : p) < 0.38;
      };
      return [{ color: c1, test: band }];
    }
    case 'chevrons': {
      const band = (x: number, t: number) => {
        const p = (t * 6.0 - Math.abs(x) * 1.5) % 1;
        return (p < 0 ? p + 1 : p) < 0.30;
      };
      return [{ color: c1, test: band }];
    }
    case 'split':
      return [
        { color: c1, test: (_x, t) => t < 0.26 },
        { color: c2, test: (_x, t) => t > 0.865 },
      ];
    case 'blocks': {
      const chk = (x: number, t: number) =>
        t > 0.15 && t < 0.9 && ((Math.floor(t * 9) + Math.floor((x + 0.17) / 0.085)) % 2 === 0);
      return [{ color: c1, test: chk }];
    }
    default:
      return [];
  }
}

/** The dark detail layer as REAL small geometry (the grid-tessellation used
 *  for big pattern regions is far too coarse for 5 mm insert dots — an early
 *  build rendered them as slivers). Binding insert packs (setback stance,
 *  centres at t=0.42 / 0.74, 2 columns x 5 rows) are flat discs; the waist
 *  mark is three thin bars. All merged into one geometry. */
function detailGeometry(o: typeof DEFAULTS): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const surfaceY = (x: number, t: number) =>
    liftAt(t) + (o.thickness / 2) * thicknessFactor(t, Math.abs(x) / Math.max(halfWidthAt(t, o), 1e-4)) + 0.0012;
  const addFlat = (g: THREE.BufferGeometry, x: number, t: number) => {
    g.rotateX(-Math.PI / 2);
    g.translate(x, surfaceY(x, t), t * o.length - o.length / 2);
    parts.push(g.toNonIndexed());
  };
  for (const tc of [0.42, 0.74]) {
    for (const dx of [-0.032, 0.032]) {
      for (let r = -2; r <= 2; r++) {
        addFlat(new THREE.CircleGeometry(0.005, 14), dx, tc + (r * 0.036) / o.length);
      }
    }
  }
  for (const b of [0.545, 0.565, 0.585]) addFlat(new THREE.PlaneGeometry(0.034, 0.0075), -0.10, b);
  let total = 0;
  for (const p of parts) total += p.attributes.position.count;
  const pos = new Float32Array(total * 3);
  let off = 0;
  for (const p of parts) {
    pos.set(p.attributes.position.array as Float32Array, off * 3);
    off += p.attributes.position.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------
// Geometry: one bent grid -> topsheet, base, sidewall, pattern layers.
// ---------------------------------------------------------------------------

interface BoardGrid {
  topPos: Float32Array;
  botPos: Float32Array;
  xArr: Float32Array;
  tArr: Float32Array;
  topIdx: number[];
  count: number;
}

function buildGrid(o: typeof DEFAULTS): BoardGrid {
  const [NL, NC] = o.segments;
  const count = (NL + 1) * (NC + 1);
  const topPos = new Float32Array(count * 3);
  const botPos = new Float32Array(count * 3);
  const xArr = new Float32Array(count);
  const tArr = new Float32Array(count);
  const valid: boolean[] = new Array(count).fill(false);
  for (let i = 0; i <= NL; i++) {
    const t = i / NL;
    const hw = halfWidthAt(t, o);
    const nh = notchHalfAt(t, o);
    for (let j = 0; j <= NC; j++) {
      const k = i * (NC + 1) + j;
      const s = j / NC * 2 - 1;
      let x = s * hw;
      let ok = Math.abs(x) >= nh - 1e-9;
      if (ok && nh > 0) {
        // project the innermost surviving vertex of each prong onto the notch line
        const step = 2 * hw / NC;
        if (Math.abs(x) - nh < step) x = Math.sign(x) * nh;
      }
      const half = (o.thickness / 2) * thicknessFactor(t, Math.abs(s));
      const yMid = liftAt(t);
      const z = t * o.length - o.length / 2;
      topPos.set([x, yMid + half + 0.0004, z], k * 3);
      botPos.set([x, yMid - half - 0.0004, z], k * 3);
      xArr[k] = x; tArr[k] = t;
      valid[k] = ok;
    }
  }
  const topIdx: number[] = [];
  const row = NC + 1;
  for (let i = 0; i < NL; i++) {
    for (let j = 0; j < NC; j++) {
      const a = i * row + j, b = a + 1, c = a + row, d = c + 1;
      const va = valid[a], vb = valid[b], vc = valid[c], vd = valid[d];
      if (va && vb && vc && vd) { topIdx.push(a, c, b, b, c, d); continue; }
      // Three valid corners (on the notch diagonal): keep the single fitting
      // triangle instead of culling the whole quad, which halves the step.
      if (!va && vb && vc && vd) topIdx.push(b, c, d);
      else if (va && !vb && vc && vd) topIdx.push(a, c, d);
      else if (va && vb && !vc && vd) topIdx.push(a, d, b);
      else if (va && vb && vc && !vd) topIdx.push(a, c, b);
    }
  }
  return { topPos, botPos, xArr, tArr, topIdx, count };
}

function surfaceGeometry(grid: BoardGrid, side: 1 | -1): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(side > 0 ? grid.topPos.slice() : grid.botPos.slice(), 3));
  if (side > 0) {
    g.setIndex(grid.topIdx);
  } else {
    const idx: number[] = [];
    for (let i = 0; i < grid.topIdx.length; i += 3) idx.push(grid.topIdx[i], grid.topIdx[i + 2], grid.topIdx[i + 1]);
    g.setIndex(idx);
  }
  g.computeVertexNormals();
  return g;
}

/** A flat-colour pattern layer: the subset of deck triangles whose centre
 *  passes `test`, lifted 0.7 mm off the deck so it reads as an inlay. */
function patternGeometry(grid: BoardGrid, side: 1 | -1, test: RegionTest): THREE.BufferGeometry | null {
  const src = side > 0 ? grid.topPos : grid.botPos;
  const pos: number[] = [];
  const lift = side * 0.0007;
  for (let i = 0; i < grid.topIdx.length; i += 3) {
    const [a, b, c] = [grid.topIdx[i], grid.topIdx[i + 1], grid.topIdx[i + 2]];
    const cx = (grid.xArr[a] + grid.xArr[b] + grid.xArr[c]) / 3;
    const ct = (grid.tArr[a] + grid.tArr[b] + grid.tArr[c]) / 3;
    if (!test(cx, ct)) continue;
    const order = side > 0 ? [a, b, c] : [a, c, b];
    for (const k of order) pos.push(src[k * 3], src[k * 3 + 1] + lift, src[k * 3 + 2]);
  }
  if (pos.length === 0) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** A lengthwise stripe as a clean quad strip hugging the deck: vertices sit
 *  exactly on the stripe's x edges (clamped inside the outline near the
 *  tips), so its edges are ruler-straight at any grid resolution. */
function stripGeometry(o: typeof DEFAULTS, side: 1 | -1, x0: number, x1: number): THREE.BufferGeometry | null {
  const NL = o.segments[0];
  const pos: number[] = [];
  const surfY = (x: number, t: number) => {
    const hw = Math.max(halfWidthAt(t, o), 1e-4);
    return liftAt(t) + side * ((o.thickness / 2) * thicknessFactor(t, Math.abs(x) / hw) + 0.0011);
  };
  // Per row the stripe band [x0, x1] is clipped by the outline, and by the
  // swallowtail notch gap (-nh, nh) once it opens: a band crossing the gap
  // continues as two prong bands ('left' / 'right'), a band inside the gap
  // ends. Runs connect only within the same segment key.
  let prev = new Map<string, [number[], number[]]>();
  for (let i = 0; i <= NL; i++) {
    const t = i / NL;
    const hw = halfWidthAt(t, o);
    const nh = notchHalfAt(t, o);
    const xa = Math.max(x0, -hw + 0.003), xb = Math.min(x1, hw - 0.003);
    const segs = new Map<string, [number, number]>();
    if (xb - xa >= 0.002) {
      if (nh <= 0 || xb <= -nh || xa >= nh) segs.set('full', [xa, xb]);
      else {
        if (-nh - xa >= 0.002) segs.set('left', [xa, -nh]);
        if (xb - nh >= 0.002) segs.set('right', [nh, xb]);
      }
    }
    const z = t * o.length - o.length / 2;
    const next = new Map<string, [number[], number[]]>();
    for (const [key, [sx0, sx1]] of segs) {
      const L: number[] = [sx0, surfY(sx0, t), z], R: number[] = [sx1, surfY(sx1, t), z];
      const p = prev.get(key);
      if (p) {
        const [pL, pR] = p;
        if (side > 0) pos.push(...pL, ...L, ...pR, ...pR, ...L, ...R);
        else pos.push(...pL, ...pR, ...L, ...pR, ...R, ...L);
      }
      next.set(key, [L, R]);
    }
    prev = next;
  }
  if (pos.length === 0) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** Sidewall: quads along every boundary edge of the top grid (outer outline
 *  and the swallowtail notch), joining the top and bottom skins. */
function sidewallGeometry(grid: BoardGrid): THREE.BufferGeometry {
  const edgeUse = new Map<string, { a: number; b: number; n: number }>();
  const addEdge = (a: number, b: number) => {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    const e = edgeUse.get(key);
    if (e) e.n++; else edgeUse.set(key, { a, b, n: 1 });
  };
  for (let i = 0; i < grid.topIdx.length; i += 3) {
    addEdge(grid.topIdx[i], grid.topIdx[i + 1]);
    addEdge(grid.topIdx[i + 1], grid.topIdx[i + 2]);
    addEdge(grid.topIdx[i + 2], grid.topIdx[i]);
  }
  const pos: number[] = [];
  const P = (arr: Float32Array, k: number) => [arr[k * 3], arr[k * 3 + 1], arr[k * 3 + 2]];
  for (const e of edgeUse.values()) {
    if (e.n !== 1) continue;
    const ta = P(grid.topPos, e.a), tb = P(grid.topPos, e.b);
    const ba = P(grid.botPos, e.a), bb = P(grid.botPos, e.b);
    pos.push(...ta, ...ba, ...bb, ...ta, ...bb, ...tb);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createSwallowtailBoard(options: SwallowtailBoardOptions = {}): THREE.Group {
  const o: typeof DEFAULTS = { ...DEFAULTS, ...options };
  const group = new THREE.Group();
  group.name = 'SwallowtailBoard';
  const grid = buildGrid(o);
  const flat = (color: string, roughness: number) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.0 });

  const core = new THREE.Mesh(sidewallGeometry(grid), flat(o.sidewallColor, 0.62));
  core.material.side = THREE.DoubleSide;
  core.name = 'core-sidewall';
  group.add(core);

  const top = new THREE.Mesh(surfaceGeometry(grid, 1), flat(o.topsheetColor, 0.5));
  top.name = 'topsheet';
  group.add(top);

  const base = new THREE.Mesh(surfaceGeometry(grid, -1), flat(o.baseColor, 0.32));
  base.name = 'base';
  group.add(base);

  // Abstract geometric graphics — geometry layers, never textures.
  const addLayers = (kind: BoardPattern, forBase: boolean, side: 1 | -1, rough: number) => {
    for (const layer of patternLayers(kind, o, forBase)) {
      const g = layer.strip
        ? stripGeometry(o, side, layer.strip[0], layer.strip[1])
        : patternGeometry(grid, side, layer.test!);
      if (g) { const m = new THREE.Mesh(g, flat(layer.color, rough)); m.name = forBase ? 'pattern-base' : 'pattern-top'; group.add(m); }
    }
  };
  addLayers(o.pattern, false, 1, 0.5);
  addLayers(o.basePattern, true, -1, 0.32);
  if (o.inserts) {
    const m = new THREE.Mesh(detailGeometry(o), flat('#17171a', 0.55));
    m.name = 'detail-inserts';
    group.add(m);
  }

  group.traverse((m) => {
    if ((m as THREE.Mesh).isMesh) {
      m.castShadow = o.castShadow;
      m.receiveShadow = o.receiveShadow;
    }
  });
  group.userData.boardSpec = {
    length: o.length, noseWidth: o.noseWidth, waistWidth: o.waistWidth,
    tailWidth: o.tailWidth, notchDepth: o.notchDepth, thickness: o.thickness,
    pattern: o.pattern, textures: 0,
  };
  return group;
}

export default createSwallowtailBoard;
