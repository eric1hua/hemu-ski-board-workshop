// A procedural stand-in for the game's rider, built to the game's own
// proportions (src/riderSpec.ts): trunk 0.591 m, total height ~1.80 m,
// chunky boots. NOT the game's GLB — the real character models stay in the
// private hemu-ski repo; this figure exists so gear fit and glide poses can
// be reviewed in this public workshop. Flat colours, jointed limbs: the
// review page animates the joints for the in-place glide.
//
// Figure-local frame: front (face, boot toes) toward +z.
//   - board pose: legs spread along local x (front leg +0.256), so the page
//     rotates the figure +90° about y to stand sideways on the board: local
//     +x -> board nose (-z world), local +z -> board toe edge (+x world).
//   - ski pose: legs at local x ±0.125, page rotates 180° so the figure
//     faces the ski tips (-z world).
// Only dependency: three.

import * as THREE from 'three';

export interface RiderFigure {
  group: THREE.Group;
  glide: (t: number) => void;
  rest: () => void;
}

const M = (c: string, r = 0.75) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

function limb(parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

/** One leg: thigh pivot at hip, shin pivot at knee, chunky boot on the shin.
 *  Boot toe toward local +z. */
function buildLeg() {
  const hip = new THREE.Group();
  limb(hip, box(0.13, 0.44, 0.15), M('#33404f', 0.85), 0, -0.22, 0);
  const knee = new THREE.Group();
  knee.position.set(0, -0.44, 0);
  hip.add(knee);
  limb(knee, box(0.115, 0.42, 0.13), M('#33404f', 0.85), 0, -0.21, 0);
  const boot = limb(knee, box(0.17, 0.15, 0.33), M('#1d1d20', 0.6), 0, -0.44, 0.055);
  boot.name = 'boot';
  return { hip, knee };
}

function buildArm() {
  const sh = new THREE.Group();
  limb(sh, box(0.105, 0.36, 0.115), M('#2f7f8f', 0.85), 0, -0.17, 0);
  const el = new THREE.Group();
  el.position.set(0, -0.35, 0);
  sh.add(el);
  limb(el, box(0.09, 0.32, 0.095), M('#2f7f8f', 0.85), 0, -0.15, 0);
  limb(el, box(0.085, 0.1, 0.09), M('#e86a1c', 0.7), 0, -0.34, 0); // glove
  return { sh, el };
}

export function createRiderFigure(pose: 'board' | 'ski'): RiderFigure {
  const g = new THREE.Group();
  g.name = 'RiderFigure';

  const hips = new THREE.Group();
  g.add(hips);
  limb(hips, box(0.3, 0.19, 0.21), M('#33404f', 0.85), 0, 0.02, 0);

  const torso = new THREE.Group();
  torso.position.y = 0.1;
  hips.add(torso);
  limb(torso, box(0.36, 0.46, 0.24), M('#2f7f8f', 0.85), 0, 0.24, 0);
  limb(torso, box(0.37, 0.09, 0.25), M('#f2a7b9', 0.8), 0, 0.03, 0);

  const head = new THREE.Group();
  head.position.y = 0.52;
  torso.add(head);
  limb(head, new THREE.SphereGeometry(0.105, 18, 14), M('#f0c8a8', 0.6), 0, 0.1, 0);
  limb(head, box(0.15, 0.13, 0.14), M('#3a2e28', 0.95), 0, 0.095, -0.04);
  limb(head, new THREE.CylinderGeometry(0.108, 0.114, 0.07, 16), M('#e86a1c', 0.85), 0, 0.182, 0);
  limb(head, new THREE.SphereGeometry(0.034, 10, 8), M('#f4f7fa', 0.9), 0, 0.232, 0); // beanie pompom
  for (const sx of [-1, 1]) {
    const ear = limb(head, new THREE.ConeGeometry(0.038, 0.095, 4), M('#3a2e28', 0.95), sx * 0.07, 0.245, 0);
    ear.rotation.y = Math.PI / 4;
  }
  limb(head, box(0.13, 0.045, 0.02), M('#bfe3f2', 0.3), 0, 0.1, 0.1);

  const armL = buildArm(), armR = buildArm();
  armL.sh.position.set(-0.235, 0.44, 0);
  armR.sh.position.set(0.235, 0.44, 0);
  torso.add(armL.sh, armR.sh);

  if (pose === 'ski') {
    // Ski poles: grip at the glove, shaft angling down-back, basket + tip.
    for (const arm of [armL, armR]) {
      const pole = new THREE.Group();
      pole.position.set(0, -0.32, 0.02);
      pole.rotation.x = 0.42;
      arm.el.add(pole);
      limb(pole, new THREE.CylinderGeometry(0.008, 0.008, 1.0, 8), M('#c8ced4', 0.35), 0, -0.5, 0);
      limb(pole, new THREE.CylinderGeometry(0.035, 0.045, 0.02, 10), M('#e86a1c', 0.6), 0, -0.9, 0);
      limb(pole, box(0.03, 0.09, 0.03), M('#1d1d20', 0.6), 0, 0.02, 0); // grip
    }
  }

  const legL = buildLeg(), legR = buildLeg();
  hips.add(legL.hip, legR.hip);

  // Neutral joint snapshot, filled by the pose functions.
  const rest = {
    hipsY: 0.86, torsoRX: 0, torsoRZ: 0,
    legL: { p: new THREE.Vector3(), hip: new THREE.Euler(), knee: new THREE.Euler() },
    legR: { p: new THREE.Vector3(), hip: new THREE.Euler(), knee: new THREE.Euler() },
    armL: { sh: new THREE.Euler(), el: new THREE.Euler() },
    armR: { sh: new THREE.Euler(), el: new THREE.Euler() },
  };
  function snapshot() {
    rest.hipsY = hips.position.y;
    rest.torsoRX = torso.rotation.x;
    rest.legL.p.copy(legL.hip.position); rest.legL.hip.copy(legL.hip.rotation); rest.legL.knee.copy(legL.knee.rotation);
    rest.legR.p.copy(legR.hip.position); rest.legR.hip.copy(legR.hip.rotation); rest.legR.knee.copy(legR.knee.rotation);
    rest.armL.sh.copy(armL.sh.rotation); rest.armL.el.copy(armL.el.rotation);
    rest.armR.sh.copy(armR.sh.rotation); rest.armR.el.copy(armR.el.rotation);
  }

  if (pose === 'board') {
    // Sideways stance: spread along local x, gentle knee bend in the x-y
    // plane (rotation.z), arms out for balance, face/toes toward +z.
    legL.hip.position.set(-0.256, -0.04, 0);
    legR.hip.position.set(0.256, -0.04, 0);
    legR.hip.rotation.z = 0.26; legR.knee.rotation.z = -0.44;   // front leg
    legL.hip.rotation.z = -0.26; legL.knee.rotation.z = 0.44;   // back leg
    hips.position.y = 0.79;
    torso.rotation.y = -0.15;
    torso.rotation.x = 0.1; // slight crouch toward the toe edge
    armL.sh.rotation.set(0, 0, 0.82); armR.sh.rotation.set(0, 0, -0.82);
    armL.el.rotation.z = 0.2; armR.el.rotation.z = -0.2;
    armL.el.rotation.x = -0.38; armR.el.rotation.x = -0.38; // forearms angle forward, not a T-pose
  } else {
    // Parallel stance, knees bent forward (rotation.x), forward lean.
    legL.hip.position.set(-0.125, -0.04, 0);
    legR.hip.position.set(0.125, -0.04, 0);
    for (const leg of [legL, legR]) { leg.hip.rotation.x = -0.38; leg.knee.rotation.x = 0.62; }
    hips.position.y = 0.86;
    torso.rotation.x = 0.14;
    armL.sh.rotation.set(-0.48, 0, 0.22); armR.sh.rotation.set(-0.48, 0, -0.22);
    armL.el.rotation.x = -0.5; armR.el.rotation.x = -0.5;
  }
  snapshot();

  function restPose() {
    hips.position.y = rest.hipsY;
    hips.rotation.set(0, 0, 0);
    torso.rotation.set(rest.torsoRX, pose === 'board' ? -0.15 : 0, 0);
    legL.hip.rotation.copy(rest.legL.hip); legL.knee.rotation.copy(rest.legL.knee);
    legR.hip.rotation.copy(rest.legR.hip); legR.knee.rotation.copy(rest.legR.knee);
    armL.sh.rotation.copy(rest.armL.sh); armR.sh.rotation.copy(rest.armR.sh);
  }

  function glide(t: number) {
    const sway = Math.sin(t * 1.6);
    const spring = (Math.sin(t * 3.2) + 1) / 2;
    if (pose === 'board') {
      hips.position.y = rest.hipsY - 0.015 - spring * 0.03;
      hips.position.z = sway * 0.03;                 // weight toe<->heel side
      torso.rotation.x = sway * 0.09;                // lean with the carve
      torso.rotation.y = -0.15 + sway * 0.1;
      legL.knee.rotation.z = rest.legL.knee.z + spring * 0.12;
      legR.knee.rotation.z = rest.legR.knee.z - spring * 0.12;
      armL.sh.rotation.z = rest.armL.sh.z + sway * 0.18;
      armR.sh.rotation.z = rest.armR.sh.z + sway * 0.18;
    } else {
      hips.position.y = rest.hipsY - spring * 0.028;
      torso.rotation.x = rest.torsoRX + spring * 0.05;
      torso.rotation.z = sway * 0.045;
      legL.knee.rotation.x = rest.legL.knee.x + spring * 0.13;
      legR.knee.rotation.x = rest.legR.knee.x + spring * 0.13;
      armL.sh.rotation.x = rest.armL.sh.x - sway * 0.1;
      armR.sh.rotation.x = rest.armR.sh.x + sway * 0.1;
    }
  }

  g.traverse((m) => { if ((m as THREE.Mesh).isMesh) m.castShadow = true; });
  return { group: g, glide, rest: restPose };
}

export default createRiderFigure;
