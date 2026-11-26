import { BALANCE, IS_MOBILE, clamp, lerp } from './config.js';

// Three.js 描画・演出層（マルチステージ・最大8人複数人間リグ・スマホ軽量化・霧家具衝突・自室小物対応）
export class GameRenderer {
  constructor(mountEl, initialStage) {
    this.mountEl = mountEl;

    this.renderer = new THREE.WebGLRenderer({ antialias: !IS_MOBILE, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.5 : 2));
    this.renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = IS_MOBILE ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    mountEl.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(IS_MOBILE ? 82 : 72, mountEl.clientWidth / mountEl.clientHeight, 0.01, 180);

    this.stageGroup = new THREE.Group();
    this.scene.add(this.stageGroup);
    this.stageController = null;
    this.currentStageId = null;

    this.furnitureGroups = new Map();
    this.furnitureMaterials = new Map();
    this.refillRing = null;
    this.humanRigs = [];
    this.roachRigs = [];
    this.crumbMeshes = [];
    this.propMeshes = [];
    this.particles = [];
    this.shockwaves = [];

    this.sharedRoachAssets = this.createSharedRoachAssets();
    this.sharedHumanAssets = this.createSharedHumanAssets();
    this.buildFirstPersonHands();
    this.ensureHumanRigCount(2);
    this.ensureRoachRigCount(4);

    this.loadStage(initialStage);

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    const w = this.mountEl.clientWidth || window.innerWidth;
    const h = this.mountEl.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  loadStage(stage) {
    if (!stage || this.currentStageId === stage.id) return;
    this.currentStageId = stage.id;

    while (this.stageGroup.children.length > 0) {
      this.stageGroup.remove(this.stageGroup.children[0]);
    }
    this.furnitureGroups.clear();
    this.furnitureMaterials.clear();
    this.propMeshes = [];
    this.crumbMeshes = [];
    this.refillRing = null;

    const sc = stage.sceneColors;
    this.scene.background = new THREE.Color(sc.background);
    this.scene.fog = new THREE.Fog(sc.fogColor, sc.fogNear, sc.fogFar);
    this.renderer.toneMappingExposure = sc.exposure;

    const registerFurniture = (id, group, mats) => {
      this.furnitureGroups.set(id, group);
      this.furnitureMaterials.set(id, mats);
      this.stageGroup.add(group);
    };

    this.stageController = stage.buildScene(this.stageGroup, registerFurniture);
    this.buildRefillStation(stage.refillSpot);
    this.buildProps(stage.initialProps);
    this.ensureCrumbMeshCount(8);
  }

  projectToScreen(x, y, z) {
    const v = new THREE.Vector3(x, y, z);
    v.project(this.camera);
    const w = this.mountEl.clientWidth || window.innerWidth;
    const h = this.mountEl.clientHeight || window.innerHeight;
    const behind = v.z > 1;
    let sx = (v.x * 0.5 + 0.5) * w;
    let sy = (-v.y * 0.5 + 0.5) * h;
    if (behind) { sx = w - sx; sy = h - 42; }
    return { x: clamp(sx, 54, w - 54), y: clamp(sy, 64, h - 64), behind };
  }

  buildRefillStation(spot) {
    const g = new THREE.Group();
    g.position.set(spot.x, spot.y, spot.z);

    const canMat = new THREE.MeshStandardMaterial({ color: 0xc93b2b, roughness: 0.35, metalness: 0.3, flatShading: true });
    const labelMat = new THREE.MeshStandardMaterial({ color: 0xf4c76c, roughness: 0.5, flatShading: true });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xf5efe6, roughness: 0.5, flatShading: true });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.24, 9), canMat);
    body.position.y = 0.12; body.castShadow = true;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0435, 0.0435, 0.08, 9), labelMat);
    band.position.y = 0.13;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.036, 0.055, 9), capMat);
    cap.position.y = 0.265;

    this.refillRing = new THREE.Mesh(
      new THREE.RingGeometry(0.075, 0.105, 18),
      new THREE.MeshBasicMaterial({ color: 0xffcf77, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
    );
    this.refillRing.rotation.x = -Math.PI / 2;
    this.refillRing.position.y = 0.01;

    g.add(body, band, cap, this.refillRing);
    this.stageGroup.add(g);
  }

  createSharedRoachAssets() {
    const shellMat = new THREE.MeshPhongMaterial({ color: 0x381508, specular: 0xffb77a, shininess: 98, flatShading: true });
    const pronotumMat = new THREE.MeshPhongMaterial({ color: 0x4b1d0a, specular: 0xffc78c, shininess: 110, flatShading: true });
    const rimMat = new THREE.MeshPhongMaterial({ color: 0x994a1c, specular: 0xffd6a6, shininess: 80, flatShading: true });
    const legMat = new THREE.MeshPhongMaterial({ color: 0x2c1106, specular: 0xd47b46, shininess: 65, flatShading: true });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0b0706 });

    return {
      shellMat, pronotumMat, rimMat, legMat, eyeMat,
      headGeo: new THREE.DodecahedronGeometry(0.022, 0),
      eyeGeo: new THREE.BoxGeometry(0.009, 0.011, 0.011),
      pronotumGeo: new THREE.CylinderGeometry(0.032, 0.044, 0.018, 6),
      pronotumRimGeo: new THREE.CylinderGeometry(0.035, 0.046, 0.008, 6),
      abdomenSegGeo: new THREE.BoxGeometry(0.068, 0.018, 0.032),
      wingGeo: new THREE.BoxGeometry(0.038, 0.007, 0.132),
      cercusGeo: new THREE.ConeGeometry(0.004, 0.032, 4),
      femurGeo: new THREE.BoxGeometry(0.048, 0.007, 0.009),
      tibiaGeo: new THREE.BoxGeometry(0.062, 0.005, 0.006),
      antSeg1Geo: new THREE.BoxGeometry(0.004, 0.004, 0.055),
      antSeg2Geo: new THREE.BoxGeometry(0.003, 0.003, 0.058),
      antSeg3Geo: new THREE.BoxGeometry(0.002, 0.002, 0.055)
    };
  }

  createRoachRig() {
    const A = this.sharedRoachAssets;
    const root = new THREE.Group();
    const bodyTilt = new THREE.Group();
    bodyTilt.scale.setScalar(0.52);
    root.add(bodyTilt);

    const abdomenGroup = new THREE.Group();
    abdomenGroup.position.set(0, 0.024, 0.02);
    for (let s = 0; s < 3; s++) {
      const seg = new THREE.Mesh(A.abdomenSegGeo, A.shellMat);
      seg.position.set(0, -s * 0.002, s * 0.026);
      seg.scale.set(1.0 - s * 0.12, 1.0 - s * 0.1, 1.0);
      seg.castShadow = true;
      abdomenGroup.add(seg);
    }
    [-1, 1].forEach(side => {
      const c = new THREE.Mesh(A.cercusGeo, A.legMat);
      c.position.set(side * 0.015, 0.0, 0.088); c.rotation.x = Math.PI * 0.45; c.rotation.z = -side * 0.35;
      abdomenGroup.add(c);
    });
    bodyTilt.add(abdomenGroup);

    const wingL = new THREE.Group(); wingL.position.set(-0.004, 0.036, -0.026);
    const wingLMesh = new THREE.Mesh(A.wingGeo, A.shellMat); wingLMesh.position.set(-0.016, 0, 0.064); wingLMesh.castShadow = true; wingL.add(wingLMesh);
    const wingR = new THREE.Group(); wingR.position.set(0.004, 0.036, -0.026);
    const wingRMesh = new THREE.Mesh(A.wingGeo, A.shellMat); wingRMesh.position.set(0.016, 0, 0.064); wingRMesh.castShadow = true; wingR.add(wingRMesh);
    bodyTilt.add(wingL, wingR);

    const pronotum = new THREE.Mesh(A.pronotumGeo, A.pronotumMat); pronotum.position.set(0, 0.034, -0.056); pronotum.scale.set(1.08, 0.85, 1.15); pronotum.castShadow = true;
    const pRim = new THREE.Mesh(A.pronotumRimGeo, A.rimMat); pRim.position.set(0, 0.030, -0.056); pRim.scale.set(1.12, 1.0, 1.18);
    bodyTilt.add(pronotum, pRim);

    const headGroup = new THREE.Group(); headGroup.position.set(0, 0.024, -0.095);
    const headMesh = new THREE.Mesh(A.headGeo, A.legMat); headMesh.scale.set(0.95, 0.8, 1.0); headGroup.add(headMesh);
    [-1, 1].forEach(side => { const eye = new THREE.Mesh(A.eyeGeo, A.eyeMat); eye.position.set(side * 0.015, 0.004, -0.008); headGroup.add(eye); });
    bodyTilt.add(headGroup);

    const antennae = [];
    [-1, 1].forEach(side => {
      const seg1 = new THREE.Group(); seg1.position.set(side * 0.010, 0.004, -0.016);
      const m1 = new THREE.Mesh(A.antSeg1Geo, A.legMat); m1.position.z = -0.027; seg1.add(m1);
      const seg2 = new THREE.Group(); seg2.position.set(0, 0, -0.054);
      const m2 = new THREE.Mesh(A.antSeg2Geo, A.legMat); m2.position.z = -0.028; seg2.add(m2);
      const seg3 = new THREE.Group(); seg3.position.set(0, 0, -0.056);
      const m3 = new THREE.Mesh(A.antSeg3Geo, A.legMat); m3.position.z = -0.027; seg3.add(m3);
      seg2.add(seg3); seg1.add(seg2); headGroup.add(seg1);
      antennae.push({ side, seg1, seg2, seg3 });
    });

    const legs = [];
    [
      { side: -1, z: -0.052, baseYaw: 0.42, group: 0 }, { side: -1, z: -0.012, baseYaw: 0.02, group: 1 }, { side: -1, z: 0.032, baseYaw: -0.48, group: 0 },
      { side: 1, z: -0.052, baseYaw: -0.42, group: 1 }, { side: 1, z: -0.012, baseYaw: -0.02, group: 0 }, { side: 1, z: 0.032, baseYaw: 0.48, group: 1 }
    ].forEach(cfg => {
      const hip = new THREE.Group(); hip.position.set(cfg.side * 0.024, 0.022, cfg.z);
      const femur = new THREE.Mesh(A.femurGeo, A.legMat); femur.position.set(cfg.side * 0.024, 0.008, 0); femur.rotation.z = cfg.side * 0.35; hip.add(femur);
      const knee = new THREE.Group(); knee.position.set(cfg.side * 0.046, 0.016, 0);
      const tibia = new THREE.Mesh(A.tibiaGeo, A.legMat); tibia.position.set(cfg.side * 0.026, -0.022, 0); tibia.rotation.z = -cfg.side * 0.78; knee.add(tibia);
      hip.add(knee); bodyTilt.add(hip);
      legs.push({ ...cfg, hip, knee });
    });

    this.scene.add(root);
    return { root, bodyTilt, abdomenGroup, wingL, wingR, headGroup, antennae, legs };
  }

  ensureRoachRigCount(count) {
    while (this.roachRigs.length < count) {
      this.roachRigs.push(this.createRoachRig());
    }
  }

  createSharedHumanAssets() {
    return {
      shirtPalette: [0xd9cbb8, 0x8da9c4, 0xc9897b, 0x88b08b, 0xc4b078, 0xa892bd, 0x79a6a6, 0xd19a66],
      pantsMat: new THREE.MeshStandardMaterial({ color: 0x353c4a, roughness: 0.9, flatShading: true }),
      skinMat: new THREE.MeshStandardMaterial({ color: 0xebbfa0, roughness: 0.85, flatShading: true }),
      hairMat: new THREE.MeshStandardMaterial({ color: 0x261d1c, roughness: 0.9, flatShading: true }),
      paperMat: new THREE.MeshStandardMaterial({ color: 0xe6dec8, roughness: 0.9, flatShading: true }),
      canBodyMat: new THREE.MeshStandardMaterial({ color: 0xb8382c, roughness: 0.45, metalness: 0.25, flatShading: true })
    };
  }

  createHumanRig(idx) {
    const A = this.sharedHumanAssets;
    const shirtMat = new THREE.MeshStandardMaterial({ color: A.shirtPalette[idx % A.shirtPalette.length], roughness: 0.88, flatShading: true });
    const root = new THREE.Group();

    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.78, 0.17), A.pantsMat); legL.position.set(-0.12, 0.39, 0); legL.castShadow = true;
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.78, 0.17), A.pantsMat); legR.position.set(0.12, 0.39, 0); legR.castShadow = true;

    const torso = new THREE.Group(); torso.position.set(0, 0.78, 0);
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.58, 0.26), shirtMat); chest.position.y = 0.29; chest.castShadow = true;
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15, 0), A.skinMat); head.position.y = 0.74; head.castShadow = true;
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.28), A.hairMat); hair.position.set(0, 0.83, 0.02);
    torso.add(chest, head, hair);

    const armR = new THREE.Group(); armR.position.set(0.29, 0.50, 0);
    const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, 0.12), A.skinMat); armRMesh.position.y = -0.22; armRMesh.castShadow = true;
    const tpPaper = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.03, 0.62, 7), A.paperMat); tpPaper.position.set(0, -0.48, -0.24); tpPaper.rotation.x = Math.PI * 0.45; tpPaper.castShadow = true;
    armR.add(armRMesh, tpPaper); torso.add(armR);

    const armL = new THREE.Group(); armL.position.set(-0.29, 0.50, 0);
    const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.50, 0.12), A.skinMat); armLMesh.position.y = -0.21;
    const tpCan = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 7), A.canBodyMat); tpCan.position.set(0, -0.44, -0.10);
    armL.add(armLMesh, tpCan); torso.add(armL);

    root.add(legL, legR, torso);
    this.scene.add(root);
    return { root, legL, legR, torso, armR, armL };
  }

  ensureHumanRigCount(count) {
    while (this.humanRigs.length < count) {
      this.humanRigs.push(this.createHumanRig(this.humanRigs.length));
    }
  }

  buildFirstPersonHands() {
    const A = this.sharedHumanAssets;
    this.fpHands = new THREE.Group();
    this.camera.add(this.fpHands);
    this.scene.add(this.camera);

    this.fpNewspaperGroup = new THREE.Group();
    this.fpNewspaperGroup.position.set(0.32, -0.26, -0.48);
    const paperBandMat = new THREE.MeshStandardMaterial({ color: 0xb84935, roughness: 0.8, flatShading: true });
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.026, 0.56, 8), A.paperMat); roll.position.set(0, 0.18, 0);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.036, 0.06, 8), paperBandMat); band.position.set(0, 0.25, 0);
    const handR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.09), A.skinMat); handR.position.set(0, -0.06, 0.02);
    this.fpNewspaperGroup.add(roll, band, handR);
    this.fpHands.add(this.fpNewspaperGroup);

    this.fpSprayGroup = new THREE.Group();
    this.fpSprayGroup.position.set(-0.30, -0.28, -0.44);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xf2e9dc, roughness: 0.5, flatShading: true });
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.22, 8), A.canBodyMat);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.028, 0.05, 8), capMat); cap.position.y = 0.135;
    this.fpSprayGroup.add(can, cap);
    this.fpHands.add(this.fpSprayGroup);
  }

  buildProps(initialProps) {
    const mats = {
      mug: new THREE.MeshStandardMaterial({ color: 0xd98a5b, roughness: 0.4, flatShading: true }),
      remote: new THREE.MeshStandardMaterial({ color: 0x2a2c33, roughness: 0.6, flatShading: true }),
      tissue: new THREE.MeshStandardMaterial({ color: 0xf0e8da, roughness: 0.85, flatShading: true }),
      book: new THREE.MeshStandardMaterial({ color: 0x45637d, roughness: 0.85, flatShading: true }),
      can: new THREE.MeshStandardMaterial({ color: 0xb8463e, roughness: 0.35, metalness: 0.5, flatShading: true }),
      snack: new THREE.MeshStandardMaterial({ color: 0xd99638, roughness: 0.72, flatShading: true }),
      pot: new THREE.MeshStandardMaterial({ color: 0xa66246, roughness: 0.85, flatShading: true }),
      leaf: new THREE.MeshStandardMaterial({ color: 0x46784b, roughness: 0.78, flatShading: true }),
      plushFurA: new THREE.MeshStandardMaterial({ color: 0xb57c52, roughness: 0.96, flatShading: true }),
      plushFurB: new THREE.MeshStandardMaterial({ color: 0xe6c8a8, roughness: 0.96, flatShading: true }),
      plushBelly: new THREE.MeshStandardMaterial({ color: 0xf2dfcb, roughness: 0.95, flatShading: true }),
      plushEye: new THREE.MeshBasicMaterial({ color: 0x161210 }),
      hpBand: new THREE.MeshStandardMaterial({ color: 0x262933, roughness: 0.5, flatShading: true }),
      hpPad: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85, flatShading: true })
    };

    let plushIdx = 0;
    this.propMeshes = initialProps.map(p => {
      let obj;
      if (p.type === 'mug') obj = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.12, 8), mats.mug);
      else if (p.type === 'remote') obj = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.025, 0.18), mats.remote);
      else if (p.type === 'tissue') obj = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.10, 0.13), mats.tissue);
      else if (p.type === 'can') obj = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.13, 8), mats.can);
      else if (p.type === 'snack') obj = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.07), mats.snack);
      else if (p.type === 'mini_plant') {
        obj = new THREE.Group();
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.048, 0.09, 7), mats.pot); pot.position.y = -0.035; pot.castShadow = true;
        const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.068, 0), mats.leaf); bush.position.y = 0.045; bush.castShadow = true;
        obj.add(pot, bush);
      } else if (p.type === 'plush') {
        const fur = (plushIdx++ % 2 === 0) ? mats.plushFurA : mats.plushFurB;
        obj = new THREE.Group();
        const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(0.064, 0), fur); torso.position.y = -0.025; torso.scale.set(1.0, 1.05, 0.9); torso.castShadow = true;
        const belly = new THREE.Mesh(new THREE.DodecahedronGeometry(0.042, 0), mats.plushBelly); belly.position.set(0, -0.028, 0.036);
        const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.052, 0), fur); head.position.y = 0.052; head.castShadow = true;
        const earL = new THREE.Mesh(new THREE.DodecahedronGeometry(0.020, 0), fur); earL.position.set(-0.038, 0.095, 0);
        const earR = new THREE.Mesh(new THREE.DodecahedronGeometry(0.020, 0), fur); earR.position.set(0.038, 0.095, 0);
        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.010, 0.010), mats.plushEye); eyeL.position.set(-0.018, 0.058, 0.046);
        const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.010, 0.010), mats.plushEye); eyeR.position.set(0.018, 0.058, 0.046);
        const armL = new THREE.Mesh(new THREE.DodecahedronGeometry(0.024, 0), fur); armL.position.set(-0.062, -0.012, 0.01);
        const armR = new THREE.Mesh(new THREE.DodecahedronGeometry(0.024, 0), fur); armR.position.set(0.062, -0.012, 0.01);
        obj.add(torso, belly, head, earL, earR, eyeL, eyeR, armL, armR);
      } else if (p.type === 'headphone') {
        obj = new THREE.Group();
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.011, 6, 12, Math.PI), mats.hpBand); band.position.y = -0.01; band.castShadow = true;
        const cupL = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.028, 8), mats.hpPad); cupL.rotation.z = Math.PI / 2; cupL.position.set(-0.068, -0.015, 0); cupL.castShadow = true;
        const cupR = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.028, 8), mats.hpPad); cupR.rotation.z = Math.PI / 2; cupR.position.set(0.068, -0.015, 0); cupR.castShadow = true;
        obj.add(band, cupL, cupR);
      } else obj = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.042, 0.24), mats.book);

      if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }
      this.stageGroup.add(obj);
      return obj;
    });
  }

  ensureCrumbMeshCount(count) {
    const crumbGeo = new THREE.DodecahedronGeometry(0.034, 0);
    const colors = [0xf2c879, 0xc97b3e, 0xffd25a];
    while (this.crumbMeshes.length < count) {
      const i = this.crumbMeshes.length;
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i % 3], emissive: 0x8a4d12, emissiveIntensity: 0.38, roughness: 0.78, flatShading: true
      });
      const mesh = new THREE.Mesh(crumbGeo, mat);
      mesh.scale.set(1.2, 0.55, 1.0);
      this.stageGroup.add(mesh);
      this.crumbMeshes.push(mesh);
    }
  }

  spawnImpactEffects(x, y, z) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.025, 0.052, 14),
      new THREE.MeshBasicMaterial({ color: 0xffd29e, transparent: true, opacity: 0.65, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.position.set(x, Math.max(0.02, y), z); ring.rotation.x = -Math.PI / 2;
    this.scene.add(ring);
    this.shockwaves.push({ mesh: ring, age: 0, maxAge: 0.22 });

    const pGeo = new THREE.DodecahedronGeometry(0.018, 0);
    const cnt = IS_MOBILE ? 6 : 10;
    for (let i = 0; i < cnt; i++) {
      const m = new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xe8caa4 : 0xc49c76, transparent: true, opacity: 0.65 }));
      m.position.set(x, y + 0.02, z);
      const a = Math.random() * Math.PI * 2, spd = 0.75 + Math.random() * 1.4;
      this.scene.add(m);
      this.particles.push({ mesh: m, vx: Math.cos(a) * spd, vy: 0.55 + Math.random() * 1.1, vz: Math.sin(a) * spd, gravity: 4.5, age: 0, maxAge: 0.38, grow: 1.3, collideFurniture: false });
    }
  }

  spawnSprayPuff(x, y, z, dx, dy, dz) {
    const pGeo = new THREE.DodecahedronGeometry(0.052, 0);
    const cnt = IS_MOBILE ? 1 : 2;
    for (let i = 0; i < cnt; i++) {
      const m = new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({ color: 0xbfe3a1, transparent: true, opacity: 0.42, depthWrite: false }));
      m.position.set(x, y, z); this.scene.add(m);
      this.particles.push({
        mesh: m, vx: dx * 4.4 + (Math.random() - 0.5) * 0.85, vy: dy * 4.4 + (Math.random() - 0.5) * 0.65,
        vz: dz * 4.4 + (Math.random() - 0.5) * 0.85, gravity: 0.2, age: 0, maxAge: 0.50, grow: 3.4, collideFurniture: true
      });
    }
  }

  spawnPoisonPuff(x, y, z, dense = false) {
    const count = (dense && !IS_MOBILE) ? 2 : 1;
    const pGeo = new THREE.DodecahedronGeometry(dense ? 0.028 : 0.022, 0);
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({ color: 0x8de063, transparent: true, opacity: dense ? 0.62 : 0.50, depthWrite: false }));
      m.position.set(x + (Math.random() - 0.5) * 0.08, y + 0.02, z + (Math.random() - 0.5) * 0.08);
      this.scene.add(m);
      this.particles.push({ mesh: m, vx: (Math.random() - 0.5) * 0.22, vy: 0.28 + Math.random() * 0.20, vz: (Math.random() - 0.5) * 0.22, gravity: -0.04, age: 0, maxAge: dense ? 0.55 : 0.44, grow: dense ? 2.4 : 2.0, collideFurniture: false });
    }
  }

  render(state, dt, timeSec) {
    if (this.currentStageId !== state.stage.id) {
      this.loadStage(state.stage);
    }

    this.ensureRoachRigCount(state.roaches.length);
    this.ensureHumanRigCount(state.humans.length);
    this.ensureCrumbMeshCount(state.crumbs.length);

    if (this.stageController && this.stageController.update) {
      this.stageController.update(dt, timeSec, state);
    }

    if (this.refillRing) {
      const lh = state.getLocalHuman();
      const ready = !lh || lh.refillCooldown <= 0;
      this.refillRing.visible = ready;
      if (ready) this.refillRing.material.opacity = 0.32 + Math.sin(timeSec * 3.5) * 0.18;
    }

    for (let i = 0; i < this.crumbMeshes.length; i++) {
      const c = state.crumbs[i], mesh = this.crumbMeshes[i];
      if (!c || !c.active) { mesh.visible = false; continue; }
      mesh.visible = true;
      const pulse = Math.sin(timeSec * 3.4 + i);
      const scaleMul = c.elevated ? (1.35 + pulse * 0.08) : 1.0;
      mesh.scale.set(1.2 * scaleMul, 0.55 * scaleMul, 1.0 * scaleMul);
      mesh.material.emissiveIntensity = c.elevated ? (0.78 + pulse * 0.22) : 0.35;
      mesh.position.set(c.x, c.y + 0.025 + pulse * 0.009, c.z);
      mesh.rotation.y = timeSec * (c.elevated ? 1.55 : 1.1) + i;
    }

    state.props.forEach((p, i) => {
      const mesh = this.propMeshes[i];
      if (!mesh) return;
      mesh.position.set(p.x, p.y, p.z);
      mesh.rotation.set(p.rx, p.ry, p.rz);
    });

    for (let i = 0; i < this.roachRigs.length; i++) {
      const r = state.roaches[i], rig = this.roachRigs[i];
      if (!r || !r.alive) { rig.root.visible = false; continue; }
      rig.root.visible = true;
      rig.root.position.set(r.x, r.y, r.z);

      const targetQuat = new THREE.Quaternion();
      if (r.surface === 'wall' && r.climbingWall) {
        const up = new THREE.Vector3(r.normal.x, r.normal.y, r.normal.z);
        const fwd = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(fwd, up).normalize();
        targetQuat.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, fwd.clone().negate()));
      } else {
        targetQuat.setFromEuler(new THREE.Euler(r.flying ? 0.24 : 0, r.yaw, 0, 'YXZ'));
      }
      rig.root.quaternion.slerp(targetQuat, clamp(dt * 18, 0, 1));

      const breath = Math.sin(r.breathPhase);
      rig.bodyTilt.position.y = 0.003 + breath * 0.0018;
      rig.abdomenGroup.scale.y = 1.0 + breath * 0.05;

      const moving = Math.hypot(r.vx, r.vz) > 0.08 || r.surface === 'wall';
      const swingAmp = r.flying ? 0.08 : (moving ? 0.42 : 0.03);
      const liftAmp = r.flying ? 0.0 : (moving ? 0.28 : 0.0);

      rig.legs.forEach(leg => {
        const phase = r.legPhase + (leg.group === 0 ? 0 : Math.PI);
        leg.hip.rotation.y = leg.baseYaw + Math.sin(phase) * swingAmp * leg.side;
        leg.hip.rotation.z = Math.max(0, Math.cos(phase)) * liftAmp * leg.side;
        leg.knee.rotation.z = -Math.max(0, Math.cos(phase)) * 0.35 * leg.side;
      });

      rig.antennae.forEach(ant => {
        const t = timeSec * 5.2 + r.antennaSeed + (ant.side > 0 ? 1.7 : 0);
        const tw = Math.sin(t) * 0.22 + Math.sin(t * 2.7) * 0.11;
        ant.seg1.rotation.y = ant.side * 0.32 + tw;
        ant.seg2.rotation.y = ant.side * 0.18 + tw * 0.9;
        ant.seg3.rotation.y = tw * 1.1;
      });

      if (r.flying) {
        const vib = Math.sin(timeSec * 130) * 0.18;
        rig.wingL.rotation.y = -0.62 + vib; rig.wingL.rotation.x = 0.36;
        rig.wingR.rotation.y = 0.62 - vib; rig.wingR.rotation.x = 0.36;
      } else if (r.wingFlutter > 0) {
        const vib = Math.sin(timeSec * 85) * 0.12;
        rig.wingL.rotation.y = -0.34 + vib; rig.wingL.rotation.x = 0.22;
        rig.wingR.rotation.y = 0.34 - vib; rig.wingR.rotation.x = 0.22;
      } else {
        rig.wingL.rotation.y = lerp(rig.wingL.rotation.y, 0, clamp(dt * 15, 0, 1));
        rig.wingL.rotation.x = lerp(rig.wingL.rotation.x, 0, clamp(dt * 15, 0, 1));
        rig.wingR.rotation.y = lerp(rig.wingR.rotation.y, 0, clamp(dt * 15, 0, 1));
        rig.wingR.rotation.x = lerp(rig.wingR.rotation.x, 0, clamp(dt * 15, 0, 1));
      }
    }

    this.updateCameraAndHumanVisuals(state, dt, timeSec);
    this.updateFurnitureTransparency(state, dt);
    this.updateEffects(state, dt);

    this.renderer.render(this.scene, this.camera);
  }

  updateCameraAndHumanVisuals(state, dt, timeSec) {
    const room = state.stage.room;

    if (state.mode === 'title' || state.mode === 'lobby') {
      const tc = state.stage.titleCamera;
      this.fpHands.visible = false;
      this.humanRigs.forEach((rig, idx) => {
        rig.root.visible = idx === 0;
        if (idx === 0) {
          rig.root.position.set(tc.humanPos[0], tc.humanPos[1], tc.humanPos[2]);
          rig.root.rotation.y = tc.humanYaw;
        }
      });

      const angle = Math.sin(timeSec * 0.16) * 0.42;
      this.camera.position.set(tc.centerX + Math.sin(angle) * tc.ampX, tc.y, tc.z);
      this.camera.lookAt(tc.lookAt[0], tc.lookAt[1], tc.lookAt[2]);
      if (Math.abs(this.camera.fov - 66) > 0.1) {
        this.camera.fov = 66;
        this.camera.updateProjectionMatrix();
      }
      return;
    }

    // 全人間の3Dモデル更新（FPS視点の自分自身のみ非表示）
    for (let i = 0; i < this.humanRigs.length; i++) {
      const h = state.humans[i], rig = this.humanRigs[i];
      if (!h || (state.playerSide === 'human' && h.isLocal)) {
        rig.root.visible = false;
        continue;
      }
      rig.root.visible = true;
      rig.root.position.set(h.x, h.y, h.z);
      rig.root.rotation.y = h.yaw;
      rig.torso.position.y = lerp(rig.torso.position.y, 0.78 + (h.crouching ? -0.42 : 0), clamp(dt * 10, 0, 1));
      const legSwing = Math.sin(h.walkCycle) * 0.48;
      rig.legL.rotation.x = legSwing; rig.legR.rotation.x = -legSwing;
      let armRot = 0.25;
      if (h.swingPhase === 'windup') armRot = 2.4;
      else if (h.swingPhase === 'strike') armRot = -0.9;
      rig.armR.rotation.x = lerp(rig.armR.rotation.x, armRot, clamp(dt * 18, 0, 1));
      rig.armL.rotation.x = lerp(rig.armL.rotation.x, h.spraying ? 1.15 + Math.max(0, h.pitch) * 0.9 : 0.2, clamp(dt * 12, 0, 1));
    }

    if (state.playerSide === 'human') {
      const h = state.getLocalHuman();
      if (!h) return;
      this.fpHands.visible = true;

      const shakeX = (Math.random() - 0.5) * h.cameraShake * 0.12;
      const shakeY = (Math.random() - 0.5) * h.cameraShake * 0.12;
      const bob = Math.sin(h.walkCycle) * 0.032;

      this.camera.position.set(h.x + shakeX, h.y + h.eyeHeight + bob + shakeY, h.z);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = h.yaw;
      this.camera.rotation.x = h.pitch;
      this.camera.rotation.z = (Math.random() - 0.5) * h.cameraShake * 0.06;

      if (Math.abs(this.camera.fov - h.fov) > 0.05) {
        this.camera.fov = h.fov;
        this.camera.updateProjectionMatrix();
      }

      let pRotX = -0.18, pRotZ = 0.12, pPosY = -0.26 + Math.sin(h.walkCycle) * 0.015, pPosZ = -0.48;
      if (h.swingPhase === 'windup') {
        const t = clamp(h.swingTimer / BALANCE.newspaper.windupTime, 0, 1);
        pRotX = lerp(-0.18, 0.85, t); pPosY = lerp(-0.26, -0.02, t); pPosZ = lerp(-0.48, -0.35, t);
      } else if (h.swingPhase === 'strike') {
        const t = clamp(h.swingTimer / BALANCE.newspaper.strikeTime, 0, 1);
        pRotX = lerp(0.85, -1.65, t * t); pRotZ = lerp(0.12, 0.42, t); pPosY = lerp(-0.02, -0.38, t); pPosZ = lerp(-0.35, -0.68, t);
      } else if (h.swingPhase === 'recover') {
        const t = clamp(h.swingTimer / Math.max(0.1, h.swingRecoverDuration), 0, 1);
        pRotX = lerp(-1.65, -0.18, t); pRotZ = lerp(0.42, 0.12, t); pPosY = lerp(-0.38, -0.26, t); pPosZ = lerp(-0.68, -0.48, t);
      }

      this.fpNewspaperGroup.rotation.set(pRotX, 0, pRotZ);
      this.fpNewspaperGroup.position.set(0.32, pPosY, pPosZ);

      const spZ = h.spraying ? -0.56 : -0.44;
      const spVib = h.spraying ? (Math.random() - 0.5) * 0.012 : 0;
      this.fpSprayGroup.position.set(-0.30 + spVib, -0.28 + spVib, lerp(this.fpSprayGroup.position.z, spZ, clamp(dt * 14, 0, 1)));
      this.fpSprayGroup.rotation.x = h.spraying ? -0.28 : 0.05;
    } else {
      this.fpHands.visible = false;
      const r = state.getCameraRoach();
      if (!r) return;

      const camDist = r.flying ? 0.58 : (IS_MOBILE ? 0.54 : 0.48);
      const sinY = Math.sin(r.camYaw), cosY = Math.cos(r.camYaw);
      const cosP = Math.cos(r.camPitch), sinP = Math.sin(r.camPitch);

      let cx = clamp(r.x + sinY * cosP * camDist, -room.halfW + 0.06, room.halfW - 0.06);
      let cy = clamp(r.y + 0.075 + sinP * camDist, 0.045, room.height - 0.08);
      let cz = clamp(r.z + cosY * cosP * camDist, -room.halfD + 0.06, room.halfD - 0.06);

      const shake = state.roachCameraShake * 0.05;
      this.camera.position.set(cx + (Math.random() - 0.5) * shake, cy + (Math.random() - 0.5) * shake, cz + (Math.random() - 0.5) * shake);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(r.x, r.y + 0.04, r.z);

      const baseFov = IS_MOBILE ? 80 : 72;
      const targetFov = r.flying ? baseFov + 12 : (r.sprinting ? baseFov + 8 : baseFov);
      if (Math.abs(this.camera.fov - targetFov) > 0.05) {
        this.camera.fov = lerp(this.camera.fov, targetFov, clamp(dt * 10, 0, 1));
        this.camera.updateProjectionMatrix();
      }
    }
  }

  updateFurnitureTransparency(state, dt) {
    let hidingId = null;
    if (state.mode === 'playing' && state.playerSide === 'roach') {
      const r = state.getCameraRoach();
      if (r && r.alive) hidingId = state.isUnderFurniture(r.x, r.z, r.y);
    }

    this.furnitureMaterials.forEach((mats, id) => {
      const targetOp = (id === hidingId) ? 0.30 : 1.0;
      for (const m of mats) {
        m.opacity = lerp(m.opacity, targetOp, clamp(dt * 10, 0, 1));
        m.depthWrite = m.opacity > 0.85;
      }
    });
  }

  updateEffects(state, dt) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.age += dt;
      const t = sw.age / sw.maxAge;
      if (t >= 1) {
        this.scene.remove(sw.mesh); sw.mesh.geometry.dispose(); sw.mesh.material.dispose();
        this.shockwaves.splice(i, 1);
        continue;
      }
      const scale = 1.0 + t * 2.4;
      sw.mesh.scale.set(scale, scale, 1);
      sw.mesh.material.opacity = (1 - t) * 0.62;
    }

    const colliders = state.stage.colliders;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      const t = p.age / p.maxAge;
      if (t >= 1) {
        this.scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      p.vy -= p.gravity * dt;
      let nx = p.mesh.position.x + p.vx * dt;
      let ny = Math.max(0.015, p.mesh.position.y + p.vy * dt);
      let nz = p.mesh.position.z + p.vz * dt;

      if (p.collideFurniture) {
        for (let c = 0; c < colliders.length; c++) {
          const col = colliders[c];
          if (nx > col.minX && nx < col.maxX && nz > col.minZ && nz < col.maxZ && ny > col.bottomY && ny < col.topY) {
            p.vx = -p.vx * 0.25 + (Math.random() - 0.5) * 1.1;
            p.vz = -p.vz * 0.25 + (Math.random() - 0.5) * 1.1;
            p.vy = Math.abs(p.vy) * 0.2 + 0.35;
            nx = p.mesh.position.x;
            nz = p.mesh.position.z;
            break;
          }
        }
      }

      p.mesh.position.set(nx, ny, nz);
      p.mesh.scale.setScalar(1.0 + t * p.grow);
      p.mesh.material.opacity = (1 - t) * 0.5;
    }
  }
}
