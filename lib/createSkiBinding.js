// src/createSkiBinding.ts
import * as THREE from "three";
var DEFAULTS = {
  bodyColor: "#232327",
  steelColor: "#a9b2b8",
  accentColor: "#e86a1c",
  castShadow: true,
  receiveShadow: true
};
var mat = (color, rough = 0.45) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.1 });
function part(geo, m, parent, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  parent.add(mesh);
  return mesh;
}
var box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function createSkiBinding(options = {}) {
  const o = { ...DEFAULTS, ...options };
  const body = mat(o.bodyColor), steel = mat(o.steelColor, 0.3), accent = mat(o.accentColor, 0.4);
  const root = new THREE.Group();
  root.name = "SkiBinding";
  part(box(0.07, 8e-3, 0.46), steel, root, 0, 4e-3, 0);
  const toe = new THREE.Group();
  toe.name = "toe-piece";
  root.add(toe);
  part(box(0.075, 0.012, 0.09), body, toe, 0, 0.012, -0.155);
  part(box(0.06, 0.034, 0.068), body, toe, 0, 0.034, -0.158);
  for (const sx of [-1, 1]) part(box(0.02, 0.02, 0.052), steel, toe, sx * 0.036, 0.03, -0.185, 0, sx * -0.5);
  part(new THREE.CylinderGeometry(0.011, 0.011, 0.012, 12), accent, toe, 0, 0.056, -0.158);
  part(box(0.055, 4e-3, 0.042), steel, toe, 0, 0.014, -0.112);
  const heel = new THREE.Group();
  heel.name = "heel-piece";
  root.add(heel);
  part(box(0.07, 0.012, 0.1), body, heel, 0, 0.012, 0.16);
  part(box(0.055, 0.044, 0.06), body, heel, 0, 0.036, 0.168);
  part(box(0.048, 0.02, 0.014), steel, heel, 0, 0.03, 0.132);
  const lever = part(box(0.016, 0.115, 0.028), body, heel, 0, 0.085, 0.208, 0.5);
  part(box(0.02, 0.03, 0.032), accent, heel, 0, 0.128, 0.232, 0.5);
  void lever;
  const brakes = new THREE.Group();
  brakes.name = "brakes";
  root.add(brakes);
  for (const sx of [-1, 1]) {
    part(box(0.052, 4e-3, 0.012), steel, brakes, sx * 0.048, 0.012, 0.155, 0, 0, sx * 0.15);
    part(box(0.032, 4e-3, 0.052), body, brakes, sx * 0.072, 3e-3, 0.16);
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
var createSkiBinding_default = createSkiBinding;
export {
  createSkiBinding,
  createSkiBinding_default as default
};
