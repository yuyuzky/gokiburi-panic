import { buildCollidersFromFurniture } from '../config.js';

// ステージ3：小学校の教室（11.2m × 8.6m・ペア机6島12席＆低床ハイドスポット多数の高密度・大人数向けステージ）
const ROOM = {
  width: 11.2,
  depth: 8.6,
  height: 3.4,
  halfW: 5.6,
  halfD: 4.3
};

// 2人掛けペア机 × 6島（X方向3列 × Z方向2行 ＝ 計12席）
// 各島の前面に幕板・横に手提げ袋を備え、下は広い潜伏空間（canHideUnder: true）
const PAIR_COLS_X = [-2.15, 0.05, 2.25];
const PAIR_ROWS_Z = [-1.55, 1.55];

// 昼休み直後の「生きた散らかり」用の椅子オフセット＆角度
const CHAIR_JITTER = [
  { a: [-0.04, 0.18], b: [0.02, -0.10] },
  { a: [0.01, -0.06], b: [-0.06, 0.24] },
  { a: [-0.05, 0.12], b: [0.00, 0.04] },
  { a: [0.02, -0.14], b: [-0.05, 0.16] },
  { a: [-0.06, 0.22], b: [0.01, -0.08] },
  { a: [0.00, 0.06], b: [-0.04, -0.20] }
];

const DESK_ISLAND_DEFS = [];
let islandIdx = 1;
for (let r = 0; r < PAIR_ROWS_Z.length; r++) {
  for (let c = 0; c < PAIR_COLS_X.length; c++) {
    DESK_ISLAND_DEFS.push({
      id: `desk_pair_${islandIdx}`,
      name: `ペア学習机 ${islandIdx}`,
      x: PAIR_COLS_X[c],
      z: PAIR_ROWS_Z[r],
      w: 1.06,
      d: 1.48,
      bottomY: 0.24,
      topY: 0.76,
      canHideUnder: true,
      climbable: true,
      isDeskPair: true,
      jitter: CHAIR_JITTER[(islandIdx - 1) % CHAIR_JITTER.length],
      parts: [
        // 2人分の机天板＋前面幕板（bottomY: 0.24で立ち視点から奥を隠し、ゴキブリは下を潜れる）
        { ox: 0.18, oz: 0, w: 0.56, d: 1.48, bottomY: 0.24, topY: 0.68, climbable: true },
        // 椅子A（北側席）座面＆背もたれ
        { ox: -0.32, oz: -0.38, w: 0.40, d: 0.40, bottomY: 0.38, topY: 0.43, climbable: true },
        { ox: -0.49, oz: -0.38, w: 0.06, d: 0.38, bottomY: 0.43, topY: 0.76, climbable: true },
        // 椅子B（南側席）座面＆背もたれ
        { ox: -0.32, oz: 0.38, w: 0.40, d: 0.40, bottomY: 0.38, topY: 0.43, climbable: true },
        { ox: -0.49, oz: 0.38, w: 0.06, d: 0.38, bottomY: 0.43, topY: 0.76, climbable: true }
      ]
    });
    islandIdx++;
  }
}

const FURNITURE_DEFS = [
  ...DESK_ISLAND_DEFS,
  // 前面（東側：黒板側）
  {
    id: 'podium', name: '教壇',
    x: 5.14, z: 0.0, w: 0.86, d: 3.50, bottomY: 0.0, topY: 0.16,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.86, d: 3.50, bottomY: 0.0, topY: 0.16, climbable: true }
    ]
  },
  {
    id: 'teacher_desk', name: '教卓',
    x: 4.24, z: 0.0, w: 0.68, d: 1.18, bottomY: 0.16, topY: 0.92,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.68, d: 1.18, bottomY: 0.16, topY: 0.92, climbable: true }
    ]
  },
  {
    id: 'teacher_chair', name: '教師用チェア',
    x: 4.85, z: 0.35, w: 0.44, d: 0.44, bottomY: 0.40, topY: 0.86,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.44, d: 0.44, bottomY: 0.40, topY: 0.46, climbable: true },
      { ox: 0.18, oz: 0, w: 0.06, d: 0.42, bottomY: 0.46, topY: 0.86, climbable: true }
    ]
  },
  {
    id: 'chalk_rail', name: '黒板チョーク受け',
    x: 5.44, z: 0.0, w: 0.24, d: 4.40, bottomY: 0.96, topY: 1.02,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.24, d: 4.40, bottomY: 0.96, topY: 1.02, climbable: true }
    ]
  },
  {
    id: 'tv_cart', name: '教室用テレビ台',
    x: 4.92, z: -3.15, w: 0.78, d: 0.96, bottomY: 0.16, topY: 1.42,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.78, d: 0.96, bottomY: 0.16, topY: 0.90, climbable: true },
      { ox: 0.06, oz: 0, w: 0.54, d: 0.78, bottomY: 0.90, topY: 1.42, climbable: true }
    ]
  },
  {
    id: 'organ', name: 'オルガン・配膳台',
    x: 4.92, z: 3.05, w: 0.68, d: 1.24, bottomY: 0.16, topY: 0.86,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.68, d: 1.24, bottomY: 0.16, topY: 0.86, climbable: true }
    ]
  },
  // 後面（西側：脚付きランドセルロッカー＆掃除用具入れ＆学級文庫補充棚）
  {
    id: 'locker_n', name: 'ランドセルロッカー（北）',
    x: -5.24, z: -1.45, w: 0.60, d: 2.30, bottomY: 0.18, topY: 1.22,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.60, d: 2.30, bottomY: 0.18, topY: 1.22, climbable: true }
    ]
  },
  {
    id: 'locker_s', name: 'ランドセルロッカー（南）',
    x: -5.24, z: 1.25, w: 0.60, d: 2.30, bottomY: 0.18, topY: 1.22,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.60, d: 2.30, bottomY: 0.18, topY: 1.22, climbable: true }
    ]
  },
  {
    id: 'cleaning_locker', name: '掃除用具入れ',
    x: -5.14, z: -3.55, w: 0.76, d: 0.98, bottomY: 0.0, topY: 1.82,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.76, d: 0.98, bottomY: 0.0, topY: 1.82, climbable: true }
    ]
  },
  {
    id: 'supply_shelf', name: '学級文庫・補充棚',
    x: -5.14, z: 3.35, w: 0.76, d: 1.18, bottomY: 0.16, topY: 0.92,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.76, d: 1.18, bottomY: 0.16, topY: 0.92, climbable: true }
    ]
  },
  // 北側（窓際）：観察棚・図工段ボール＆画材ワゴン・体育用具カゴ
  {
    id: 'window_shelf', name: '窓際の観察棚',
    x: 0.05, z: -3.96, w: 2.50, d: 0.56, bottomY: 0.18, topY: 0.82,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 2.50, d: 0.56, bottomY: 0.18, topY: 0.82, climbable: true }
    ]
  },
  {
    id: 'art_wagon', name: '図工段ボール＆画材ワゴン',
    x: -2.65, z: -3.88, w: 0.82, d: 0.64, bottomY: 0.0, topY: 0.96,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: -0.18, oz: 0, w: 0.44, d: 0.60, bottomY: 0.0, topY: 0.46, climbable: true },
      { ox: 0.22, oz: 0, w: 0.38, d: 0.56, bottomY: 0.0, topY: 0.96, climbable: true }
    ]
  },
  {
    id: 'pe_basket', name: '体育用具カゴ',
    x: 2.65, z: -3.90, w: 0.74, d: 0.62, bottomY: 0.0, topY: 0.72,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.74, d: 0.62, bottomY: 0.0, topY: 0.72, climbable: true }
    ]
  },
  // 南側（廊下際）：ゴミ箱＆古紙回収ボックス・雑巾掛け＆バケツ
  {
    id: 'trash_corner', name: 'ゴミ箱＆古紙回収ボックス',
    x: -1.05, z: 3.96, w: 1.10, d: 0.52, bottomY: 0.0, topY: 0.56,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: -0.32, oz: 0, w: 0.42, d: 0.46, bottomY: 0.0, topY: 0.56, climbable: true },
      { ox: 0.24, oz: 0, w: 0.58, d: 0.48, bottomY: 0.0, topY: 0.38, climbable: true }
    ]
  },
  {
    id: 'mop_rack', name: '雑巾掛け＆バケツ',
    x: 1.35, z: 3.96, w: 1.10, d: 0.46, bottomY: 0.18, topY: 0.84,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 1.10, d: 0.46, bottomY: 0.18, topY: 0.84, climbable: true }
    ]
  }
];

