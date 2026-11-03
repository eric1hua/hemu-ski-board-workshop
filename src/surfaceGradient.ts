import * as THREE from 'three';

export function applySurfaceGradient(
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>,
  tailColor?: string,
) {
  if (!tailColor) return;

  const { geometry, material } = mesh;
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox!;
  const positions = geometry.getAttribute('position');
  const colors = new Float32Array(positions.count * 3);
  const head = material.color.clone();
  const tail = new THREE.Color(tailColor);
  const color = new THREE.Color();

  for (let i = 0; i < positions.count; i++) {
    const fraction = (positions.getZ(i) - min.z) / (max.z - min.z);
    color.copy(head).lerp(tail, fraction).toArray(colors, i * 3);
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  material.color.set(0xffffff);
  material.vertexColors = true;
}
