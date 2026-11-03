// src/createBootLast.ts
import * as THREE from "three";
function createBootLast(kind = "board") {
  const g = new THREE.Group();
  g.name = "BootLast";
  const m = new THREE.MeshStandardMaterial({ color: "#e8e3d5", roughness: 0.85, transparent: true, opacity: 0.92 });
  const len = kind === "board" ? 0.33 : 0.34;
  const dir = kind === "board" ? 1 : -1;
  const add = (geo, x, y, z, rx = 0) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z * dir);
    mesh.rotation.x = rx * dir;
    g.add(mesh);
    return mesh;
  };
  const ball = (sx, sy, sz, x, y, z) => {
    const mesh = add(new THREE.SphereGeometry(1, 14, 10), x, y, z);
    mesh.scale.set(sx, sy, sz);
    return mesh;
  };
  ball(0.084, 0.016, len / 2, 0, 0.016, -4e-3);
  ball(0.08, 0.052, 0.078, 0, 0.055, -(len / 2 - 0.075));
  ball(0.083, 0.046, 0.145, 0, 0.05, -0.01);
  ball(0.08, 0.046, 0.095, 0, 0.047, len / 2 - 0.088);
  ball(0.07, 0.062, 0.085, 0, 0.108, -0.038);
  const shaft = add(new THREE.CylinderGeometry(0.064, 0.076, 0.145, 20), 0, 0.1975, -0.048, 0.1);
  shaft.scale.set(0.94, 1, 1.1);
  const cuff = add(new THREE.TorusGeometry(0.066, 0.0125, 10, 24), 0, 0.2696, -0.0408, Math.PI / 2 + 0.1);
  cuff.scale.set(0.94, 1.1, 1);
  g.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  g.userData.bootSpec = { kind, width: 0.17, length: len };
  return g;
}
var createBootLast_default = createBootLast;
export {
  createBootLast,
  createBootLast_default as default
};
