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
  add(new THREE.BoxGeometry(0.17, 0.09, len - 0.06), 0, 0.045, -0.01);
  const toe = add(new THREE.SphereGeometry(0.085, 14, 10), 0, 0.05, len / 2 - 0.085);
  toe.scale.set(1, 0.62, 1.15);
  add(new THREE.BoxGeometry(0.145, 0.18, 0.16), 0, 0.17, -0.045, 0.1);
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
