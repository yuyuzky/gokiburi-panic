import { buildCollidersFromFurniture } from '../config.js';

// ステージ2：深夜のワンルーム（6.4m × 5.6m・中央島＋ロフトベッド＆ウォールシェルフの3層立体迷路・案1 懐中電灯なし）
const ROOM = {
  width: 6.4,
  depth: 5.6,
  height: 2.8,
  halfW: 3.2,
  halfD: 2.8
};

const FURNITURE_DEFS = [
  // 1. ロフトベッド（高層1.56m＋ハシゴ昇降＋ベッド下の潜伏空間。東側長辺と南側足元の2方向からしゃがみスプレー可能）
  {
    id: 'loft_bed', name: 'ロフトベッド',
    x: -2.55, z: -1.65, w: 0.98, d: 1.96, bottomY: 0.0, topY: 1.88,
    canHideUnder: true, climbable: true,
    parts: [
      // ロフト上段の床＆マットレス（高さ1.56m）
      { ox: 0, oz: 0, w: 0.98, d: 1.96, bottomY: 1.36, topY: 1.56, climbable: true },
      // 落下防止のサイドガード（東側の一部：南側は乗り降りできるよう開放）
      { ox: 0.46, oz: -0.25, w: 0.06, d: 1.24, bottomY: 1.56, topY: 1.84, climbable: true },
      // 北側ヘッドボード
      { ox: 0, oz: -0.94, w: 0.98, d: 0.08, bottomY: 1.36, topY: 1.88, climbable: true },
      // 昇降用ハシゴ（東側手前：床から一気にロフト上へ登攀可能）
      { ox: 0.50, oz: 0.62, w: 0.12, d: 0.42, bottomY: 0.0, topY: 1.56, climbable: true },
      // ベッド下のロー収納ボックス（潜伏時の遮蔽物）
      { ox: -0.18, oz: -0.45, w: 0.54, d: 0.72, bottomY: 0.0, topY: 0.34, climbable: true }
    ]
  },
  // 2. ベッド脇サイドテーブル（デジタル時計＆点滅ルーター）
  {
    id: 'side_table', name: 'サイドテーブル',
    x: -1.42, z: -2.48, w: 0.46, d: 0.42, bottomY: 0.12, topY: 0.54,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.46, d: 0.42, bottomY: 0.12, topY: 0.54, climbable: true }
    ]
  },
  // 3. 木製タンス（4段チェスト・段ボール山とロフト／西棚を繋ぐ中層ハブ）
  {
    id: 'chest', name: '木製タンス',
    x: -2.85, z: 0.18, w: 0.56, d: 1.04, bottomY: 0.08, topY: 0.86,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.56, d: 1.04, bottomY: 0.08, topY: 0.86, climbable: true }
    ]
  },
  // 4. 段ボールの山（3段の階段状・タンスへ駆け上がれる立体足場）
  {
    id: 'cardboard_stack', name: '段ボールの山',
    x: -2.50, z: 1.68, w: 1.20, d: 1.15, bottomY: 0.0, topY: 0.88,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0.30, oz: 0.20, w: 0.52, d: 0.48, bottomY: 0.0, topY: 0.32, climbable: true },
      { ox: -0.24, oz: 0.22, w: 0.54, d: 0.52, bottomY: 0.0, topY: 0.60, climbable: true },
      { ox: -0.26, oz: -0.32, w: 0.54, d: 0.50, bottomY: 0.0, topY: 0.88, climbable: true }
    ]
  },
  // 5. マップ中央：こたつ風ローテーブル＆座椅子（四方を回遊でき、東西を横断する中継足場）
  {
    id: 'center_table', name: 'ローテーブル',
    x: -0.15, z: -0.10, w: 1.04, d: 0.72, bottomY: 0.30, topY: 0.38,
    canHideUnder: true, climbable: true,
    parts: [
      // テーブル天板（下を潜り抜け可能）
      { ox: 0, oz: 0, w: 1.04, d: 0.72, bottomY: 0.30, topY: 0.38, climbable: true },
      // テーブル北側に置いたコンパクト座椅子
      { ox: -0.05, oz: -0.56, w: 0.44, d: 0.36, bottomY: 0.0, topY: 0.12, climbable: true },
      { ox: -0.05, oz: -0.70, w: 0.44, d: 0.08, bottomY: 0.10, topY: 0.44, climbable: true }
    ]
  },
  // 6. L字PCデスク（デュアルモニター・光るPCケース・キーボード＆マウス）
  {
    id: 'pc_desk', name: 'L字PCデスク',
    x: 1.85, z: -1.95, w: 1.80, d: 1.38, bottomY: 0.68, topY: 1.18,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: -0.34, w: 1.80, d: 0.68, bottomY: 0.68, topY: 0.74, climbable: true },
      { ox: 0.56, oz: 0.34, w: 0.68, d: 0.68, bottomY: 0.68, topY: 0.74, climbable: true },
      { ox: -0.30, oz: -0.50, w: 0.56, d: 0.06, bottomY: 0.78, topY: 1.18, climbable: true },
      { ox: 0.32, oz: -0.46, w: 0.52, d: 0.06, bottomY: 0.78, topY: 1.16, climbable: true },
      { ox: 0.68, oz: 0.38, w: 0.22, d: 0.46, bottomY: 0.74, topY: 1.18, climbable: true }
    ]
  },
  // 7. ゲーミングチェア（PCデスクへの踏み台）
  {
    id: 'gaming_chair', name: 'ゲーミングチェア',
    x: 1.55, z: -1.26, w: 0.54, d: 0.54, bottomY: 0.42, topY: 1.16,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.54, d: 0.54, bottomY: 0.42, topY: 0.49, climbable: true },
      { ox: 0, oz: 0.22, w: 0.48, d: 0.10, bottomY: 0.48, topY: 1.16, climbable: true }
    ]
  },
  // 8. 小型ギターアンプ＆エレキギター（PCデスクとシェルフを繋ぐ中継点）
  {
    id: 'guitar_amp', name: 'ギター＆アンプ',
    x: 2.82, z: -0.62, w: 0.56, d: 0.56, bottomY: 0.0, topY: 1.02,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0.08, w: 0.46, d: 0.32, bottomY: 0.0, topY: 0.46, climbable: true },
      { ox: -0.02, oz: -0.14, w: 0.34, d: 0.16, bottomY: 0.0, topY: 1.02, climbable: true }
    ]
  },
  // 9. 本と収納ケースが詰まったオープンシェルフ（高層1.62m）
  {
    id: 'open_shelf', name: 'オープンシェルフ',
    x: 2.86, z: 0.52, w: 0.52, d: 1.24, bottomY: 0.14, topY: 1.62,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.52, d: 1.24, bottomY: 0.14, topY: 1.62, climbable: true }
    ]
  },
  // 10. 西壁ウォールシェルフ（高さ1.56m：ロフトベッドからそのまま渡れる高層キャットウォーク）
  {
    id: 'wall_shelf_w', name: '西ウォールシェルフ',
    x: -2.96, z: 0.28, w: 0.40, d: 1.78, bottomY: 1.50, topY: 1.56,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.40, d: 1.78, bottomY: 1.50, topY: 1.56, climbable: true }
    ]
  },
  // 11. 東壁ウォールシェルフ（高さ1.68m：オープンシェルフとPCデスク上空を繋ぐ高層棚）
  {
    id: 'wall_shelf_e', name: '東ウォールシェルフ',
    x: 2.96, z: -1.05, w: 0.40, d: 1.75, bottomY: 1.62, topY: 1.68,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.40, d: 1.75, bottomY: 1.62, topY: 1.68, climbable: true }
    ]
  },
  // 12. ミニキッチン棚（スプレー補充スポット）＋上部ウォールシェルフ（高さ1.66m）
  {
    id: 'mini_kitchen', name: 'ミニキッチン棚',
    x: 1.65, z: 2.38, w: 1.48, d: 0.56, bottomY: 0.0, topY: 1.66,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 1.48, d: 0.56, bottomY: 0.0, topY: 0.86, climbable: true },
      { ox: 0, oz: 0.14, w: 1.48, d: 0.34, bottomY: 1.60, topY: 1.66, climbable: true }
    ]
  },
  // 13. ミニ冷蔵庫
  {
    id: 'mini_fridge', name: 'ミニ冷蔵庫',
    x: 2.78, z: 2.36, w: 0.54, d: 0.56, bottomY: 0.0, topY: 1.16,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.54, d: 0.56, bottomY: 0.0, topY: 1.16, climbable: true }
    ]
  },
  // 14. 洗濯カゴ
  {
    id: 'laundry_basket', name: '洗濯カゴ',
    x: -1.45, z: 2.42, w: 0.46, d: 0.42, bottomY: 0.0, topY: 0.48,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.46, d: 0.42, bottomY: 0.0, topY: 0.48, climbable: true }
    ]
  },
  // 15. ゴミ箱
  {
    id: 'trash_bin', name: 'ゴミ箱',
    x: 0.55, z: -2.52, w: 0.32, d: 0.32, bottomY: 0.0, topY: 0.40,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.32, d: 0.32, bottomY: 0.0, topY: 0.40, climbable: true }
    ]
  }
];

