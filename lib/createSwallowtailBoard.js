// src/createSwallowtailBoard.ts
import * as THREE from "three";
var GAME_BOARD_LENGTH = 1.7;
var DEFAULTS = {
  length: GAME_BOARD_LENGTH,
  noseWidth: 0.33,
  waistWidth: 0.274,
  tailWidth: 0.302,
  thickness: 9e-3,
  notchDepth: 0.21,
  topsheetColor: "#f2f2f0",
  pattern: "none",
  patternColor: "#d82f2a",
  patternColor2: "#17171a",
  baseColor: "#d82f2a",
  basePattern: "none",
  basePatternColor: "#f2f2f0",
  sidewallColor: "#232327",
  inserts: true,
  segments: [220, 44],
  castShadow: true,
  receiveShadow: true
};
function halfWidthAt(t, o) {
  const n = o.noseWidth / 2, w = o.waistWidth / 2, tl = o.tailWidth / 2;
  const pts = [
    [0, 2e-3],
    [0.05, n * 0.635],
    [0.1, n * 0.876],
    [0.16, n * 0.985],
    [0.22, n],
    [0.32, w + (n - w) * 0.55],
    [0.45, w + (n - w) * 0.22],
    [0.58, w * 1.005],
    [0.66, w],
    [0.78, w + (tl - w) * 0.25],
    [0.88, w + (tl - w) * 0.62],
    [0.95, tl * 0.99],
    [1, tl]
  ];
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t1, w1] = pts[i - 1], [t2, w2] = pts[i];
      const p0 = pts[Math.max(0, i - 2)], p3 = pts[Math.min(pts.length - 1, i + 1)];
      const u = (t - t1) / (t2 - t1);
      const v = 0.5 * (2 * w1 + (-p0[1] + w2) * u + (2 * p0[1] - 5 * w1 + 4 * w2 - p3[1]) * u * u + (-p0[1] + 3 * w1 - 3 * w2 + p3[1]) * u * u * u);
      return Math.max(15e-4, v);
    }
  }
  return tl;
}
function liftAt(t) {
  let y = 0;
  if (t < 0.32) {
    const u = (0.32 - t) / 0.32;
    y += 0.055 * u * u;
  }
  if (t > 0.3 && t < 0.88) y += 6e-3 * Math.sin(Math.PI * (t - 0.3) / 0.58);
  if (t > 0.9) {
    const u = (t - 0.9) / 0.1;
    y += 0.01 * u * u;
  }
  return y;
}
function thicknessFactor(t, sAbs) {
  const nose = 0.55 + 0.45 * THREE.MathUtils.smoothstep(t, 0, 0.09);
  const tail = 1 - 0.3 * THREE.MathUtils.smoothstep(t, 0.94, 1);
  const edge = 1 - 0.38 * THREE.MathUtils.smoothstep(sAbs, 0.78, 1);
  return nose * tail * edge;
}
function notchHalfAt(t, o) {
  const tApex = 1 - o.notchDepth / o.length;
  if (t <= tApex) return 0;
  const u = (t - tApex) / (1 - tApex);
  return 0.42 * (o.tailWidth / 2) * u;
}
function patternLayers(kind, o, forBase) {
  const c1 = forBase ? o.basePatternColor : o.patternColor;
  const c2 = o.patternColor2;
  switch (kind) {
    case "lengthStripes":
      return [
        { color: c1, strip: [-0.03, 0.03] },
        { color: c1, strip: [0.047, 0.057] },
        { color: c1, strip: [-0.057, -0.047] }
      ];
    case "diagonal": {
      const band = (x, t) => {
        const p = (t * 5 + x * 2.4) % 1;
        return (p < 0 ? p + 1 : p) < 0.38;
      };
      return [{ color: c1, test: band }];
    }
    case "chevrons": {
      const band = (x, t) => {
        const p = (t * 6 - Math.abs(x) * 1.5) % 1;
        return (p < 0 ? p + 1 : p) < 0.3;
      };
      return [{ color: c1, test: band }];
    }
    case "split":
      return [
        { color: c1, test: (_x, t) => t < 0.26 },
        { color: c2, test: (_x, t) => t > 0.865 }
      ];
    case "blocks": {
      const chk = (x, t) => t > 0.15 && t < 0.9 && (Math.floor(t * 9) + Math.floor((x + 0.17) / 0.085)) % 2 === 0;
      return [{ color: c1, test: chk }];
    }
    default:
      return [];
  }
}
function detailGeometry(o) {
  const parts = [];
  const surfaceY = (x, t) => liftAt(t) + o.thickness / 2 * thicknessFactor(t, Math.abs(x) / Math.max(halfWidthAt(t, o), 1e-4)) + 12e-4;
  const addFlat = (g2, x, t) => {
    g2.rotateX(-Math.PI / 2);
    g2.translate(x, surfaceY(x, t), t * o.length - o.length / 2);
    parts.push(g2.toNonIndexed());
  };
  for (const tc of [0.42, 0.74]) {
    for (const dx of [-0.032, 0.032]) {
      for (let r = -2; r <= 2; r++) {
        addFlat(new THREE.CircleGeometry(5e-3, 14), dx, tc + r * 0.036 / o.length);
      }
    }
  }
  for (const b of [0.545, 0.565, 0.585]) addFlat(new THREE.PlaneGeometry(0.034, 75e-4), -0.1, b);
  let total = 0;
  for (const p of parts) total += p.attributes.position.count;
  const pos = new Float32Array(total * 3);
  let off = 0;
  for (const p of parts) {
    pos.set(p.attributes.position.array, off * 3);
    off += p.attributes.position.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function buildGrid(o) {
  const [NL, NC] = o.segments;
  const count = (NL + 1) * (NC + 1);
  const topPos = new Float32Array(count * 3);
  const botPos = new Float32Array(count * 3);
  const xArr = new Float32Array(count);
  const tArr = new Float32Array(count);
  const valid = new Array(count).fill(false);
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
        const step = 2 * hw / NC;
        if (Math.abs(x) - nh < step) x = Math.sign(x) * nh;
      }
      const half = o.thickness / 2 * thicknessFactor(t, Math.abs(s));
      const yMid = liftAt(t);
      const z = t * o.length - o.length / 2;
      topPos.set([x, yMid + half + 4e-4, z], k * 3);
      botPos.set([x, yMid - half - 4e-4, z], k * 3);
      xArr[k] = x;
      tArr[k] = t;
      valid[k] = ok;
    }
  }
  const topIdx = [];
  const row = NC + 1;
  for (let i = 0; i < NL; i++) {
    for (let j = 0; j < NC; j++) {
      const a = i * row + j, b = a + 1, c = a + row, d = c + 1;
      const va = valid[a], vb = valid[b], vc = valid[c], vd = valid[d];
      if (va && vb && vc && vd) {
        topIdx.push(a, c, b, b, c, d);
        continue;
      }
      if (!va && vb && vc && vd) topIdx.push(b, c, d);
      else if (va && !vb && vc && vd) topIdx.push(a, c, d);
      else if (va && vb && !vc && vd) topIdx.push(a, d, b);
      else if (va && vb && vc && !vd) topIdx.push(a, c, b);
    }
  }
  return { topPos, botPos, xArr, tArr, topIdx, count };
}
function surfaceGeometry(grid, side) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(side > 0 ? grid.topPos.slice() : grid.botPos.slice(), 3));
  if (side > 0) {
    g.setIndex(grid.topIdx);
  } else {
    const idx = [];
    for (let i = 0; i < grid.topIdx.length; i += 3) idx.push(grid.topIdx[i], grid.topIdx[i + 2], grid.topIdx[i + 1]);
    g.setIndex(idx);
  }
  g.computeVertexNormals();
  return g;
}
function patternGeometry(grid, side, test) {
  const src = side > 0 ? grid.topPos : grid.botPos;
  const pos = [];
  const lift = side * 7e-4;
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
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function stripGeometry(o, side, x0, x1) {
  const NL = o.segments[0];
  const pos = [];
  const surfY = (x, t) => {
    const hw = Math.max(halfWidthAt(t, o), 1e-4);
    return liftAt(t) + side * (o.thickness / 2 * thicknessFactor(t, Math.abs(x) / hw) + 11e-4);
  };
  let prev = /* @__PURE__ */ new Map();
  for (let i = 0; i <= NL; i++) {
    const t = i / NL;
    const hw = halfWidthAt(t, o);
    const nh = notchHalfAt(t, o);
    const xa = Math.max(x0, -hw + 3e-3), xb = Math.min(x1, hw - 3e-3);
    const segs = /* @__PURE__ */ new Map();
    if (xb - xa >= 2e-3) {
      if (nh <= 0 || xb <= -nh || xa >= nh) segs.set("full", [xa, xb]);
      else {
        if (-nh - xa >= 2e-3) segs.set("left", [xa, -nh]);
        if (xb - nh >= 2e-3) segs.set("right", [nh, xb]);
      }
    }
    const z = t * o.length - o.length / 2;
    const next = /* @__PURE__ */ new Map();
    for (const [key, [sx0, sx1]] of segs) {
      const L = [sx0, surfY(sx0, t), z], R = [sx1, surfY(sx1, t), z];
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
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function sidewallGeometry(grid) {
  const edgeUse = /* @__PURE__ */ new Map();
  const addEdge = (a, b) => {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    const e = edgeUse.get(key);
    if (e) e.n++;
    else edgeUse.set(key, { a, b, n: 1 });
  };
  for (let i = 0; i < grid.topIdx.length; i += 3) {
    addEdge(grid.topIdx[i], grid.topIdx[i + 1]);
    addEdge(grid.topIdx[i + 1], grid.topIdx[i + 2]);
    addEdge(grid.topIdx[i + 2], grid.topIdx[i]);
  }
  const pos = [];
  const P = (arr, k) => [arr[k * 3], arr[k * 3 + 1], arr[k * 3 + 2]];
  for (const e of edgeUse.values()) {
    if (e.n !== 1) continue;
    const ta = P(grid.topPos, e.a), tb = P(grid.topPos, e.b);
    const ba = P(grid.botPos, e.a), bb = P(grid.botPos, e.b);
    pos.push(...ta, ...ba, ...bb, ...ta, ...bb, ...tb);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function createSwallowtailBoard(options = {}) {
  const o = { ...DEFAULTS, ...options };
  const group = new THREE.Group();
  group.name = "SwallowtailBoard";
  const grid = buildGrid(o);
  const flat = (color, roughness) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
  const core = new THREE.Mesh(sidewallGeometry(grid), flat(o.sidewallColor, 0.62));
  core.material.side = THREE.DoubleSide;
  core.name = "core-sidewall";
  group.add(core);
  const top = new THREE.Mesh(surfaceGeometry(grid, 1), flat(o.topsheetColor, 0.5));
  top.name = "topsheet";
  group.add(top);
  const base = new THREE.Mesh(surfaceGeometry(grid, -1), flat(o.baseColor, 0.32));
  base.name = "base";
  group.add(base);
  const addLayers = (kind, forBase, side, rough) => {
    for (const layer of patternLayers(kind, o, forBase)) {
      const g = layer.strip ? stripGeometry(o, side, layer.strip[0], layer.strip[1]) : patternGeometry(grid, side, layer.test);
      if (g) {
        const m = new THREE.Mesh(g, flat(layer.color, rough));
        m.name = forBase ? "pattern-base" : "pattern-top";
        group.add(m);
      }
    }
  };
  addLayers(o.pattern, false, 1, 0.5);
  addLayers(o.basePattern, true, -1, 0.32);
  if (o.inserts) {
    const m = new THREE.Mesh(detailGeometry(o), flat("#17171a", 0.55));
    m.name = "detail-inserts";
    group.add(m);
  }
  group.traverse((m) => {
    if (m.isMesh) {
      m.castShadow = o.castShadow;
      m.receiveShadow = o.receiveShadow;
    }
  });
  group.userData.boardSpec = {
    length: o.length,
    noseWidth: o.noseWidth,
    waistWidth: o.waistWidth,
    tailWidth: o.tailWidth,
    notchDepth: o.notchDepth,
    thickness: o.thickness,
    pattern: o.pattern,
    textures: 0
  };
  return group;
}
var createSwallowtailBoard_default = createSwallowtailBoard;
export {
  GAME_BOARD_LENGTH,
  createSwallowtailBoard,
  createSwallowtailBoard_default as default
};
