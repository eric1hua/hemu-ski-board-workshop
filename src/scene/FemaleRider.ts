// The game's real female rider (user instruction, 2026-11-03): loads
// hemu-ski's female-rider GLB (65-bone Mixamo rig, walk/run clips) and
// poses her on the workshop's gear with the same trick the game uses —
// two-bone IK from hip socket to ankle, knees driven forward
// (src/player/rider.js in hemu-ski). She is scaled by the game's own spec:
// total height 1.8 m (rider-model.js, female: height 1.8).
//
// Pose API is world-space: the caller supplies ankle targets (from the
// binding groups), a hips target and a twist; legs/arms are solved with
// quaternion premultiplication against measured bind-pose directions, so
// no axis sign is ever guessed from the file's layout.

import * as THREE from 'three';
// @ts-ignore - vendored three addon
import { GLTFLoader } from '../../vendor/addons/loaders/GLTFLoader.js';

const BONE = (root: THREE.Object3D, suffix: string) => {
  // GLTFLoader sanitises ':' in node names (mixamorig:Hips -> mixamorig_Hips),
  // so compare on alphanumeric-stripped names.
  let found: THREE.Object3D | null = null;
  root.traverse((o) => { if (o.name.replace(/[^a-zA-Z0-9]/g, '').endsWith(suffix)) found = o; });
  if (!found) throw new Error('bone not found: ' + suffix);
  return found as THREE.Object3D;
};

const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();

/** Rotate `bone` in world space so its child joint moves toward target dir. */
function aim(bone: THREE.Object3D, child: THREE.Object3D, dirWorld: THREE.Vector3) {
  bone.getWorldPosition(_v1);
  child.getWorldPosition(_v2);
  _v2.sub(_v1).normalize();
  _q1.setFromUnitVectors(_v2, dirWorld.clone().normalize());
  bone.getWorldQuaternion(_q2);
  _q1.multiply(_q2); // desired world quat
  bone.parent!.getWorldQuaternion(_q2).invert();
  bone.quaternion.copy(_q2.multiply(_q1));
  bone.updateWorldMatrix(true, true);
}

export interface PoseTargets {
  frontAnkle: THREE.Vector3;  // world
  backAnkle: THREE.Vector3;   // world (ski: left/right — front = character's left)
  hips: THREE.Vector3;        // world position for the Hips joint
  hipsTwist: number;          // rad, around world Y, applied to hips orientation
  lean: number;               // rad, forward fold at the hips
  footQuat: (front: boolean) => THREE.Quaternion; // desired world quat per foot
  armSpread: number;          // 0..1 balance-arms amount
}

export class FemaleRider {
  group = new THREE.Group();
  private bones: Record<string, THREE.Object3D> = {};
  private bind: Record<string, { pos: THREE.Vector3; quat: THREE.Quaternion }> = {};
  private L1 = { L: 0, R: 0 };  // thigh lengths (m)
  private L2 = { L: 0, R: 0 };  // shin lengths (m)
  forward = new THREE.Vector3(0, 0, 1); // model-space facing (measured)
  private hipsBindLocal = new THREE.Vector3();
  ready = false;

  static async load(url: string): Promise<FemaleRider> {
    const r = new FemaleRider();
    const gltf = await new GLTFLoader().loadAsync(url);
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const h = box.max.y - box.min.y;
    model.scale.setScalar(1.8 / h); // the game's female spec: height 1.8
    r.group.add(model);
    r.group.updateMatrixWorld(true);
    for (const n of ['Hips', 'Spine', 'Head', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase',
      'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase',
      'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand']) {
      const b = BONE(model, n);
      r.bones[n] = b;
      r.bind[n] = { pos: b.getWorldPosition(new THREE.Vector3()), quat: b.getWorldQuaternion(new THREE.Quaternion()) };
    }
    const d = (a: string, b: string) => r.bind[a].pos.distanceTo(r.bind[b].pos);
    r.L1.L = d('LeftUpLeg', 'LeftLeg'); r.L2.L = d('LeftLeg', 'LeftFoot');
    r.L1.R = d('RightUpLeg', 'RightLeg'); r.L2.R = d('RightLeg', 'RightFoot');
    // facing = where the toes point, in model space
    r.forward.copy(r.bind['LeftToeBase'].pos).sub(r.bind['LeftFoot'].pos);
    r.forward.y = 0; r.forward.normalize();
    r.hipsBindLocal.copy(r.bones['Hips'].position);
    r.ready = true;
    return r;
  }

  /** Total leg length (thigh + shin) for the front (Left) leg, metres. */
  legLength(): number { return this.L1.L + this.L2.L; }
  /** Bind-pose world (= model-space) orientation of a foot bone. */
  bindFootQuat(front: boolean): THREE.Quaternion {
    return this.bind[front ? 'LeftFoot' : 'RightFoot'].quat.clone();
  }

