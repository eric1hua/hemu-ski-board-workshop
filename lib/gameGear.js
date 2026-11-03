// src/boardPatterns.ts
var BOARD_PATTERNS = [
  ["none", "\u7EAF\u8272"],
  ["lengthStripes", "\u7EB5\u6761\u7EB9"],
  ["alpenglow", "\u65E5\u7167\u91D1\u5C71"],
  ["contours", "\u7B49\u9AD8\u7EBF"],
  ["slalom", "\u7C89\u96EA\u56DE\u8F6C"],
  ["ridgeline", "\u5C71\u810A\u526A\u5F71"],
  ["fault", "\u51B0\u5DDD\u88C2\u9699"],
  ["wind", "\u98CE\u523B\u96EA\u7EB9"],
  ["tracks", "\u96EA\u72D0\u8DB3\u8FF9"],
  ["crystal", "\u51B0\u6676\u5FBD\u8BB0"],
  ["comet", "\u5F57\u661F\u96EA\u7EBF"]
];
function ribbon(start, end, center, width) {
  return (t) => {
    if (t < start || t > end) return null;
    const u = (t - start) / (end - start);
    const x = center(u), w = width(u);
    return [x - w, x + w];
  };
}
function oval(x, t, width, height) {
  return ribbon(t - height, t + height, () => x, (u) => width * Math.sqrt(1 - (2 * u - 1) ** 2));
}
function facet(t0, t1, x0, x1, width) {
  return ribbon(t0, t1, (u) => x0 + (x1 - x0) * u, (u) => width * (1 - u));
}
function designBands(pattern) {
  switch (pattern) {
    case "alpenglow":
      return [
        { ink: 1, band: oval(0, 0.23, 0.105, 0.062) },
        { ink: 2, band: facet(0.31, 0.365, 0.015, -0.02, 0.12) },
        { ink: 2, band: facet(0.325, 0.39, 0.03, -0.015, 0.08) },
        { ink: 2, band: facet(0.35, 0.41, 0.05, 5e-3, 0.042) }
      ];
    case "contours":
      return [1, 0.78, 0.56, 0.34].flatMap(
        (scale, i) => [-1, 1].map((side) => ({
          ink: i % 2 === 0 ? 1 : 2,
          band: ribbon(
            0.49 - 0.32 * scale,
            0.49 + 0.32 * scale,
            (u) => -0.07 + 0.1 * Math.sin(Math.PI * u) + side * 0.13 * scale * Math.sin(Math.PI * u),
            (u) => 6e-3 * Math.sin(Math.PI * u)
          )
        }))
      );
    case "slalom":
      return [
        { ink: 1, band: ribbon(0.1, 0.93, (u) => 0.115 * Math.sin(3.5 * Math.PI * u), (u) => 0.036 * Math.sin(Math.PI * u)) },
        { ink: 2, band: ribbon(0.13, 0.89, (u) => 0.11 * Math.sin(3.25 * Math.PI * u) - 0.057, (u) => 7e-3 * Math.sin(Math.PI * u)) }
      ];
    case "ridgeline":
      return [
        { ink: 1, band: facet(0.19, 0.57, -0.145, 0.175, 0.038) },
        { ink: 1, band: facet(0.31, 0.72, -0.16, 0.155, 0.058) },
        { ink: 2, band: facet(0.49, 0.78, -0.15, 0.12, 0.037) },
        { ink: 2, band: facet(0.62, 0.92, -0.14, 0.1, 0.025) }
      ];
    case "fault":
      return [
        { ink: 1, band: ribbon(0.1, 0.92, (u) => u < 0.45 ? -0.14 + 0.58 * u : 0.121 - 0.36 * (u - 0.45), (u) => 0.038 * Math.sin(Math.PI * u)) },
        { ink: 2, band: facet(0.44, 0.69, 0.108, 0.175, 0.012) },
        { ink: 2, band: facet(0.34, 0.48, -0.13, 0.06, 0.018) },
        { ink: 2, band: facet(0.66, 0.86, 0.04, 0.15, 0.013) }
      ];
    case "wind":
      return Array.from({ length: 6 }, (_, i) => ({
        ink: i % 3 === 0 ? 2 : 1,
        band: ribbon(
          0.16 + i * 0.08,
          0.48 + i * 0.08,
          (u) => -0.15 + 0.3 * u,
          (u) => 0.017 * Math.sin(Math.PI * u) ** 2
        )
      }));
    case "tracks":
      return Array.from({ length: 5 }, (_, i) => {
        const x = (i % 2 ? 1 : -1) * 0.062, t = 0.19 + i * 0.146;
        return [
          { ink: 1, band: oval(x, t + 0.018, 0.037, 0.02) },
          { ink: 2, band: oval(x - 0.034, t - 0.011, 0.013, 0.011) },
          { ink: 2, band: oval(x, t - 0.019, 0.014, 0.011) },
          { ink: 2, band: oval(x + 0.034, t - 0.011, 0.013, 0.011) }
        ];
      }).flat();
    case "crystal":
      return [
        { ink: 1, band: ribbon(0.13, 0.43, () => 0, (u) => 0.105 * (1 - Math.abs(2 * u - 1))) },
        { ink: 2, band: ribbon(0.18, 0.38, () => 8e-3, (u) => 0.041 * (1 - Math.abs(2 * u - 1))) },
        ...[0.51, 0.62, 0.73].map((t, i) => ({
          ink: i === 1 ? 2 : 1,
          band: ribbon(t - 0.03, t + 0.03, () => 0, (u) => 0.033 * (1 - Math.abs(2 * u - 1)))
        }))
      ];
    case "comet":
      return [
        { ink: 1, band: oval(-0.065, 0.22, 0.06, 0.042) },
        { ink: 1, band: ribbon(0.23, 0.89, (u) => -0.065 + 0.22 * Math.sin(u * 2.3), (u) => 0.05 * (1 - u) ** 2) },
        { ink: 2, band: ribbon(0.32, 0.94, (u) => -0.08 + 0.19 * Math.sin(u * 2.4), (u) => 0.013 * (1 - u)) }
      ];
    default:
      return [];
  }
}

