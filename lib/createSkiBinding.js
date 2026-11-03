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
function plate(w, h, d, r = 0.01, bev = 3e-3) {
  const b = Math.min(bev, h * 0.45, w * 0.45, d * 0.45);
  const s = new THREE.Shape();
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
  const geo = new THREE.ExtrudeGeometry(s, {
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
  const o = { ...DEFAULTS, ...options };
  const body = mat(o.bodyColor), steel = mat(o.steelColor, 0.3), accent = mat(o.accentColor, 0.4);
  const root = new THREE.Group();
  root.name = "SkiBinding";
  part(plate(0.07, 8e-3, 0.46, 0.02, 3e-3), steel, root, 0, 4e-3, 0);
  const toe = new THREE.Group();
  toe.name = "toe-piece";
  root.add(toe);
  part(plate(0.075, 0.012, 0.09, 0.012, 4e-3), body, toe, 0, 0.012, -0.155);
  part(plate(0.06, 0.034, 0.068, 0.012, 8e-3), body, toe, 0, 0.034, -0.158);
  const wingGeo = new THREE.CapsuleGeometry(95e-4, 0.033, 3, 10);
  wingGeo.rotateX(Math.PI / 2);
  for (const sx of [-1, 1]) part(wingGeo, steel, toe, sx * 0.036, 0.03, -0.185, 0, sx * -0.5);
  part(new THREE.CylinderGeometry(0.011, 0.011, 0.012, 12), accent, toe, 0, 0.056, -0.158);
  part(plate(0.055, 4e-3, 0.042, 8e-3, 16e-4), steel, toe, 0, 0.014, -0.112);
  const heel = new THREE.Group();
  heel.name = "heel-piece";
  root.add(heel);
  part(plate(0.07, 0.012, 0.1, 0.012, 4e-3), body, heel, 0, 0.012, 0.16);
  part(plate(0.055, 0.044, 0.06, 0.012, 9e-3), body, heel, 0, 0.036, 0.168);
  part(plate(0.048, 0.02, 0.014, 5e-3, 4e-3), steel, heel, 0, 0.03, 0.132);
  part(new THREE.CapsuleGeometry(0.0105, 0.088, 3, 10), body, heel, 0, 0.085, 0.208, 0.5);
  part(new THREE.CapsuleGeometry(0.011, 0.014, 3, 10), accent, heel, 0, 0.128, 0.232, 0.5);
  const brakes = new THREE.Group();
  brakes.name = "brakes";
  root.add(brakes);
  const armGeo = new THREE.CylinderGeometry(32e-4, 32e-4, 0.052, 8);
  armGeo.rotateZ(Math.PI / 2);
  for (const sx of [-1, 1]) {
    part(armGeo, steel, brakes, sx * 0.048, 0.012, 0.155, 0, 0, sx * 0.15);
    part(plate(0.032, 4e-3, 0.052, 8e-3, 16e-4), body, brakes, sx * 0.072, 3e-3, 0.16);
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
