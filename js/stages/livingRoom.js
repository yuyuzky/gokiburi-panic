import { buildCollidersFromFurniture, lerp, clamp } from '../config.js';

const ROOM = {
  width: 10.0,
  depth: 8.4,
  height: 3.3,
  halfW: 5.0,
  halfD: 4.2
};

const FURNITURE_DEFS = [
  {
    id: 'sofa', name: 'ソファ',
    x: -1.8, z: 0.6, w: 2.38, d: 0.94, bottomY: 0.18, topY: 0.86,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 2.38, d: 0.94, bottomY: 0.18, topY: 0.485, climbable: true },
      { ox: 0, oz: 0.36, w: 2.38, d: 0.22, bottomY: 0.40, topY: 0.86, climbable: true },
      { ox: -1.08, oz: 0, w: 0.22, d: 0.92, bottomY: 0.38, topY: 0.66, climbable: true },
      { ox:  1.08, oz: 0, w: 0.22, d: 0.92, bottomY: 0.38, topY: 0.66, climbable: true }
    ]
  },
  {
    id: 'low_table', name: 'ローテーブル',
    x: -1.8, z: -0.95, w: 1.45, d: 0.78, bottomY: 0.36, topY: 0.42,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 1.45, d: 0.78, bottomY: 0.36, topY: 0.42, climbable: true }
    ]
  },
  {
    id: 'tv_stand', name: 'テレビ台',
    x: -1.8, z: -3.55, w: 2.1, d: 0.52, bottomY: 0.16, topY: 0.52,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 2.1, d: 0.52, bottomY: 0.16, topY: 0.52, climbable: true },
      { ox: 0, oz: 0, w: 1.42, d: 0.10, bottomY: 0.52, topY: 1.46, climbable: true }
    ]
  },
  {
    id: 'bookshelf', name: '本棚',
    x: -4.62, z: -0.8, w: 0.62, d: 1.75, bottomY: 0.0, topY: 2.1,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.62, d: 1.75, bottomY: 0.0, topY: 2.1, climbable: true }
    ]
  },
  {
    id: 'kitchen_counter', name: 'キッチンカウンター',
    x: 3.7, z: 2.35, w: 2.36, d: 0.88, bottomY: 0.0, topY: 0.92,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 2.30, d: 0.82, bottomY: 0.0, topY: 0.86, climbable: true },
      { ox: 0, oz: 0, w: 2.36, d: 0.88, bottomY: 0.86, topY: 0.92, climbable: true }
    ]
  },
  {
    id: 'fridge', name: '冷蔵庫',
    x: 4.42, z: -1.4, w: 0.88, d: 0.86, bottomY: 0.0, topY: 2.05,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.88, d: 0.86, bottomY: 0.0, topY: 2.05, climbable: true }
    ]
  },
  {
    id: 'dining_table', name: 'ダイニングテーブル',
    x: 2.35, z: -1.1, w: 1.65, d: 1.05, bottomY: 0.70, topY: 0.76,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 1.65, d: 1.05, bottomY: 0.70, topY: 0.76, climbable: true }
    ]
  },
  {
    id: 'chair_1', name: 'ダイニングチェア1',
    x: 2.35, z: -1.85, w: 0.46, d: 0.46, bottomY: 0.425, topY: 0.475,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.46, d: 0.46, bottomY: 0.425, topY: 0.475, climbable: true },
      { ox: 0, oz: -0.20, w: 0.44, d: 0.06, bottomY: 0.47, topY: 0.89, climbable: true }
    ]
  },
  {
    id: 'chair_2', name: 'ダイニングチェア2',
    x: 2.35, z: -0.35, w: 0.46, d: 0.46, bottomY: 0.425, topY: 0.475,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.46, d: 0.46, bottomY: 0.425, topY: 0.475, climbable: true },
      { ox: 0, oz: 0.20, w: 0.44, d: 0.06, bottomY: 0.47, topY: 0.89, climbable: true }
    ]
  },
  {
    id: 'plant_pot', name: '観葉植物',
    x: -4.25, z: -3.45, w: 0.46, d: 0.46, bottomY: 0.0, topY: 0.45,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.46, d: 0.46, bottomY: 0.0, topY: 0.45, climbable: true }
    ]
  },
  {
    id: 'low_chest', name: 'ローチェスト',
    x: -0.6, z: 3.75, w: 1.69, d: 0.52, bottomY: 0.14, topY: 0.78,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 1.65, d: 0.48, bottomY: 0.14, topY: 0.74, climbable: true },
      { ox: 0, oz: 0, w: 1.69, d: 0.52, bottomY: 0.74, topY: 0.78, climbable: true }
    ]
  },
  {
    id: 'ottoman', name: 'オットマン',
    x: -3.55, z: 0.75, w: 0.68, d: 0.68, bottomY: 0.12, topY: 0.40,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.68, d: 0.68, bottomY: 0.12, topY: 0.40, climbable: true }
    ]
  },
  {
    id: 'kitchen_wagon', name: 'キッチンワゴン',
    x: 4.45, z: -3.05, w: 0.68, d: 0.74, bottomY: 0.0, topY: 0.84,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.68, d: 0.74, bottomY: 0.0, topY: 0.84, climbable: true }
    ]
  },
  {
    id: 'floor_lamp', name: 'フロアランプ',
    x: -4.35, z: 3.45, w: 0.34, d: 0.34, bottomY: 0.0, topY: 1.64,
    canHideUnder: false, climbable: false,
    parts: [
      { ox: 0, oz: 0, w: 0.34, d: 0.34, bottomY: 0.0, topY: 0.045, climbable: false },
      { ox: 0, oz: 0, w: 0.08, d: 0.08, bottomY: 0.045, topY: 1.32, climbable: false },
      { ox: 0, oz: 0, w: 0.42, d: 0.42, bottomY: 1.32, topY: 1.64, climbable: false }
    ]
  }
];