// src/noseStickers.ts
var NOSE_STICKERS = [
  ["none", "\u65E0\u8D34\u7EB8"],
  ["mountain", "\u5C71\u5CF0"],
  ["snowflake", "\u96EA\u82B1"],
  ["fox", "\u96EA\u72D0"]
];
function stickerPaths(sticker) {
  switch (sticker) {
    case "mountain":
      return [
        [[-1, 0.65], [-0.33, -0.48], [-0.1, -0.18], [0.27, -0.79], [1, 0.65], [-1, 0.65]],
        [[0.04, -0.41], [0.2, -0.25], [0.31, -0.42], [0.48, -0.38]]
      ];
    case "fox":
      return [
        [[0, 0.83], [-0.86, 0.13], [-0.93, -0.82], [-0.35, -0.35], [0.35, -0.35], [0.93, -0.82], [0.86, 0.13], [0, 0.83]],
        [[-0.79, 0.12], [-0.42, 0.11], [-0.11, 0.53], [0.11, 0.53], [0.42, 0.11], [0.79, 0.12]],
        [[-0.48, -0.04], [-0.29, 0.02]],
        [[0.29, 0.02], [0.48, -0.04]]
      ];
    case "snowflake":
      return Array.from({ length: 6 }, (_, i) => {
        const angle = i * Math.PI / 3;
        const rotate = (x, y) => [
          x * Math.cos(angle) - y * Math.sin(angle),
          x * Math.sin(angle) + y * Math.cos(angle)
        ];
        return [
          [[0, 0], rotate(0, 1)],
          [rotate(-0.25, 0.78), rotate(0, 0.51), rotate(0.25, 0.78)]
        ];
      }).flat();
  }
}
var NOSE_NAME_LIMIT = "Christopher".length;
function normalizeNoseName(value) {
  return value.replace(/[^a-z]/gi, "").slice(0, NOSE_NAME_LIMIT);
}
var LETTERS = {
  A: "041034 0222",
  B: "040020312202 0222332404",
  C: "301000041434",
  D: "04002031332404",
  E: "30000434 0222",
  F: "040030 0222",
  G: "3010000414343222",
  H: "0004 3034 0232",
  I: "0030 2024 0434",
  J: "3033140403",
  K: "0004 300234",
  L: "000434",
  M: "0400123034",
  N: "04003430",
  O: "001030340400",
  P: "040020312202",
  Q: "0030340400 2234",
  R: "040020312202 1234",
  S: "300002323404",
  T: "0030 2024",
  U: "0004143430",
  V: "001430",
  W: "0004123430",
  X: "0034 3004",
  Y: "002230 2224",
  Z: "00300434"
};
function noseNamePaths(value) {
  const name = normalizeNoseName(value).toUpperCase();
  return [...name].flatMap(
    (letter, index) => LETTERS[letter].trim().split(" ").map((stroke) => {
      const points = [];
      for (let i = 0; i < stroke.length; i += 2) {
        const point = [index * 4.5 + Number(stroke[i]) - ((name.length - 1) * 4.5 + 3) / 2, Number(stroke[i + 1]) - 2];
        const last = points[points.length - 1];
        if (!last || point[0] !== last[0] || point[1] !== last[1]) points.push(point);
      }
      return points;
    })
  );
}