  /** Solve the full pose. Call after the group is placed in the scene. */
  pose(t: PoseTargets) {
    if (!this.ready) return;
    const B = this.bones;
    this.group.updateMatrixWorld(true);
    // --- hips: position. worldPos = P + Q*(s*local), solved for local
    // against the parent's CURRENT world transform — exact, no drift. ---
    const hips = B['Hips'];
    hips.parent!.getWorldPosition(_v1);
    hips.parent!.getWorldQuaternion(_q1).invert();
    const parentScale = hips.parent!.getWorldScale(_v3).x;
    hips.position.copy(_v2.copy(t.hips).sub(_v1).applyQuaternion(_q1).divideScalar(parentScale));
    // --- hips: orientation from BIND (never accumulated): twist around
    // world Y + a forward lean around the model's side axis, in model
    // space, then carried into world by the group's own rotation. ---
    const groupQ = this.group.getWorldQuaternion(new THREE.Quaternion());
    const sideAxis = new THREE.Vector3(0, 1, 0).cross(this.forward).normalize();
    _q2.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.hipsTwist)
      .multiply(new THREE.Quaternion().setFromAxisAngle(sideAxis, t.lean))
      .multiply(this.bind['Hips'].quat);
    const desired = groupQ.clone().multiply(_q2);
    hips.parent!.getWorldQuaternion(_q1).invert();
    hips.quaternion.copy(_q1.multiply(desired));
    hips.updateWorldMatrix(true, true);
    this.group.updateMatrixWorld(true);
    // --- legs: two-bone IK, knees forward (+ slight outward) ---
    this.solveLeg('Left', t.frontAnkle, t.footQuat(true), 0.12);
    this.solveLeg('Right', t.backAnkle, t.footQuat(false), 0.12);
    // --- arms: balance pose, aimed in world space ---
    this.poseArm('Left', t.armSpread);
    this.poseArm('Right', t.armSpread);
    this.group.updateMatrixWorld(true);
  }

  private solveLeg(side: 'Left' | 'Right', ankle: THREE.Vector3, footQuat: THREE.Quaternion, kneeOut: number) {
    const B = this.bones;
    const up = B[side + 'UpLeg'], leg = B[side + 'Leg'], foot = B[side + 'Foot'];
    const L1 = side === 'Left' ? this.L1.L : this.L1.R;
    const L2 = side === 'Left' ? this.L2.L : this.L2.R;
    const H = up.getWorldPosition(new THREE.Vector3());
    const toA = ankle.clone().sub(H);
    const D = THREE.MathUtils.clamp(toA.length(), 0.15, L1 + L2 - 0.002);
    toA.normalize();
    // knee direction: character forward in world + a little outward
    const fwd = this.forward.clone().applyQuaternion(this.group.getWorldQuaternion(new THREE.Quaternion()));
    const sideAxis = new THREE.Vector3(0, 1, 0).cross(fwd).normalize().multiplyScalar(side === 'Left' ? 1 : -1);
    const bend = fwd.add(sideAxis.multiplyScalar(kneeOut));
    bend.addScaledVector(toA, -bend.dot(toA)).normalize();
    const a1 = (L1 * L1 - L2 * L2 + D * D) / (2 * D);
    const h = Math.sqrt(Math.max(L1 * L1 - a1 * a1, 0));
    const knee = H.clone().addScaledVector(toA, a1).addScaledVector(bend, h);
    aim(up, leg, knee.clone().sub(H));
    aim(leg, foot, ankle.clone().sub(knee));
    // foot: set world orientation directly
    foot.parent!.getWorldQuaternion(_q1).invert();
    foot.quaternion.copy(_q1.multiply(footQuat));
    foot.updateWorldMatrix(true, true);
  }

  private poseArm(side: 'Left' | 'Right', spread: number) {
    const B = this.bones;
    const arm = B[side + 'Arm'], fore = B[side + 'ForeArm'], hand = B[side + 'Hand'];
    const gq = this.group.getWorldQuaternion(new THREE.Quaternion());
    const sgn = side === 'Left' ? 1 : -1;
    const sideAxis = new THREE.Vector3(0, 1, 0).cross(this.forward).normalize().multiplyScalar(sgn);
    // elbow direction (model space): down, out with spread, a touch forward
    const elbowDir = new THREE.Vector3(0, -1, 0)
      .addScaledVector(sideAxis, 0.35 + spread * 0.55)
      .addScaledVector(this.forward, 0.18).normalize().applyQuaternion(gq);
    aim(arm, fore, elbowDir);
    const wristDir = new THREE.Vector3(0, -1, 0)
      .addScaledVector(sideAxis, 0.15 + spread * 0.3)
      .addScaledVector(this.forward, 0.42).normalize().applyQuaternion(gq);
    aim(fore, hand, wristDir);
  }
}

export default FemaleRider;