// 吹き飛ばせる自室小物（中央ローテーブルへ密集配置＋ロフト＆高層棚にも配置）
const INITIAL_PROPS = [
  // 中央ローテーブル上のパニック小物群（新聞紙を振ると派手に飛び散る）
  { id: 'center_mug', type: 'mug', x: -0.42, y: 0.38 + 0.06, z: -0.22, radius: 0.055, halfH: 0.06 },
  { id: 'center_snack', type: 'snack', x: 0.14, y: 0.38 + 0.075, z: -0.18, radius: 0.08, halfH: 0.075 },
  { id: 'center_remote', type: 'remote', x: -0.12, y: 0.38 + 0.013, z: 0.12, radius: 0.09, halfH: 0.013 },
  { id: 'center_tissue', type: 'tissue', x: 0.18, y: 0.38 + 0.05, z: 0.12, radius: 0.12, halfH: 0.05 },
  { id: 'center_can', type: 'can', x: -0.45, y: 0.38 + 0.065, z: 0.08, radius: 0.04, halfH: 0.065 },
  { id: 'center_book', type: 'book', x: -0.14, y: 0.38 + 0.021, z: -0.26, radius: 0.12, halfH: 0.021 },
  // ぬいぐるみ（ロフトベッド上・西ウォールシェルフ上・オープンシェルフ上）
  { id: 'plush_loft', type: 'plush', x: -2.42, y: 1.56 + 0.095, z: -1.12, radius: 0.09, halfH: 0.095 },
  { id: 'plush_west', type: 'plush', x: -2.94, y: 1.56 + 0.095, z: 0.48, radius: 0.09, halfH: 0.095 },
  { id: 'plush_shelf', type: 'plush', x: 2.82, y: 1.62 + 0.095, z: 0.25, radius: 0.09, halfH: 0.095 },
  // ヘッドホン・エナドリ・マグ（PCデスク＆東ウォールシェルフ）
  { id: 'headphone_1', type: 'headphone', x: 1.22, y: 0.74 + 0.065, z: -2.18, radius: 0.085, halfH: 0.065 },
  { id: 'energy_1', type: 'can', x: 1.52, y: 0.74 + 0.065, z: -2.38, radius: 0.04, halfH: 0.065 },
  { id: 'energy_2', type: 'can', x: 2.38, y: 0.74 + 0.065, z: -1.52, radius: 0.04, halfH: 0.065 },
  { id: 'mug_study', type: 'mug', x: 2.28, y: 0.74 + 0.06, z: -2.12, radius: 0.055, halfH: 0.06 },
  { id: 'book_east_high', type: 'book', x: 2.94, y: 1.68 + 0.021, z: -1.15, radius: 0.12, halfH: 0.021 },
  // タンス・段ボール・キッチン・床
  { id: 'tissue_chest', type: 'tissue', x: -2.84, y: 0.86 + 0.05, z: -0.02, radius: 0.12, halfH: 0.05 },
  { id: 'snack_box', type: 'snack', x: -2.74, y: 0.88 + 0.075, z: 1.36, radius: 0.08, halfH: 0.075 },
  { id: 'cup_kitchen', type: 'mug', x: 1.98, y: 0.86 + 0.06, z: 2.35, radius: 0.055, halfH: 0.06 },
  { id: 'book_floor1', type: 'book', x: -1.78, y: 0.021, z: 1.12, radius: 0.12, halfH: 0.021 },
  { id: 'snack_fridge', type: 'snack', x: 2.76, y: 1.16 + 0.075, z: 2.34, radius: 0.08, halfH: 0.075 }
];

// 食べかす配置（床・中層・高層1.56m〜1.68mの3層に分散して高低差の駆け引きを作る）
const CRUMB_SPAWN_POINTS = [
  // 床（通路・ロフト下周辺）
  { x: -1.25, y: 0.0,  z: -0.55, elevated: false, jitter: 0.22 },
  { x:  0.85, y: 0.0,  z:  0.55, elevated: false, jitter: 0.22 },
  { x: -0.95, y: 0.0,  z:  1.25, elevated: false, jitter: 0.22 },
  { x:  0.15, y: 0.0,  z: -1.55, elevated: false, jitter: 0.20 },
  // 中層（中央テーブル・タンス・PCデスク・キッチン棚）
  { x: -0.15, y: 0.38, z: -0.05, elevated: true, jitter: 0.16 },
  { x: -2.84, y: 0.86, z:  0.22, elevated: true, jitter: 0.12 },
  { x:  1.85, y: 0.74, z: -2.18, elevated: true, jitter: 0.16 },
  { x:  1.72, y: 0.86, z:  2.36, elevated: true, jitter: 0.14 },
  // 高層（ロフトベッド上・西ウォールシェルフ・東ウォールシェルフ・オープンシェルフ上）
  { x: -2.52, y: 1.56, z: -1.55, elevated: true, jitter: 0.18 },
  { x: -2.94, y: 1.56, z:  0.12, elevated: true, jitter: 0.10 },
  { x:  2.94, y: 1.68, z: -0.95, elevated: true, jitter: 0.10 },
  { x:  2.84, y: 1.62, z:  0.65, elevated: true, jitter: 0.12 }
];

function createDarkFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#47362b';
  ctx.fillRect(0, 0, 512, 512);
  const planks = 8;
  const plankH = 512 / planks;
  for (let i = 0; i < planks; i++) {
    const y = i * plankH;
    const tone = 70 + ((i * 19) % 18) - 9;
    ctx.fillStyle = `rgb(${tone + 12}, ${tone - 2}, ${tone - 14})`;
    ctx.fillRect(0, y, 512, plankH - 2);
    for (let g = 0; g < 14; g++) {
      ctx.fillStyle = g % 2 === 0 ? 'rgba(28, 16, 10, 0.14)' : 'rgba(130, 96, 68, 0.09)';
      ctx.fillRect(0, y + Math.random() * (plankH - 3), 512, 1.5);
    }
    const jointX = ((i * 157 + 70) % 400) + 40;
    ctx.fillStyle = 'rgba(20, 14, 12, 0.58)';
    ctx.fillRect(jointX, y, 2, plankH);
    ctx.fillRect(0, y + plankH - 2, 512, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 3.5);
  return tex;
}

function createStudyWallpaperTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c4c7d1';
  ctx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 4) {
    ctx.fillStyle = x % 8 === 0 ? 'rgba(90, 96, 118, 0.06)' : 'rgba(255, 255, 255, 0.07)';
    ctx.fillRect(x, 0, 2, 256);
  }
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(80, 86, 106, 0.08)' : 'rgba(255, 255, 255, 0.09)';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

function createNightSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, '#070b1a');
  grad.addColorStop(0.5, '#131c36');
  grad.addColorStop(0.82, '#222d4a');
  grad.addColorStop(1.0, '#121524');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 130; i++) {
    ctx.fillStyle = `rgba(220, 235, 255, ${0.35 + Math.random() * 0.65})`;
    const sz = Math.random() < 0.2 ? 2 : 1;
    ctx.fillRect(Math.random() * 512, Math.random() * 260, sz, sz);
  }
  return new THREE.CanvasTexture(canvas);
}

function createMoonRayTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, 'rgba(155, 200, 255, 0.22)');
  grad.addColorStop(0.5, 'rgba(120, 170, 255, 0.10)');
  grad.addColorStop(1.0, 'rgba(90, 140, 230, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 256);

  const hGrad = ctx.createLinearGradient(0, 0, 128, 0);
  hGrad.addColorStop(0.0, 'rgba(0,0,0,1)');
  hGrad.addColorStop(0.24, 'rgba(0,0,0,0)');
  hGrad.addColorStop(0.76, 'rgba(0,0,0,0)');
  hGrad.addColorStop(1.0, 'rgba(0,0,0,1)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, 0, 128, 256);
  return new THREE.CanvasTexture(canvas);
}

export const studyRoomStage = {
  id: 'study_room',
  name: '深夜のワンルーム',
  subtitle: '6畳強・ロフト＆3層立体迷路',
  badge: 'STAGE 02',
  description: '中央ローテーブルとロフトベッド・壁付け棚・ギター・PCデスクが3層に繋がる6.4m×5.6mの深夜自室。',
  room: ROOM,
  hasTrain: false,
  humanSpawn: { x: 0.05, y: 0.0, z: 1.35, yaw: 0.05, pitch: -0.15 },
  roachSpawns: [
    { x: -2.45, z: -1.45, yaw: 0.7 },
    { x: 1.75, z: -2.05, yaw: -1.3 },
    { x: -0.15, z: -0.10, yaw: 2.1 }
  ],
  refillSpot: {
    x: 1.18,
    y: 0.86,
    z: 2.28,
    interactDist: 1.65,
    holdDuration: 2.0,
    cooldownDuration: 15.0
  },
  furnitureDefs: FURNITURE_DEFS,
  colliders: buildCollidersFromFurniture(FURNITURE_DEFS),
  initialProps: INITIAL_PROPS,
  crumbSpawnPoints: CRUMB_SPAWN_POINTS,
  sceneColors: {
    background: 0x0e1424,
    fogColor: 0x161f36,
    fogNear: 16,
    fogFar: 90,
    exposure: 1.08
  },
  titleCamera: {
    centerX: -0.05,
    ampX: 1.4,
    y: 1.55,
    z: 1.95,
    lookAt: [-0.15, 0.88, -1.5],
    humanPos: [0.65, 0, 1.30],
    humanYaw: 0.65
  },

  buildScene(stageGroup, registerFurniture) {
    // 深夜ライティング（懐中電灯なし：月明かり＋PC光＋デスクライト＋高層間接照明）
    stageGroup.add(new THREE.HemisphereLight(0x7590d4, 0x2a2d44, 0.94));
    stageGroup.add(new THREE.AmbientLight(0x3e496e, 0.58));

    const moonLight = new THREE.DirectionalLight(0x9bc4ff, 1.38);
    moonLight.position.set(-3.5, 4.8, -8.5);
    moonLight.target.position.set(0.2, 0.0, 0.8);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 1.2;
    moonLight.shadow.camera.far = 20;
    const d = 5.2;
    moonLight.shadow.camera.left = -d;
    moonLight.shadow.camera.right = d;
    moonLight.shadow.camera.top = d;
    moonLight.shadow.camera.bottom = -d;
    moonLight.shadow.bias = -0.0007;
    stageGroup.add(moonLight, moonLight.target);

    // PCモニター＆PCケースの青白い光
    const pcGlow = new THREE.PointLight(0x5eb8ff, 1.0, 5.5, 1.6);
    pcGlow.position.set(1.85, 1.12, -2.10);
    stageGroup.add(pcGlow);

    // デスクライトの暖色スポット
    const deskLampGlow = new THREE.PointLight(0xffb86c, 1.1, 6.0, 1.5);
    deskLampGlow.position.set(2.42, 1.30, -2.20);
    stageGroup.add(deskLampGlow);

    // 高層視認性＆雰囲気用の暖色間接照明（ロフトベッド上＆西棚・東棚のテープライト）
    const loftGlow = new THREE.PointLight(0xffc078, 0.82, 4.8, 1.6);
    loftGlow.position.set(-2.35, 1.95, -0.85);
    stageGroup.add(loftGlow);

    const eastShelfGlow = new THREE.PointLight(0xffbe76, 0.72, 4.5, 1.6);
    eastShelfGlow.position.set(2.55, 1.98, -0.45);
    stageGroup.add(eastShelfGlow);

    // 玄関〜キッチン側の常夜灯
    const hallGlow = new THREE.PointLight(0xffe0b2, 0.58, 6.2, 1.7);
    hallGlow.position.set(0.5, 2.45, 1.85);
    stageGroup.add(hallGlow);

    // 窓外の夜空・月・街灯シルエット
    const ext = new THREE.Group();
    ext.add(new THREE.Mesh(
      new THREE.SphereGeometry(90, 22, 16),
      new THREE.MeshBasicMaterial({ map: createNightSkyTexture(), side: THREE.BackSide, fog: false })
    ));
    const moon = new THREE.Mesh(
      new THREE.CircleGeometry(3.6, 22),
      new THREE.MeshBasicMaterial({ color: 0xfff5d6, fog: false })
    );
    moon.position.set(-12, 15, -62);
    ext.add(moon);

    const bldgMat = new THREE.MeshStandardMaterial({ color: 0x101626, roughness: 0.95, flatShading: true });
    const litWinMat = new THREE.MeshBasicMaterial({ color: 0xffd580 });
    for (let i = 0; i < 16; i++) {
      const bx = -22 + i * 2.9;
      const bz = -13 - (i % 4) * 3.4;
      const bh = 5 + (i % 5) * 2.3;
      const bw = 2.0 + (i % 2) * 0.7;
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 2.2), bldgMat);
      bldg.position.set(bx, bh * 0.5 - 3.5, bz);
      ext.add(bldg);
      if (i % 3 !== 0) {
        const w = new THREE.Mesh(new THREE.PlaneGeometry(0.40, 0.46), litWinMat);
        w.position.set(bx, bh * 0.45 - 2.3, bz + 1.12);
        ext.add(w);
      }
    }
    stageGroup.add(ext);

    // 室内構造（床・天井・シーリングライト・壁紙・巾木・サッシ窓＆ブラインド・玄関ドア・エアコン）
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM.width, ROOM.depth),
      new THREE.MeshStandardMaterial({ map: createDarkFloorTexture(), roughness: 0.68, metalness: 0.04 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    stageGroup.add(floor);

    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM.width, ROOM.depth),
      new THREE.MeshStandardMaterial({ color: 0x9aa0b0, roughness: 0.92, flatShading: true })
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = ROOM.height;
    stageGroup.add(ceil);

    const ceilLight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.36, 0.08, 12),
      new THREE.MeshStandardMaterial({ color: 0xe6e8f0, emissive: 0x5c6b94, emissiveIntensity: 0.25, roughness: 0.4, flatShading: true })
    );
    ceilLight.position.set(0, ROOM.height - 0.04, 0.0);
    stageGroup.add(ceilLight);

    const wallMat = new THREE.MeshStandardMaterial({ map: createStudyWallpaperTexture(), roughness: 0.88, flatShading: true });
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x3b2c22, roughness: 0.72, flatShading: true });

    const southW = new THREE.Mesh(new THREE.BoxGeometry(ROOM.width, ROOM.height, 0.16), wallMat);
    southW.position.set(0, ROOM.height * 0.5, ROOM.halfD + 0.08); southW.receiveShadow = true;
    const westW = new THREE.Mesh(new THREE.BoxGeometry(0.16, ROOM.height, ROOM.depth), wallMat);
    westW.position.set(-ROOM.halfW - 0.08, ROOM.height * 0.5, 0); westW.receiveShadow = true;
    const eastW = new THREE.Mesh(new THREE.BoxGeometry(0.16, ROOM.height, ROOM.depth), wallMat);
    eastW.position.set(ROOM.halfW + 0.08, ROOM.height * 0.5, 0); eastW.receiveShadow = true;
    stageGroup.add(southW, westW, eastW);

    const bbS = new THREE.Mesh(new THREE.BoxGeometry(ROOM.width, 0.09, 0.03), baseboardMat); bbS.position.set(0, 0.045, ROOM.halfD - 0.015);
    const bbW = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, ROOM.depth), baseboardMat); bbW.position.set(-ROOM.halfW + 0.015, 0.045, 0);
    const bbE = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, ROOM.depth), baseboardMat); bbE.position.set(ROOM.halfW - 0.015, 0.045, 0);
    const bbN = new THREE.Mesh(new THREE.BoxGeometry(ROOM.width, 0.09, 0.03), baseboardMat); bbN.position.set(0, 0.045, -ROOM.halfD + 0.015);
    stageGroup.add(bbS, bbW, bbE, bbN);

    // 北側のアルミサッシ腰窓＋半開きブラインド
    const winW = 2.6;
    const winBot = 0.88;
    const winTop = 2.25;
    const winCenterX = -0.35;
    const leftW = (winCenterX - winW * 0.5) - (-ROOM.halfW);
    const rightW = ROOM.halfW - (winCenterX + winW * 0.5);

    const nL = new THREE.Mesh(new THREE.BoxGeometry(leftW, ROOM.height, 0.18), wallMat);
    nL.position.set(-ROOM.halfW + leftW * 0.5, ROOM.height * 0.5, -ROOM.halfD - 0.09);
    const nR = new THREE.Mesh(new THREE.BoxGeometry(rightW, ROOM.height, 0.18), wallMat);
    nR.position.set(ROOM.halfW - rightW * 0.5, ROOM.height * 0.5, -ROOM.halfD - 0.09);
    const nB = new THREE.Mesh(new THREE.BoxGeometry(winW, winBot, 0.18), wallMat);
    nB.position.set(winCenterX, winBot * 0.5, -ROOM.halfD - 0.09);
    const nT = new THREE.Mesh(new THREE.BoxGeometry(winW, ROOM.height - winTop, 0.18), wallMat);
    nT.position.set(winCenterX, winTop + (ROOM.height - winTop) * 0.5, -ROOM.halfD - 0.09);
    [nL, nR, nB, nT].forEach(m => { m.castShadow = true; m.receiveShadow = true; stageGroup.add(m); });

    const sashMat = new THREE.MeshStandardMaterial({ color: 0x333847, roughness: 0.4, metalness: 0.55, flatShading: true });
    const addSash = (w, h, d, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), sashMat);
      m.position.set(x, y, z);
      stageGroup.add(m);
    };
    addSash(winW, 0.06, 0.14, winCenterX, winTop, -ROOM.halfD);
    addSash(winW, 0.06, 0.14, winCenterX, winBot, -ROOM.halfD);
    addSash(0.06, winTop - winBot, 0.12, winCenterX, (winBot + winTop) * 0.5, -ROOM.halfD);
    addSash(0.06, winTop - winBot, 0.12, winCenterX - winW * 0.5 + 0.03, (winBot + winTop) * 0.5, -ROOM.halfD);
    addSash(0.06, winTop - winBot, 0.12, winCenterX + winW * 0.5 - 0.03, (winBot + winTop) * 0.5, -ROOM.halfD);

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(winW - 0.08, winTop - winBot - 0.08),
      new THREE.MeshStandardMaterial({ color: 0x8fb8ff, transparent: true, opacity: 0.08, roughness: 0.1, metalness: 0.25 })
    );
    glass.position.set(winCenterX, (winBot + winTop) * 0.5, -ROOM.halfD);
    stageGroup.add(glass);

    const blindMat = new THREE.MeshStandardMaterial({ color: 0xd6d9e2, roughness: 0.7, flatShading: true });
    const blindBox = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.08, 0.06, 0.08), blindMat);
    blindBox.position.set(winCenterX, winTop + 0.03, -ROOM.halfD + 0.08);
    stageGroup.add(blindBox);
    for (let i = 0; i < 9; i++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(winW - 0.04, 0.012, 0.04), blindMat);
      slat.position.set(winCenterX, winTop - 0.06 - i * 0.065, -ROOM.halfD + 0.08);
      slat.rotation.x = 0.28;
      stageGroup.add(slat);
    }

    // 南壁：ワンルームの玄関ドア
    {
      const doorG = new THREE.Group();
      doorG.position.set(-0.22, 0, ROOM.halfD - 0.02);
      const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x45352b, roughness: 0.75, flatShading: true });
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x5c4738, roughness: 0.72, flatShading: true });
      const knobMat = new THREE.MeshStandardMaterial({ color: 0xc9ced6, roughness: 0.3, metalness: 0.7, flatShading: true });
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.94, 2.04, 0.05), doorFrameMat); frame.position.y = 1.02;
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.84, 1.98, 0.06), doorMat); leaf.position.set(0, 0.99, -0.01);
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.025, 0.05), knobMat); handle.position.set(0.32, 0.96, -0.05);
      doorG.add(frame, leaf, handle);
      stageGroup.add(doorG);
    }

    // 西壁上部：壁掛けエアコン（ロフトより上の位置）
    {
      const acG = new THREE.Group();
      acG.position.set(-ROOM.halfW + 0.13, 2.38, 0.35);
      const acMat = new THREE.MeshStandardMaterial({ color: 0xe6e9f0, roughness: 0.45, flatShading: true });
      const ventMat = new THREE.MeshStandardMaterial({ color: 0x3a3f4d, roughness: 0.8, flatShading: true });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.84), acMat);
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.74), ventMat); vent.position.set(0.10, -0.08, 0);
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.025), new THREE.MeshBasicMaterial({ color: 0x4ade80 }));
      led.position.set(0.115, -0.02, 0.32);
      acG.add(body, vent, led);
      stageGroup.add(acG);
    }

    // 壁の装飾（ロフト横ポスター・PC横コルクボード）
    {
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2422, roughness: 0.75, flatShading: true });
      const posterG = new THREE.Group();
      posterG.position.set(-ROOM.halfW + 0.02, 2.15, -1.65);
      const pBg = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.66, 0.48), new THREE.MeshStandardMaterial({ color: 0x26293d, roughness: 0.88, flatShading: true }));
      const pArt = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshStandardMaterial({ color: 0xd96b43, roughness: 0.85, flatShading: true }));
      pArt.rotation.y = Math.PI / 2; pArt.position.set(0.015, 0.05, 0);
      posterG.add(pBg, pArt);
      stageGroup.add(posterG);

      const corkG = new THREE.Group();
      corkG.position.set(ROOM.halfW - 0.02, 2.18, -1.45);
      const cFrame = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.44, 0.64), frameMat);
      const cBoard = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.38, 0.58), new THREE.MeshStandardMaterial({ color: 0xa67c52, roughness: 0.95, flatShading: true }));
      const memo1 = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.13), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      memo1.rotation.y = -Math.PI / 2; memo1.position.set(-0.022, 0.05, -0.13);
      const memo2 = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.11), new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
      memo2.rotation.y = -Math.PI / 2; memo2.position.set(-0.022, -0.04, 0.09);
      corkG.add(cFrame, cBoard, memo1, memo2);
      stageGroup.add(corkG);
    }

    // 中央ラグマット＋脱ぎ捨てたパーカー装飾
    const rug = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 0.012, 1.85),
      new THREE.MeshStandardMaterial({ color: 0x3b4861, roughness: 0.95, flatShading: true })
    );
    rug.position.set(-0.15, 0.006, -0.10);
    rug.receiveShadow = true;
    stageGroup.add(rug);

    const hoodieG = new THREE.Group();
    hoodieG.position.set(-1.35, 0.018, 0.72);
    hoodieG.rotation.y = 0.55;
    const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x4f5d75, roughness: 0.95, flatShading: true });
    const hBody = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.022, 0.42), hoodieMat);
    const hSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.018, 0.12), hoodieMat);
    hSleeve.position.set(0.22, 0, -0.09); hSleeve.rotation.y = -0.5;
    hoodieG.add(hBody, hSleeve);
    stageGroup.add(hoodieG);

    const makeMat = (color, rough = 0.78, metal = 0.05) => new THREE.MeshStandardMaterial({
      color, roughness: rough, metalness: metal, flatShading: true, transparent: true, opacity: 1.0
    });
    const tapeLightMat = new THREE.MeshBasicMaterial({ color: 0xffd28a, transparent: true, opacity: 0.92 });

    // PCモニター待機アニメーション
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 256;
    screenCanvas.height = 128;
    const screenCtx = screenCanvas.getContext('2d');
    const screenTex = new THREE.CanvasTexture(screenCanvas);

    const redrawMonitor = (timeSec) => {
      screenCtx.fillStyle = '#0c1829';
      screenCtx.fillRect(0, 0, 256, 128);
      screenCtx.fillStyle = '#193554';
      screenCtx.fillRect(10, 10, 236, 16);
      screenCtx.strokeStyle = '#53c8ff';
      screenCtx.lineWidth = 2;
      screenCtx.beginPath();
      for (let x = 14; x < 242; x += 6) {
        const y = 70 + Math.sin(x * 0.06 + timeSec * 3.5) * 16 + Math.cos(x * 0.03 - timeSec * 2.0) * 8;
        if (x === 14) screenCtx.moveTo(x, y);
        else screenCtx.lineTo(x, y);
      }
      screenCtx.stroke();
      if (Math.floor(timeSec * 2) % 2 === 0) {
        screenCtx.fillStyle = '#9be2ff';
        screenCtx.fillRect(18, 104, 10, 12);
      }
      screenTex.needsUpdate = true;
    };
    redrawMonitor(0);

    // 1. ロフトベッド（高層1.56m＋ハシゴ＋ベッド下収納＋間接照明テープライト）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'loft_bed');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const frameMat = makeMat(0x2d313b, 0.52, 0.45);
      const woodMat = makeMat(0x634530, 0.72);
      const mattMat = makeMat(0xdcdde6, 0.92);
      const blanketMat = makeMat(0x3a4f70, 0.92);
      const pillowMat = makeMat(0xe8e4dc, 0.9);
      const boxMat = makeMat(0x475569, 0.85);

      // 4本のロフト支柱
      const postGeo = new THREE.BoxGeometry(0.06, 1.88, 0.06);
      [[-0.46, -0.95], [0.46, -0.95], [-0.46, 0.95], [0.46, 0.95]].forEach(([lx, lz]) => {
        const p = new THREE.Mesh(postGeo, frameMat); p.position.set(lx, 0.94, lz); p.castShadow = true; g.add(p);
      });
      // 上段フレーム＆マットレス
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.08, 1.96), frameMat); deck.position.y = 1.40; deck.castShadow = true; deck.receiveShadow = true;
      const matt = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.14, 1.88), mattMat); matt.position.y = 1.49; matt.castShadow = true; matt.receiveShadow = true;
      const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.04, 1.18), blanketMat); blanket.position.set(0, 1.565, 0.25); blanket.receiveShadow = true;
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.10, 0.28), pillowMat); pillow.position.set(0, 1.60, -0.66);
      // ヘッドボード＆落下防止サイドガード
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.52, 0.06), woodMat); head.position.set(0, 1.62, -0.95); head.castShadow = true;
      const guardTop = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.24), frameMat); guardTop.position.set(0.47, 1.82, -0.25);
      const guardMid = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 1.24), frameMat); guardMid.position.set(0.47, 1.68, -0.25);
      // 昇降用ハシゴ（東側手前）
      const railGeo = new THREE.BoxGeometry(0.04, 1.56, 0.04);
      const r1 = new THREE.Mesh(railGeo, frameMat); r1.position.set(0.50, 0.78, 0.44);
      const r2 = new THREE.Mesh(railGeo, frameMat); r2.position.set(0.50, 0.78, 0.80);
      g.add(r1, r2);
      for (let step = 0; step < 5; step++) {
        const rung = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.36), frameMat);
        rung.position.set(0.50, 0.26 + step * 0.28, 0.62);
        rung.castShadow = true;
        g.add(rung);
      }
      // ロフト下の収納ボックス＆間接照明テープライト
      const underBox = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.34, 0.72), boxMat); underBox.position.set(-0.18, 0.17, -0.45); underBox.castShadow = true; underBox.receiveShadow = true;
      const loftTape = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 1.72), tapeLightMat); loftTape.position.set(0.44, 1.35, 0);

      g.add(deck, matt, blanket, pillow, head, guardTop, guardMid, underBox, loftTape);
      registerFurniture('loft_bed', g, [frameMat, woodMat, mattMat, blanketMat, pillowMat, boxMat]);
    }

    // 2. サイドテーブル（デジタル時計＆点滅ルーター）
    let routerLedMat = null;
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'side_table');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0x5c3e2b, 0.72), darkMat = makeMat(0x1f222b, 0.5);
      const clockMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 1.0 });
      routerLedMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 1.0 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.42, def.d), woodMat); body.position.y = 0.33; body.castShadow = true; body.receiveShadow = true;
      const legGeo = new THREE.CylinderGeometry(0.02, 0.016, 0.12, 6);
      [[-0.18, -0.16], [0.18, -0.16], [-0.18, 0.16], [0.18, 0.16]].forEach(([lx, lz]) => {
        const l = new THREE.Mesh(legGeo, woodMat); l.position.set(lx, 0.06, lz); g.add(l);
      });
      const clkBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.065, 0.05), darkMat); clkBody.position.set(-0.10, 0.572, -0.05);
      const clkFace = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.04), clockMat); clkFace.position.set(-0.10, 0.572, -0.023);
      const router = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.14), darkMat); router.position.set(0.14, 0.615, -0.08);
      const rLed = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.012), routerLedMat); rLed.position.set(0.14, 0.65, -0.005);
      g.add(body, clkBody, clkFace, router, rLed);
      registerFurniture('side_table', g, [woodMat, darkMat, clockMat, routerLedMat]);
    }

    // 3. 木製タンス（4段チェスト）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'chest');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0x734b30, 0.7), drawerMat = makeMat(0x825739, 0.74), knobMat = makeMat(0xd4a65e, 0.35, 0.6);
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.78, def.d), woodMat); body.position.y = 0.47; body.castShadow = true; body.receiveShadow = true;
      g.add(body);
      for (let row = 0; row < 4; row++) {
        const dr = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.155, def.d - 0.10), drawerMat);
        dr.position.set(def.w * 0.5 + 0.005, 0.18 + row * 0.185, 0);
        const k1 = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), knobMat); k1.position.set(def.w * 0.5 + 0.028, 0.18 + row * 0.185, -0.22);
        const k2 = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), knobMat); k2.position.set(def.w * 0.5 + 0.028, 0.18 + row * 0.185, 0.22);
        g.add(dr, k1, k2);
      }
      registerFurniture('chest', g, [woodMat, drawerMat, knobMat]);
    }

    // 4. 段ボールの山（3段の階段状）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'cardboard_stack');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const boxMat1 = makeMat(0x9e7952, 0.92), boxMat2 = makeMat(0x8c6844, 0.92), tapeMat = makeMat(0xcfb58e, 0.85);
      def.parts.forEach((p, idx) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.topY, p.d), idx % 2 === 0 ? boxMat1 : boxMat2);
        b.position.set(p.ox, p.topY * 0.5, p.oz);
        b.castShadow = true; b.receiveShadow = true;
        const t = new THREE.Mesh(new THREE.BoxGeometry(p.w + 0.005, 0.01, 0.06), tapeMat);
        t.position.set(p.ox, p.topY + 0.002, p.oz);
        g.add(b, t);
      });
      registerFurniture('cardboard_stack', g, [boxMat1, boxMat2, tapeMat]);
    }

    // 5. マップ中央：こたつ風ローテーブル＆座椅子
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'center_table');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const topMat = makeMat(0x7a5236, 0.62), legMat = makeMat(0x4f3220, 0.72);
      const chairMat = makeMat(0x4b5c78, 0.92), chairPipeMat = makeMat(0x2a2e38, 0.5);

      const top = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.055, 0.72), topMat); top.position.y = 0.352; top.castShadow = true; top.receiveShadow = true;
      const apron = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.04, 0.60), legMat); apron.position.y = 0.31;
      g.add(top, apron);
      const legGeo = new THREE.BoxGeometry(0.055, 0.32, 0.055);
      [[-0.44, -0.28], [0.44, -0.28], [-0.44, 0.28], [0.44, 0.28]].forEach(([lx, lz]) => {
        const l = new THREE.Mesh(legGeo, legMat); l.position.set(lx, 0.16, lz); l.castShadow = true; g.add(l);
      });
      // コンパクト座椅子
      const zSeat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.09, 0.36), chairMat); zSeat.position.set(-0.05, 0.055, -0.56); zSeat.castShadow = true; zSeat.receiveShadow = true;
      const zBack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.36, 0.08), chairMat); zBack.position.set(-0.05, 0.26, -0.71); zBack.rotation.x = -0.14; zBack.castShadow = true;
      g.add(zSeat, zBack);

      registerFurniture('center_table', g, [topMat, legMat, chairMat, chairPipeMat]);
    }

    // 6. L字PCデスク
    let pcFanLedMat = null;
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'pc_desk');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const topMat = makeMat(0x343740, 0.65);
      const legMat = makeMat(0x202229, 0.5, 0.5);
      const monMat = makeMat(0x191b22, 0.4, 0.35);
      const scrMat = new THREE.MeshBasicMaterial({ map: screenTex, transparent: true, opacity: 1.0 });
      const lampMat = new THREE.MeshStandardMaterial({ color: 0xffe0a8, emissive: 0xffb35c, emissiveIntensity: 0.9, transparent: true, opacity: 1.0 });
      const padMat = makeMat(0x1e2430, 0.9);
      const kbLedMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
      pcFanLedMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.9 });

      const mainTop = new THREE.Mesh(new THREE.BoxGeometry(1.80, 0.06, 0.68), topMat); mainTop.position.set(0, 0.71, -0.34); mainTop.castShadow = true; mainTop.receiveShadow = true;
      const sideTop = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.06, 0.68), topMat); sideTop.position.set(0.56, 0.71, 0.34); sideTop.castShadow = true; sideTop.receiveShadow = true;
      g.add(mainTop, sideTop);

      const legGeo = new THREE.BoxGeometry(0.05, 0.68, 0.05);
      [[-0.84, -0.62], [-0.84, -0.05], [0.84, -0.62], [0.84, 0.62], [0.26, 0.62]].forEach(([lx, lz]) => {
        const l = new THREE.Mesh(legGeo, legMat); l.position.set(lx, 0.34, lz); l.castShadow = true; g.add(l);
      });

      const mon1 = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.34, 0.04), monMat); mon1.position.set(-0.30, 1.00, -0.50); mon1.castShadow = true;
      const scr1 = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.30), scrMat); scr1.position.set(-0.30, 1.00, -0.478);
      const stand1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.06), monMat); stand1.position.set(-0.30, 0.82, -0.52);

      const mon2 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.32, 0.04), monMat); mon2.position.set(0.32, 0.99, -0.46); mon2.rotation.y = -0.22; mon2.castShadow = true;
      const scr2 = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.28), scrMat); scr2.position.set(0.315, 0.99, -0.438); scr2.rotation.y = -0.22;
      const stand2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.06), monMat); stand2.position.set(0.32, 0.82, -0.48);

      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.008, 0.28), padMat); pad.position.set(-0.08, 0.744, -0.18);
      const kb = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 0.14), monMat); kb.position.set(-0.18, 0.755, -0.18);
      const kbGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.10), kbLedMat); kbGlow.rotation.x = -Math.PI / 2; kbGlow.position.set(-0.18, 0.766, -0.18);
      const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.028, 0.10), monMat); mouse.position.set(0.14, 0.756, -0.17);

      const pcCase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.44, 0.46), monMat); pcCase.position.set(0.68, 0.96, 0.38); pcCase.castShadow = true;
      const fanRing1 = new THREE.Mesh(new THREE.RingGeometry(0.042, 0.056, 12), pcFanLedMat); fanRing1.rotation.y = -Math.PI / 2; fanRing1.position.set(0.568, 1.04, 0.32);
      const fanRing2 = new THREE.Mesh(new THREE.RingGeometry(0.042, 0.056, 12), pcFanLedMat); fanRing2.rotation.y = -Math.PI / 2; fanRing2.position.set(0.568, 0.89, 0.32);

      const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.54, 6), legMat); lampArm.position.set(0.70, 1.01, -0.52);
      const lampHead = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.13, 8), lampMat); lampHead.position.set(0.62, 1.28, -0.44); lampHead.rotation.z = 0.42;

      g.add(mon1, scr1, stand1, mon2, scr2, stand2, pad, kb, kbGlow, mouse, pcCase, fanRing1, fanRing2, lampArm, lampHead);
      registerFurniture('pc_desk', g, [topMat, legMat, monMat, scrMat, lampMat, padMat, kbLedMat, pcFanLedMat]);
    }

    // 7. ゲーミングチェア
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'gaming_chair');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const blackMat = makeMat(0x23262e, 0.85), accentMat = makeMat(0xc43b3b, 0.8);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.40, 8), blackMat); stem.position.y = 0.20;
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 5), blackMat); base.position.y = 0.03;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.07, 0.54), blackMat); seat.position.y = 0.455; seat.castShadow = true;
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.68, 0.09), blackMat); back.position.set(0, 0.82, 0.22); back.castShadow = true;
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.60, 0.10), accentMat); stripe.position.set(0, 0.82, 0.22);
      g.add(stem, base, seat, back, stripe);
      registerFurniture('gaming_chair', g, [blackMat, accentMat]);
    }

    // 8. 小型ギターアンプ＆エレキギター
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'guitar_amp');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const ampMat = makeMat(0x22242a, 0.85), grillMat = makeMat(0x3a3e4a, 0.92), knobMat = makeMat(0xd4af37, 0.35, 0.7);
      const gBodyMat = makeMat(0xd9cfc0, 0.38, 0.15), pickMat = makeMat(0x7c3626, 0.45), neckMat = makeMat(0xc9a374, 0.6);
      const standMat = makeMat(0x1c1d22, 0.5, 0.5);

      const amp = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.32), ampMat); amp.position.set(0, 0.23, 0.08); amp.castShadow = true; amp.receiveShadow = true;
      const grill = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.34, 0.26), grillMat); grill.position.set(-0.23, 0.21, 0.08);
      const ampLed = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.015), new THREE.MeshBasicMaterial({ color: 0xef4444 })); ampLed.position.set(-0.235, 0.41, 0.18);
      for (let k = 0; k < 4; k++) {
        const kn = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 6), knobMat);
        kn.rotation.z = Math.PI / 2;
        kn.position.set(-0.235, 0.41, -0.02 + k * 0.05);
        g.add(kn);
      }

      const guitarG = new THREE.Group();
      guitarG.position.set(-0.02, 0.0, -0.14);
      guitarG.rotation.y = -Math.PI * 0.42;
      guitarG.rotation.x = -0.12;
      const stBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.24), standMat); stBase.position.y = 0.015;
      const gLower = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.32, 0.045), gBodyMat); gLower.position.set(0, 0.26, 0); gLower.castShadow = true;
      const gHorn = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.045), gBodyMat); gHorn.position.set(-0.02, 0.44, 0);
      const pick = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.050), pickMat); pick.position.set(0.02, 0.30, 0.002);
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.48, 0.026), neckMat); neck.position.set(0, 0.72, 0); neck.castShadow = true;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.14, 0.024), neckMat); head.position.set(0.015, 0.98, 0);
      guitarG.add(stBase, gLower, gHorn, pick, neck, head);

      g.add(amp, grill, ampLed, guitarG);
      registerFurniture('guitar_amp', g, [ampMat, grillMat, knobMat, gBodyMat, pickMat, neckMat, standMat]);
    }

    // 9. オープンシェルフ
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'open_shelf');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const frameMat = makeMat(0x3a3e4a, 0.45, 0.55), woodMat = makeMat(0x704d33, 0.7), boxMat = makeMat(0x38465e, 0.85);
      const postGeo = new THREE.BoxGeometry(0.035, 1.62, 0.035);
      [[-0.24, -0.60], [0.24, -0.60], [-0.24, 0.60], [0.24, 0.60]].forEach(([lx, lz]) => {
        const p = new THREE.Mesh(postGeo, frameMat); p.position.set(lx, 0.81, lz); p.castShadow = true; g.add(p);
      });
      [0.16, 0.62, 1.10, 1.60].forEach(sy => {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.035, def.d), woodMat);
        shelf.position.y = sy; shelf.castShadow = true; shelf.receiveShadow = true; g.add(shelf);
      });
      const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.46), boxMat); box1.position.set(0, 0.35, -0.32); box1.castShadow = true;
      const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.46), boxMat); box2.position.set(0, 0.35, 0.28); box2.castShadow = true;
      g.add(box1, box2);
      const bCols = [0x8c3b32, 0x3b5978, 0xc79246, 0x4b6e52, 0x7a4f6b, 0x2f4858];
      const shelfMats = [frameMat, woodMat, boxMat];
      for (let row = 0; row < 2; row++) {
        const baseY = row === 0 ? 0.64 : 1.12;
        for (let b = 0; b < 9; b++) {
          const bm = makeMat(bCols[(row * 4 + b) % bCols.length], 0.85);
          shelfMats.push(bm);
          const bh = 0.22 + ((b * 5) % 4) * 0.03;
          const bk = new THREE.Mesh(new THREE.BoxGeometry(0.28, bh, 0.085), bm);
          bk.position.set(0.02, baseY + bh * 0.5, -0.48 + b * 0.115);
          g.add(bk);
        }
      }
      registerFurniture('open_shelf', g, shelfMats);
    }

    // 10. 西壁ウォールシェルフ（棚下間接照明付き）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'wall_shelf_w');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0x754e32, 0.68), brkMat = makeMat(0x282b33, 0.5, 0.5);
      const board = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.055, def.d), woodMat); board.position.y = 1.532; board.castShadow = true; board.receiveShadow = true;
      const tape = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.015, def.d - 0.12), tapeLightMat); tape.position.set(0.08, 1.498, 0);
      g.add(board, tape);
      [-0.65, 0, 0.65].forEach(bz => {
        const brk = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.03), brkMat); brk.position.set(-0.04, 1.44, bz); g.add(brk);
      });
      registerFurniture('wall_shelf_w', g, [woodMat, brkMat]);
    }

    // 11. 東壁ウォールシェルフ（棚下間接照明付き）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'wall_shelf_e');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0x754e32, 0.68), brkMat = makeMat(0x282b33, 0.5, 0.5);
      const board = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.055, def.d), woodMat); board.position.y = 1.652; board.castShadow = true; board.receiveShadow = true;
      const tape = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.015, def.d - 0.12), tapeLightMat); tape.position.set(-0.08, 1.618, 0);
      g.add(board, tape);
      [-0.62, 0, 0.62].forEach(bz => {
        const brk = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.03), brkMat); brk.position.set(0.04, 1.56, bz); g.add(brk);
      });
      registerFurniture('wall_shelf_e', g, [woodMat, brkMat]);
    }

    // 12. ミニキッチン棚＋上部ウォールシェルフ
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'mini_kitchen');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const bodyMat = makeMat(0xcac6be, 0.8), topMat = makeMat(0x7c828c, 0.35, 0.6), woodMat = makeMat(0x754e32, 0.68);
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.82, def.d), bodyMat); body.position.y = 0.41; body.castShadow = true; body.receiveShadow = true;
      const top = new THREE.Mesh(new THREE.BoxGeometry(def.w + 0.02, 0.04, def.d + 0.02), topMat); top.position.y = 0.84; top.castShadow = true; top.receiveShadow = true;
      const upper = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.055, 0.34), woodMat); upper.position.set(0, 1.632, 0.14); upper.castShadow = true; upper.receiveShadow = true;
      g.add(body, top, upper);
      registerFurniture('mini_kitchen', g, [bodyMat, topMat, woodMat]);
    }

    // 13. ミニ冷蔵庫
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'mini_fridge');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const bodyMat = makeMat(0xbcc2cc, 0.4, 0.3), seamMat = makeMat(0x4b4f59, 0.5);
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.topY, def.d), bodyMat); body.position.y = def.topY * 0.5; body.castShadow = true; body.receiveShadow = true;
      const seam = new THREE.Mesh(new THREE.BoxGeometry(def.w + 0.015, 0.02, def.d + 0.015), seamMat); seam.position.y = 0.76;
      g.add(body, seam);
      registerFurniture('mini_fridge', g, [bodyMat, seamMat]);
    }

    // 14. 洗濯カゴ
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'laundry_basket');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const basketMat = makeMat(0x6d7d96, 0.88), clothMat = makeMat(0x9e8c7a, 0.95);
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.topY, def.d), basketMat); body.position.y = def.topY * 0.5; body.castShadow = true;
      const cloth = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), clothMat); cloth.position.set(0, def.topY + 0.02, 0);
      g.add(body, cloth);
      registerFurniture('laundry_basket', g, [basketMat, clothMat]);
    }

    // 15. ゴミ箱
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'trash_bin');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const binMat = makeMat(0x363a45, 0.7);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, def.topY, 8), binMat); body.position.y = def.topY * 0.5; body.castShadow = true;
      g.add(body);
      registerFurniture('trash_bin', g, [binMat]);
    }

    // 青白い月光のゴッドレイ＋漂うホコリ
    const moonRayMeshes = [];
    const rayMat = new THREE.MeshBasicMaterial({
      map: createMoonRayTexture(),
      transparent: true,
      opacity: 0.52,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    [-0.95, 0.15].forEach((rx, idx) => {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 3.8), rayMat);
      plane.position.set(rx, 1.35, -1.45);
      plane.rotation.set(0.62, -0.22, 0.12);
      stageGroup.add(plane);
      moonRayMeshes.push({ mesh: plane, baseOpacity: 0.44 + idx * 0.06, phase: idx * 1.6 });
    });

    const dustCount = 110;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustVelocities = [];
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3 + 0] = (Math.random() * 2 - 1) * (ROOM.halfW - 0.3);
      dustPositions[i * 3 + 1] = 0.2 + Math.random() * (ROOM.height - 0.4);
      dustPositions[i * 3 + 2] = (Math.random() * 2 - 1) * (ROOM.halfD - 0.3);
      dustVelocities.push({
        vx: (Math.random() - 0.5) * 0.04,
        vy: -0.015 + Math.random() * 0.03,
        vz: (Math.random() - 0.5) * 0.04
      });
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustPoints = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ color: 0xcbe2ff, size: 0.022, transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    stageGroup.add(dustPoints);

    let monitorAcc = 0;
    return {
      update(dt, timeSec) {
        monitorAcc += dt;
        if (monitorAcc >= 0.12) {
          monitorAcc = 0;
          redrawMonitor(timeSec);
        }
        if (routerLedMat) {
          routerLedMat.opacity = (Math.floor(timeSec * 3.5) % 2 === 0) ? 1.0 : 0.25;
        }
        if (pcFanLedMat) {
          pcFanLedMat.opacity = 0.65 + Math.sin(timeSec * 2.4) * 0.25;
        }
        moonRayMeshes.forEach(r => {
          r.mesh.material.opacity = r.baseOpacity + Math.sin(timeSec * 0.6 + r.phase) * 0.06;
        });
        const pos = dustPoints.geometry.attributes.position;
        for (let i = 0; i < dustVelocities.length; i++) {
          const v = dustVelocities[i];
          let x = pos.getX(i) + v.vx * dt;
          let y = pos.getY(i) + v.vy * dt + Math.sin(timeSec + i) * 0.0004;
          let z = pos.getZ(i) + v.vz * dt;
          if (x < -ROOM.halfW + 0.25) x = ROOM.halfW - 0.25;
          if (x > ROOM.halfW - 0.25) x = -ROOM.halfW + 0.25;
          if (y < 0.15) y = ROOM.height - 0.25;
          if (y > ROOM.height - 0.2) y = 0.2;
          if (z < -ROOM.halfD + 0.25) z = ROOM.halfD - 0.25;
          if (z > ROOM.halfD - 0.25) z = -ROOM.halfD + 0.25;
          pos.setXYZ(i, x, y, z);
        }
        pos.needsUpdate = true;
      }
    };
  }
};
