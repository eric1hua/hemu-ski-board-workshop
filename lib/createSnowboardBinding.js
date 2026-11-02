// src/createSnowboardBinding.ts
import * as THREE from "three";
var DEFAULTS = {
  chassisColor: "#26262b",
  strapColor: "#3a3a41",
  accentColor: "#e86a1c",
  // the game's classic binding orange
  footbedColor: "#454b58",
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
function createSnowboardBinding(options = {}) {
  const o = { ...DEFAULTS, ...options };
  const chassis = mat(o.chassisColor), strapM = mat(o.strapColor, 0.7), accent = mat(o.accentColor, 0.4), bed = mat(o.footbedColor, 0.8);
  const steel = mat("#8f979e", 0.35);
  const root = new THREE.Group();
  root.name = "SnowboardBinding";
  const base = new THREE.Group();
  base.name = "chassis";
  root.add(base);
  part(new THREE.CylinderGeometry(0.058, 0.058, 8e-3, 24), steel, base, 0, 4e-3, 0.01);
  part(box(0.2, 0.01, 0.36), chassis, base, 0, 0.013, 0.015);
  for (const sx of [-1, 1]) part(box(0.014, 0.038, 0.33), chassis, base, sx * 0.096, 0.032, 0.01);
  part(box(0.182, 7e-3, 0.335), bed, base, 0, 0.0215, 0.012);
  part(box(0.182, 6e-3, 0.075), bed, base, 0, 0.025, 0.175, -0.12);
  const cup = part(new THREE.CylinderGeometry(0.104, 0.104, 0.07, 20, 1, true, Math.PI - 1.15, 2.3), chassis, base, 0, 0.055, -0.052);
  cup.material = chassis;
  cup.material.side = THREE.DoubleSide;
  cup.name = "heelcup";
  const hb = new THREE.Group();
  hb.name = "highback";
  hb.position.set(0, 0.055, -0.148);
  hb.rotation.x = 0.17;
  base.add(hb);
  part(box(0.155, 0.235, 0.016), chassis, hb, 0, 0.115, 0);
  part(box(0.15, 0.07, 0.026), accent, hb, 0, 0.205, -4e-3);
  part(box(0.05, 0.045, 0.022), accent, base, 0, 0.045, -0.168);
  const ankle = new THREE.Group();
  ankle.name = "strap-ankle";
  ankle.userData.detachable = true;
  root.add(ankle);
  const band = part(new THREE.TorusGeometry(0.089, 0.021, 10, 22, Math.PI), strapM, ankle, 0, 0.062, -5e-3);
  band.scale.set(1, 1.05, 1.9);
  part(box(0.028, 0.05, 0.075), accent, ankle, 0.108, 0.075, -5e-3);
  part(box(0.02, 0.02, 0.05), steel, ankle, 0.108, 0.108, -5e-3);
  part(box(8e-3, 0.02, 0.09), chassis, ankle, -0.104, 0.07, -5e-3);
  const toe = new THREE.Group();
  toe.name = "strap-toe";
  toe.userData.detachable = true;
  root.add(toe);
  const capBand = part(new THREE.TorusGeometry(0.078, 0.017, 10, 20, Math.PI), strapM, toe, 0, 0.05, 0.128);
  capBand.scale.set(1, 1, 1.7);
  part(box(0.145, 0.055, 0.018), strapM, toe, 0, 0.055, 0.183, 0.35);
  part(box(0.026, 0.042, 0.06), accent, toe, 0.104, 0.06, 0.128);
  part(box(8e-3, 0.018, 0.07), chassis, toe, -0.102, 0.055, 0.128);
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
    highbackHeight: 0.24,
    detachable: ["strap-ankle", "strap-toe"]
  };
  return root;
}
var createSnowboardBinding_default = createSnowboardBinding;
export {
  createSnowboardBinding,
  createSnowboardBinding_default as default
};
