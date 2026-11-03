// src/createSnowboardBinding.ts
import * as THREE from "three";
var DEFAULTS = {
  chassisColor: "#ece4d2",
  strapColor: "#20262f",
  accentColor: "#c9ccd1",
  padColor: "#26303c",
  footbedColor: "#22262c",
  castShadow: true,
  receiveShadow: true
};
var mat = (color, rough = 0.55) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05 });
function part(geo, m, parent, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(geo, m);
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
  const shape = traceRR(new THREE.Shape(), w - 2 * b, d - 2 * b, Math.max(15e-4, r - b));
  const geo = new THREE.ExtrudeGeometry(shape, {
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
  return new THREE.CapsuleGeometry(r, len, 3, 10);
}
function frameRing(d, h, t, wall) {
  const shape = traceRR(new THREE.Shape(), d, h, Math.min(9e-3, h * 0.32));
  shape.holes.push(traceRR(new THREE.Path(), d - wall * 2, h - wall * 2, Math.max(2e-3, Math.min(9e-3, h * 0.32) - wall * 0.6)));
  const geo = new THREE.ExtrudeGeometry(shape, {
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
  const geo = new THREE.SphereGeometry(1, 10, 7);
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
  const o = { ...DEFAULTS, ...options };
  const chassis = mat(o.chassisColor, 0.5), strapM = mat(o.strapColor, 0.75);
  const accent = mat(o.accentColor, 0.3), pad = mat(o.padColor, 0.7), bed = mat(o.footbedColor, 0.85);
  const steel = mat("#8f979e", 0.35);
  const root = new THREE.Group();
  root.name = "SnowboardBinding";
  const base = new THREE.Group();
  base.name = "chassis";
  root.add(base);
  part(new THREE.CylinderGeometry(0.058, 0.058, 8e-3, 24), steel, base, 0, 4e-3, 0.01);
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
  const cup = part(new THREE.CylinderGeometry(0.104, 0.104, 0.055, 20, 1, true, Math.PI - 1.15, 2.3), chassis, base, 0, 0.047, -0.052);
  cup.material.side = THREE.DoubleSide;
  cup.name = "heelcup";
  const lipGeo = new THREE.TorusGeometry(0.104, 55e-4, 8, 20, 2.3);
  lipGeo.rotateZ(-Math.PI / 2 - 1.15);
  lipGeo.rotateX(Math.PI / 2);
  part(lipGeo, chassis, base, 0, 0.0745, -0.052);
  const hb = new THREE.Group();
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
    const shape = new THREE.Shape();
    shape.moveTo(-0.058, 0.182);
    shape.lineTo(0.058, 0.182);
    shape.lineTo(0, 0.075);
    shape.closePath();
    const tri = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {
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
  const ankle = new THREE.Group();
  ankle.name = "strap-ankle";
  ankle.userData.detachable = true;
  root.add(ankle);
  segmentedStrap(ankle, strapM, { cx: 0, cy: 0.05, cz: -5e-3, rx: 0.099, ry: 0.09, n: 7, segRx: 0.026, segRy: 0.0105, segRz: 0.044 });
  frameBuckle(ankle, accent, strapM, 0.105, 0.07, -5e-3, 0.042, 0.06);
  part(plate(8e-3, 0.02, 0.09, 4e-3, 25e-4), chassis, ankle, -0.104, 0.062, -5e-3);
  const toe = new THREE.Group();
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
var createSnowboardBinding_default = createSnowboardBinding;
export {
  createSnowboardBinding,
  createSnowboardBinding_default as default
};
