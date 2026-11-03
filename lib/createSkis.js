// src/createSkis.ts
import * as THREE2 from "three";

// src/surfaceGradient.ts
import * as THREE from "three";
function applySurfaceGradient(mesh, tailColor) {
  if (!tailColor) return;
  const { geometry, material } = mesh;
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const positions = geometry.getAttribute("position");
  const colors = new Float32Array(positions.count * 3);
  const head = material.color.clone();
  const tail = new THREE.Color(tailColor);
  const color = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    const fraction = (positions.getZ(i) - min.z) / (max.z - min.z);
    color.copy(head).lerp(tail, fraction).toArray(colors, i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  material.color.set(16777215);
  material.vertexColors = true;
}

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
var SKI_OUTLINE = [
  [0, 0.12],
  [5e-3, 0.613],
  [0.01, 0.73],
  [0.015, 0.804],
  [0.02, 0.857],
  [0.025, 0.895],
  [0.03, 0.921],
  [0.035, 0.94],
  [0.04, 0.957],
  [0.045, 0.963],
  [0.05, 0.975],
  [0.055, 0.985],
  [0.06, 0.994],
  [0.065, 0.995],
  [0.07, 0.999],
  [0.075, 1],
  [0.08, 1],
  [0.1, 0.995],
  [0.12, 0.982],
  [0.14, 0.969],
  [0.16, 0.959],
  [0.18, 0.94],
  [0.2, 0.924],
  [0.22, 0.906],
  [0.24, 0.896],
  [0.26, 0.881],
  [0.28, 0.864],
  [0.3, 0.849],
  [0.32, 0.839],
  [0.34, 0.83],
  [0.36, 0.823],
  [0.38, 0.813],
  [0.4, 0.811],
  [0.42, 0.803],
  [0.44, 0.795],
  [0.46, 0.792],
  [0.48, 0.788],
  [0.5, 0.789],
  [0.52, 0.79],
  [0.54, 0.788],
  [0.56, 0.784],
  [0.58, 0.784],
  [0.6, 0.787],
  [0.62, 0.789],
  [0.64, 0.794],
  [0.66, 0.794],
  [0.68, 0.794],
  [0.7, 0.798],
  [0.72, 0.805],
  [0.74, 0.813],
  [0.76, 0.826],
  [0.78, 0.834],
  [0.8, 0.843],
  [0.82, 0.853],
  [0.84, 0.865],
  [0.86, 0.872],
  [0.88, 0.882],
  [0.9, 0.894],
  [0.92, 0.895],
  [0.94, 0.89],
  [0.945, 0.881],
  [0.95, 0.878],
  [0.955, 0.869],
  [0.96, 0.854],
  [0.965, 0.838],
  [0.97, 0.823],
  [0.975, 0.806],
  [0.98, 0.772],
  [0.985, 0.739],
  [0.99, 0.688],
  [0.995, 0.611],
  [1, 0.448]
];
var SKI_LIFT = [
  [0, 0.043],
  [0.01, 0.034],
  [0.02, 0.025],
  [0.03, 0.018],
  [0.05, 7e-3],
  [0.07, 0],
  [0.93, 0],
  [0.96, 1e-3],
  [0.98, 6e-3],
  [1, 0.014]
];
function tableAt(tab, t) {
  if (t <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) {
    if (t <= tab[i][0]) {
      const [t1, v1] = tab[i - 1], [t2, v2] = tab[i];
      return v1 + (v2 - v1) * ((t - t1) / (t2 - t1));
    }
  }
  return tab[tab.length - 1][1];
}
var ROW_T = [
  [0, 0],
  [0.14, 0.06],
  [0.76, 0.88],
  [1, 1]
];
function rowT(u) {
  return tableAt(ROW_T, u);
}
function colWarp(v) {
  return Math.sign(v) * (1 - Math.pow(1 - Math.abs(v), 1.55));
}
function halfWidthAt(t, o) {
  return Math.max(15e-4, tableAt(SKI_OUTLINE, t) * (o.tipWidth / 2));
}
function liftAt(t) {
  let y = tableAt(SKI_LIFT, t);
  if (t > 0.25 && t < 0.85) y += 4e-3 * Math.sin(Math.PI * (t - 0.25) / 0.6);
  return y;
}
function skiNormal(o, t, s, side, out) {
  const P = (tt, ss) => {
    const tc = Math.min(1, Math.max(0, tt));
    const half = o.thickness / 2 * thicknessFactor(tc, Math.abs(ss));
    return [ss * halfWidthAt(tc, o), liftAt(tc) + side * (half + 4e-4), tc * o.length - o.length / 2];
  };
  const et = 15e-4, es = 0.01;
  const [tx1, ty1, tz1] = P(t + et, s), [tx0, ty0, tz0] = P(t - et, s);
  const [sx1, sy1, sz1] = P(t, s + es), [sx0, sy0, sz0] = P(t, s - es);
  const dT = [tx1 - tx0, ty1 - ty0, tz1 - tz0];
  const dS = [sx1 - sx0, sy1 - sy0, sz1 - sz0];
  out.set(
    dS[1] * dT[2] - dS[2] * dT[1],
    dS[2] * dT[0] - dS[0] * dT[2],
    dS[0] * dT[1] - dS[1] * dT[0]
  );
  if (out.y * side < 0) out.negate();
  out.normalize();
}
function thicknessFactor(t, sAbs) {
  const ends = (0.5 + 0.5 * THREE2.MathUtils.smoothstep(t, 0, 0.08)) * (1 - 0.35 * THREE2.MathUtils.smoothstep(t, 0.94, 1));
  const edge = 1 - 0.35 * THREE2.MathUtils.smoothstep(sAbs, 0.75, 1);
  return ends * edge;
}
function buildGrid(o) {
  const [NL, NC] = o.segments;
  const count = (NL + 1) * (NC + 1);
  const topPos = new Float32Array(count * 3), botPos = new Float32Array(count * 3);
  const topN = new Float32Array(count * 3), botN = new Float32Array(count * 3);
  const xArr = new Float32Array(count), tArr = new Float32Array(count), sArr = new Float32Array(count);
  const cols = [];
  for (let j = 0; j <= NC; j++) cols.push(colWarp(j / NC * 2 - 1));
  for (let i = 0; i <= NL; i++) {
    const t = rowT(i / NL), hw = halfWidthAt(t, o);
    for (let j = 0; j <= NC; j++) {
      const k = i * (NC + 1) + j, s = cols[j], x = s * hw;
      const half = o.thickness / 2 * thicknessFactor(t, Math.abs(s));
      const ym = liftAt(t), z = t * o.length - o.length / 2;
      topPos.set([x, ym + half + 4e-4, z], k * 3);
      botPos.set([x, ym - half - 4e-4, z], k * 3);
      xArr[k] = x;
      tArr[k] = t;
      sArr[k] = s;
    }
  }
  const n = new THREE2.Vector3();
  for (let k = 0; k < count; k++) {
    skiNormal(o, tArr[k], sArr[k], 1, n);
    topN.set([n.x, n.y, n.z], k * 3);
    skiNormal(o, tArr[k], sArr[k], -1, n);
    botN.set([n.x, n.y, n.z], k * 3);
  }
  const topIdx = [], row = NC + 1;
  for (let i = 0; i < NL; i++) for (let j = 0; j < NC; j++) {
    const a = i * row + j, b = a + 1, c = a + row, d = c + 1;
    topIdx.push(a, c, b, b, c, d);
  }
  return { topPos, botPos, topN, botN, xArr, tArr, topIdx };
}
function surface(grid, side) {
  const g = new THREE2.BufferGeometry();
  g.setAttribute("position", new THREE2.BufferAttribute(side > 0 ? grid.topPos.slice() : grid.botPos.slice(), 3));
  g.setAttribute("normal", new THREE2.BufferAttribute(side > 0 ? grid.topN.slice() : grid.botN.slice(), 3));
  if (side > 0) g.setIndex(grid.topIdx);
  else {
    const idx = [];
    for (let i = 0; i < grid.topIdx.length; i += 3) idx.push(grid.topIdx[i], grid.topIdx[i + 2], grid.topIdx[i + 1]);
    g.setIndex(idx);
  }
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
  const g = new THREE2.BufferGeometry();
  g.setAttribute("position", new THREE2.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function inlay(grid, test) {
  const pos = [];
  const nor = [];
  for (let i = 0; i < grid.topIdx.length; i += 3) {
    const [a, b, c] = [grid.topIdx[i], grid.topIdx[i + 1], grid.topIdx[i + 2]];
    const cx = (grid.xArr[a] + grid.xArr[b] + grid.xArr[c]) / 3;
    const ct = (grid.tArr[a] + grid.tArr[b] + grid.tArr[c]) / 3;
    if (!test(cx, ct)) continue;
    for (const k of [a, b, c]) {
      pos.push(grid.topPos[k * 3], grid.topPos[k * 3 + 1] + 7e-4, grid.topPos[k * 3 + 2]);
      nor.push(grid.topN[k * 3], grid.topN[k * 3 + 1], grid.topN[k * 3 + 2]);
    }
  }
  if (!pos.length) return null;
  const g = new THREE2.BufferGeometry();
  g.setAttribute("position", new THREE2.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE2.Float32BufferAttribute(nor, 3));
  return g;
}
function stripeGeometry(o, halfW) {
  const NL = o.segments[0];
  const pos = [];
  const nor = [];
  const nVec = new THREE2.Vector3();
  const surfY = (x, t) => {
    const hw = Math.max(halfWidthAt(t, o), 1e-4);
    return liftAt(t) + o.thickness / 2 * thicknessFactor(t, Math.abs(x) / hw) + 11e-4;
  };
  const surfN = (x, t) => {
    const hw = Math.max(halfWidthAt(t, o), 1e-4);
    skiNormal(o, t, x / hw, 1, nVec);
    return [nVec.x, nVec.y, nVec.z];
  };
  let prev = null;
  for (let i = 0; i <= NL; i++) {
    const t = rowT(i / NL);
    const hw = halfWidthAt(t, o);
    const xa = Math.max(-halfW, -hw + 3e-3), xb = Math.min(halfW, hw - 3e-3);
    if (xb - xa < 2e-3) {
      prev = null;
      continue;
    }
    const z = t * o.length - o.length / 2;
    const cur = [
      { p: [xa, surfY(xa, t), z], n: surfN(xa, t) },
      { p: [xb, surfY(xb, t), z], n: surfN(xb, t) }
    ];
    if (prev) {
      const quad = [prev[0], cur[0], prev[1], prev[1], cur[0], cur[1]];
      for (const e of quad) {
        pos.push(...e.p);
        nor.push(...e.n);
      }
    }
    prev = cur;
  }
  if (!pos.length) return null;
  const g = new THREE2.BufferGeometry();
  g.setAttribute("position", new THREE2.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE2.Float32BufferAttribute(nor, 3));
  return g;
}
function createSki(options = {}) {
  const o = { ...DEFAULTS, ...options };
  const grid = buildGrid(o);
  const flat = (color, rough = 0.5) => new THREE2.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
  const g = new THREE2.Group();
  g.name = "Ski";
  const wall = new THREE2.Mesh(sidewall(grid), flat(o.sidewallColor, 0.62));
  wall.material.side = THREE2.DoubleSide;
  g.add(wall);
  const top = new THREE2.Mesh(surface(grid, 1), flat(o.topsheetColor));
  const base = new THREE2.Mesh(surface(grid, -1), flat(o.baseColor, 0.32));
  applySurfaceGradient(top, options.topsheetTailColor);
  applySurfaceGradient(base, options.baseTailColor);
  g.add(top, base);
  const stripeG = stripeGeometry(o, 0.011);
  if (stripeG) {
    const m = new THREE2.Mesh(stripeG, flat(o.stripeColor));
    m.name = "stripe";
    g.add(m);
  }
  const accents = inlay(grid, (x, t) => (t > 0.07 && t < 0.13 || t > 0.86 && t < 0.9) && Math.abs(x) > 0.0125 && Math.abs(x) < 0.021);
  if (accents) {
    const m = new THREE2.Mesh(accents, flat(o.accentColor));
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
  const pair = new THREE2.Group();
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