// ペア机・教卓・ロッカー・観察棚に並べた吹き飛ばせる物理小物（22個）
const INITIAL_PROPS = [
  // ペア机1〜6の上（教科書・ノート・筆箱・給食カップ・お菓子）
  { id: 'tb_1', type: 'book', x: -1.96, y: 0.68 + 0.021, z: -1.92, radius: 0.12, halfH: 0.021 },
  { id: 'pc_1', type: 'remote', x: -1.92, y: 0.68 + 0.013, z: -1.24, radius: 0.09, halfH: 0.013 },
  { id: 'tb_2', type: 'book', x: 0.24, y: 0.68 + 0.021, z: -1.86, radius: 0.12, halfH: 0.021 },
  { id: 'cup_1', type: 'mug', x: 0.22, y: 0.68 + 0.06, z: -1.18, radius: 0.055, halfH: 0.06 },
  { id: 'tb_3', type: 'book', x: 2.42, y: 0.68 + 0.021, z: -1.94, radius: 0.12, halfH: 0.021 },
  { id: 'can_1', type: 'can', x: 2.46, y: 0.68 + 0.065, z: -1.22, radius: 0.04, halfH: 0.065 },
  { id: 'tb_4', type: 'book', x: -1.98, y: 0.68 + 0.021, z: 1.18, radius: 0.12, halfH: 0.021 },
  { id: 'snack_1', type: 'snack', x: -1.94, y: 0.68 + 0.075, z: 1.88, radius: 0.08, halfH: 0.075 },
  { id: 'tb_5', type: 'book', x: 0.22, y: 0.68 + 0.021, z: 1.24, radius: 0.12, halfH: 0.021 },
  { id: 'pc_2', type: 'remote', x: 0.25, y: 0.68 + 0.013, z: 1.92, radius: 0.09, halfH: 0.013 },
  { id: 'tb_6', type: 'book', x: 2.42, y: 0.68 + 0.021, z: 1.20, radius: 0.12, halfH: 0.021 },
  { id: 'cup_2', type: 'mug', x: 2.44, y: 0.68 + 0.06, z: 1.88, radius: 0.055, halfH: 0.06 },
  // 教卓・オルガン・ロッカー・観察棚・図工ワゴン・床
  { id: 'teacher_book', type: 'book', x: 4.22, y: 0.92 + 0.021, z: -0.24, radius: 0.12, halfH: 0.021 },
  { id: 'chalk_box', type: 'tissue', x: 4.26, y: 0.92 + 0.05, z: 0.26, radius: 0.12, halfH: 0.05 },
  { id: 'organ_cup', type: 'mug', x: 4.90, y: 0.86 + 0.06, z: 2.86, radius: 0.055, halfH: 0.06 },
  { id: 'win_plant_1', type: 'mini_plant', x: -0.68, y: 0.82 + 0.08, z: -3.96, radius: 0.07, halfH: 0.08 },
  { id: 'win_plant_2', type: 'mini_plant', x: 0.78, y: 0.82 + 0.08, z: -3.96, radius: 0.07, halfH: 0.08 },
  { id: 'locker_tissue', type: 'tissue', x: -5.22, y: 1.22 + 0.05, z: -1.15, radius: 0.12, halfH: 0.05 },
  { id: 'locker_book', type: 'book', x: -5.22, y: 1.22 + 0.021, z: 1.48, radius: 0.12, halfH: 0.021 },
  { id: 'art_can', type: 'can', x: -2.44, y: 0.96 + 0.065, z: -3.86, radius: 0.04, halfH: 0.065 },
  { id: 'floor_book', type: 'book', x: -3.65, y: 0.021, z: 2.25, radius: 0.12, halfH: 0.021 },
  { id: 'floor_snack', type: 'snack', x: 3.35, y: 0.075, z: -2.45, radius: 0.08, halfH: 0.075 }
];

