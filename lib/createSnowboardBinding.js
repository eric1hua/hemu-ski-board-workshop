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
var box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function segmentedStrap(parent, m, opt) {
  for (let i = 0; i < opt.n; i++) {
    const th = Math.PI * (0.08 + 0.84 * ((i + 0.5) / opt.n));
    const x = opt.cx + opt.rx * Math.cos(th);
    const y = opt.cy + opt.ry * Math.sin(th);
    part(box(opt.segW, opt.thick, opt.depth), m, parent, x, y, opt.cz, 0, 0, th + Math.PI / 2);
  }
}
function frameBuckle(parent, frame, inset, x, y, z, h, d) {
  part(box(0.014, h, d), frame, parent, x, y, z);
  part(box(0.016, h * 0.62, d * 0.62), inset, parent, x, y, z);
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
  part(box(0.2, 9e-3, 0.36), chassis, base, 0, 0.012, 0.015);
  for (const sx of [-1, 1]) {
    part(box(0.014, 0.02, 0.33), chassis, base, sx * 0.096, 0.026, 0.01);
    part(box(0.014, 0.05, 0.055), chassis, base, sx * 0.096, 0.045, 0.128);
    part(box(0.014, 0.055, 0.06), chassis, base, sx * 0.096, 0.048, -0.108);
    part(box(0.012, 0.015, 0.185), chassis, base, sx * 0.096, 0.062, 0.012, -0.16);
  }
  part(box(0.182, 7e-3, 0.335), bed, base, 0, 0.02, 0.012);
  part(box(0.182, 6e-3, 0.075), bed, base, 0, 0.023, 0.175, -0.12);
  const cup = part(new THREE.CylinderGeometry(0.104, 0.104, 0.055, 20, 1, true, Math.PI - 1.15, 2.3), chassis, base, 0, 0.047, -0.052);
  cup.material.side = THREE.DoubleSide;
  cup.name = "heelcup";
  const hb = new THREE.Group();
  hb.name = "highback";
  hb.position.set(0, 0.05, -0.148);
  hb.rotation.x = 0.17;
  base.add(hb);
  for (const sx of [-1, 1]) part(box(0.017, 0.205, 0.02), chassis, hb, sx * 0.072, 0.102, 0);
  part(box(0.16, 0.028, 0.02), chassis, hb, 0, 0.205, 0);
  for (const s of [-1, 1]) part(box(0.026, 0.225, 0.014), chassis, hb, 0, 0.102, 2e-3, 0, 0, s * 0.6);
  {
    const shape = new THREE.Shape();
    shape.moveTo(-0.058, 0.182);
    shape.lineTo(0.058, 0.182);
    shape.lineTo(0, 0.075);
    shape.closePath();
    const tri = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.01, bevelEnabled: false }), pad);
    tri.position.z = -9e-3;
    hb.add(tri);
  }
  part(box(0.13, 0.07, 0.01), pad, hb, 0, 0.04, 0.012);
  part(box(0.05, 0.045, 0.022), chassis, base, 0, 0.045, -0.168);
  const ankle = new THREE.Group();
  ankle.name = "strap-ankle";
  ankle.userData.detachable = true;
  root.add(ankle);
  segmentedStrap(ankle, strapM, { cx: 0, cy: 0.05, cz: -5e-3, rx: 0.099, ry: 0.09, n: 7, segW: 0.042, thick: 0.015, depth: 0.086 });
  frameBuckle(ankle, accent, strapM, 0.105, 0.07, -5e-3, 0.042, 0.06);
  part(box(8e-3, 0.02, 0.09), chassis, ankle, -0.104, 0.062, -5e-3);
  const toe = new THREE.Group();
  toe.name = "strap-toe";
  toe.userData.detachable = true;
  root.add(toe);
  segmentedStrap(toe, strapM, { cx: 0, cy: 0.04, cz: 0.128, rx: 0.089, ry: 0.064, n: 5, segW: 0.045, thick: 0.0135, depth: 0.056 });
  part(box(0.13, 0.045, 0.016), strapM, toe, 0, 0.048, 0.182, 0.35);
  frameBuckle(toe, accent, strapM, 0.102, 0.062, 0.128, 0.036, 0.05);
  part(box(8e-3, 0.018, 0.07), chassis, toe, -0.101, 0.05, 0.128);
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
    style: "v24 reference: ivory X-frame highback, segmented straps"
  };
  return root;
}
var createSnowboardBinding_default = createSnowboardBinding;
export {
  createSnowboardBinding,
  createSnowboardBinding_default as default
};
