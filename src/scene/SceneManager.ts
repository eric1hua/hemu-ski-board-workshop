// SceneManager — all three.js work for the workshop review page, decoupled
// from the UI. React owns UIState and pushes it here; this class owns the
// renderer, the stage, and the glide animation loop. Structural changes
// (gear / view / colours / pattern) rebuild the stage; light changes
// (straps, boot last, spin) apply in place.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createSwallowtailBoard } from '../createSwallowtailBoard';
import { createSkis } from '../createSkis';
import { createSnowboardBinding } from '../createSnowboardBinding';
import { createSkiBinding } from '../createSkiBinding';
import { createBootLast } from '../createBootLast';
import { createRiderFigure, type RiderFigure } from '../createRiderFigure';
import { FemaleRider } from './FemaleRider';
import type { UIState } from '../app/types';

interface FemalePoseCtx {
  rig: THREE.Group; gear: 'board' | 'skis';
  front: THREE.Object3D; back: THREE.Object3D;
}

interface StrapRef { node: THREE.Object3D; home: THREE.Vector3; name: string }

export class SceneManager {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private stage = new THREE.Group();
  private lines = new THREE.Group();
  private clock = new THREE.Clock();
  private state: UIState | null = null;
  private structuralKey = '';
  private rider: RiderFigure | null = null;
  private female: FemaleRider | null = null;
  private femalePose: FemalePoseCtx | null = null;
  private carveRig: THREE.Group | null = null;
  private straps: StrapRef[] = [];
  onStats: ((tris: number) => void) | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene.background = new THREE.Color('#7e8b99');
    this.camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.01, 100);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotateSpeed = 2.2;

    this.scene.add(new THREE.HemisphereLight(0xdfeaf5, 0x4a4238, 1.15));
    const sun = new THREE.DirectionalLight(0xfff2dd, 2.6);
    sun.position.set(2.5, 4, 1.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.002;
    sun.shadow.camera.left = -2; sun.shadow.camera.right = 2; sun.shadow.camera.top = 2; sun.shadow.camera.bottom = -2;
    this.scene.add(sun);

    const ground = new THREE.Mesh(new THREE.CircleGeometry(7, 48), new THREE.MeshStandardMaterial({ color: '#93a3b3', roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.002; ground.receiveShadow = true;
    this.scene.add(ground);

    // speed lines for the in-place glide
    const lm = new THREE.MeshBasicMaterial({ color: '#e8eef5' });
    for (let i = 0; i < 26; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), lm);
      m.userData.seed = Math.random();
      this.lines.add(m);
    }
    this.lines.visible = false;
    this.scene.add(this.lines);
    this.scene.add(this.stage);

    // The game's real female rider (user instruction 2026-11-03): load
    // async, swap her in when she arrives if a wear/glide view is up.
    FemaleRider.load('assets/female-rider.glb').then((r) => {
      this.female = r;
      r.group.traverse((m) => { if ((m as THREE.Mesh).isMesh) m.castShadow = true; });
      if (this.state && (this.state.view === 'wear' || this.state.view === 'glide')) this.rebuild();
    }).catch((e) => console.warn('female rider load failed, keeping figure', e));

    addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    });
    this.renderer.setAnimationLoop(() => this.tick());
  }

  /** Push a new UI state. Rebuilds only when the structural key changes. */
  setState(s: UIState) {
    const key = [s.gear, s.view, s.pattern, s.colors.top, s.colors.base, s.colors.pat, s.colors.pat2, s.colors.acc].join('|');
    this.state = s;
    if (key !== this.structuralKey) {
      this.structuralKey = key;
      this.rebuild();
    }
    this.applyLight();
  }

  private boardOpts() {
    const c = this.state!.colors;
    return {
      topsheetColor: c.top, baseColor: c.base,
      pattern: this.state!.pattern, patternColor: c.pat, patternColor2: c.pat2,
      basePattern: this.state!.pattern === 'none' ? 'none' as const : 'lengthStripes' as const,
      basePatternColor: c.top,
    };
  }
  private skiOpts() {
    const c = this.state!.colors;
    return {
      topsheetColor: c.top === '#f2f2f0' ? '#2f5d8a' : c.top,
      baseColor: c.base, stripeColor: c.pat,
      accentColor: c.pat2 === '#17171a' ? '#f2a7b9' : c.pat2,
    };
  }

  private buildWear(): THREE.Group {
    const s = this.state!;
    const rig = new THREE.Group();
    this.carveRig = new THREE.Group();
    rig.add(this.carveRig);
    const bindings: THREE.Object3D[] = [];
    if (s.gear === 'board') {
      const board = createSwallowtailBoard(this.boardOpts());
      board.position.y = 0.0055;
      this.carveRig.add(board);
      for (const [z, ang] of [[-0.128, Math.PI / 2 + 0.18], [0.384, Math.PI / 2 - 0.10]] as const) {
        const b = createSnowboardBinding({ accentColor: s.colors.acc });
        b.position.set(0, 0.016, z);
        b.rotation.y = ang;
        this.carveRig.add(b);
        bindings.push(b);
      }
    } else {
      const skis = createSkis(this.skiOpts());
      skis.position.y = 0.006;
      this.carveRig.add(skis);
      for (const sx of [-1, 1]) {
        const b = createSkiBinding({ accentColor: s.colors.acc });
        b.position.set(sx * 0.125, 0.0155, 0);
        this.carveRig.add(b);
        bindings.push(b);
      }
    }
    if (this.female) {
      // Real game character (user instruction): yaw her measured facing
      // onto the gear, IK-pose her onto the bindings.
      const f = this.female.forward;
      if (s.gear === 'board') {
        this.female.group.rotation.y = Math.atan2(f.z, f.x); // facing -> +x (toe edge)
        this.female.group.position.set(0, 0, 0.128);
      } else {
        this.female.group.rotation.y = Math.atan2(f.x, -f.z); // facing -> -z (tips)
        this.female.group.position.set(0, 0, 0.02);
      }
      this.carveRig.add(this.female.group);
      this.femalePose = { rig, gear: s.gear, front: bindings[0], back: bindings[1] };
      this.solveFemale(0);
    } else if (s.gear === 'board') {
      this.rider = createRiderFigure('board');
      this.rider.group.rotation.y = Math.PI / 2 + 0.04;
      this.rider.group.position.set(0, 0.16, 0.128);
      this.carveRig.add(this.rider.group);
    } else {
      this.rider = createRiderFigure('ski');
      this.rider.group.rotation.y = Math.PI;
      this.rider.group.position.set(0, 0.05, 0.055);
      this.carveRig.add(this.rider.group);
    }
    return rig;
  }

  /** Pose the female rider onto the current bindings (t = glide time). */
  private solveFemale(t: number) {
    const ctx = this.femalePose, r = this.female;
    if (!ctx || !r) return;
    ctx.rig.updateMatrixWorld(true);
    const board = ctx.gear === 'board';
    const gliding = this.state!.view === 'glide';
    const ankleOf = (b: THREE.Object3D) => b.localToWorld(new THREE.Vector3(0, board ? 0.115 : 0.125, board ? 0.005 : -0.01));
    const frontA = ankleOf(ctx.front), backA = ankleOf(ctx.back);
    const hips = frontA.clone().add(backA).multiplyScalar(0.5);
    const leg = r.legLength();
    hips.y += leg * (board ? 0.87 : 0.95);
    if (board) { hips.x += 0.02; hips.z += 0.02; }
    if (gliding) {
      hips.y += Math.sin(t * 2.2) * 0.012 - 0.015;
      if (board) hips.z += Math.sin(t * 1.6) * 0.03; else hips.x += Math.sin(t * 1.6) * 0.02;
    }
    const groupQ = r.group.getWorldQuaternion(new THREE.Quaternion());
    r.pose({
      frontAnkle: frontA, backAnkle: backA, hips,
      hipsTwist: board ? 0.55 + (gliding ? Math.sin(t * 1.6) * 0.05 : 0) : 0,
      lean: board ? 0.14 : 0.10,
      footQuat: (front) => groupQ.clone()
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), board ? (front ? 0.15 : -0.08) : 0))
        .multiply(r.bindFootQuat(front)),
      armSpread: board ? 0.7 : 0.35,
    });
  }

  private rebuild() {
    const s = this.state!;
    while (this.stage.children.length) this.stage.remove(this.stage.children[0]);
    this.rider = null; this.carveRig = null; this.femalePose = null;
    let obj: THREE.Object3D;
    if (s.view === 'solo') {
      obj = s.gear === 'board' ? createSwallowtailBoard(this.boardOpts()) : createSkis(this.skiOpts());
    } else if (s.view === 'binding') {
      const wrap = new THREE.Group();
      if (s.gear === 'board') {
        const b = createSnowboardBinding({ accentColor: s.colors.acc });
        b.rotation.y = -0.5;
        const boot = createBootLast('board');
        boot.rotation.y = -0.5; boot.position.y = 0.026; boot.name = 'BootStandalone';
        wrap.add(b, boot);
      } else {
        const b = createSkiBinding({ accentColor: s.colors.acc });
        b.rotation.y = 0.5;
        const boot = createBootLast('ski');
        boot.rotation.y = 0.5; boot.position.y = 0.045; boot.name = 'BootStandalone';
        wrap.add(b, boot);
      }
      obj = wrap;
    } else {
      obj = this.buildWear();
    }
    this.stage.add(obj);
    this.straps = [];
    obj.traverse((n) => {
      if (n.userData && n.userData.detachable) this.straps.push({ node: n, home: n.position.clone(), name: n.name });
    });
    this.lines.visible = s.view === 'glide';
    if (this.lines.visible) this.layoutLines();
    if (this.onStats) this.onStats(this.countTris(obj));
    // camera framing
    let dir: [number, number, number] | undefined;
    if (s.view === 'wear' || s.view === 'glide') dir = s.gear === 'board' ? [1.25, 0.6, 0.85] : [0.8, 0.6, -1.2];
    if (s.view === 'binding' && s.gear === 'skis') dir = [1.35, 0.5, 0.35];
    this.frame(obj, s.view === 'binding' ? 1.5 : 1, dir);
  }

  private applyLight() {
    const s = this.state!;
    this.controls.autoRotate = s.spin && s.view !== 'glide';
    this.stage.traverse((n) => { if (n.name === 'BootStandalone') n.visible = s.boot; });
    for (const ref of this.straps) {
      const on = ref.name === 'strap-ankle' ? s.ankle : s.toe;
      ref.node.visible = on;
      const off = s.detach && on;
      ref.node.position.copy(ref.home).add(new THREE.Vector3(0, off ? 0.13 : 0, 0));
    }
  }

  private layoutLines() {
    const gear = this.state!.gear;
    this.lines.children.forEach((m, i) => {
      const seed = m.userData.seed as number;
      if (gear === 'board') {
        m.scale.set(0.7 + seed * 1.1, 0.004, 0.03);
        m.position.set(((seed * 7 + i * 0.37) % 6) - 3, 0.002, ((seed * 13 + i * 0.61) % 3.4) - 1.7);
        if (Math.abs(m.position.z) < 0.3) m.position.z += 0.55;
      } else {
        m.scale.set(0.03, 0.004, 0.7 + seed * 1.1);
        m.position.set(((seed * 11 + i * 0.53) % 3.4) - 1.7, 0.002, ((seed * 5 + i * 0.41) % 6) - 3);
        if (Math.abs(m.position.x) < 0.3) m.position.x += 0.55;
      }
    });
  }

  private frame(obj: THREE.Object3D, dist = 1, dir: [number, number, number] = [1.05, 0.7, 1.3]) {
    const bb = new THREE.Box3().setFromObject(obj);
    const c = bb.getCenter(new THREE.Vector3());
    const sz = bb.getSize(new THREE.Vector3());
    const r = Math.max(sz.x, sz.y, sz.z);
    this.controls.target.copy(c);
    this.camera.position.set(c.x + r * dir[0] * dist, c.y + r * dir[1], c.z + r * dir[2] * dist);
    this.camera.near = Math.max(0.01, r / 100); this.camera.far = r * 80;
    this.camera.updateProjectionMatrix();
  }

  private countTris(obj: THREE.Object3D): number {
    let t = 0;
    obj.traverse((m) => {
      const mesh = m as THREE.Mesh;
      if (mesh.isMesh) { const g = mesh.geometry; t += (g.index ? g.index.count : g.attributes.position.count) / 3; }
    });
    return Math.round(t);
  }

  private tick() {
    const t = this.clock.getElapsedTime();
    const s = this.state;
    if (s && s.view === 'glide' && (this.rider || this.femalePose)) {
      if (this.rider) this.rider.glide(t);
      if (this.femalePose) this.solveFemale(t);
      if (this.carveRig) {
        if (s.gear === 'board') this.carveRig.rotation.z = Math.sin(t * 1.6) * 0.09;
        else { this.carveRig.rotation.z = Math.sin(t * 1.6) * 0.045; this.carveRig.position.x = Math.sin(t * 1.6) * 0.02; }
      }
      const dir = s.gear === 'board' ? 'x' : 'z';
      const sgn = s.gear === 'board' ? -1 : 1;
      for (const m of this.lines.children) {
        m.position[dir] += sgn * 0.028;
        if (m.position[dir] > 3.2) m.position[dir] = -3.2;
        if (m.position[dir] < -3.2) m.position[dir] = 3.2;
      }
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