// 食べかす（床通路・ペア机上・高所ロッカー/テレビ台/掃除用具入れへ分散）
const CRUMB_SPAWN_POINTS = [
  // 床通路
  { x: -3.65, y: 0.0, z: -0.85, elevated: false, jitter: 0.30 },
  { x: -3.65, y: 0.0, z:  1.15, elevated: false, jitter: 0.30 },
  { x: -1.05, y: 0.0, z:  0.00, elevated: false, jitter: 0.30 },
  { x:  1.15, y: 0.0, z:  0.00, elevated: false, jitter: 0.30 },
  { x:  3.25, y: 0.0, z: -1.10, elevated: false, jitter: 0.30 },
  { x:  3.25, y: 0.0, z:  1.10, elevated: false, jitter: 0.30 },
  // 中層（ペア机上・教卓・観察棚）
  { x: -1.96, y: 0.68, z: -1.55, elevated: true, jitter: 0.16 },
  { x:  0.24, y: 0.68, z:  1.55, elevated: true, jitter: 0.16 },
  { x:  2.42, y: 0.68, z: -1.55, elevated: true, jitter: 0.16 },
  { x:  4.24, y: 0.92, z:  0.00, elevated: true, jitter: 0.16 },
  { x:  0.05, y: 0.82, z: -3.96, elevated: true, jitter: 0.25 },
  // 高層（ロッカー上・テレビ台・掃除用具入れ上）
  { x: -5.24, y: 1.22, z: -1.45, elevated: true, jitter: 0.14 },
  { x: -5.24, y: 1.22, z:  1.25, elevated: true, jitter: 0.14 },
  { x:  4.92, y: 1.42, z: -3.15, elevated: true, jitter: 0.12 },
  { x: -5.14, y: 1.82, z: -3.55, elevated: true, jitter: 0.12 }
];

function createClassroomFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c49b6c';
  ctx.fillRect(0, 0, 512, 512);
  const planks = 10;
  const plankH = 512 / planks;
  for (let i = 0; i < planks; i++) {
    const y = i * plankH;
    const tone = 186 + ((i * 17) % 20) - 10;
    ctx.fillStyle = `rgb(${tone + 10}, ${tone - 22}, ${tone - 58})`;
    ctx.fillRect(0, y, 512, plankH - 1.5);
    for (let g = 0; g < 10; g++) {
      ctx.fillStyle = g % 2 === 0 ? 'rgba(110, 72, 36, 0.10)' : 'rgba(255, 232, 198, 0.12)';
      ctx.fillRect(0, y + Math.random() * (plankH - 2), 512, 1.5);
    }
    const jointX = ((i * 191 + 60) % 420) + 40;
    ctx.fillStyle = 'rgba(92, 60, 32, 0.42)';
    ctx.fillRect(jointX, y, 1.5, plankH);
    ctx.fillRect(0, y + plankH - 1.5, 512, 1.5);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 5);
  return tex;
}

function createDaySkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.00, '#3b82d6');
  grad.addColorStop(0.38, '#7ab8f5');
  grad.addColorStop(0.68, '#cfe8ff');
  grad.addColorStop(0.80, '#eef7ff');
  grad.addColorStop(1.00, '#a8b89a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
  [[90, 140, 68, 22], [260, 110, 84, 24], [410, 155, 74, 20], [180, 185, 56, 16]].forEach(([cx, cy, rx, ry]) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  return new THREE.CanvasTexture(canvas);
}

function createBlackboardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1f4231';
  ctx.fillRect(0, 0, 1024, 384);
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(220, 240, 225, ${0.015 + Math.random() * 0.025})`;
    ctx.fillRect(Math.random() * 960, Math.random() * 340, 40 + Math.random() * 90, 14 + Math.random() * 28);
  }
  ctx.strokeStyle = 'rgba(245, 248, 242, 0.65)';
  ctx.lineWidth = 3;
  ctx.strokeRect(810, 26, 184, 330);
  ctx.beginPath();
  ctx.moveTo(810, 96); ctx.lineTo(994, 96);
  ctx.moveTo(902, 26); ctx.lineTo(902, 96);
  ctx.stroke();

  ctx.fillStyle = 'rgba(248, 250, 244, 0.88)';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('日直', 828, 70);
  ctx.fillText('3-2', 924, 70);

  ctx.font = '22px sans-serif';
  ['1. 国語', '2. 算数', '3. 理科', '4. 体育', '5. 図工'].forEach((line, idx) => {
    ctx.fillText(line, 832, 142 + idx * 42);
  });

  ctx.font = 'bold 34px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 245, 0.86)';
  ctx.fillText('今日のめあて：みんなで力を合わせよう！', 54, 74);

  ctx.strokeStyle = 'rgba(255, 232, 130, 0.82)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(54, 88); ctx.lineTo(710, 88);
  ctx.stroke();

  ctx.font = '28px sans-serif';
  ctx.fillStyle = 'rgba(240, 248, 255, 0.82)';
  ctx.fillText('3 × 4 = 12', 78, 162);
  ctx.fillText('12 ÷ 3 = 4', 78, 212);
  ctx.fillStyle = 'rgba(255, 175, 175, 0.85)';
  ctx.fillText('※ そうじ当番わすれずに！', 78, 296);

  ctx.strokeStyle = 'rgba(180, 235, 255, 0.72)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(540, 220, 44, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(525, 210, 4, 0, Math.PI * 2);
  ctx.arc(555, 210, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(540, 226, 18, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

function createBulletinBoardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b99364';
  ctx.fillRect(0, 0, 1024, 320);

  const kanji = ['友', '夢', '空', '光'];
  for (let i = 0; i < 4; i++) {
    const x = 42 + i * 116;
    ctx.fillStyle = '#f6f3ea';
    ctx.fillRect(x, 34, 92, 248);
    ctx.fillStyle = '#1f1e1c';
    ctx.font = 'bold 64px serif';
    ctx.fillText(kanji[i], x + 14, 176);
  }
  const artBg = ['#8ecae6', '#ffd166', '#a8dadc'];
  const artFg = ['#e76f51', '#2a9d8f', '#f4a261'];
  for (let i = 0; i < 3; i++) {
    const x = 532 + i * 156;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, 42, 134, 216);
    ctx.fillStyle = artBg[i];
    ctx.fillRect(x + 8, 50, 118, 176);
    ctx.fillStyle = artFg[i];
    ctx.beginPath();
    ctx.arc(x + 67, 132, 34, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

function createDayRayTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, 'rgba(255, 252, 232, 0.24)');
  grad.addColorStop(0.5, 'rgba(245, 248, 255, 0.10)');
  grad.addColorStop(1.0, 'rgba(240, 248, 255, 0.0)');
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

export const classroomStage = {
  id: 'classroom',
  name: '小学校の教室',
  subtitle: '大人数向け・ペア机12席＆高密度ハイド戦場',
  badge: 'STAGE 03',
  description: '幕板付きペア机6島（12席）と脚付きロッカー・教卓・図工ワゴン・雑巾掛けが密集する11.2m×8.6mの昼休み教室。',
  room: ROOM,
  hasTrain: false,
  humanSpawn: { x: 3.25, y: 0.0, z: 0.0, yaw: Math.PI * 0.5, pitch: -0.14 },
  humanSpawns: [
    { x: 3.25, y: 0.0, z: 0.0, yaw: Math.PI * 0.5, pitch: -0.14 },
    { x: 3.25, y: 0.0, z: -1.45, yaw: Math.PI * 0.5, pitch: -0.14 },
    { x: 3.25, y: 0.0, z: 1.45, yaw: Math.PI * 0.5, pitch: -0.14 },
    { x: -3.75, y: 0.0, z: 0.0, yaw: -Math.PI * 0.5, pitch: -0.14 },
    { x: -3.75, y: 0.0, z: -1.45, yaw: -Math.PI * 0.5, pitch: -0.14 },
    { x: -3.75, y: 0.0, z: 1.45, yaw: -Math.PI * 0.5, pitch: -0.14 },
    { x: -1.05, y: 0.0, z: 0.0, yaw: 0.0, pitch: -0.14 },
    { x: 1.15, y: 0.0, z: 0.0, yaw: Math.PI, pitch: -0.14 }
  ],
  roachSpawns: [
    { x: -2.02, z: -1.55, yaw: 0.4 },
    { x: 0.18, z: 1.55, yaw: -1.2 },
    { x: 2.38, z: -1.55, yaw: 2.3 },
    { x: -2.02, z: 1.55, yaw: -0.6 },
    { x: 0.18, z: -1.55, yaw: 1.8 },
    { x: 2.38, z: 1.55, yaw: 0.2 },
    { x: 0.05, z: -3.96, yaw: 0.0 },
    { x: 4.92, z: 3.05, yaw: 0.7 }
  ],
  refillSpot: {
    x: -4.82,
    y: 0.92,
    z: 3.25,
    interactDist: 1.75,
    holdDuration: 2.0,
    cooldownDuration: 15.0
  },
  furnitureDefs: FURNITURE_DEFS,
  colliders: buildCollidersFromFurniture(FURNITURE_DEFS),
  initialProps: INITIAL_PROPS,
  crumbSpawnPoints: CRUMB_SPAWN_POINTS,
  sceneColors: {
    background: 0x8ec5f5,
    fogColor: 0xcbe4fa,
    fogNear: 28,
    fogFar: 130,
    exposure: 1.10
  },
  titleCamera: {
    centerX: -1.0,
    ampX: 2.2,
    y: 1.72,
    z: 3.05,
    lookAt: [1.6, 1.0, -0.35],
    humanPos: [3.2, 0, 0.2],
    humanYaw: Math.PI * 0.55
  },

  buildScene(stageGroup, registerFurniture) {
    // 昼休み〜放課後の明るい自然光＋蛍光灯ライティング
    stageGroup.add(new THREE.HemisphereLight(0xeef6ff, 0x9c866b, 1.05));
    stageGroup.add(new THREE.AmbientLight(0xdbe8f5, 0.42));

    const sun = new THREE.DirectionalLight(0xfff5e0, 1.85);
    sun.position.set(-2.5, 8.5, -12.0);
    sun.target.position.set(0.4, 0.0, 1.2);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 28;
    const d = 7.8;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0007;
    stageGroup.add(sun, sun.target);

    [-2.4, 2.4].forEach(lx => {
      const fl = new THREE.PointLight(0xf6fbff, 0.45, 11, 1.6);
      fl.position.set(lx, 3.05, 0.0);
      stageGroup.add(fl);
    });

    // 窓外の青空・校庭・桜＆緑の木々・ベランダ
    const ext = new THREE.Group();
    ext.add(new THREE.Mesh(
      new THREE.SphereGeometry(120, 22, 16),
      new THREE.MeshBasicMaterial({ map: createDaySkyTexture(), side: THREE.BackSide, fog: false })
    ));

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 90),
      new THREE.MeshStandardMaterial({ color: 0xd4c2a1, roughness: 0.95, flatShading: true })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -3.6, -32);
    ext.add(ground);

    const veranda = new THREE.Mesh(
      new THREE.BoxGeometry(11.8, 0.16, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xb9bec4, roughness: 0.88, flatShading: true })
    );
    veranda.position.set(0, -0.06, -ROOM.halfD - 0.72);
    ext.add(veranda);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4c35, roughness: 0.9, flatShading: true });
    const leafMatG = new THREE.MeshStandardMaterial({ color: 0x4f8a4b, roughness: 0.85, flatShading: true });
    const leafMatP = new THREE.MeshStandardMaterial({ color: 0xf4b6c2, roughness: 0.85, flatShading: true });
    for (let i = 0; i < 12; i++) {
      const tx = -28 + i * 5.2;
      const tz = -15 - (i % 3) * 4.5;
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 4.6, 6), trunkMat);
      trunk.position.y = -1.3;
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.9 + (i % 2) * 0.4, 0), i % 3 === 0 ? leafMatP : leafMatG);
      crown.position.y = 1.6;
      tree.add(trunk, crown);
      tree.position.set(tx, 0, tz);
      ext.add(tree);
    }
    stageGroup.add(ext);

    // 室内構造（木製フローリング・白い天井＆蛍光灯・クリーム壁・腰板）
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM.width, ROOM.depth),
      new THREE.MeshStandardMaterial({ map: createClassroomFloorTexture(), roughness: 0.58, metalness: 0.04 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    stageGroup.add(floor);

    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM.width, ROOM.depth),
      new THREE.MeshStandardMaterial({ color: 0xf2f4f7, roughness: 0.9, flatShading: true })
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = ROOM.height;
    stageGroup.add(ceil);

    const flHousingMat = new THREE.MeshStandardMaterial({ color: 0xd9dde3, roughness: 0.5, flatShading: true });
    const flTubeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const flGeo = new THREE.BoxGeometry(1.35, 0.06, 0.16);
    const flTubeGeo = new THREE.BoxGeometry(1.28, 0.025, 0.10);
    [-3.2, 0.0, 3.2].forEach(fx => {
      [-1.95, 1.95].forEach(fz => {
        const h = new THREE.Mesh(flGeo, flHousingMat); h.position.set(fx, ROOM.height - 0.03, fz);
        const t = new THREE.Mesh(flTubeGeo, flTubeMat); t.position.set(fx, ROOM.height - 0.068, fz);
        stageGroup.add(h, t);
      });
    });

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0eadb, roughness: 0.88, flatShading: true });
    const wainscotMat = new THREE.MeshStandardMaterial({ color: 0xb68b5c, roughness: 0.78, flatShading: true });

    const eastW = new THREE.Mesh(new THREE.BoxGeometry(0.18, ROOM.height, ROOM.depth), wallMat);
    eastW.position.set(ROOM.halfW + 0.09, ROOM.height * 0.5, 0); eastW.receiveShadow = true;
    const westW = new THREE.Mesh(new THREE.BoxGeometry(0.18, ROOM.height, ROOM.depth), wallMat);
    westW.position.set(-ROOM.halfW - 0.09, ROOM.height * 0.5, 0); westW.receiveShadow = true;
    const wsE = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.95, ROOM.depth), wainscotMat); wsE.position.set(ROOM.halfW - 0.015, 0.475, 0);
    const wsW = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.95, ROOM.depth), wainscotMat); wsW.position.set(-ROOM.halfW + 0.015, 0.475, 0);
    stageGroup.add(eastW, westW, wsE, wsW);

    // 北壁（窓側：3連教室窓＋揺れるレースカーテン）
    const winBot = 0.86;
    const winTop = 2.68;
    const winTotalW = 9.0;
    const sideW = (ROOM.width - winTotalW) * 0.5;
    const nL = new THREE.Mesh(new THREE.BoxGeometry(sideW, ROOM.height, 0.18), wallMat);
    nL.position.set(-ROOM.halfW + sideW * 0.5, ROOM.height * 0.5, -ROOM.halfD - 0.09);
    const nR = new THREE.Mesh(new THREE.BoxGeometry(sideW, ROOM.height, 0.18), wallMat);
    nR.position.set(ROOM.halfW - sideW * 0.5, ROOM.height * 0.5, -ROOM.halfD - 0.09);
    const nB = new THREE.Mesh(new THREE.BoxGeometry(winTotalW, winBot, 0.18), wallMat);
    nB.position.set(0, winBot * 0.5, -ROOM.halfD - 0.09);
    const nT = new THREE.Mesh(new THREE.BoxGeometry(winTotalW, ROOM.height - winTop, 0.18), wallMat);
    nT.position.set(0, winTop + (ROOM.height - winTop) * 0.5, -ROOM.halfD - 0.09);
    [nL, nR, nB, nT].forEach(m => { m.castShadow = true; m.receiveShadow = true; stageGroup.add(m); });

    const sashMat = new THREE.MeshStandardMaterial({ color: 0xb0b8c2, roughness: 0.4, metalness: 0.5, flatShading: true });
    const addSash = (w, h, d, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), sashMat);
      m.position.set(x, y, z);
      stageGroup.add(m);
    };
    addSash(winTotalW, 0.07, 0.14, 0, winTop, -ROOM.halfD);
    addSash(winTotalW, 0.07, 0.14, 0, winBot, -ROOM.halfD);
    [-4.5, -2.25, 0.0, 2.25, 4.5].forEach(sx => addSash(0.07, winTop - winBot, 0.12, sx, (winBot + winTop) * 0.5, -ROOM.halfD));

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(winTotalW - 0.1, winTop - winBot - 0.1),
      new THREE.MeshStandardMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.10, roughness: 0.1, metalness: 0.2 })
    );
    glass.position.set(0, (winBot + winTop) * 0.5, -ROOM.halfD);
    stageGroup.add(glass);

    // 窓際の揺れるレースカーテン（3枚）
    const curtainMeshes = [];
    const curtainMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.44, side: THREE.DoubleSide, roughness: 0.9, flatShading: true });
    [-4.1, -0.35, 4.1].forEach((cx, idx) => {
      const cGeo = new THREE.PlaneGeometry(0.76, winTop - winBot + 0.08, 4, 6);
      const pos = cGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 9) * 0.035);
      cGeo.computeVertexNormals();
      const curtain = new THREE.Mesh(cGeo, curtainMat);
      curtain.position.set(cx, (winBot + winTop) * 0.5, -ROOM.halfD + 0.12);
      stageGroup.add(curtain);
      curtainMeshes.push({ mesh: curtain, phase: idx * 1.9 });
    });

    // 南壁（廊下側：前後引き戸＋廊下側の横長窓）
    const southW = new THREE.Mesh(new THREE.BoxGeometry(ROOM.width, ROOM.height, 0.18), wallMat);
    southW.position.set(0, ROOM.height * 0.5, ROOM.halfD + 0.09); southW.receiveShadow = true;
    const wsS = new THREE.Mesh(new THREE.BoxGeometry(ROOM.width, 0.95, 0.03), wainscotMat);
    wsS.position.set(0, 0.475, ROOM.halfD - 0.015);
    stageGroup.add(southW, wsS);

    const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x7c5534, roughness: 0.75, flatShading: true });
    const doorGlassMat = new THREE.MeshStandardMaterial({ color: 0xcce2f0, roughness: 0.25, metalness: 0.15, flatShading: true });
    [-3.95, 3.95].forEach(dx => {
      const dg = new THREE.Group();
      dg.position.set(dx, 0, ROOM.halfD - 0.025);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.16, 2.08, 0.05), doorFrameMat); frame.position.y = 1.04;
      const pane = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.92, 0.06), doorGlassMat); pane.position.y = 1.48;
      dg.add(frame, pane);
      stageGroup.add(dg);
    });
    const hallWinFrame = new THREE.Mesh(new THREE.BoxGeometry(6.0, 1.05, 0.05), doorFrameMat);
    hallWinFrame.position.set(0, 1.65, ROOM.halfD - 0.02);
    const hallWinGlass = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.88, 0.06), doorGlassMat);
    hallWinGlass.position.set(0, 1.65, ROOM.halfD - 0.022);
    stageGroup.add(hallWinFrame, hallWinGlass);

    // 東壁：黒板＋上の丸時計
    {
      const bbFrame = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.42, 4.54), doorFrameMat);
      bbFrame.position.set(ROOM.halfW - 0.03, 1.72, 0);
      const bbFace = new THREE.Mesh(
        new THREE.PlaneGeometry(4.40, 1.30),
        new THREE.MeshStandardMaterial({ map: createBlackboardTexture(), roughness: 0.85 })
      );
      bbFace.rotation.y = -Math.PI / 2;
      bbFace.position.set(ROOM.halfW - 0.064, 1.72, 0);

      const clkRim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 16), doorFrameMat);
      clkRim.rotation.z = Math.PI / 2; clkRim.position.set(ROOM.halfW - 0.03, 2.86, 0);
      const clkFace = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.058, 16), new THREE.MeshBasicMaterial({ color: 0xf8f9fa }));
      clkFace.rotation.z = Math.PI / 2; clkFace.position.set(ROOM.halfW - 0.03, 2.86, 0);
      stageGroup.add(bbFrame, bbFace, clkRim, clkFace);
    }

    // 西壁：後ろの掲示板（習字・図工の絵）
    {
      const bullFrame = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.16, 4.10), doorFrameMat);
      bullFrame.position.set(-ROOM.halfW + 0.025, 2.02, -0.10);
      const bullFace = new THREE.Mesh(
        new THREE.PlaneGeometry(3.96, 1.04),
        new THREE.MeshStandardMaterial({ map: createBulletinBoardTexture(), roughness: 0.9 })
      );
      bullFace.rotation.y = Math.PI / 2;
      bullFace.position.set(-ROOM.halfW + 0.054, 2.02, -0.10);
      stageGroup.add(bullFrame, bullFace);
    }

    // 家具構築（ペア机6島・12席はジオメトリ完全共有でスマホ軽量化）
    const makeMat = (color, rough = 0.78, metal = 0.05) => new THREE.MeshStandardMaterial({
      color, roughness: rough, metalness: metal, flatShading: true, transparent: true, opacity: 1.0
    });

    const sharedGeos = {
      deskTop: new THREE.BoxGeometry(0.56, 0.035, 0.72),
      deskBox: new THREE.BoxGeometry(0.46, 0.09, 0.64),
      modesty: new THREE.BoxGeometry(0.025, 0.36, 1.44), // 前面幕板（立ち視点の視線切り）
      dLeg: new THREE.CylinderGeometry(0.015, 0.015, 0.65, 6),
      bag: new THREE.BoxGeometry(0.28, 0.28, 0.07),      // 机横の手提げ袋・体操着袋
      seat: new THREE.BoxGeometry(0.40, 0.035, 0.40),
      back: new THREE.BoxGeometry(0.035, 0.24, 0.36),
      cLeg: new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6),
      cPipe: new THREE.CylinderGeometry(0.011, 0.011, 0.36, 6)
    };
    const bagColors = [0x3b82f6, 0xef4444, 0x22c55e, 0xf59e0b, 0x8b5cf6, 0xec4899];

    DESK_ISLAND_DEFS.forEach((def, idx) => {
      const g = new THREE.Group();
      g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0xcfa068, 0.65);
      const modestyMat = makeMat(0xb88952, 0.72);
      const pipeMat = makeMat(0x5d6673, 0.45, 0.55);
      const bagMatA = makeMat(bagColors[(idx * 2) % bagColors.length], 0.88);
      const bagMatB = makeMat(bagColors[(idx * 2 + 1) % bagColors.length], 0.88);

      // 2人分の机天板＆物入れ
      [-0.37, 0.37].forEach(dz => {
        const top = new THREE.Mesh(sharedGeos.deskTop, woodMat); top.position.set(0.18, 0.662, dz); top.castShadow = true; top.receiveShadow = true;
        const box = new THREE.Mesh(sharedGeos.deskBox, pipeMat); box.position.set(0.18, 0.60, dz);
        g.add(top, box);
      });
      // 前面幕板（下端 y=0.24 まで下げて床の奥を見通しにくくする）
      const modesty = new THREE.Mesh(sharedGeos.modesty, modestyMat);
      modesty.position.set(0.44, 0.42, 0); modesty.castShadow = true; modesty.receiveShadow = true;
      g.add(modesty);

      // 机の脚（6本）
      [[-0.06, -0.68], [0.42, -0.68], [-0.06, 0.0], [0.42, 0.0], [-0.06, 0.68], [0.42, 0.68]].forEach(([lx, lz]) => {
        const l = new THREE.Mesh(sharedGeos.dLeg, pipeMat); l.position.set(lx, 0.325, lz); l.castShadow = true; g.add(l);
      });

      // 机の左右にぶら下がった手提げ袋＆体操着袋（視線切り）
      const bagN = new THREE.Mesh(sharedGeos.bag, bagMatA); bagN.position.set(0.18, 0.42, -0.76); bagN.castShadow = true;
      const bagS = new THREE.Mesh(sharedGeos.bag, bagMatB); bagS.position.set(0.18, 0.42, 0.76); bagS.castShadow = true;
      g.add(bagN, bagS);

      // 椅子2脚（少し斜め・引き出し気味の生活感ジッター）
      [
        { oz: -0.38, j: def.jitter.a },
        { oz:  0.38, j: def.jitter.b }
      ].forEach(({ oz, j }) => {
        const cg = new THREE.Group();
        cg.position.set(-0.32 + j[0], 0, oz);
        cg.rotation.y = j[1];
        const seat = new THREE.Mesh(sharedGeos.seat, woodMat); seat.position.y = 0.412; seat.castShadow = true; seat.receiveShadow = true;
        const back = new THREE.Mesh(sharedGeos.back, woodMat); back.position.set(-0.17, 0.64, 0); back.castShadow = true;
        cg.add(seat, back);
        [[-0.17, -0.16], [0.17, -0.16], [-0.17, 0.16], [0.17, 0.16]].forEach(([lx, lz]) => {
          const l = new THREE.Mesh(sharedGeos.cLeg, pipeMat); l.position.set(lx, 0.21, lz); cg.add(l);
        });
        [-0.15, 0.15].forEach(bz => {
          const p = new THREE.Mesh(sharedGeos.cPipe, pipeMat); p.position.set(-0.17, 0.56, bz); cg.add(p);
        });
        g.add(cg);
      });

      registerFurniture(def.id, g, [woodMat, modestyMat, pipeMat, bagMatA, bagMatB]);
    });

    // 教壇
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'podium');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0xa67c4e, 0.72);
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.topY, def.d), woodMat);
      body.position.y = def.topY * 0.5; body.receiveShadow = true;
      g.add(body);
      registerFurniture('podium', g, [woodMat]);
    }

    // 教卓（脚付き・下に潜れる）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'teacher_desk');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0x9c6e41, 0.68), topMat = makeMat(0xb88956, 0.62), legMat = makeMat(0x523922, 0.75);
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w - 0.04, 0.70, def.d - 0.04), woodMat); body.position.y = 0.51; body.castShadow = true; body.receiveShadow = true;
      const top = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.06, def.d), topMat); top.position.y = 0.89; top.castShadow = true; top.receiveShadow = true;
      g.add(body, top);
      const legGeo = new THREE.BoxGeometry(0.05, 0.16, 0.05);
      [[-0.28, -0.52], [0.28, -0.52], [-0.28, 0.52], [0.28, 0.52]].forEach(([lx, lz]) => {
        const l = new THREE.Mesh(legGeo, legMat); l.position.set(lx, 0.08, lz); g.add(l);
      });
      registerFurniture('teacher_desk', g, [woodMat, topMat, legMat]);
    }

    // 教師用チェア
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'teacher_chair');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0x8a5b36, 0.7), pipeMat = makeMat(0x3a404a, 0.5, 0.5);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.44), woodMat); seat.position.y = 0.435; seat.castShadow = true;
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.38, 0.42), woodMat); back.position.set(0.19, 0.66, 0); back.castShadow = true;
      g.add(seat, back);
      [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([lx, lz]) => {
        const l = new THREE.Mesh(sharedGeos.cLeg, pipeMat); l.position.set(lx, 0.21, lz); g.add(l);
      });
      registerFurniture('teacher_chair', g, [woodMat, pipeMat]);
    }

    // 黒板チョーク受け＋チョーク＆黒板消し
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'chalk_rail');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const railMat = makeMat(0x7c5534, 0.7), eraserMat = makeMat(0x2d4a6e, 0.9), chalkW = makeMat(0xf8fafc, 0.9), chalkY = makeMat(0xfef08a, 0.9);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.06, def.d), railMat); rail.position.y = 0.99; rail.castShadow = true;
      const eraser = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.16), eraserMat); eraser.position.set(-0.02, 1.04, -0.35);
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.09), chalkW); c1.position.set(-0.02, 1.03, 0.18);
      const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.08), chalkY); c2.position.set(-0.02, 1.03, 0.32);
      g.add(rail, eraser, c1, c2);
      registerFurniture('chalk_rail', g, [railMat, eraserMat, chalkW, chalkY]);
    }

    // テレビ台
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'tv_cart');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const cartMat = makeMat(0x4b5361, 0.5, 0.45), tvMat = makeMat(0x1f232b, 0.4, 0.35), scrMat = makeMat(0x141a24, 0.2, 0.4);
      const stand = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.74, def.d), cartMat); stand.position.y = 0.53; stand.castShadow = true; stand.receiveShadow = true;
      const tv = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.52, 0.78), tvMat); tv.position.set(0.06, 1.16, 0); tv.castShadow = true;
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.70, 0.44), scrMat); scr.rotation.y = -Math.PI / 2; scr.position.set(-0.215, 1.16, 0);
      g.add(stand, tv, scr);
      registerFurniture('tv_cart', g, [cartMat, tvMat, scrMat]);
    }

    // オルガン・配膳台
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'organ');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0x8a5b36, 0.68), keyMat = makeMat(0xf5f2eb, 0.5);
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.70, def.d), woodMat); body.position.y = 0.51; body.castShadow = true; body.receiveShadow = true;
      const keys = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.92), keyMat); keys.position.set(-0.24, 0.76, 0);
      g.add(body, keys);
      registerFurniture('organ', g, [woodMat, keyMat]);
    }

    // 脚付きランドセルロッカー（北・南：bottomY: 0.18で下に潜れる）
    const randColors = [0xd63b3b, 0x24344d, 0x2e6f40, 0xd48b28, 0x7a4988];
    ['locker_n', 'locker_s'].forEach((lid, lidx) => {
      const def = FURNITURE_DEFS.find(f => f.id === lid);
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0xba8f5c, 0.72), darkMat = makeMat(0x6e4f30, 0.85), legMat = makeMat(0x523922, 0.78);
      const mats = [woodMat, darkMat, legMat];
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.topY - 0.18, def.d), woodMat);
      body.position.y = 0.18 + (def.topY - 0.18) * 0.5; body.castShadow = true; body.receiveShadow = true;
      g.add(body);
      const legGeo = new THREE.BoxGeometry(0.06, 0.18, 0.06);
      [[-0.24, -1.06], [0.24, -1.06], [-0.24, 1.06], [0.24, 1.06]].forEach(([lx, lz]) => {
        const l = new THREE.Mesh(legGeo, legMat); l.position.set(lx, 0.09, lz); g.add(l);
      });
      for (let col = 0; col < 5; col++) {
        for (let row = 0; row < 2; row++) {
          const cz = -0.92 + col * 0.46;
          const cy = 0.44 + row * 0.48;
          const hole = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.38, 0.38), darkMat);
          hole.position.set(def.w * 0.5 - 0.01, cy, cz);
          g.add(hole);
          if ((col + row + lidx) % 2 === 0) {
            const rm = makeMat(randColors[(col + lidx * 2) % randColors.length], 0.55);
            mats.push(rm);
            const bag = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.24), rm);
            bag.position.set(def.w * 0.5 - 0.04, cy - 0.04, cz);
            g.add(bag);
          }
        }
      }
      registerFurniture(lid, g, mats);
    });

    // 掃除用具入れ（最高所1.82m）＋立てかけたほうき＆ちりとり
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'cleaning_locker');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const steelMat = makeMat(0x9ca6b0, 0.48, 0.35), lineMat = makeMat(0x525a63, 0.6);
      const broomStickMat = makeMat(0x8c6239, 0.75), broomHeadMat = makeMat(0xc4a265, 0.92), dustpanMat = makeMat(0x3b82f6, 0.6);
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.topY, def.d), steelMat);
      body.position.y = def.topY * 0.5; body.castShadow = true; body.receiveShadow = true;
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.02, def.topY - 0.1, 0.02), lineMat);
      seam.position.set(def.w * 0.5 + 0.005, def.topY * 0.5, 0);
      // ほうき（立てかけ）
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.15, 6), broomStickMat);
      stick.position.set(0.44, 0.62, 0.32); stick.rotation.z = 0.12;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.22), broomHeadMat);
      head.position.set(0.50, 0.10, 0.32);
      // ちりとり
      const pan = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.22), dustpanMat);
      pan.position.set(0.48, 0.02, 0.06);
      g.add(body, seam, stick, head, pan);
      registerFurniture('cleaning_locker', g, [steelMat, lineMat, broomStickMat, broomHeadMat, dustpanMat]);
    }

    // 学級文庫・補充棚（脚付き・下に潜れる）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'supply_shelf');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0xb88d5a, 0.72), legMat = makeMat(0x523922, 0.78);
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.topY - 0.16, def.d), woodMat);
      body.position.y = 0.16 + (def.topY - 0.16) * 0.5; body.castShadow = true; body.receiveShadow = true;
      g.add(body);
      const legGeo = new THREE.BoxGeometry(0.05, 0.16, 0.05);
      [[-0.32, -0.52], [0.32, -0.52], [-0.32, 0.52], [0.32, 0.52]].forEach(([lx, lz]) => {
        const l = new THREE.Mesh(legGeo, legMat); l.position.set(lx, 0.08, lz); g.add(l);
      });
      registerFurniture('supply_shelf', g, [woodMat, legMat]);
    }

    // 窓際の観察棚（脚付き・下に潜れる）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'window_shelf');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0xb88d5a, 0.70), legMat = makeMat(0x5c6470, 0.5, 0.5), tankMat = makeMat(0x7dd3fc, 0.2, 0.2);
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.topY - 0.18, def.d), woodMat);
      body.position.y = 0.18 + (def.topY - 0.18) * 0.5; body.castShadow = true; body.receiveShadow = true;
      // 飼育ケース（メダカ水槽風）
      const tank = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.24, 0.28), tankMat);
      tank.position.set(0.0, def.topY + 0.12, 0.0);
      g.add(body, tank);
      [[-1.16, -0.22], [1.16, -0.22], [-1.16, 0.22], [1.16, 0.22]].forEach(([lx, lz]) => {
        const l = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.18, 6), legMat); l.position.set(lx, 0.09, lz); g.add(l);
      });
      registerFurniture('window_shelf', g, [woodMat, legMat, tankMat]);
    }

    // 図工の段ボール＆画材ワゴン
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'art_wagon');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const boxMat = makeMat(0xa67f56, 0.92), wagonMat = makeMat(0x475569, 0.55, 0.4), paperMat = makeMat(0xfef08a, 0.85);
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.46, 0.60), boxMat); box.position.set(-0.18, 0.23, 0); box.castShadow = true; box.receiveShadow = true;
      const wagon = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.96, 0.56), wagonMat); wagon.position.set(0.22, 0.48, 0); wagon.castShadow = true; wagon.receiveShadow = true;
      const paper = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.46), paperMat); paper.position.set(-0.18, 0.485, 0);
      g.add(box, wagon, paper);
      registerFurniture('art_wagon', g, [boxMat, wagonMat, paperMat]);
    }

    // 体育用具カゴ（ボール入り）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'pe_basket');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const cageMat = makeMat(0x64748b, 0.45, 0.55), ballA = makeMat(0xea580c, 0.7), ballB = makeMat(0xf8fafc, 0.7);
      const cage = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.topY, def.d), cageMat); cage.position.y = def.topY * 0.5; cage.castShadow = true; cage.receiveShadow = true;
      const b1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 1), ballA); b1.position.set(-0.14, def.topY + 0.06, -0.06);
      const b2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.13, 1), ballB); b2.position.set(0.14, def.topY + 0.05, 0.08);
      g.add(cage, b1, b2);
      registerFurniture('pe_basket', g, [cageMat, ballA, ballB]);
    }

    // ゴミ箱＆古紙回収ボックス
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'trash_corner');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const binMat = makeMat(0x3b82f6, 0.7), boxMat = makeMat(0x9e7952, 0.92), paperMat = makeMat(0xf1f5f9, 0.9);
      const bin = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.46), binMat); bin.position.set(-0.32, 0.28, 0); bin.castShadow = true;
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.38, 0.48), boxMat); box.position.set(0.24, 0.19, 0); box.castShadow = true;
      const stack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.36), paperMat); stack.position.set(0.24, 0.42, 0);
      g.add(bin, box, stack);
      registerFurniture('trash_corner', g, [binMat, boxMat, paperMat]);
    }

    // 雑巾掛け＆青いバケツ（下に潜れる）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'mop_rack');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const pipeMat = makeMat(0x94a3b8, 0.4, 0.6), clothMat = makeMat(0xf1f5f9, 0.95), bucketMat = makeMat(0x2563eb, 0.55);
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.04, 0.06), pipeMat); topBar.position.y = 0.82;
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.82, 0.40), pipeMat); legL.position.set(-0.52, 0.41, 0);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.82, 0.40), pipeMat); legR.position.set(0.52, 0.41, 0);
      g.add(topBar, legL, legR);
      // ぶら下がった雑巾4枚（視線切り）
      [-0.36, -0.12, 0.12, 0.36].forEach(cx => {
        const cl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.44, 0.04), clothMat);
        cl.position.set(cx, 0.58, 0); cl.castShadow = true; g.add(cl);
      });
      const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.24, 8), bucketMat);
      bucket.position.set(0.32, 0.12, 0.0); bucket.castShadow = true;
      g.add(bucket);
      registerFurniture('mop_rack', g, [pipeMat, clothMat, bucketMat]);
    }

    // 窓から差し込む昼の陽光ゴッドレイ＋チョークの粉（ホコリ）
    const dayRayMeshes = [];
    const rayMat = new THREE.MeshBasicMaterial({
      map: createDayRayTexture(),
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    [-3.0, 0.0, 3.0].forEach((rx, idx) => {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 5.2), rayMat);
      plane.position.set(rx, 1.55, -2.2);
      plane.rotation.set(0.64, 0.14, -0.08);
      stageGroup.add(plane);
      dayRayMeshes.push({ mesh: plane, baseOpacity: 0.42 + idx * 0.04, phase: idx * 1.5 });
    });

    const dustCount = 120;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustVelocities = [];
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3 + 0] = (Math.random() * 2 - 1) * (ROOM.halfW - 0.4);
      dustPositions[i * 3 + 1] = 0.2 + Math.random() * (ROOM.height - 0.5);
      dustPositions[i * 3 + 2] = (Math.random() * 2 - 1) * (ROOM.halfD - 0.4);
      dustVelocities.push({ vx: (Math.random() - 0.5) * 0.04, vy: -0.015 + Math.random() * 0.03, vz: (Math.random() - 0.5) * 0.04 });
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustPoints = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.024, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    stageGroup.add(dustPoints);

    return {
      update(dt, timeSec) {
        curtainMeshes.forEach(({ mesh, phase }) => {
          mesh.rotation.y = Math.sin(timeSec * 1.2 + phase) * 0.07;
          mesh.rotation.x = Math.sin(timeSec * 0.9 + phase) * 0.03;
        });
        dayRayMeshes.forEach(r => {
          r.mesh.material.opacity = r.baseOpacity + Math.sin(timeSec * 0.55 + r.phase) * 0.05;
        });
        const pos = dustPoints.geometry.attributes.position;
        for (let i = 0; i < dustVelocities.length; i++) {
          const v = dustVelocities[i];
          let x = pos.getX(i) + v.vx * dt;
          let y = pos.getY(i) + v.vy * dt + Math.sin(timeSec + i) * 0.0004;
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
