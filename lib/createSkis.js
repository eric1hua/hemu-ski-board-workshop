// src/createSkis.ts
import * as THREE from "three";

// src/riderSpec.ts
var RIDER = {
  /** Hips->Head trunk length both riders share, m. */
  trunk: 0.591,
  /** Snowboard boot outer size, m: [width, height, length]. */
  boardBoot: { width: 0.17, height: 0.17, length: 0.33 },
  /** Snowboard stance: distance between foot centres, m. */
  boardStance: 0.52,
  /** Ski boot sole length, m (0.17 each way from binding centre). */
  skiBootSole: 0.34,
  /** Ski boot sole height above the ski (binding stack), m. */
  skiStack: 0.035,
  /** Each ski sits this far out from the body's middle, m. */
  skiStance: 0.125
};
var SKI_LENGTH = 1.7;

// src/createSkis.ts
var DEFAULTS = {
  length: SKI_LENGTH,
  tipWidth: 0.132,
  waistWidth: 0.105,
  tailWidth: 0.118,
  thickness: 0.011,
  topsheetColor: "#2f5d8a",
  stripeColor: "#b9d4ee",
  accentColor: "#f2a7b9",
  baseColor: "#1f2a44",
  sidewallColor: "#232327",
  segments: [140, 18],
  castShadow: true,
  receiveShadow: true
};
function halfWidthAt(t, o) {
  const tip = o.tipWidth / 2, w = o.waistWidth / 2, tl = o.tailWidth / 2;
  const pts = [
    [0, 4e-3],
    [0.04, tip * 0.62],
    [0.09, tip * 0.97],
    [0.13, tip],
    [0.25, w + (tip - w) * 0.42],
    [0.5, w],
    [0.72, w + (tl - w) * 0.3],
    [0.9, tl * 0.98],
    [1, tl]
  ];
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t1, w1] = pts[i - 1], [t2, w2] = pts[i];
      const p0 = pts[Math.max(0, i - 2)], p3 = pts[Math.min(pts.length - 1, i + 1)];
      const u = (t - t1) / (t2 - t1);
      const v = 0.5 * (2 * w1 + (-p0[1] + w2) * u + (2 * p0[1] - 5 * w1 + 4 * w2 - p3[1]) * u * u + (-p0[1] + 3 * w1 - 3 * w2 + p3[1]) * u * u * u);
      return Math.max(2e-3, v);
    }
  }
  return tl;
}
function liftAt(t) {
  let y = 0;
  if (t < 0.17) {
    const u = (0.17 - t) / 0.17;
    y += 0.075 * u * u;
  }
  if (t > 0.25 && t < 0.85) y += 4e-3 * Math.sin(Math.PI * (t - 0.25) / 0.6);
  if (t > 0.93) {
    const u = (t - 0.93) / 0.07;
    y += 0.018 * u * u;
  }
  return y;
}
function thicknessFactor(t, sAbs) {
  const ends = (0.5 + 0.5 * THREE.MathUtils.smoothstep(t, 0, 0.08)) * (1 - 0.35 * THREE.MathUtils.smoothstep(t, 0.94, 1));
  const edge = 1 - 0.35 * THREE.MathUtils.smoothstep(sAbs, 0.75, 1);
  return ends * edge;
}
function buildGrid(o) {
  const [NL, NC] = o.segments;
  const count = (NL + 1) * (NC + 1);
  const topPos = new Float32Array(count * 3), botPos = new Float32Array(count * 3);
  const xArr = new Float32Array(count), tArr = new Float32Array(count);
  for (let i = 0; i <= NL; i++) {
    const t = i / NL, hw = halfWidthAt(t, o);
    for (let j = 0; j <= NC; j++) {
      const k = i * (NC + 1) + j, s = j / NC * 2 - 1, x = s * hw;
      const half = o.thickness / 2 * thicknessFactor(t, Math.abs(s));
      const ym = liftAt(t), z = t * o.length - o.length / 2;
      topPos.set([x, ym + half + 4e-4, z], k * 3);
      botPos.set([x, ym - half - 4e-4, z], k * 3);
      xArr[k] = x;
      tArr[k] = t;
    }
  }
  const topIdx = [], row = NC + 1;
  for (let i = 0; i < NL; i++) for (let j = 0; j < NC; j++) {
    const a = i * row + j, b = a + 1, c = a + row, d = c + 1;
    topIdx.push(a, c, b, b, c, d);
  }
  return { topPos, botPos, xArr, tArr, topIdx };
}
function surface(grid, side) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(side > 0 ? grid.topPos.slice() : grid.botPos.slice(), 3));
  if (side > 0) g.setIndex(grid.topIdx);
  else {
    const idx = [];
    for (let i = 0; i < grid.topIdx.length; i += 3) idx.push(grid.topIdx[i], grid.topIdx[i + 2], grid.topIdx[i + 1]);
    g.setIndex(idx);
  }
  g.computeVertexNormals();
  return g;
}
function sidewall(grid) {
  const use = /* @__PURE__ */ new Map();
  const add = (a, b) => {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    const e = use.get(key);
    if (e) e.n++;
    else use.set(key, { a, b, n: 1 });
  };
  for (let i = 0; i < grid.topIdx.length; i += 3) {
    add(grid.topIdx[i], grid.topIdx[i + 1]);
    add(grid.topIdx[i + 1], grid.topIdx[i + 2]);
    add(grid.topIdx[i + 2], grid.topIdx[i]);
  }
  const pos = [];
  const P = (arr, k) => [arr[k * 3], arr[k * 3 + 1], arr[k * 3 + 2]];
  for (const e of use.values()) {
    if (e.n !== 1) continue;
    const ta = P(grid.topPos, e.a), tb = P(grid.topPos, e.b), ba = P(grid.botPos, e.a), bb = P(grid.botPos, e.b);
    pos.push(...ta, ...ba, ...bb, ...ta, ...bb, ...tb);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function inlay(grid, test) {
  const pos = [];
  for (let i = 0; i < grid.topIdx.length; i += 3) {
    const [a, b, c] = [grid.topIdx[i], grid.topIdx[i + 1], grid.topIdx[i + 2]];
    const cx = (grid.xArr[a] + grid.xArr[b] + grid.xArr[c]) / 3;
    const ct = (grid.tArr[a] + grid.tArr[b] + grid.tArr[c]) / 3;
    if (!test(cx, ct)) continue;
    for (const k of [a, b, c]) pos.push(grid.topPos[k * 3], grid.topPos[k * 3 + 1] + 7e-4, grid.topPos[k * 3 + 2]);
  }
  if (!pos.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function createSki(options = {}) {
  const o = { ...DEFAULTS, ...options };
  const grid = buildGrid(o);
  const flat = (color, rough = 0.5) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
  const g = new THREE.Group();
  g.name = "Ski";
  const wall = new THREE.Mesh(sidewall(grid), flat(o.sidewallColor, 0.62));
  wall.material.side = THREE.DoubleSide;
  g.add(wall);
  g.add(new THREE.Mesh(surface(grid, 1), flat(o.topsheetColor)));
  g.add(new THREE.Mesh(surface(grid, -1), flat(o.baseColor, 0.32)));
  const stripe = inlay(grid, (x) => Math.abs(x) < 0.011);
  if (stripe) {
    const m = new THREE.Mesh(stripe, flat(o.stripeColor));
    m.name = "stripe";
    g.add(m);
  }
  const accents = inlay(grid, (x, t) => t > 0.07 && t < 0.13 && Math.abs(x) < 0.02 || t > 0.86 && t < 0.9 && Math.abs(x) < 0.02);
  if (accents) {
    const m = new THREE.Mesh(accents, flat(o.accentColor));
    m.name = "accents";
    g.add(m);
  }
  g.traverse((m) => {
    if (m.isMesh) {
      m.castShadow = o.castShadow;
      m.receiveShadow = o.receiveShadow;
    }
  });
  g.userData.skiSpec = { length: o.length, tipWidth: o.tipWidth, waistWidth: o.waistWidth, tailWidth: o.tailWidth };
  return g;
}
function createSkis(options = {}) {
  const pair = new THREE.Group();
  pair.name = "Skis";
  const l = createSki(options);
  l.position.x = -RIDER.skiStance;
  l.name = "SkiL";
  const r = createSki(options);
  r.position.x = RIDER.skiStance;
  r.name = "SkiR";
  pair.add(l, r);
  return pair;
}
var createSkis_default = createSkis;
export {
  createSki,
  createSkis,
  createSkis_default as default
};