const INITIAL_PROPS = [
  { id: 'mug_1', type: 'mug', x: -1.5, y: 0.42 + 0.06, z: -0.85, radius: 0.055, halfH: 0.06 },
  { id: 'remote_1', type: 'remote', x: -2.05, y: 0.42 + 0.013, z: -1.05, radius: 0.09, halfH: 0.013 },
  { id: 'tissue_1', type: 'tissue', x: -1.25, y: 0.42 + 0.05, z: -1.08, radius: 0.12, halfH: 0.05 },
  { id: 'book_1', type: 'book', x: -2.25, y: 0.42 + 0.021, z: -0.78, radius: 0.12, halfH: 0.021 },
  { id: 'mug_2', type: 'mug', x: 2.1, y: 0.76 + 0.06, z: -1.0, radius: 0.055, halfH: 0.06 },
  { id: 'book_2', type: 'book', x: 2.65, y: 0.76 + 0.021, z: -1.25, radius: 0.12, halfH: 0.021 },
  { id: 'tissue_2', type: 'tissue', x: 3.4, y: 0.92 + 0.05, z: 2.25, radius: 0.12, halfH: 0.05 },
  { id: 'can_1', type: 'can', x: 2.45, y: 0.76 + 0.065, z: -0.88, radius: 0.04, halfH: 0.065 },
  { id: 'book_3', type: 'book', x: -1.2, y: 0.021, z: 2.4, radius: 0.12, halfH: 0.021 },
  { id: 'mug_3', type: 'mug', x: -0.95, y: 0.78 + 0.06, z: 3.72, radius: 0.055, halfH: 0.06 },
  { id: 'snack_1', type: 'snack', x: -0.22, y: 0.78 + 0.075, z: 3.74, radius: 0.08, halfH: 0.075 },
  { id: 'mini_plant_1', type: 'mini_plant', x: 4.35, y: 0.92 + 0.08, z: 2.38, radius: 0.07, halfH: 0.08 },
  { id: 'can_2', type: 'can', x: 4.42, y: 0.84 + 0.065, z: -3.02, radius: 0.04, halfH: 0.065 },
  { id: 'book_4', type: 'book', x: -0.45, y: 0.021, z: -3.45, radius: 0.12, halfH: 0.021 },
  { id: 'remote_2', type: 'remote', x: -3.55, y: 0.40 + 0.013, z: 0.75, radius: 0.09, halfH: 0.013 }
];

const CRUMB_SPAWN_POINTS = [
  { x: -3.5, y: 0.0,  z: -2.4, elevated: false, jitter: 0.32 },
  { x: -0.4, y: 0.0,  z: -3.1, elevated: false, jitter: 0.32 },
  { x:  1.4, y: 0.0,  z: -2.9, elevated: false, jitter: 0.30 },
  { x: -3.5, y: 0.0,  z:  2.2, elevated: false, jitter: 0.30 },
  { x:  0.8, y: 0.0,  z:  2.4, elevated: false, jitter: 0.30 },
  { x:  3.1, y: 0.0,  z:  0.7, elevated: false, jitter: 0.30 },
  { x:  0.3, y: 0.0,  z: -0.7, elevated: false, jitter: 0.30 },
  { x: -1.75, y: 0.42, z: -0.92, elevated: true, jitter: 0.18 },
  { x:  2.32, y: 0.76, z: -1.08, elevated: true, jitter: 0.22 },
  { x:  3.75, y: 0.92, z:  2.35, elevated: true, jitter: 0.18 },
  { x: -0.60, y: 0.78, z:  3.74, elevated: true, jitter: 0.14 },
  { x:  4.45, y: 0.84, z: -3.05, elevated: true, jitter: 0.12 }
];

function createWoodFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#7c5338';
  ctx.fillRect(0, 0, 512, 512);
  const planks = 8;
  const plankH = 512 / planks;
  for (let i = 0; i < planks; i++) {
    const y = i * plankH;
    const tone = 112 + ((i * 23) % 24) - 12;
    ctx.fillStyle = `rgb(${tone + 18}, ${tone - 14}, ${tone - 38})`;
    ctx.fillRect(0, y, 512, plankH - 2);
    for (let g = 0; g < 18; g++) {
      const gy = y + Math.random() * (plankH - 3);
      ctx.fillStyle = g % 2 === 0 ? 'rgba(55, 30, 16, 0.14)' : 'rgba(180, 128, 86, 0.10)';
      ctx.fillRect(0, gy, 512, 1.5 + Math.random() * 2);
    }
    const jointX = ((i * 173 + 90) % 420) + 40;
    ctx.fillStyle = 'rgba(38, 22, 12, 0.65)';
    ctx.fillRect(jointX, y, 2, plankH);
    ctx.fillRect(0, y + plankH - 2, 512, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 4);
  return tex;
}

function createWallpaperTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e7dccb';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(180,162,140,0.16)' : 'rgba(255,248,238,0.18)';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  return tex;
}

function createSunsetSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.00, '#131632');
  grad.addColorStop(0.24, '#2d234d');
  grad.addColorStop(0.42, '#733856');
  grad.addColorStop(0.54, '#c9523e');
  grad.addColorStop(0.64, '#f28b3c');
  grad.addColorStop(0.72, '#ffd07b');
  grad.addColorStop(1.00, '#3a2232');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  return new THREE.CanvasTexture(canvas);
}

function createGodRayTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, 'rgba(255, 195, 118, 0.26)');
  grad.addColorStop(0.45, 'rgba(255, 152, 82, 0.13)');
  grad.addColorStop(1.0, 'rgba(255, 120, 60, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 256);

  const hGrad = ctx.createLinearGradient(0, 0, 128, 0);
  hGrad.addColorStop(0.0, 'rgba(0,0,0,1)');
  hGrad.addColorStop(0.22, 'rgba(0,0,0,0)');
  hGrad.addColorStop(0.78, 'rgba(0,0,0,0)');
  hGrad.addColorStop(1.0, 'rgba(0,0,0,1)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, 0, 128, 256);
  return new THREE.CanvasTexture(canvas);
}

export const livingRoomStage = {
  id: 'living_room',
  name: '夕暮れリビング',
  subtitle: 'バランス型・広めの洋室',
  badge: 'STAGE 01',
  description: '西日が差し込み、窓外を夕方の電車が走る10m×8.4mのリビング。見通しと家具隠蔽のバランス型。',
  room: ROOM,
  hasTrain: true,
  humanSpawn: { x: 0.4, y: 0.0, z: 2.2, yaw: 0.15, pitch: -0.18 },
  humanSpawns: [
    { x: 0.4, y: 0.0, z: 2.2, yaw: 0.15, pitch: -0.18 },
    { x: -0.6, y: 0.0, z: 2.2, yaw: -0.1, pitch: -0.18 },
    { x: 1.4, y: 0.0, z: 1.6, yaw: 0.35, pitch: -0.18 },
    { x: 0.2, y: 0.0, z: 0.3, yaw: 0.0, pitch: -0.18 },
    { x: 1.2, y: 0.0, z: -0.2, yaw: 0.2, pitch: -0.18 },
    { x: -3.2, y: 0.0, z: 2.2, yaw: -0.3, pitch: -0.18 },
    { x: 2.0, y: 0.0, z: 2.6, yaw: 0.45, pitch: -0.18 },
    { x: -1.8, y: 0.0, z: 2.6, yaw: -0.2, pitch: -0.18 }
  ],
  roachSpawns: [
    { x: -1.8, z: -0.95, yaw: 0.4 },
    { x: -1.6, z: -3.55, yaw: 2.2 },
    { x: 2.4, z: -1.1, yaw: -1.2 },
    { x: -1.8, z: 0.6, yaw: 1.4 },
    { x: -3.55, z: 0.75, yaw: -0.6 },
    { x: -0.6, z: 3.75, yaw: 3.0 },
    { x: 3.4, z: -2.6, yaw: -2.2 },
    { x: -3.5, z: -2.4, yaw: 0.9 }
  ],
  refillSpot: {
    x: 2.82,
    y: 0.92,
    z: 2.08,
    interactDist: 1.65,
    holdDuration: 2.0,
    cooldownDuration: 15.0
  },
  furnitureDefs: FURNITURE_DEFS,
  colliders: buildCollidersFromFurniture(FURNITURE_DEFS),
  initialProps: INITIAL_PROPS,
  crumbSpawnPoints: CRUMB_SPAWN_POINTS,
  sceneColors: {
    background: 0x2a1829,
    fogColor: 0x4a293c,
    fogNear: 22,
    fogFar: 115,
    exposure: 1.08
  },
  titleCamera: {
    centerX: 0,
    ampX: 3.2,
    y: 1.55,
    z: 2.85,
    lookAt: [-0.4, 1.05, -4.5],
    humanPos: [1.3, 0, 2.5],
    humanYaw: 0.4
  },

  buildScene(stageGroup, registerFurniture) {
    const curtainMeshes = [];
    const godRayMeshes = [];
    const dustVelocities = [];

    // 照明
    stageGroup.add(new THREE.HemisphereLight(0x8e79b8, 0x352845, 0.85));
    stageGroup.add(new THREE.AmbientLight(0x4c3b63, 0.42));

    const sun = new THREE.DirectionalLight(0xff8442, 2.25);
    sun.position.set(3.5, 4.6, -11.5);
    sun.target.position.set(-0.6, 0.0, 1.4);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 26;
    const d = 7.2;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0007;
    stageGroup.add(sun, sun.target);

    const bounce = new THREE.PointLight(0xff9b5e, 0.65, 11, 1.6);
    bounce.position.set(0.0, 1.2, -1.6);
    stageGroup.add(bounce);

    const ceilingGlow = new THREE.PointLight(0xffe7c4, 0.35, 10, 1.8);
    ceilingGlow.position.set(0, 3.0, 0.5);
    stageGroup.add(ceilingGlow);

    const lampGlow = new THREE.PointLight(0xffb46b, 0.52, 5.5, 1.8);
    lampGlow.position.set(-4.35, 1.52, 3.45);
    stageGroup.add(lampGlow);

    // 窓外ジオラマ（夕焼け空・住宅街・高架電車）
    const ext = new THREE.Group();
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(110, 24, 18),
      new THREE.MeshBasicMaterial({ map: createSunsetSkyTexture(), side: THREE.BackSide, fog: false })
    );
    ext.add(sky);

    const sunGroup = new THREE.Group();
    sunGroup.position.set(14, 11, -78);
    sunGroup.add(new THREE.Mesh(new THREE.CircleGeometry(6.8, 24), new THREE.MeshBasicMaterial({ color: 0xffdf8e, fog: false })));
    const halo = new THREE.Mesh(new THREE.CircleGeometry(12.5, 24), new THREE.MeshBasicMaterial({ color: 0xff7b38, transparent: true, opacity: 0.28, fog: false }));
    halo.position.z = -0.2;
    sunGroup.add(halo);
    ext.add(sunGroup);

    const balconyFloor = new THREE.Mesh(
      new THREE.BoxGeometry(11.0, 0.16, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x6f686c, roughness: 0.9, flatShading: true })
    );
    balconyFloor.position.set(0, -0.06, -ROOM.halfD - 0.9);
    balconyFloor.receiveShadow = true;
    ext.add(balconyFloor);

    const railMat = new THREE.MeshStandardMaterial({ color: 0x3b3842, roughness: 0.5, metalness: 0.4, flatShading: true });
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.06, 0.07), railMat);
    topRail.position.set(0, 1.05, -ROOM.halfD - 1.72);
    const botRail = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.05, 0.05), railMat);
    botRail.position.set(0, 0.14, -ROOM.halfD - 1.72);
    ext.add(topRail, botRail);

    const barGeo = new THREE.BoxGeometry(0.03, 0.92, 0.03);
    for (let x = -5.1; x <= 5.1; x += 0.34) {
      const bar = new THREE.Mesh(barGeo, railMat);
      bar.position.set(x, 0.6, -ROOM.halfD - 1.72);
      ext.add(bar);
    }

    const acUnit = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.62, 0.36),
      new THREE.MeshStandardMaterial({ color: 0xbfb5ad, roughness: 0.7, flatShading: true })
    );
    acUnit.position.set(-3.9, 0.34, -ROOM.halfD - 1.25);
    ext.add(acUnit);

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2c222e, roughness: 0.9, flatShading: true });
    [[-7.5, -13.5], [8.5, -15.5], [-19, -18], [21, -17]].forEach(([px, pz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 12, 6), poleMat);
      pole.position.set(px, 3.0, pz);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.1), poleMat);
      arm.position.set(px, 7.6, pz);
      ext.add(pole, arm);
    });

    const wireMat = new THREE.LineBasicMaterial({ color: 0x1c1420 });
    const addWire = (p1, p2, sag) => {
      const pts = [];
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        pts.push(new THREE.Vector3(lerp(p1[0], p2[0], t), lerp(p1[1], p2[1], t) - Math.sin(t * Math.PI) * sag, lerp(p1[2], p2[2], t)));
      }
      ext.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireMat));
    };
    addWire([-7.5, 7.55, -13.5], [8.5, 7.55, -15.5], 0.85);
    addWire([-7.5, 7.20, -13.5], [8.5, 7.20, -15.5], 1.15);

    const houseMat = new THREE.MeshStandardMaterial({ color: 0x2b1d2e, roughness: 0.95, flatShading: true });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x3f2433, roughness: 0.9, flatShading: true });
    const litWinMat = new THREE.MeshBasicMaterial({ color: 0xffcc77 });
    for (let i = 0; i < 24; i++) {
      const hx = -34 + i * 2.9;
      const hz = -15 - ((i * 7) % 12);
      const hw = 2.1 + (i % 3) * 0.55;
      const hh = 2.8 + (i % 4) * 0.85;
      const hd = 2.3 + (i % 2) * 0.6;
      const house = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(hw, hh, hd), houseMat);
      body.position.y = hh * 0.5 - 3.6;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(hw, hd) * 0.75, 1.3, 4), roofMat);
      roof.rotation.y = Math.PI * 0.25;
      roof.position.y = hh - 3.6 + 0.62;
      house.add(body, roof);
      if (i % 2 === 0) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.55), litWinMat);
        win.position.set(0, hh * 0.5 - 3.2, hd * 0.5 + 0.02);
        house.add(win);
      }
      house.position.set(hx, 0, hz);
      ext.add(house);
    }

    const viaductZ = -21.5;
    const viaductY = 2.4;
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x3a2a3b, roughness: 0.95, flatShading: true });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(100, 0.65, 1.9), concreteMat);
    deck.position.set(0, viaductY, viaductZ);
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(100, 0.55, 0.18), concreteMat);
    sideWall.position.set(0, viaductY + 0.52, viaductZ + 0.88);
    ext.add(deck, sideWall);
    for (let px = -42; px <= 42; px += 7.5) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.85, 8.0, 1.3), concreteMat);
      pillar.position.set(px, viaductY - 4.2, viaductZ);
      ext.add(pillar);
    }

    const trainGroup = new THREE.Group();
    trainGroup.position.set(-28, viaductY + 1.05, viaductZ);
    const carBodyMat = new THREE.MeshStandardMaterial({ color: 0x4b3c4d, roughness: 0.6, flatShading: true });
    const carStripeMat = new THREE.MeshStandardMaterial({ color: 0xd96b38, roughness: 0.5, flatShading: true });
    const trainWinMat = new THREE.MeshBasicMaterial({ color: 0xffe29a });
    const headLightMat = new THREE.MeshBasicMaterial({ color: 0xfff6d1 });
    for (let c = 0; c < 4; c++) {
      const car = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.35, 1.25), carBodyMat);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.62, 0.22, 1.28), carStripeMat);
      stripe.position.y = -0.18;
      car.add(body, stripe);
      for (let w = 0; w < 4; w++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.48), trainWinMat);
        win.position.set(-1.55 + w * 1.03, 0.16, 0.64);
        car.add(win);
      }
      if (c === 0 || c === 3) {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.7), headLightMat);
        hl.position.set(c === 3 ? 2.32 : -2.32, -0.25, 0);
        car.add(hl);
      }
      car.position.x = (c - 1.5) * 4.85;
      trainGroup.add(car);
    }
    ext.add(trainGroup);

    const mMat1 = new THREE.MeshStandardMaterial({ color: 0x3b223a, roughness: 1.0, flatShading: true });
    const mMat2 = new THREE.MeshStandardMaterial({ color: 0x2a1830, roughness: 1.0, flatShading: true });
    [[-38, -48, 22, 18, mMat1], [-14, -52, 26, 22, mMat2], [16, -54, 28, 20, mMat1], [42, -50, 24, 19, mMat2], [0, -64, 34, 26, mMat2]].forEach(([mx, mz, rad, h, mat]) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(rad, h, 5), mat);
      cone.position.set(mx, h * 0.5 - 8.5, mz);
      ext.add(cone);
    });
    stageGroup.add(ext);

    // 室内構造（床・天井・壁・掃き出し窓・カーテン・ラグ）
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM.width, ROOM.depth),
      new THREE.MeshStandardMaterial({ map: createWoodFloorTexture(), roughness: 0.62, metalness: 0.05 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    stageGroup.add(floor);

    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM.width, ROOM.depth),
      new THREE.MeshStandardMaterial({ color: 0xd9cfc4, roughness: 0.92, flatShading: true })
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = ROOM.height;
    stageGroup.add(ceil);

    const lightCover = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.48, 0.1, 12),
      new THREE.MeshStandardMaterial({ color: 0xfff0d8, emissive: 0xffd29e, emissiveIntensity: 0.25, roughness: 0.4, flatShading: true })
    );
    lightCover.position.set(0, ROOM.height - 0.06, 0.3);
    stageGroup.add(lightCover);

    const wallMat = new THREE.MeshStandardMaterial({ map: createWallpaperTexture(), roughness: 0.88, flatShading: true });
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x5c3c28, roughness: 0.7, flatShading: true });

    const southWall = new THREE.Mesh(new THREE.BoxGeometry(ROOM.width, ROOM.height, 0.16), wallMat);
    southWall.position.set(0, ROOM.height * 0.5, ROOM.halfD + 0.08);
    southWall.receiveShadow = true;
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.16, ROOM.height, ROOM.depth), wallMat);
    westWall.position.set(-ROOM.halfW - 0.08, ROOM.height * 0.5, 0);
    westWall.receiveShadow = true;
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.16, ROOM.height, ROOM.depth), wallMat);
    eastWall.position.set(ROOM.halfW + 0.08, ROOM.height * 0.5, 0);
    eastWall.receiveShadow = true;
    stageGroup.add(southWall, westWall, eastWall);

    const bbS = new THREE.Mesh(new THREE.BoxGeometry(ROOM.width, 0.1, 0.03), baseboardMat);
    bbS.position.set(0, 0.05, ROOM.halfD - 0.015);
    const bbW = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, ROOM.depth), baseboardMat);
    bbW.position.set(-ROOM.halfW + 0.015, 0.05, 0);
    const bbE = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, ROOM.depth), baseboardMat);
    bbE.position.set(ROOM.halfW - 0.015, 0.05, 0);
    stageGroup.add(bbS, bbW, bbE);

    const winW = 6.2;
    const winH = 2.45;
    const sideWallW = (ROOM.width - winW) * 0.5;
    const northLeft = new THREE.Mesh(new THREE.BoxGeometry(sideWallW, ROOM.height, 0.18), wallMat);
    northLeft.position.set(-ROOM.halfW + sideWallW * 0.5, ROOM.height * 0.5, -ROOM.halfD - 0.09);
    const northRight = new THREE.Mesh(new THREE.BoxGeometry(sideWallW, ROOM.height, 0.18), wallMat);
    northRight.position.set(ROOM.halfW - sideWallW * 0.5, ROOM.height * 0.5, -ROOM.halfD - 0.09);
    const northTop = new THREE.Mesh(new THREE.BoxGeometry(winW, ROOM.height - winH, 0.18), wallMat);
    northTop.position.set(0, winH + (ROOM.height - winH) * 0.5, -ROOM.halfD - 0.09);
    [northLeft, northRight, northTop].forEach(m => { m.castShadow = true; m.receiveShadow = true; stageGroup.add(m); });

    const sashMat = new THREE.MeshStandardMaterial({ color: 0x3b3d44, roughness: 0.4, metalness: 0.55, flatShading: true });
    const addSash = (w, h, d, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), sashMat);
      m.position.set(x, y, z);
      stageGroup.add(m);
    };
    addSash(winW, 0.08, 0.14, 0, winH, -ROOM.halfD);
    addSash(winW, 0.07, 0.14, 0, 0.035, -ROOM.halfD);
    addSash(0.08, winH, 0.12, 0, winH * 0.5, -ROOM.halfD);
    addSash(0.08, winH, 0.12, -winW * 0.5 + 0.04, winH * 0.5, -ROOM.halfD);
    addSash(0.08, winH, 0.12, winW * 0.5 - 0.04, winH * 0.5, -ROOM.halfD);

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(winW - 0.1, winH - 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffd2a8, transparent: true, opacity: 0.09, roughness: 0.1, metalness: 0.2 })
    );
    glass.position.set(0, winH * 0.5, -ROOM.halfD);
    stageGroup.add(glass);

    const curtainMat = new THREE.MeshStandardMaterial({ color: 0xfff1dc, transparent: true, opacity: 0.42, side: THREE.DoubleSide, roughness: 0.9, flatShading: true });
    [-1, 1].forEach(side => {
      const cGeo = new THREE.PlaneGeometry(1.15, winH + 0.05, 4, 6);
      const pos = cGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 8) * 0.04);
      cGeo.computeVertexNormals();
      const curtain = new THREE.Mesh(cGeo, curtainMat);
      curtain.position.set(side * (winW * 0.5 - 0.45), winH * 0.5 + 0.05, -ROOM.halfD + 0.14);
      stageGroup.add(curtain);
      curtainMeshes.push({ mesh: curtain, side });
    });

    const rug = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.014, 2.3),
      new THREE.MeshStandardMaterial({ color: 0x8b6e5b, roughness: 0.95, flatShading: true })
    );
    rug.position.set(-1.8, 0.007, -0.35);
    rug.receiveShadow = true;
    stageGroup.add(rug);

    // 掛け時計・アート・壁棚
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x4b2e1e, roughness: 0.72, flatShading: true });
    const clock = new THREE.Group();
    clock.position.set(-0.6, 2.15, ROOM.halfD - 0.03);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 16), frameMat);
    rim.rotation.x = Math.PI / 2;
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.046, 16), new THREE.MeshStandardMaterial({ color: 0xf4ece0, roughness: 0.85, flatShading: true }));
    face.rotation.x = Math.PI / 2;
    clock.add(rim, face);
    stageGroup.add(clock);

    // 家具一式
    const makeMat = (color, rough = 0.78, metal = 0.05) => new THREE.MeshStandardMaterial({
      color, roughness: rough, metalness: metal, flatShading: true, transparent: true, opacity: 1.0
    });

    // ソファ
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'sofa');
      const g = new THREE.Group();
      g.position.set(def.x, 0, def.z);
      const fabricMat = makeMat(0x3a4354, 0.92);
      const cushionMat = makeMat(0x4b5568, 0.92);
      const legMat = makeMat(0x4a2f1d, 0.7);
      const pillowMat = makeMat(0xc96b4b, 0.9);
      const legGeo = new THREE.CylinderGeometry(0.035, 0.025, 0.18, 6);
      [[-1.08, -0.38], [1.08, -0.38], [-1.08, 0.38], [1.08, 0.38]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, legMat); leg.position.set(lx, 0.09, lz); leg.castShadow = true; g.add(leg);
      });
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.24, 0.94), fabricMat); base.position.set(0, 0.30, 0); base.castShadow = true; base.receiveShadow = true; g.add(base);
      const back = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.46, 0.22), fabricMat); back.position.set(0, 0.63, 0.36); back.castShadow = true; g.add(back);
      [-1.08, 1.08].forEach(ax => { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.92), fabricMat); arm.position.set(ax, 0.52, 0); arm.castShadow = true; g.add(arm); });
      [-0.48, 0.48].forEach(cx => { const c = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.09, 0.68), cushionMat); c.position.set(cx, 0.44, -0.06); c.receiveShadow = true; g.add(c); });
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.30, 0.12), pillowMat); pillow.position.set(0.75, 0.60, 0.18); pillow.rotation.set(-0.22, -0.3, 0.15); g.add(pillow);
      registerFurniture('sofa', g, [fabricMat, cushionMat, legMat, pillowMat]);
    }
    // ローテーブル
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'low_table');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0x6b442a, 0.65), legMat = makeMat(0x4d301d, 0.7);
      const top = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.06, def.d), woodMat); top.position.y = 0.39; top.castShadow = true; top.receiveShadow = true; g.add(top);
      const legGeo = new THREE.BoxGeometry(0.06, 0.36, 0.06);
      [[-0.64, -0.31], [0.64, -0.31], [-0.64, 0.31], [0.64, 0.31]].forEach(([lx, lz]) => { const l = new THREE.Mesh(legGeo, legMat); l.position.set(lx, 0.18, lz); l.castShadow = true; g.add(l); });
      registerFurniture('low_table', g, [woodMat, legMat]);
    }
    // テレビ台
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'tv_stand');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0x5b3b27, 0.68), tvMat = makeMat(0x1f2026, 0.45, 0.3), scrMat = makeMat(0x14171f, 0.2, 0.4);
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.36, def.d), woodMat); body.position.y = 0.34; body.castShadow = true; body.receiveShadow = true; g.add(body);
      const legGeo = new THREE.CylinderGeometry(0.028, 0.022, 0.16, 6);
      [[-0.95, -0.18], [0.95, -0.18], [-0.95, 0.18], [0.95, 0.18]].forEach(([lx, lz]) => { const l = new THREE.Mesh(legGeo, tvMat); l.position.set(lx, 0.08, lz); g.add(l); });
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.12), tvMat); neck.position.set(0, 0.60, 0);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.82, 0.06), tvMat); panel.position.set(0, 1.05, 0); panel.castShadow = true;
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 0.74), scrMat); scr.position.set(0, 1.05, 0.032);
      g.add(neck, panel, scr);
      registerFurniture('tv_stand', g, [woodMat, tvMat, scrMat]);
    }
    // 本棚
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'bookshelf');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0x5c3c26, 0.75);
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.topY, def.d), woodMat); body.position.y = def.topY * 0.5; body.castShadow = true; body.receiveShadow = true; g.add(body);
      const cols = [0x8c3b32, 0x3b5978, 0xc79246, 0x4b6e52, 0x7a4f6b];
      const mats = [woodMat];
      for (let row = 0; row < 4; row++) {
        for (let b = 0; b < 9; b++) {
          const bm = makeMat(cols[(row * 3 + b) % cols.length], 0.85); mats.push(bm);
          const bh = 0.22 + ((b * 7) % 5) * 0.025;
          const bk = new THREE.Mesh(new THREE.BoxGeometry(0.16, bh, 0.12), bm);
          bk.position.set(def.w * 0.5 - 0.04, 0.35 + row * 0.44 + bh * 0.5, -0.7 + b * 0.17);
          g.add(bk);
        }
      }
      registerFurniture('bookshelf', g, mats);
    }
    // キッチンカウンター
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'kitchen_counter');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const baseMat = makeMat(0xded5c8, 0.82), topMat = makeMat(0x7c553b, 0.55), sinkMat = makeMat(0x8c929c, 0.35, 0.65);
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.30, 0.86, 0.82), baseMat); base.position.y = 0.43; base.castShadow = true; base.receiveShadow = true;
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.06, 0.88), topMat); top.position.y = 0.89; top.castShadow = true; top.receiveShadow = true;
      const sink = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 0.48), sinkMat); sink.position.set(0.45, 0.925, 0);
      g.add(base, top, sink);
      registerFurniture('kitchen_counter', g, [baseMat, topMat, sinkMat]);
    }
    // 冷蔵庫
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'fridge');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const bodyMat = makeMat(0xd6d1cc, 0.42, 0.25), lineMat = makeMat(0x69676b, 0.5);
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.topY, def.d), bodyMat); body.position.y = def.topY * 0.5; body.castShadow = true; body.receiveShadow = true;
      const seam = new THREE.Mesh(new THREE.BoxGeometry(def.w + 0.02, 0.02, def.d + 0.02), lineMat); seam.position.y = 0.85;
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.05), lineMat); handle.position.set(-def.w * 0.5 - 0.02, 1.32, 0.25);
      g.add(body, seam, handle);
      registerFurniture('fridge', g, [bodyMat, lineMat]);
    }
    // ダイニングテーブル
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'dining_table');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0x7d5133, 0.62), legMat = makeMat(0x573722, 0.7);
      const top = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.06, def.d), woodMat); top.position.y = def.topY - 0.03; top.castShadow = true; top.receiveShadow = true; g.add(top);
      const legGeo = new THREE.BoxGeometry(0.07, def.topY - 0.06, 0.07);
      [[-0.72, -0.42], [0.72, -0.42], [-0.72, 0.42], [0.72, 0.42]].forEach(([lx, lz]) => { const l = new THREE.Mesh(legGeo, legMat); l.position.set(lx, (def.topY - 0.06) * 0.5, lz); l.castShadow = true; g.add(l); });
      registerFurniture('dining_table', g, [woodMat, legMat]);
    }
    // ダイニングチェア x2
    ['chair_1', 'chair_2'].forEach((cid, idx) => {
      const def = FURNITURE_DEFS.find(f => f.id === cid);
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0x69422a, 0.7), seatMat = makeMat(0x9e7d63, 0.9);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.46), seatMat); seat.position.y = 0.45; seat.castShadow = true; g.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.42, 0.05), woodMat); back.position.set(0, 0.68, idx === 0 ? -0.20 : 0.20); back.castShadow = true; g.add(back);
      const legGeo = new THREE.BoxGeometry(0.04, 0.44, 0.04);
      [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].forEach(([lx, lz]) => { const l = new THREE.Mesh(legGeo, woodMat); l.position.set(lx, 0.22, lz); g.add(l); });
      registerFurniture(cid, g, [woodMat, seatMat]);
    });
    // 観葉植物
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'plant_pot');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const potMat = makeMat(0x9e583b, 0.85), soilMat = makeMat(0x3a281e, 0.95), leafMat = makeMat(0x3d6b41, 0.78);
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.45, 7), potMat); pot.position.y = 0.225; pot.castShadow = true;
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 7), soilMat); soil.position.y = 0.44;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.75, 5), soilMat); stem.position.y = 0.80;
      g.add(pot, soil, stem);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.52, 4), leafMat);
        leaf.position.set(Math.cos(a) * 0.22, 1.05 + (i % 3) * 0.14, Math.sin(a) * 0.22);
        leaf.rotation.z = -Math.cos(a) * 0.65; leaf.rotation.x = Math.sin(a) * 0.65;
        g.add(leaf);
      }
      registerFurniture('plant_pot', g, [potMat, soilMat, leafMat]);
    }
    // ローチェスト
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'low_chest');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0x6e472c, 0.68), drawerMat = makeMat(0x7c5335, 0.72), knobMat = makeMat(0xd4a65e, 0.35, 0.6), legMat = makeMat(0x452b1a, 0.75);
      const legGeo = new THREE.CylinderGeometry(0.026, 0.02, 0.14, 6);
      [[-0.72, -0.18], [0.72, -0.18], [-0.72, 0.18], [0.72, 0.18]].forEach(([lx, lz]) => { const l = new THREE.Mesh(legGeo, legMat); l.position.set(lx, 0.07, lz); g.add(l); });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.60, 0.48), woodMat); body.position.y = 0.44; body.castShadow = true; body.receiveShadow = true;
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.69, 0.04, 0.52), woodMat); top.position.y = 0.76; top.castShadow = true; top.receiveShadow = true;
      g.add(body, top);
      for (let col = -1; col <= 1; col++) {
        for (let row = 0; row < 2; row++) {
          const dr = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.03), drawerMat); dr.position.set(col * 0.52, 0.31 + row * 0.27, -0.25);
          const kn = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), knobMat); kn.position.set(col * 0.52, 0.31 + row * 0.27, -0.275);
          g.add(dr, kn);
        }
      }
      registerFurniture('low_chest', g, [woodMat, drawerMat, knobMat, legMat]);
    }
    // オットマン
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'ottoman');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const fabricMat = makeMat(0x4a5469, 0.92), legMat = makeMat(0x4a2f1d, 0.7);
      const legGeo = new THREE.CylinderGeometry(0.028, 0.022, 0.12, 6);
      [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].forEach(([lx, lz]) => { const l = new THREE.Mesh(legGeo, legMat); l.position.set(lx, 0.06, lz); g.add(l); });
      const cush = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.28, def.d), fabricMat); cush.position.y = 0.26; cush.castShadow = true; cush.receiveShadow = true; g.add(cush);
      registerFurniture('ottoman', g, [fabricMat, legMat]);
    }
    // キッチンワゴン
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'kitchen_wagon');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const frameMat = makeMat(0x3a3d45, 0.5, 0.45), woodMat = makeMat(0x8c5e3c, 0.62), binMat = makeMat(0x5e646e, 0.75);
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w - 0.08, 0.78, def.d - 0.08), binMat); body.position.y = 0.39; body.castShadow = true; body.receiveShadow = true;
      const top = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.05, def.d), woodMat); top.position.y = 0.815; top.castShadow = true; top.receiveShadow = true;
      g.add(body, top);
      registerFurniture('kitchen_wagon', g, [frameMat, woodMat, binMat]);
    }
    // フロアランプ
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'floor_lamp');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const metalMat = makeMat(0x2d2b33, 0.45, 0.6);
      const shadeMat = new THREE.MeshStandardMaterial({ color: 0xf7e3c4, emissive: 0xffa652, emissiveIntensity: 0.48, roughness: 0.85, flatShading: true, transparent: true, opacity: 1.0 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.17, 0.04, 10), metalMat); base.position.y = 0.02;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 1.38, 6), metalMat); pole.position.y = 0.71;
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.32, 10, 1, true), shadeMat); shade.position.y = 1.48;
      g.add(base, pole, shade);
      registerFurniture('floor_lamp', g, [metalMat, shadeMat]);
    }

    // ゴッドレイとホコリ
    const rayMat = new THREE.MeshBasicMaterial({ map: createGodRayTexture(), transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    [-1.8, -0.3, 1.3].forEach((rx, idx) => {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 5.2), rayMat);
      plane.position.set(rx - 0.5, 1.35, -2.1);
      plane.rotation.set(0.68, -0.28, 0.15);
      stageGroup.add(plane);
      godRayMeshes.push({ mesh: plane, baseOpacity: 0.55 + idx * 0.06, phase: idx * 1.4 });
    });

    const dustCount = 170;
    const positions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      positions[i * 3 + 0] = (Math.random() * 2 - 1) * (ROOM.halfW - 0.4);
      positions[i * 3 + 1] = 0.2 + Math.random() * (ROOM.height - 0.5);
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * (ROOM.halfD - 0.4);
      dustVelocities.push({ vx: (Math.random() - 0.5) * 0.06, vy: -0.02 + Math.random() * 0.04, vz: (Math.random() - 0.5) * 0.06 });
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dustPoints = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffd7a1, size: 0.028, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    stageGroup.add(dustPoints);

    return {
      update(dt, timeSec, state) {
        trainGroup.visible = state.train.active;
        trainGroup.position.x = state.train.x;
        curtainMeshes.forEach(({ mesh, side }, i) => {
          mesh.rotation.y = Math.sin(timeSec * 1.1 + i) * 0.06 * side;
          mesh.rotation.x = Math.sin(timeSec * 0.8 + i * 2) * 0.03;
        });
        godRayMeshes.forEach(r => {
          r.mesh.material.opacity = r.baseOpacity + Math.sin(timeSec * 0.7 + r.phase) * 0.07;
        });
        const pos = dustPoints.geometry.attributes.position;
        for (let i = 0; i < dustVelocities.length; i++) {
          const v = dustVelocities[i];
          let x = pos.getX(i) + v.vx * dt;
          let y = pos.getY(i) + v.vy * dt + Math.sin(timeSec + i) * 0.0005;
          let z = pos.getZ(i) + v.vz * dt;
          if (x < -ROOM.halfW + 0.3) x = ROOM.halfW - 0.3;
          if (x > ROOM.halfW - 0.3) x = -ROOM.halfW + 0.3;
          if (y < 0.15) y = ROOM.height - 0.3;
          if (y > ROOM.height - 0.2) y = 0.2;
          if (z < -ROOM.halfD + 0.3) z = ROOM.halfD - 0.3;
          if (z > ROOM.halfD - 0.3) z = -ROOM.halfD + 0.3;
          pos.setXYZ(i, x, y, z);
        }
        pos.needsUpdate = true;
      }
    };
  }
};