// src/gearDesign.ts
var MAX_DESIGN_BYTES = 8192;
function record(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid gear design.");
  return value;
}
function color(value) {
  if (typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error("Invalid design color.");
  return value;
}
function parseGearDesign(text) {
  if (text.length > MAX_DESIGN_BYTES) throw new Error("Gear design file is too large.");
  const file = record(JSON.parse(text));
  if (file.format !== "hemu-ski-gear" || file.version !== 1) throw new Error("Unsupported gear design format.");
  const s = record(file.style);
  if (s.gear !== "board" && s.gear !== "skis") throw new Error("Unknown gear type.");
  const pattern = BOARD_PATTERNS.find(([id]) => id === s.pattern);
  const sticker = NOSE_STICKERS.find(([id]) => id === s.noseSticker);
  if (!pattern || !sticker || typeof s.noseName !== "string" || normalizeNoseName(s.noseName) !== s.noseName) {
    throw new Error("Invalid gear graphics.");
  }
  const c = record(s.colors);
  const tails = record(s.tailColors);
  return {
    gear: s.gear,
    pattern: pattern[0],
    colors: { top: color(c.top), base: color(c.base), pat: color(c.pat), pat2: color(c.pat2), acc: color(c.acc) },
    tailColors: {
      top: tails.top === void 0 ? void 0 : color(tails.top),
      base: tails.base === void 0 ? void 0 : color(tails.base)
    },
    noseSticker: sticker[0],
    noseStickerColor: color(s.noseStickerColor),
    noseName: s.noseName
  };
}
function serializeGearDesign(s) {
  const { gear, pattern, colors, tailColors, noseSticker, noseStickerColor, noseName } = s;
  return JSON.stringify({
    format: "hemu-ski-gear",
    version: 1,
    style: { gear, pattern, colors, tailColors, noseSticker, noseStickerColor, noseName }
  }, null, 2);
}
function boardOptions(s) {
  const c = s.colors;
  return {
    topsheetColor: c.top,
    baseColor: c.base,
    topsheetTailColor: s.tailColors.top,
    baseTailColor: s.tailColors.base,
    noseSticker: s.noseSticker,
    noseStickerColor: s.noseStickerColor,
    noseName: s.noseName,
    pattern: s.pattern,
    patternColor: c.pat,
    patternColor2: c.pat2,
    basePattern: s.pattern === "none" ? "none" : "lengthStripes",
    basePatternColor: c.top
  };
}
function skiOptions(s) {
  const c = s.colors;
  return {
    topsheetColor: c.top,
    topsheetTailColor: s.tailColors.top,
    baseTailColor: s.tailColors.base,
    baseColor: c.base,
    stripeColor: c.pat,
    accentColor: c.pat2
  };
}

// src/createSwallowtailBoard.ts
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
  const color2 = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    const fraction = (positions.getZ(i) - min.z) / (max.z - min.z);
    color2.copy(head).lerp(tail, fraction).toArray(colors, i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  material.color.set(16777215);
  material.vertexColors = true;
}

// src/createSwallowtailBoard.ts
var GAME_BOARD_LENGTH = 1.7;
var DEFAULTS = {
  length: GAME_BOARD_LENGTH,
  noseWidth: 0.478,
  waistWidth: 0.398,
  tailWidth: 0.418,
  thickness: 9e-3,
  notchDepth: 0.22,
  topsheetColor: "#f2f2f0",
  pattern: "none",
  noseSticker: "none",
  noseStickerColor: "#17171a",
  noseName: "",
  patternColor: "#d82f2a",
  patternColor2: "#17171a",
  baseColor: "#d82f2a",
  basePattern: "none",
  basePatternColor: "#f2f2f0",
  sidewallColor: "#232327",
  inserts: true,
  segments: [144, 24],
  castShadow: true,
  receiveShadow: true
};
var OUTLINE = [
  [0, 0.03],
  [4e-3, 0.173],
  [7e-3, 0.235],
  [0.01, 0.28],
  [0.014, 0.321],
  [0.017, 0.358],
  [0.021, 0.399],
  [0.024, 0.432],
  [0.028, 0.465],
  [0.031, 0.498],
  [0.035, 0.527],
  [0.038, 0.56],
  [0.042, 0.584],
  [0.045, 0.605],
  [0.049, 0.634],
  [0.052, 0.65],
  [0.06, 0.694],
  [0.08, 0.793],
  [0.1, 0.876],
  [0.12, 0.934],
  [0.14, 0.969],
  [0.16, 0.99],
  [0.18, 1],
  [0.2, 0.993],
  [0.22, 0.988],
  [0.24, 0.983],
  [0.26, 0.964],
  [0.28, 0.956],
  [0.3, 0.938],
  [0.32, 0.93],
  [0.34, 0.913],
  [0.36, 0.903],
  [0.38, 0.889],
  [0.4, 0.88],
  [0.42, 0.87],
  [0.44, 0.864],
  [0.46, 0.855],
  [0.48, 0.849],
  [0.5, 0.84],
  [0.52, 0.841],
  [0.54, 0.834],
  [0.56, 0.83],
  [0.58, 0.83],
  [0.6, 0.828],
  [0.62, 0.83],
  [0.64, 0.83],
  [0.66, 0.83],
  [0.68, 0.83],
  [0.7, 0.83],
  [0.72, 0.834],
  [0.74, 0.835],
  [0.76, 0.846],
  [0.78, 0.851],
  [0.8, 0.851],
  [0.82, 0.859],
  [0.84, 0.87],
  [0.86, 0.876],
  [0.88, 0.881],
  [0.9, 0.896],
  [0.92, 0.902],
  [0.94, 0.909],
  [0.95, 0.909],
  [0.957, 0.909],
  [0.962, 0.91],
  [0.967, 0.889],
  [0.971, 0.844],
  [0.976, 0.798],
  [0.98, 0.749],
  [0.985, 0.691],
  [0.99, 0.63],
  [0.994, 0.564],
  [1, 0.481]
];
var NOTCH_GAP = [
  [0.86, 0],
  [0.88, 0.072],
  [0.9, 0.148],
  [0.92, 0.216],
  [0.93, 0.239],
  [0.939, 0.267],
  [0.948, 0.296],
  [0.957, 0.321],
  [0.967, 0.346],
  [0.976, 0.37],
  [0.985, 0.395],
  [0.994, 0.412],
  [1, 0.44]
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
function halfWidthAt(t, o) {
  return Math.max(15e-4, tableAt(OUTLINE, t) * (o.noseWidth / 2));
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
  const nose = 0.55 + 0.45 * THREE2.MathUtils.smoothstep(t, 0, 0.09);
  const tail = 1 - 0.3 * THREE2.MathUtils.smoothstep(t, 0.94, 1);
  const edge = 1 - 0.38 * THREE2.MathUtils.smoothstep(sAbs, 0.78, 1);
  return nose * tail * edge;
}
function notchHalfAt(t, o) {
  return tableAt(NOTCH_GAP, t) * (o.noseWidth / 2);
}
function colWarp(v) {
  return Math.sign(v) * (1 - Math.pow(1 - Math.abs(v), 1.55));
}
function deckNormal(o, t, s, side, out) {
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
      return designBands(kind).map(({ ink, band }) => ({
        color: ink === 1 ? c1 : c2,
        band,
        offset: ink === 1 ? 0 : 3e-4
      }));
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
        addFlat(new THREE2.CircleGeometry(5e-3, 14), dx, tc + r * 0.036 / o.length);
      }
    }
  }
  for (const b of [0.545, 0.565, 0.585]) addFlat(new THREE2.PlaneGeometry(0.034, 75e-4), -0.1, b);
  let total = 0;
  for (const p of parts) total += p.attributes.position.count;
  const pos = new Float32Array(total * 3);
  let off = 0;
  for (const p of parts) {
    pos.set(p.attributes.position.array, off * 3);
    off += p.attributes.position.count;
  }
  const g = new THREE2.BufferGeometry();
  g.setAttribute("position", new THREE2.BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function buildGrid(o) {
  const [NL, NC] = o.segments;
  const count = (NL + 1) * (NC + 1);
  const topPos = new Float32Array(count * 3);
  const botPos = new Float32Array(count * 3);
  const topN = new Float32Array(count * 3);
  const botN = new Float32Array(count * 3);
  const xArr = new Float32Array(count);
  const tArr = new Float32Array(count);
  const sArr = new Float32Array(count);
  const valid = new Array(count).fill(false);
  const cols = [];
  for (let j = 0; j <= NC; j++) cols.push(colWarp(j / NC * 2 - 1));
  for (let i = 0; i <= NL; i++) {
    const t = rowT(i / NL);
    const hw = halfWidthAt(t, o);
    const nh = notchHalfAt(t, o);
    for (let j = 0; j <= NC; j++) {
      const k = i * (NC + 1) + j;
      const s = cols[j];
      let x = s * hw;
      let ok = Math.abs(x) >= nh - 1e-9;
      if (ok && nh > 0) {
        const step = (cols[Math.min(NC, j + 1)] - cols[Math.max(0, j - 1)]) * hw;
        if (Math.abs(x) - nh < step) x = Math.sign(x) * nh;
      }
      const half = o.thickness / 2 * thicknessFactor(t, Math.abs(s));
      const yMid = liftAt(t);
      const z = t * o.length - o.length / 2;
      topPos.set([x, yMid + half + 4e-4, z], k * 3);
      botPos.set([x, yMid - half - 4e-4, z], k * 3);
      xArr[k] = x;
      tArr[k] = t;
      sArr[k] = s;
      valid[k] = ok;
    }
  }
  const n = new THREE2.Vector3();
  for (let k = 0; k < count; k++) {
    deckNormal(o, tArr[k], sArr[k], 1, n);
    topN.set([n.x, n.y, n.z], k * 3);
    deckNormal(o, tArr[k], sArr[k], -1, n);
    botN.set([n.x, n.y, n.z], k * 3);
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
  return { topPos, botPos, topN, botN, xArr, tArr, topIdx, count };
}
function surfaceGeometry(grid, side) {
  const g = new THREE2.BufferGeometry();
  g.setAttribute("position", new THREE2.BufferAttribute(side > 0 ? grid.topPos.slice() : grid.botPos.slice(), 3));
  g.setAttribute("normal", new THREE2.BufferAttribute(side > 0 ? grid.topN.slice() : grid.botN.slice(), 3));
  if (side > 0) {
    g.setIndex(grid.topIdx);
  } else {
    const idx = [];
    for (let i = 0; i < grid.topIdx.length; i += 3) idx.push(grid.topIdx[i], grid.topIdx[i + 2], grid.topIdx[i + 1]);
    g.setIndex(idx);
  }
  return g;
}
function patternGeometry(grid, side, test) {
  const src = side > 0 ? grid.topPos : grid.botPos;
  const srcN = side > 0 ? grid.topN : grid.botN;
  const pos = [];
  const nor = [];
  const lift = side * 7e-4;
  for (let i = 0; i < grid.topIdx.length; i += 3) {
    const [a, b, c] = [grid.topIdx[i], grid.topIdx[i + 1], grid.topIdx[i + 2]];
    const cx = (grid.xArr[a] + grid.xArr[b] + grid.xArr[c]) / 3;
    const ct = (grid.tArr[a] + grid.tArr[b] + grid.tArr[c]) / 3;
    if (!test(cx, ct)) continue;
    const order = side > 0 ? [a, b, c] : [a, c, b];
    for (const k of order) {
      pos.push(src[k * 3], src[k * 3 + 1] + lift, src[k * 3 + 2]);
      nor.push(srcN[k * 3], srcN[k * 3 + 1], srcN[k * 3 + 2]);
    }
  }
  if (pos.length === 0) return null;
  const g = new THREE2.BufferGeometry();
  g.setAttribute("position", new THREE2.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE2.Float32BufferAttribute(nor, 3));
  return g;
}
function stripGeometry(o, side, band, offset = 0, samples = o.segments[0]) {
  const NL = samples;
  const pos = [];
  const nor = [];
  const surfY = (x, t) => {
    const hw = Math.max(halfWidthAt(t, o), 1e-4);
    return liftAt(t) + side * (o.thickness / 2 * thicknessFactor(t, Math.abs(x) / hw) + 11e-4 + offset);
  };
  const nVec = new THREE2.Vector3();
  const surfN = (x, t) => {
    const hw = Math.max(halfWidthAt(t, o), 1e-4);
    deckNormal(o, t, x / hw, side, nVec);
    return [nVec.x, nVec.y, nVec.z];
  };
  let prev = /* @__PURE__ */ new Map();
  for (let i = 0; i <= NL; i++) {
    const t = rowT(i / NL);
    const hw = halfWidthAt(t, o);
    const nh = notchHalfAt(t, o);
    const bounds = band(t);
    if (!bounds) {
      prev.clear();
      continue;
    }
    const [x0, x1] = bounds;
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
      const L = { p: [sx0, surfY(sx0, t), z], n: surfN(sx0, t) };
      const R = { p: [sx1, surfY(sx1, t), z], n: surfN(sx1, t) };
      const p = prev.get(key);
      if (p) {
        const [pL, pR] = p;
        const quad = side > 0 ? [pL, L, pR, pR, L, R] : [pL, pR, L, pR, R, L];
        for (const e of quad) {
          pos.push(...e.p);
          nor.push(...e.n);
        }
      }
      next.set(key, [L, R]);
    }
    prev = next;
  }
  if (pos.length === 0) return null;
  const g = new THREE2.BufferGeometry();
  g.setAttribute("position", new THREE2.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE2.Float32BufferAttribute(nor, 3));
  return g;
}
function noseLineGeometry(o, paths, center, scale, halfStroke) {
  const positions = [];
  const point = (x, z) => {
    const t = z / o.length + 0.5;
    const width = Math.max(halfWidthAt(t, o), 1e-4);
    const y = liftAt(t) + o.thickness / 2 * thicknessFactor(t, Math.abs(x) / width);
    return [x, y + 22e-4, z];
  };
  for (const path of paths) {
    for (let i = 1; i < path.length; i++) {
      const [ax, az] = path[i - 1].map((v) => v * scale);
      const [bx, bz] = path[i].map((v) => v * scale);
      const dx = bx - ax, dz = bz - az;
      const length = Math.hypot(dx, dz);
      const nx = -dz * halfStroke / length, nz = dx * halfStroke / length;
      const steps = Math.ceil(length / 6e-3);
      const zCenter = (center - 0.5) * o.length;
      for (let j = 0; j < steps; j++) {
        const u = j / steps, v = (j + 1) / steps;
        const a = point(ax + dx * u + nx, zCenter + az + dz * u + nz);
        const b = point(ax + dx * v + nx, zCenter + az + dz * v + nz);
        const c = point(ax + dx * u - nx, zCenter + az + dz * u - nz);
        const d = point(ax + dx * v - nx, zCenter + az + dz * v - nz);
        positions.push(...a, ...b, ...c, ...c, ...b, ...d);
      }
    }
  }
  return new THREE2.BufferGeometry().setAttribute("position", new THREE2.Float32BufferAttribute(positions, 3));
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
  const g = new THREE2.BufferGeometry();
  g.setAttribute("position", new THREE2.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function createSwallowtailBoard(options = {}) {
  const o = { ...DEFAULTS, ...options };
  const group = new THREE2.Group();
  group.name = "SwallowtailBoard";
  const grid = buildGrid(o);
  const flat = (color2, roughness) => new THREE2.MeshStandardMaterial({ color: color2, roughness, metalness: 0 });
  const core = new THREE2.Mesh(sidewallGeometry(grid), flat(o.sidewallColor, 0.62));
  core.material.side = THREE2.DoubleSide;
  core.name = "core-sidewall";
  group.add(core);
  const top = new THREE2.Mesh(surfaceGeometry(grid, 1), flat(o.topsheetColor, 0.5));
  applySurfaceGradient(top, options.topsheetTailColor);
  top.name = "topsheet";
  group.add(top);
  const base = new THREE2.Mesh(surfaceGeometry(grid, -1), flat(o.baseColor, 0.32));
  applySurfaceGradient(base, options.baseTailColor);
  base.name = "base";
  group.add(base);
  const addLayers = (kind, forBase, side, rough) => {
    for (const layer of patternLayers(kind, o, forBase)) {
      const g = layer.band ? stripGeometry(o, side, layer.band, layer.offset, Math.max(240, o.segments[0])) : layer.strip ? stripGeometry(o, side, () => layer.strip) : patternGeometry(grid, side, layer.test);
      if (g) {
        const m = new THREE2.Mesh(g, flat(layer.color, rough));
        m.name = forBase ? "pattern-base" : "pattern-top";
        group.add(m);
      }
    }
  };
  addLayers(o.pattern, false, 1, 0.5);
  addLayers(o.basePattern, true, -1, 0.32);
  if (o.inserts) {
    const m = new THREE2.Mesh(detailGeometry(o), flat("#17171a", 0.55));
    m.name = "detail-inserts";
    group.add(m);
  }
  group.traverse((m) => {
    if (m.isMesh) {
      m.castShadow = o.castShadow;
      m.receiveShadow = o.receiveShadow;
    }
  });
  if (o.noseSticker !== "none") {
    const material = new THREE2.MeshBasicMaterial({ color: o.noseStickerColor });
    const radius = Math.min(0.085, o.length * 0.05, halfWidthAt(0.08, o) * 0.75);
    const sticker = new THREE2.Mesh(noseLineGeometry(o, stickerPaths(o.noseSticker), 0.135, radius, radius * 0.031), material);
    if (o.noseName) {
      const unit = Math.min(65e-4, halfWidthAt(0.21, o) / 30);
      const name = new THREE2.Mesh(noseLineGeometry(o, noseNamePaths(o.noseName), 0.215, unit, unit * 0.19), material);
      name.name = "nose-sticker-name";
      group.add(name);
    }
    sticker.name = "nose-sticker";
    group.add(sticker);
  }
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

// src/createSnowboardBinding.ts
import * as THREE3 from "three";
var DEFAULTS2 = {
  chassisColor: "#ece4d2",
  strapColor: "#20262f",
  accentColor: "#c9ccd1",
  padColor: "#26303c",
  footbedColor: "#22262c",
  castShadow: true,
  receiveShadow: true
};
var mat = (color2, rough = 0.55) => new THREE3.MeshStandardMaterial({ color: color2, roughness: rough, metalness: 0.05 });
function part(geo, m, parent, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE3.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  parent.add(mesh);
  return mesh;
}
function traceRR(t, w, h, r) {
  const x = -w / 2, y = -h / 2;
  t.moveTo(x + r, y);
  t.lineTo(x + w - r, y);
  t.quadraticCurveTo(x + w, y, x + w, y + r);
  t.lineTo(x + w, y + h - r);
  t.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  t.lineTo(x + r, y + h);
  t.quadraticCurveTo(x, y + h, x, y + h - r);
  t.lineTo(x, y + r);
  t.quadraticCurveTo(x, y, x + r, y);
  return t;
}
function plate(w, h, d, r = 0.01, bev = 3e-3) {
  const b = Math.min(bev, h * 0.45, w * 0.45, d * 0.45);
  const shape = traceRR(new THREE3.Shape(), w - 2 * b, d - 2 * b, Math.max(15e-4, r - b));
  const geo = new THREE3.ExtrudeGeometry(shape, {
    depth: Math.max(8e-4, h - 2 * b),
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 2,
    curveSegments: 4
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -(h - 2 * b) / 2, 0);
  return geo;
}
function bar(r, len) {
  return new THREE3.CapsuleGeometry(r, len, 3, 10);
}
function frameRing(d, h, t, wall) {
  const shape = traceRR(new THREE3.Shape(), d, h, Math.min(9e-3, h * 0.32));
  shape.holes.push(traceRR(new THREE3.Path(), d - wall * 2, h - wall * 2, Math.max(2e-3, Math.min(9e-3, h * 0.32) - wall * 0.6)));
  const geo = new THREE3.ExtrudeGeometry(shape, {
    depth: t,
    bevelEnabled: true,
    bevelThickness: 12e-4,
    bevelSize: 12e-4,
    bevelSegments: 1,
    curveSegments: 5
  });
  geo.rotateY(Math.PI / 2);
  geo.translate(-t / 2, 0, 0);
  return geo;
}
function segmentedStrap(parent, m, opt) {
  const geo = new THREE3.SphereGeometry(1, 10, 7);
  for (let i = 0; i < opt.n; i++) {
    const th = Math.PI * (0.08 + 0.84 * ((i + 0.5) / opt.n));
    const x = opt.cx + opt.rx * Math.cos(th);
    const y = opt.cy + opt.ry * Math.sin(th);
    const seg = part(geo, m, parent, x, y, opt.cz, 0, 0, th + Math.PI / 2);
    seg.scale.set(opt.segRx, opt.segRy, opt.segRz);
  }
}
function frameBuckle(parent, frame, inset, x, y, z, h, d) {
  part(frameRing(d, h, 0.011, 75e-4), frame, parent, x, y, z);
  part(plate(0.013, h * 0.6, d * 0.6, 6e-3, 3e-3), inset, parent, x - 1e-3, y, z);
}
function createSnowboardBinding(options = {}) {
  const o = { ...DEFAULTS2, ...options };
  const chassis = mat(o.chassisColor, 0.5), strapM = mat(o.strapColor, 0.75);
  const accent = mat(o.accentColor, 0.3), pad = mat(o.padColor, 0.7), bed = mat(o.footbedColor, 0.85);
  const steel = mat("#8f979e", 0.35);
  const root = new THREE3.Group();
  root.name = "SnowboardBinding";
  const base = new THREE3.Group();
  base.name = "chassis";
  root.add(base);
  part(new THREE3.CylinderGeometry(0.058, 0.058, 8e-3, 24), steel, base, 0, 4e-3, 0.01);
  part(plate(0.2, 9e-3, 0.36, 0.04, 35e-4), chassis, base, 0, 0.012, 0.015);
  for (const sx of [-1, 1]) {
    part(plate(0.015, 0.02, 0.33, 7e-3, 4e-3), chassis, base, sx * 0.096, 0.026, 0.01);
    part(plate(0.015, 0.05, 0.055, 6e-3, 5e-3), chassis, base, sx * 0.096, 0.045, 0.128);
    part(plate(0.015, 0.055, 0.06, 6e-3, 5e-3), chassis, base, sx * 0.096, 0.048, -0.108);
    const strut = part(bar(85e-4, 0.165), chassis, base, sx * 0.096, 0.062, 0.012, -0.16 + Math.PI / 2);
    strut.scale.set(1, 1, 0.62);
  }
  part(plate(0.182, 7e-3, 0.335, 0.03, 3e-3), bed, base, 0, 0.02, 0.012);
  part(plate(0.182, 6e-3, 0.075, 0.02, 25e-4), bed, base, 0, 0.023, 0.175, -0.12);
  const cup = part(new THREE3.CylinderGeometry(0.104, 0.104, 0.055, 20, 1, true, Math.PI - 1.15, 2.3), chassis, base, 0, 0.047, -0.052);
  cup.material.side = THREE3.DoubleSide;
  cup.name = "heelcup";
  const lipGeo = new THREE3.TorusGeometry(0.104, 55e-4, 8, 20, 2.3);
  lipGeo.rotateZ(-Math.PI / 2 - 1.15);
  lipGeo.rotateX(Math.PI / 2);
  part(lipGeo, chassis, base, 0, 0.0745, -0.052);
  const hb = new THREE3.Group();
  hb.name = "highback";
  hb.position.set(0, 0.05, -0.148);
  hb.rotation.x = 0.17;
  base.add(hb);
  for (const sx of [-1, 1]) {
    const post = part(bar(0.0105, 0.183), chassis, hb, sx * 0.072, 0.102, 0);
    post.scale.set(1, 1, 0.58);
  }
  const topBarGeo = bar(95e-4, 0.144);
  topBarGeo.rotateZ(Math.PI / 2);
  const topBar = part(topBarGeo, chassis, hb, 0, 0.205, 0);
  topBar.scale.set(1, 1, 0.62);
  for (const s of [-1, 1]) {
    const strut = part(bar(78e-4, 0.209), chassis, hb, 0, 0.102, 2e-3, 0, 0, s * 0.6);
    strut.scale.set(1, 1, 0.58);
  }
  {
    const shape = new THREE3.Shape();
    shape.moveTo(-0.058, 0.182);
    shape.lineTo(0.058, 0.182);
    shape.lineTo(0, 0.075);
    shape.closePath();
    const tri = new THREE3.Mesh(new THREE3.ExtrudeGeometry(shape, {
      depth: 4e-3,
      bevelEnabled: true,
      bevelThickness: 16e-4,
      bevelSize: 16e-4,
      bevelSegments: 1
    }), pad);
    tri.position.z = -62e-4;
    hb.add(tri);
  }
  part(plate(0.13, 0.07, 7e-3, 0.012, 3e-3), pad, hb, 0, 0.04, 0.0105);
  part(plate(0.05, 0.045, 0.02, 8e-3, 5e-3), chassis, base, 0, 0.045, -0.168);
  const ankle = new THREE3.Group();
  ankle.name = "strap-ankle";
  ankle.userData.detachable = true;
  root.add(ankle);
  segmentedStrap(ankle, strapM, { cx: 0, cy: 0.05, cz: -5e-3, rx: 0.099, ry: 0.09, n: 7, segRx: 0.026, segRy: 0.0105, segRz: 0.044 });
  frameBuckle(ankle, accent, strapM, 0.105, 0.07, -5e-3, 0.042, 0.06);
  part(plate(8e-3, 0.02, 0.09, 4e-3, 25e-4), chassis, ankle, -0.104, 0.062, -5e-3);
  const toe = new THREE3.Group();
  toe.name = "strap-toe";
  toe.userData.detachable = true;
  root.add(toe);
  segmentedStrap(toe, strapM, { cx: 0, cy: 0.04, cz: 0.128, rx: 0.089, ry: 0.064, n: 5, segRx: 0.027, segRy: 95e-4, segRz: 0.029 });
  part(plate(0.13, 0.045, 0.015, 0.012, 5e-3), strapM, toe, 0, 0.048, 0.182, 0.35);
  frameBuckle(toe, accent, strapM, 0.102, 0.062, 0.128, 0.036, 0.05);
  part(plate(8e-3, 0.018, 0.07, 4e-3, 25e-4), chassis, toe, -0.101, 0.05, 0.128);
  root.traverse((m) => {
    if (m.isMesh) {
      m.castShadow = o.castShadow;
      m.receiveShadow = o.receiveShadow;
    }
  });
  root.userData.bindingSpec = {
    fitsBoot: { width: 0.17, length: 0.33 },
    innerWidth: 0.19,
    footbedLength: 0.36,
    highbackHeight: 0.25,
    detachable: ["strap-ankle", "strap-toe"],
    style: "v26 rounded: thin capsule X highback, pillow straps, rounded plates"
  };
  return root;
}

// src/createSkis.ts
import * as THREE4 from "three";

// src/riderSpec.ts
var SKI_LENGTH = 1.7;

// src/createSkis.ts
var DEFAULTS3 = {
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
function halfWidthAt2(t, o) {
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
function liftAt2(t) {
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
function thicknessFactor2(t, sAbs) {
  const ends = (0.5 + 0.5 * THREE4.MathUtils.smoothstep(t, 0, 0.08)) * (1 - 0.35 * THREE4.MathUtils.smoothstep(t, 0.94, 1));
  const edge = 1 - 0.35 * THREE4.MathUtils.smoothstep(sAbs, 0.75, 1);
  return ends * edge;
}
function buildGrid2(o) {
  const [NL, NC] = o.segments;
  const count = (NL + 1) * (NC + 1);
  const topPos = new Float32Array(count * 3), botPos = new Float32Array(count * 3);
  const xArr = new Float32Array(count), tArr = new Float32Array(count);
  for (let i = 0; i <= NL; i++) {
    const t = i / NL, hw = halfWidthAt2(t, o);
    for (let j = 0; j <= NC; j++) {
      const k = i * (NC + 1) + j, s = j / NC * 2 - 1, x = s * hw;
      const half = o.thickness / 2 * thicknessFactor2(t, Math.abs(s));
      const ym = liftAt2(t), z = t * o.length - o.length / 2;
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
  const g = new THREE4.BufferGeometry();
  g.setAttribute("position", new THREE4.BufferAttribute(side > 0 ? grid.topPos.slice() : grid.botPos.slice(), 3));
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
  const g = new THREE4.BufferGeometry();
  g.setAttribute("position", new THREE4.Float32BufferAttribute(pos, 3));
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
  const g = new THREE4.BufferGeometry();
  g.setAttribute("position", new THREE4.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function createSki(options = {}) {
  const o = { ...DEFAULTS3, ...options };
  const grid = buildGrid2(o);
  const flat = (color2, rough = 0.5) => new THREE4.MeshStandardMaterial({ color: color2, roughness: rough, metalness: 0 });
  const g = new THREE4.Group();
  g.name = "Ski";
  const wall = new THREE4.Mesh(sidewall(grid), flat(o.sidewallColor, 0.62));
  wall.material.side = THREE4.DoubleSide;
  g.add(wall);
  const top = new THREE4.Mesh(surface(grid, 1), flat(o.topsheetColor));
  const base = new THREE4.Mesh(surface(grid, -1), flat(o.baseColor, 0.32));
  applySurfaceGradient(top, options.topsheetTailColor);
  applySurfaceGradient(base, options.baseTailColor);
  g.add(top, base);
  const stripe = inlay(grid, (x) => Math.abs(x) < 0.011);
  if (stripe) {
    const m = new THREE4.Mesh(stripe, flat(o.stripeColor));
    m.name = "stripe";
    g.add(m);
  }
  const accents = inlay(grid, (x, t) => t > 0.07 && t < 0.13 && Math.abs(x) < 0.02 || t > 0.86 && t < 0.9 && Math.abs(x) < 0.02);
  if (accents) {
    const m = new THREE4.Mesh(accents, flat(o.accentColor));
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

// src/createSkiBinding.ts
import * as THREE5 from "three";
var DEFAULTS4 = {
  bodyColor: "#232327",
  steelColor: "#a9b2b8",
  accentColor: "#e86a1c",
  castShadow: true,
  receiveShadow: true
};
var mat2 = (color2, rough = 0.45) => new THREE5.MeshStandardMaterial({ color: color2, roughness: rough, metalness: 0.1 });
function part2(geo, m, parent, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE5.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  parent.add(mesh);
  return mesh;
}
function plate2(w, h, d, r = 0.01, bev = 3e-3) {
  const b = Math.min(bev, h * 0.45, w * 0.45, d * 0.45);
  const s = new THREE5.Shape();
  const x = -(w - 2 * b) / 2, y = -(d - 2 * b) / 2, sw = w - 2 * b, sd = d - 2 * b, sr = Math.max(15e-4, r - b);
  s.moveTo(x + sr, y);
  s.lineTo(x + sw - sr, y);
  s.quadraticCurveTo(x + sw, y, x + sw, y + sr);
  s.lineTo(x + sw, y + sd - sr);
  s.quadraticCurveTo(x + sw, y + sd, x + sw - sr, y + sd);
  s.lineTo(x + sr, y + sd);
  s.quadraticCurveTo(x, y + sd, x, y + sd - sr);
  s.lineTo(x, y + sr);
  s.quadraticCurveTo(x, y, x + sr, y);
  const geo = new THREE5.ExtrudeGeometry(s, {
    depth: Math.max(8e-4, h - 2 * b),
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 2,
    curveSegments: 4
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -(h - 2 * b) / 2, 0);
  return geo;
}
function createSkiBinding(options = {}) {
  const o = { ...DEFAULTS4, ...options };
  const body = mat2(o.bodyColor), steel = mat2(o.steelColor, 0.3), accent = mat2(o.accentColor, 0.4);
  const root = new THREE5.Group();
  root.name = "SkiBinding";
  part2(plate2(0.07, 8e-3, 0.46, 0.02, 3e-3), steel, root, 0, 4e-3, 0);
  const toe = new THREE5.Group();
  toe.name = "toe-piece";
  root.add(toe);
  part2(plate2(0.075, 0.012, 0.09, 0.012, 4e-3), body, toe, 0, 0.012, -0.155);
  part2(plate2(0.06, 0.034, 0.068, 0.012, 8e-3), body, toe, 0, 0.034, -0.158);
  const wingGeo = new THREE5.CapsuleGeometry(95e-4, 0.033, 3, 10);
  wingGeo.rotateX(Math.PI / 2);
  for (const sx of [-1, 1]) part2(wingGeo, steel, toe, sx * 0.036, 0.03, -0.185, 0, sx * -0.5);
  part2(new THREE5.CylinderGeometry(0.011, 0.011, 0.012, 12), accent, toe, 0, 0.056, -0.158);
  part2(plate2(0.055, 4e-3, 0.042, 8e-3, 16e-4), steel, toe, 0, 0.014, -0.112);
  const heel = new THREE5.Group();
  heel.name = "heel-piece";
  root.add(heel);
  part2(plate2(0.07, 0.012, 0.1, 0.012, 4e-3), body, heel, 0, 0.012, 0.16);
  part2(plate2(0.055, 0.044, 0.06, 0.012, 9e-3), body, heel, 0, 0.036, 0.168);
  part2(plate2(0.048, 0.02, 0.014, 5e-3, 4e-3), steel, heel, 0, 0.03, 0.132);
  part2(new THREE5.CapsuleGeometry(0.0105, 0.088, 3, 10), body, heel, 0, 0.085, 0.208, 0.5);
  part2(new THREE5.CapsuleGeometry(0.011, 0.014, 3, 10), accent, heel, 0, 0.128, 0.232, 0.5);
  const brakes = new THREE5.Group();
  brakes.name = "brakes";
  root.add(brakes);
  const armGeo = new THREE5.CylinderGeometry(32e-4, 32e-4, 0.052, 8);
  armGeo.rotateZ(Math.PI / 2);
  for (const sx of [-1, 1]) {
    part2(armGeo, steel, brakes, sx * 0.048, 0.012, 0.155, 0, 0, sx * 0.15);
    part2(plate2(0.032, 4e-3, 0.052, 8e-3, 16e-4), body, brakes, sx * 0.072, 3e-3, 0.16);
  }
  root.traverse((m) => {
    if (m.isMesh) {
      m.castShadow = o.castShadow;
      m.receiveShadow = o.receiveShadow;
    }
  });
  root.userData.bindingSpec = { bootSoleLength: 0.34, stackHeight: 0.035, brakeWidth: 0.145 };
  return root;
}
export {
  MAX_DESIGN_BYTES,
  boardOptions,
  createSki,
  createSkiBinding,
  createSnowboardBinding,
  createSwallowtailBoard,
  parseGearDesign,
  serializeGearDesign,
  skiOptions
};
