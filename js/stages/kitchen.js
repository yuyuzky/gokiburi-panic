import { buildCollidersFromFurniture } from '../config.js';

// ステージ4：レストランのキッチン（13.6m × 6.6m・4層立体動線＆専用機材差別化＆おしゃれなホールと夜景・川を進む船）
const ROOM = {
  width: 13.6,
  depth: 6.6,
  height: 3.4,
  halfW: 6.8,
  halfD: 3.3
};

const FURNITURE_DEFS = [
  // 1. 中央左：大理石製菓・仕込み台（脚付き）＋頭上の吊り下げ鍋ラック（第4層空中ルート）
  {
    id: 'pastry_island', name: '大理石製菓台＆吊り下げ鍋ラック',
    x: -2.25, z: 0.25, w: 2.35, d: 0.94, bottomY: 0.18, topY: 1.94,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 2.35, d: 0.94, bottomY: 0.18, topY: 0.88, climbable: true },
      // 頭上の吊り下げ鍋ラック（bottomY=1.84 > 1.75 で人間歩行を妨げず空中ルートになる）
      { ox: 0, oz: 0, w: 2.20, d: 0.64, bottomY: 1.84, topY: 1.94, climbable: true }
    ]
  },
  // 2. 中央右：2段シェルフ付き盛り付けアイランド（下段0.88m / 上棚1.42m）＋エスプレッソマシン
  {
    id: 'plating_island', name: '2段盛り付けアイランド＆エスプレッソ台',
    x: 2.25, z: 0.25, w: 2.40, d: 0.96, bottomY: 0.18, topY: 1.42,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 2.40, d: 0.96, bottomY: 0.18, topY: 0.88, climbable: true },
      // 中層と高層を繋ぐ上段サーブシェルフ（1.34m〜1.42m）
      { ox: 0, oz: -0.04, w: 2.24, d: 0.44, bottomY: 1.34, topY: 1.42, climbable: true }
    ]
  },
  // 3. 第4層空中ブリッジ：西レンジフードから厨房を横断する天井吊りアルミ排気ダクト橋（1.96m〜2.22m）
  {
    id: 'overhead_duct', name: '天井吊りアルミ排気ダクト橋',
    x: -0.20, z: 0.25, w: 11.4, d: 0.54, bottomY: 1.96, topY: 2.22,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 11.4, d: 0.54, bottomY: 1.96, topY: 2.22, climbable: true }
    ]
  },
  // 4. 北側：ワイド配膳カウンター（幅7.6m・脚付き）＋頭上ヒートランプ棚（1.88m〜1.96m）
  {
    id: 'pass_counter', name: 'ワイド配膳カウンター＆ヒートランプ棚',
    x: 0.0, z: -2.96, w: 7.60, d: 0.64, bottomY: 0.18, topY: 1.96,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 7.60, d: 0.64, bottomY: 0.18, topY: 0.90, climbable: true },
      { ox: 0, oz: 0.04, w: 6.60, d: 0.44, bottomY: 1.88, topY: 1.96, climbable: true }
    ]
  },
  // 5. 北西：サラダ＆デザート冷蔵ショーケース（脚付き・ガラスケース1.26m）
  {
    id: 'salad_showcase', name: 'サラダ＆デザート冷蔵ショーケース',
    x: -5.15, z: -2.96, w: 2.00, d: 0.64, bottomY: 0.18, topY: 1.26,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 2.00, d: 0.64, bottomY: 0.18, topY: 0.90, climbable: true },
      { ox: 0, oz: -0.04, w: 1.78, d: 0.48, bottomY: 0.90, topY: 1.26, climbable: true }
    ]
  },
  // 6. 北東：ワイン＆グラスサービスワゴン（木製＆真鍮フレーム・脚付き）
  {
    id: 'wine_wagon', name: 'ワイン＆グラスサービスワゴン',
    x: 5.15, z: -2.96, w: 2.00, d: 0.64, bottomY: 0.18, topY: 0.90,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 2.00, d: 0.64, bottomY: 0.18, topY: 0.90, climbable: true }
    ]
  },
  // 7. 西側北：業務用ガスコンロ（青い種火＆寸胴鍋）＋頭上大型レンジフード（2.18m）
  {
    id: 'gas_range', name: '業務用ガスコンロ＆レンジフード',
    x: -6.34, z: -1.25, w: 0.84, d: 1.95, bottomY: 0.18, topY: 2.18,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.84, d: 1.95, bottomY: 0.18, topY: 0.86, climbable: true },
      { ox: 0.04, oz: 0, w: 0.94, d: 2.15, bottomY: 1.78, topY: 2.18, climbable: true }
    ]
  },
  // 8. 西側南：レンガ造りの本格ピザ窯（ドーム1.58m・内部に赤い炎）＋薪ラック（0.52mステップ）
  {
    id: 'pizza_oven', name: 'レンガ造りピザ窯＆薪ラック',
    x: -6.26, z: 1.25, w: 1.00, d: 2.15, bottomY: 0.0, topY: 1.58,
    canHideUnder: false, climbable: true,
    parts: [
      // ピザ窯本体（台座〜ドーム頂上1.58m）
      { ox: 0, oz: -0.35, w: 1.00, d: 1.38, bottomY: 0.0, topY: 1.58, climbable: true },
      // 薪ラック（高さ0.52mの第2層ステップ）
      { ox: -0.08, oz: 0.72, w: 0.78, d: 0.70, bottomY: 0.0, topY: 0.52, climbable: true }
    ]
  },
  // 9. 東側北：業務用2槽シンク（脚付き・洗い物カゴ＆洗剤）
  {
    id: 'double_sink', name: '業務用2槽シンク',
    x: 6.34, z: -1.25, w: 0.84, d: 2.05, bottomY: 0.18, topY: 0.88,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.84, d: 2.05, bottomY: 0.18, topY: 0.88, climbable: true }
    ]
  },
  // 10. 東側中央：ガラス扉の縦型ドリンク冷蔵ショーケース（1.78m・内部に色とりどりの瓶）
  {
    id: 'drink_cooler', name: '縦型ドリンク冷蔵ショーケース',
    x: 6.32, z: 0.65, w: 0.86, d: 1.15, bottomY: 0.0, topY: 1.78,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.86, d: 1.15, bottomY: 0.0, topY: 1.78, climbable: true }
    ]
  },
  // 11. 東側南角：業務用大型冷凍庫（1.95m）
  {
    id: 'walkin_freezer', name: '業務用大型冷凍庫',
    x: 6.28, z: 2.25, w: 0.94, d: 1.25, bottomY: 0.0, topY: 1.95,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 0.94, d: 1.25, bottomY: 0.0, topY: 1.95, climbable: true }
    ]
  },
  // 12. 南西：野菜＆ワイン木箱の段差パントリー（1.68m・脚付き・西角まで密着）
  {
    id: 'pantry_rack', name: '野菜＆ワイン木箱パントリー',
    x: -5.15, z: 2.92, w: 2.35, d: 0.68, bottomY: 0.16, topY: 1.68,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 2.35, d: 0.68, bottomY: 0.16, topY: 1.68, climbable: true }
    ]
  },
  // 13. 南西中央寄り：踏み台(0.42m)→ビールケース(0.78m)→段ボール(1.18m)の3段階段足場
  {
    id: 'step_crates', name: '踏み台＆ビールケース階段',
    x: -2.75, z: 2.94, w: 1.95, d: 0.64, bottomY: 0.0, topY: 1.18,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: -0.64, oz: 0, w: 0.62, d: 0.60, bottomY: 0.0, topY: 1.18, climbable: true },
      { ox:  0.00, oz: 0, w: 0.62, d: 0.58, bottomY: 0.0, topY: 0.78, climbable: true },
      { ox:  0.64, oz: 0, w: 0.58, d: 0.52, bottomY: 0.0, topY: 0.42, climbable: true }
    ]
  },
  // 14. 南中央西寄り：ペダル式ゴミ箱＆モップバケツ
  {
    id: 'trash_mop', name: 'ペダルゴミ箱＆モップバケツ',
    x: -0.75, z: 2.98, w: 1.20, d: 0.56, bottomY: 0.0, topY: 0.66,
    canHideUnder: false, climbable: true,
    parts: [
      { ox: -0.28, oz: 0, w: 0.54, d: 0.52, bottomY: 0.0, topY: 0.66, climbable: true },
      { ox:  0.30, oz: 0, w: 0.48, d: 0.46, bottomY: 0.0, topY: 0.36, climbable: true }
    ]
  },
  // 15. 南東寄り：衛生用品・スプレー補充台（脚付き）
  {
    id: 'sanitation_table', name: '衛生用品・補充台',
    x: 1.95, z: 2.94, w: 1.55, d: 0.64, bottomY: 0.18, topY: 0.88,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 1.55, d: 0.64, bottomY: 0.18, topY: 0.88, climbable: true }
    ]
  },
  // 16. 南東：食洗機＆山積み洗い物カゴ（1.32m・脚付き）
  {
    id: 'dish_station', name: '食洗機＆洗い物カゴ',
    x: 4.15, z: 2.92, w: 1.65, d: 0.68, bottomY: 0.18, topY: 1.32,
    canHideUnder: true, climbable: true,
    parts: [
      { ox: 0, oz: 0, w: 1.65, d: 0.68, bottomY: 0.18, topY: 1.32, climbable: true }
    ]
  }
];

// 厨房専用のワインボトル・フライパン・皿を含む吹き飛ばせる物理小物（32個）
const INITIAL_PROPS = [
  // 左：大理石製菓・仕込み台上
  { id: 'ps_pan', type: 'frying_pan', x: -3.05, y: 0.88 + 0.015, z: 0.02, radius: 0.11, halfH: 0.015 },
  { id: 'ps_plate_1', type: 'plate', x: -2.55, y: 0.88 + 0.01, z: 0.44, radius: 0.11, halfH: 0.01 },
  { id: 'ps_wine_1', type: 'wine_bottle', x: -1.95, y: 0.88 + 0.12, z: -0.05, radius: 0.04, halfH: 0.12 },
  { id: 'ps_snack', type: 'snack', x: -1.45, y: 0.88 + 0.075, z: 0.38, radius: 0.08, halfH: 0.075 },
  { id: 'ps_can', type: 'can', x: -1.25, y: 0.88 + 0.065, z: -0.04, radius: 0.04, halfH: 0.065 },
  // 右：2段シェルフ付き盛り付けアイランド（下段0.88m＆上棚1.42m）
  { id: 'pl_plate_1', type: 'plate', x: 1.35, y: 0.88 + 0.01, z: 0.42, radius: 0.11, halfH: 0.01 },
  { id: 'pl_pan_1', type: 'frying_pan', x: 1.85, y: 0.88 + 0.015, z: -0.04, radius: 0.11, halfH: 0.015 },
  { id: 'pl_mug_1', type: 'mug', x: 2.35, y: 0.88 + 0.06, z: 0.40, radius: 0.055, halfH: 0.06 },
  { id: 'pl_wine_1', type: 'wine_bottle', x: 2.85, y: 0.88 + 0.12, z: 0.02, radius: 0.04, halfH: 0.12 },
  { id: 'pl_top_plate', type: 'plate', x: 1.65, y: 1.42 + 0.01, z: 0.21, radius: 0.11, halfH: 0.01 },
  { id: 'pl_top_wine', type: 'wine_bottle', x: 2.25, y: 1.42 + 0.12, z: 0.21, radius: 0.04, halfH: 0.12 },
  { id: 'pl_top_mug', type: 'mug', x: 2.85, y: 1.42 + 0.06, z: 0.21, radius: 0.055, halfH: 0.06 },
  // 北側：ワイド配膳カウンター（料理皿・ワイン・香草・伝票端末）
  { id: 'pass_plate_1', type: 'plate', x: -2.95, y: 0.90 + 0.01, z: -2.94, radius: 0.11, halfH: 0.01 },
  { id: 'pass_wine_1', type: 'wine_bottle', x: -2.25, y: 0.90 + 0.12, z: -2.94, radius: 0.04, halfH: 0.12 },
  { id: 'pass_herb_1', type: 'mini_plant', x: -1.35, y: 0.90 + 0.08, z: -2.96, radius: 0.07, halfH: 0.08 },
  { id: 'pass_plate_2', type: 'plate', x: -0.35, y: 0.90 + 0.01, z: -2.94, radius: 0.11, halfH: 0.01 },
  { id: 'pass_remote', type: 'remote', x: 0.65, y: 0.90 + 0.013, z: -2.90, radius: 0.09, halfH: 0.013 },
  { id: 'pass_plate_3', type: 'plate', x: 1.55, y: 0.90 + 0.01, z: -2.94, radius: 0.11, halfH: 0.01 },
  { id: 'pass_herb_2', type: 'mini_plant', x: 2.45, y: 0.90 + 0.08, z: -2.96, radius: 0.07, halfH: 0.08 },
  { id: 'pass_wine_2', type: 'wine_bottle', x: 3.25, y: 0.90 + 0.12, z: -2.94, radius: 0.04, halfH: 0.12 },
  // ワインワゴン・サラダショーケース上・コンロ・シンク
  { id: 'wg_wine_1', type: 'wine_bottle', x: 4.65, y: 0.90 + 0.12, z: -2.92, radius: 0.04, halfH: 0.12 },
  { id: 'wg_wine_2', type: 'wine_bottle', x: 5.55, y: 0.90 + 0.12, z: -2.94, radius: 0.04, halfH: 0.12 },
  { id: 'salad_plate', type: 'plate', x: -5.15, y: 1.26 + 0.01, z: -2.96, radius: 0.11, halfH: 0.01 },
  { id: 'range_pan', type: 'frying_pan', x: -6.26, y: 0.86 + 0.015, z: -0.45, radius: 0.11, halfH: 0.015 },
  { id: 'sink_plate', type: 'plate', x: 6.26, y: 0.88 + 0.01, z: -0.45, radius: 0.11, halfH: 0.01 },
  // 高層＆階段エリア（パントリー・ビールケース階段・冷凍庫・ドリンクショーケース・食洗機・床）
  { id: 'rack_wine', type: 'wine_bottle', x: -5.45, y: 1.68 + 0.12, z: 2.90, radius: 0.04, halfH: 0.12 },
  { id: 'rack_snack', type: 'snack', x: -4.65, y: 1.68 + 0.075, z: 2.92, radius: 0.08, halfH: 0.075 },
  { id: 'step_can', type: 'can', x: -2.75, y: 0.78 + 0.065, z: 2.92, radius: 0.04, halfH: 0.065 },
  { id: 'cooler_box', type: 'tissue', x: 6.28, y: 1.78 + 0.05, z: 0.65, radius: 0.12, halfH: 0.05 },
  { id: 'freezer_pan', type: 'frying_pan', x: 6.24, y: 1.95 + 0.015, z: 2.25, radius: 0.11, halfH: 0.015 },
  { id: 'dish_mug', type: 'mug', x: 4.15, y: 1.32 + 0.06, z: 2.92, radius: 0.055, halfH: 0.06 },
  { id: 'floor_wine', type: 'wine_bottle', x: -3.85, y: 0.12, z: 1.85, radius: 0.04, halfH: 0.12 }
];

// 食べかす（4層立体動線に合わせて高層ルートに重点配置し、立体的な攻防を誘発）
const CRUMB_SPAWN_POINTS = [
  // 第1層（床通路）
  { x: -4.45, y: 0.0, z: -1.25, elevated: false, jitter: 0.28 },
  { x:  4.45, y: 0.0, z: -1.25, elevated: false, jitter: 0.28 },
  { x:  0.00, y: 0.0, z:  0.25, elevated: false, jitter: 0.24 },
  { x:  0.00, y: 0.0, z: -1.45, elevated: false, jitter: 0.28 },
  // 第2〜3層（階段・調理台・盛り付け上棚1.42m・ピザ窯1.58m・パントリー1.68m）
  { x: -2.25, y: 0.88, z:  0.25, elevated: true, jitter: 0.20 },
  { x:  2.25, y: 1.42, z:  0.21, elevated: true, jitter: 0.18 },
  { x: -6.26, y: 1.58, z:  0.90, elevated: true, jitter: 0.14 },
  { x:  0.00, y: 0.90, z: -2.96, elevated: true, jitter: 0.30 },
  { x: -5.15, y: 1.68, z:  2.92, elevated: true, jitter: 0.18 },
  { x:  4.15, y: 1.32, z:  2.92, elevated: true, jitter: 0.16 },
  // 第4層（排気ダクト橋2.22m・吊り下げ鍋ラック1.94m・ヒートランプ棚1.96m・ドリンク冷蔵1.78m・大型冷凍庫1.95m・レンジフード2.18m）
  { x: -2.25, y: 1.94, z:  0.25, elevated: true, jitter: 0.16 },
  { x:  0.00, y: 2.22, z:  0.25, elevated: true, jitter: 0.20 },
  { x:  2.85, y: 2.22, z:  0.25, elevated: true, jitter: 0.20 },
  { x:  0.00, y: 1.96, z: -2.92, elevated: true, jitter: 0.25 },
  { x:  6.32, y: 1.78, z:  0.65, elevated: true, jitter: 0.14 },
  { x:  6.28, y: 1.95, z:  2.25, elevated: true, jitter: 0.14 },
  { x: -6.30, y: 2.18, z: -1.25, elevated: true, jitter: 0.16 }
];

function createKitchenFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const tiles = 8;
  const sz = 512 / tiles;
  for (let r = 0; r < tiles; r++) {
    for (let c = 0; c < tiles; c++) {
      const dark = (r + c) % 2 === 0;
      ctx.fillStyle = dark ? '#b8bfc7' : '#dfe4ea';
      ctx.fillRect(c * sz, r * sz, sz, sz);
      ctx.strokeStyle = 'rgba(72, 82, 94, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(c * sz + 1, r * sz + 1, sz - 2, sz - 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6.5, 3.5);
  return tex;
}

function createKitchenWallTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#eef2f5';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(130, 145, 160, 0.32)';
  ctx.lineWidth = 2;
  const rows = 8, cols = 4;
  const rh = 256 / rows, cw = 256 / cols;
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2 === 0) ? 0 : cw * 0.5;
    for (let c = -1; c <= cols; c++) {
      ctx.strokeRect(c * cw + offset, r * rh, cw, rh);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 2.5);
  return tex;
}

function createHallWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#3b2419';
  ctx.fillRect(0, 0, 512, 512);
  const planks = 8;
  const ph = 512 / planks;
  for (let i = 0; i < planks; i++) {
    const y = i * ph;
    const tone = 56 + ((i * 17) % 16) - 8;
    ctx.fillStyle = `rgb(${tone + 18}, ${tone - 6}, ${tone - 18})`;
    ctx.fillRect(0, y, 512, ph - 2);
    ctx.fillStyle = 'rgba(18, 9, 5, 0.58)';
    ctx.fillRect(0, y + ph - 2, 512, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 3);
  return tex;
}

function createNightSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.00, '#040714');
  grad.addColorStop(0.45, '#0b142c');
  grad.addColorStop(0.75, '#162447');
  grad.addColorStop(0.90, '#222e52');
  grad.addColorStop(1.00, '#0a1020');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(235, 244, 255, ${0.35 + Math.random() * 0.65})`;
    const sz = Math.random() < 0.22 ? 2 : 1;
    ctx.fillRect(Math.random() * 512, Math.random() * 270, sz, sz);
  }
  return new THREE.CanvasTexture(canvas);
}

function createCityBuildingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0c1324';
  ctx.fillRect(0, 0, 128, 256);
  const cols = 6, rows = 16;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const rnd = Math.random();
      if (rnd < 0.42) {
        ctx.fillStyle = rnd < 0.25 ? '#ffe394' : (rnd < 0.36 ? '#bae6fd' : '#ffb870');
        ctx.fillRect(10 + c * 18, 8 + r * 15, 11, 8);
      }
    }
  }
  return new THREE.CanvasTexture(canvas);
}

function createRiverTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, '#0a1833');
  grad.addColorStop(0.5, '#0f254a');
  grad.addColorStop(1.0, '#09142b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    const w = 12 + Math.random() * 44;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 214, 130, 0.22)' : 'rgba(130, 195, 255, 0.16)';
    ctx.fillRect(x, y, w, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

// ゴッドレイ／光コーン用の縦＋横フェードグラデーションテクスチャ（軽量加算合成用）
function createLightBeamTexture(r, g, b, peakAlpha = 0.28) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, `rgba(${r}, ${g}, ${b}, ${peakAlpha})`);
  grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${(peakAlpha * 0.45).toFixed(3)})`);
  grad.addColorStop(1.0, `rgba(${r}, ${g}, ${b}, 0.0)`);
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

// 床面プールライト・水面反射パッチ用の放射状グローテクスチャ
function createRadialGlowTexture(r, g, b, peakAlpha = 0.35) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0.0, `rgba(${r}, ${g}, ${b}, ${peakAlpha})`);
  grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${(peakAlpha * 0.38).toFixed(3)})`);
  grad.addColorStop(1.0, `rgba(${r}, ${g}, ${b}, 0.0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

export const kitchenStage = {
  id: 'kitchen',
  name: 'レストランのキッチン',
  subtitle: '4層立体厨房・ピザ窯＆ダクト橋・夜景と船のホール',
  badge: 'STAGE 04',
  description: 'ピザ窯・大理石製菓台・2段盛り付け台・空中排気ダクト橋を備えた13.6m×6.6mの高密度厨房。配膳口から夜景と船が見える。',
  room: ROOM,
  hasTrain: false,
  humanSpawn: { x: 0.0, y: 0.0, z: 1.65, yaw: 0.0, pitch: -0.14 },
  humanSpawns: [
    { x:  0.00, y: 0.0, z:  0.25, yaw: 0.0, pitch: -0.14 },
    { x:  0.00, y: 0.0, z:  1.65, yaw: 0.0, pitch: -0.14 },
    { x: -2.25, y: 0.0, z:  1.65, yaw: 0.15, pitch: -0.14 },
    { x:  2.25, y: 0.0, z:  1.65, yaw: -0.15, pitch: -0.14 },
    { x: -4.55, y: 0.0, z:  0.25, yaw: -Math.PI * 0.5, pitch: -0.14 },
    { x:  4.55, y: 0.0, z:  0.25, yaw:  Math.PI * 0.5, pitch: -0.14 },
    { x: -2.25, y: 0.0, z: -1.45, yaw:  Math.PI - 0.15, pitch: -0.14 },
    { x:  2.25, y: 0.0, z: -1.45, yaw:  Math.PI + 0.15, pitch: -0.14 }
  ],
  roachSpawns: [
    { x: -2.25, z:  0.25, yaw:  0.4 },
    { x:  2.25, z:  0.25, yaw: -0.8 },
    { x: -6.34, z: -1.25, yaw: -1.3 },
    { x:  6.34, z: -1.25, yaw:  1.6 },
    { x:  0.00, z: -2.96, yaw:  3.0 },
    { x: -5.15, z:  2.92, yaw: -0.5 },
    { x:  4.15, z:  2.92, yaw:  2.1 },
    { x: -6.26, z:  1.25, yaw: -1.8 }
  ],
  refillSpot: {
    x: 1.95,
    y: 0.88,
    z: 2.90,
    interactDist: 1.75,
    holdDuration: 2.0,
    cooldownDuration: 15.0
  },
  furnitureDefs: FURNITURE_DEFS,
  colliders: buildCollidersFromFurniture(FURNITURE_DEFS),
  initialProps: INITIAL_PROPS,
  crumbSpawnPoints: CRUMB_SPAWN_POINTS,
  sceneColors: {
    background: 0x070c1c,
    fogColor: 0x0d162e,
    fogNear: 26,
    fogFar: 165,
    exposure: 1.06
  },
  titleCamera: {
    centerX: 0.0,
    ampX: 3.2,
    y: 1.72,
    z: 2.05,
    lookAt: [0.0, 1.15, -8.5],
    humanPos: [1.25, 0, 1.55],
    humanYaw: 0.45
  },

  buildScene(stageGroup, registerFurniture) {
    // 1. メリハリのある3層色温度ライティング（環境光を絞り、機材下の暗がりと各光源のコントラストを強調）
    stageGroup.add(new THREE.HemisphereLight(0xdce8f8, 0x2b282b, 0.44));
    stageGroup.add(new THREE.AmbientLight(0x9fb2cc, 0.16));

    // 厨房の斜め業務用キーライト（影をしっかり落とし、脚付き機材の下を暗い潜伏空間にする）
    const kitchenKey = new THREE.DirectionalLight(0xf6fbff, 1.38);
    kitchenKey.position.set(2.8, 6.8, 3.6);
    kitchenKey.target.position.set(-0.4, 0.0, -0.6);
    kitchenKey.castShadow = true;
    kitchenKey.shadow.mapSize.width = 2048;
    kitchenKey.shadow.mapSize.height = 2048;
    kitchenKey.shadow.camera.near = 1.5;
    kitchenKey.shadow.camera.far = 22;
    const d = 8.4;
    kitchenKey.shadow.camera.left = -d;
    kitchenKey.shadow.camera.right = d;
    kitchenKey.shadow.camera.top = d;
    kitchenKey.shadow.camera.bottom = -d;
    kitchenKey.shadow.bias = -0.0007;
    stageGroup.add(kitchenKey, kitchenKey.target);

    // 厨房中央の蛍光灯エリアを補助する白昼色ライト（作業台の視認性を確保しつつ床下は暗く保つ）
    [-3.4, 3.4].forEach(kx => {
      const kfl = new THREE.PointLight(0xf0f7ff, 0.52, 8.5, 1.7);
      kfl.position.set(kx, 2.95, 0.35);
      stageGroup.add(kfl);
    });

    // ホール窓から差し込む月明かり＆夜景の青白い外光（影なし軽量リムライト）
    const moonDir = new THREE.DirectionalLight(0x7aa8e8, 0.55);
    moonDir.position.set(4.5, 5.2, -16.0);
    moonDir.target.position.set(0.0, 0.0, -3.5);
    stageGroup.add(moonDir, moonDir.target);

    // 配膳口ヒートランプの琥珀色暖色光（料理とカウンターを際立たせる）
    [-2.1, 2.1].forEach(px => {
      const pg = new THREE.PointLight(0xffa94d, 1.18, 6.8, 1.6);
      pg.position.set(px, 2.02, -2.85);
      stageGroup.add(pg);
    });

    // コンロの青火＆ピザ窯の赤い炎のアクセント光（updateで微細に揺らす）
    const stoveGlow = new THREE.PointLight(0x38bdf8, 0.92, 4.4, 1.7);
    stoveGlow.position.set(-5.95, 1.05, -1.25);
    const pizzaGlow = new THREE.PointLight(0xff5a24, 1.48, 5.4, 1.6);
    pizzaGlow.position.set(-5.55, 1.15, 0.90);
    stageGroup.add(stoveGlow, pizzaGlow);

    // おしゃれなホール側を照らす琥珀色の暖色光
    [-3.4, 0.0, 3.4].forEach(hx => {
      const hl = new THREE.PointLight(0xffa44a, 1.32, 10.5, 1.5);
      hl.position.set(hx, 2.55, -6.5);
      stageGroup.add(hl);
    });

    // 2. 窓外の夜景・川・橋・川を進むクルーズ船（影なし・軽量ジオラマ）
    const riverTex = createRiverTexture();
    let cruiseBoat = null;
    let boatReflect = null;
    {
      const night = new THREE.Group();
      night.add(new THREE.Mesh(
        new THREE.SphereGeometry(125, 22, 16),
        new THREE.MeshBasicMaterial({ map: createNightSkyTexture(), side: THREE.BackSide, fog: false })
      ));
      const moon = new THREE.Mesh(
        new THREE.CircleGeometry(2.6, 20),
        new THREE.MeshBasicMaterial({ color: 0xfff5d6, fog: false })
      );
      moon.position.set(16, 18, -82);
      night.add(moon);

      const river = new THREE.Mesh(
        new THREE.PlaneGeometry(110, 28),
        new THREE.MeshBasicMaterial({ map: riverTex, fog: false })
      );
      river.rotation.x = -Math.PI / 2;
      river.position.set(0, -1.65, -24.5);
      night.add(river);

      const bank = new THREE.Mesh(new THREE.BoxGeometry(110, 1.4, 4.0), new THREE.MeshBasicMaterial({ color: 0x0b1224, fog: false }));
      bank.position.set(0, -1.0, -39.5);
      const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(68, 0.45, 1.4), new THREE.MeshBasicMaterial({ color: 0x16223d, fog: false }));
      bridgeDeck.position.set(0, 1.8, -37.5);
      const bridgeLight = new THREE.Mesh(new THREE.BoxGeometry(68, 0.14, 0.14), new THREE.MeshBasicMaterial({ color: 0xffd180, fog: false }));
      bridgeLight.position.set(0, 2.08, -36.8);
      night.add(bank, bridgeDeck, bridgeLight);

      [-18, 0, 18].forEach(bx => {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(0.9, 6.8, 1.2), new THREE.MeshBasicMaterial({ color: 0x1e2c4a, fog: false }));
        tower.position.set(bx, 3.4, -37.5);
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff5a5a, fog: false }));
        beacon.position.set(bx, 6.9, -37.5);
        night.add(tower, beacon);
      });

      const bldgMat = new THREE.MeshBasicMaterial({ map: createCityBuildingTexture(), fog: false });
      const bldgSpecs = [
        [-38, 14, 4.8], [-32, 22, 5.2], [-25, 16, 4.6], [-18, 28, 5.6],
        [-11, 19, 4.4], [ -4, 32, 6.2], [  3, 24, 5.0], [ 10, 35, 6.0],
        [ 17, 21, 4.8], [ 24, 27, 5.4], [ 31, 18, 4.6], [ 38, 23, 5.2]
      ];
      bldgSpecs.forEach(([bx, bh, bw], idx) => {
        const bz = -46 - (idx % 3) * 5.5;
        const bldg = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 4.2), bldgMat);
        bldg.position.set(bx, bh * 0.5 - 2.0, bz);
        night.add(bldg);
      });

      // 川面を進むライトアップ・ディナークルーズ船（夜景に馴染む暗色シルエット＋窓灯＆航海灯）
      cruiseBoat = new THREE.Group();
      cruiseBoat.position.set(-22, -1.45, -21.5);
      const hullMat = new THREE.MeshBasicMaterial({ color: 0x0d1320, fog: false });
      const deckMat = new THREE.MeshBasicMaterial({ color: 0x263042, fog: false });
      const cabinWinMat = new THREE.MeshBasicMaterial({ color: 0xdba85c, fog: false });
      const fairyLightMat = new THREE.MeshBasicMaterial({ color: 0xe6be78, fog: false });
      const navRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444, fog: false });
      const navGreenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, fog: false });
      const navWhiteMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, fog: false });

      const hull = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.85, 1.9), hullMat); hull.position.y = 0.25;
      const bow = new THREE.Mesh(new THREE.ConeGeometry(1.15, 2.0, 4), hullMat);
      bow.rotation.z = -Math.PI / 2; bow.rotation.x = Math.PI / 4; bow.position.set(4.5, 0.35, 0);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.05, 1.55), deckMat); cabin.position.set(-0.2, 1.15, 0);
      const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.55, 1.25), deckMat); upperDeck.position.set(-0.4, 1.92, 0);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.85, 6), hullMat); mast.position.set(0.5, 2.55, 0);
      cruiseBoat.add(hull, bow, cabin, upperDeck, mast);

      // 航海灯（右舷の緑灯・左舷の赤灯・マスト頂上の白灯）
      const portLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), navRedMat); portLight.position.set(3.2, 0.85, -0.82);
      const stbdLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), navGreenMat); stbdLight.position.set(3.2, 0.85, 0.82);
      const mastLight = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), navWhiteMat); mastLight.position.set(0.5, 3.00, 0);
      cruiseBoat.add(portLight, stbdLight, mastLight);

      for (let w = 0; w < 6; w++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.36), cabinWinMat);
        win.position.set(-2.1 + w * 0.78, 1.18, 0.79);
        cruiseBoat.add(win);
      }
      for (let l = 0; l < 9; l++) {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), fairyLightMat);
        dot.position.set(-2.8 + l * 0.72, 1.70, 0.78);
        cruiseBoat.add(dot);
      }
      // 月と対岸ビル群が川面に落とす光の帯（揺らぐ水面反射）
      const riverGlowMeshes = [];
      const moonStripMat = new THREE.MeshBasicMaterial({
        map: createLightBeamTexture(195, 224, 255, 0.34),
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide
      });
      const moonStrip = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 26), moonStripMat);
      moonStrip.rotation.x = -Math.PI / 2;
      moonStrip.position.set(8.5, -1.60, -24.5);
      night.add(moonStrip);
      riverGlowMeshes.push({ mesh: moonStrip, baseOp: 0.68, phase: 0.4 });

      const cityStripMat = new THREE.MeshBasicMaterial({
        map: createLightBeamTexture(255, 200, 120, 0.22),
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide
      });
      [-12.5, -2.5, 16.0].forEach((rx, idx) => {
        const strip = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 22), cityStripMat);
        strip.rotation.x = -Math.PI / 2;
        strip.position.set(rx, -1.61, -26.5);
        night.add(strip);
        riverGlowMeshes.push({ mesh: strip, baseOp: 0.46 + (idx % 2) * 0.12, phase: idx * 1.8 });
      });

      boatReflect = new THREE.Mesh(
        new THREE.PlaneGeometry(6.4, 1.3),
        new THREE.MeshBasicMaterial({
          map: createRadialGlowTexture(230, 178, 96, 0.28),
          transparent: true,
          opacity: 0.20,
          blending: THREE.AdditiveBlending,
          fog: false,
          depthWrite: false
        })
      );
      boatReflect.rotation.x = -Math.PI / 2;
      boatReflect.position.set(0.0, -0.15, 0.85);
      cruiseBoat.add(boatReflect);
      night.add(cruiseBoat);

      stageGroup.add(night);
      stageGroup.userData.riverGlowMeshes = riverGlowMeshes;
    }

    // 3. おしゃれなレストランホール（立ち入り不可ジオラマ・全面ガラス窓付き）
    {
      const hall = new THREE.Group();
      const hallW = 15.2, hallD = 6.6, hallH = 3.6;
      const hallCenterZ = -ROOM.halfD - hallD * 0.5;
      const windowZ = -ROOM.halfD - hallD;

      const hallFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(hallW, hallD),
        new THREE.MeshStandardMaterial({ map: createHallWoodTexture(), roughness: 0.55 })
      );
      hallFloor.rotation.x = -Math.PI / 2; hallFloor.position.set(0, 0, hallCenterZ);

      const hallCeil = new THREE.Mesh(
        new THREE.PlaneGeometry(hallW, hallD),
        new THREE.MeshStandardMaterial({ color: 0x241815, roughness: 0.95, flatShading: true })
      );
      hallCeil.rotation.x = Math.PI / 2; hallCeil.position.set(0, hallH, hallCenterZ);

      const hallWallMat = new THREE.MeshStandardMaterial({ color: 0x3d2224, roughness: 0.85, flatShading: true });
      const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4a656, roughness: 0.35, metalness: 0.65, flatShading: true });
      const leftW = new THREE.Mesh(new THREE.BoxGeometry(0.18, hallH, hallD), hallWallMat); leftW.position.set(-hallW * 0.5, hallH * 0.5, hallCenterZ);
      const rightW = new THREE.Mesh(new THREE.BoxGeometry(0.18, hallH, hallD), hallWallMat); rightW.position.set(hallW * 0.5, hallH * 0.5, hallCenterZ);
      hall.add(hallFloor, hallCeil, leftW, rightW);

      const lowWall = new THREE.Mesh(new THREE.BoxGeometry(hallW, 0.52, 0.16), hallWallMat); lowWall.position.set(0, 0.26, windowZ);
      const topBeam = new THREE.Mesh(new THREE.BoxGeometry(hallW, 0.38, 0.18), hallWallMat); topBeam.position.set(0, hallH - 0.19, windowZ);
      const mullionMat = new THREE.MeshStandardMaterial({ color: 0x1c1e26, roughness: 0.4, metalness: 0.6 });
      hall.add(lowWall, topBeam);
      [-6.0, -3.0, 0.0, 3.0, 6.0].forEach(mx => {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.14, hallH, 0.18), mullionMat); col.position.set(mx, hallH * 0.5, windowZ);
        const sconce = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.26, 8), new THREE.MeshBasicMaterial({ color: 0xffd28a })); sconce.position.set(mx, 2.05, windowZ + 0.14);
        hall.add(col, sconce);
      });
      const hallGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(hallW - 0.2, hallH - 0.9),
        new THREE.MeshStandardMaterial({ color: 0x8fb8ff, transparent: true, opacity: 0.06, roughness: 0.1, metalness: 0.2 })
      );
      hallGlass.position.set(0, 0.52 + (hallH - 0.9) * 0.5, windowZ);
      hall.add(hallGlass);

      const cellarMat = new THREE.MeshStandardMaterial({ color: 0x261611, roughness: 0.72, flatShading: true });
      const potMat = new THREE.MeshStandardMaterial({ color: 0x3b3532, roughness: 0.8 });
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f5e38, roughness: 0.8, flatShading: true });
      [-1, 1].forEach(side => {
        const cellar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 2.2, 2.4), cellarMat); cellar.position.set(side * (hallW * 0.5 - 0.26), 1.1, hallCenterZ);
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 2.2), new THREE.MeshBasicMaterial({ color: 0xffc978 })); strip.position.set(side * (hallW * 0.5 - 0.44), 2.15, hallCenterZ);
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.48, 8), potMat); pot.position.set(side * 5.2, 0.24, windowZ + 0.65);
        const plant = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), leafMat); plant.position.set(side * 5.2, 0.82, windowZ + 0.65);
        hall.add(cellar, strip, pot, plant);
      });

      const clothWhite = new THREE.MeshStandardMaterial({ color: 0xf7f2ea, roughness: 0.86, flatShading: true });
      const clothAccent = new THREE.MeshStandardMaterial({ color: 0x7c1f28, roughness: 0.9, flatShading: true });
      const chairWood = new THREE.MeshStandardMaterial({ color: 0x2e1b14, roughness: 0.75, flatShading: true });
      const chairVelvet = new THREE.MeshStandardMaterial({ color: 0x6b1d24, roughness: 0.9, flatShading: true });
      const candleMat = new THREE.MeshBasicMaterial({ color: 0xffe494 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0xe2f1ff, transparent: true, opacity: 0.55, roughness: 0.15 });
      const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xffcf7d });

      const tBaseGeo = new THREE.CylinderGeometry(0.56, 0.62, 0.74, 12);
      const tRunnerGeo = new THREE.BoxGeometry(0.32, 0.02, 1.06);
      const candleGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.12, 6);
      const wineGeo = new THREE.CylinderGeometry(0.032, 0.015, 0.15, 6);
      const cSeatGeo = new THREE.BoxGeometry(0.42, 0.07, 0.42);
      const cBackGeo = new THREE.BoxGeometry(0.06, 0.48, 0.40);
      const cLegGeo = new THREE.BoxGeometry(0.04, 0.44, 0.04);
      const globeGeo = new THREE.SphereGeometry(0.14, 10, 8);
      const cordGeo = new THREE.CylinderGeometry(0.008, 0.008, 1.15, 5);

      const tableCoords = [
        [-3.4, -5.25], [0.0, -5.25], [3.4, -5.25],
        [-3.4, -7.85], [0.0, -7.85], [3.4, -7.85]
      ];
      tableCoords.forEach(([tx, tz]) => {
        const tg = new THREE.Group(); tg.position.set(tx, 0, tz);
        const tb = new THREE.Mesh(tBaseGeo, clothWhite); tb.position.y = 0.37;
        const tr = new THREE.Mesh(tRunnerGeo, clothAccent); tr.position.y = 0.75;
        const cd = new THREE.Mesh(candleGeo, candleMat); cd.position.y = 0.82;
        const wg1 = new THREE.Mesh(wineGeo, glassMat); wg1.position.set(-0.24, 0.83, 0.14);
        const wg2 = new THREE.Mesh(wineGeo, glassMat); wg2.position.set( 0.24, 0.83, -0.14);
        tg.add(tb, tr, cd, wg1, wg2);

        [-0.78, 0.78].forEach(side => {
          const cg = new THREE.Group(); cg.position.set(side, 0, 0);
          const seat = new THREE.Mesh(cSeatGeo, chairVelvet); seat.position.y = 0.45;
          const back = new THREE.Mesh(cBackGeo, chairWood); back.position.set(side > 0 ? 0.18 : -0.18, 0.71, 0);
          const leg = new THREE.Mesh(cLegGeo, chairWood); leg.position.set(0, 0.22, 0);
          cg.add(seat, back, leg);
          tg.add(cg);
        });

        const cord = new THREE.Mesh(cordGeo, brassMat); cord.position.set(0, 3.02, 0);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.015, 6, 12), brassMat); ring.rotation.x = Math.PI / 2; ring.position.set(0, 2.46, 0);
        const globe = new THREE.Mesh(globeGeo, lampGlowMat); globe.position.set(0, 2.42, 0);
        tg.add(cord, ring, globe);
        hall.add(tg);
      });

      // ホール床の暖色プールライト（ペンダント直下）＆窓際の月明かり反射パッチ
      const warmPoolMat = new THREE.MeshBasicMaterial({
        map: createRadialGlowTexture(255, 178, 92, 0.34),
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const poolGeo = new THREE.PlaneGeometry(2.5, 2.5);
      tableCoords.forEach(([tx, tz]) => {
        const pool = new THREE.Mesh(poolGeo, warmPoolMat);
        pool.rotation.x = -Math.PI / 2;
        pool.position.set(tx, 0.015, tz);
        hall.add(pool);
      });

      const moonPatchMat = new THREE.MeshBasicMaterial({
        map: createRadialGlowTexture(135, 185, 255, 0.28),
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      [-4.2, -1.2, 1.8, 4.6].forEach(mx => {
        const patch = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.4), moonPatchMat);
        patch.rotation.x = -Math.PI / 2;
        patch.position.set(mx, 0.018, windowZ + 1.45);
        hall.add(patch);
      });

      // ホール奥のパノラマ窓から斜めに差し込む月明かり・夜景のゴッドレイ（軽量加算合成プレーン）
      const moonRays = [];
      const moonRayMat = new THREE.MeshBasicMaterial({
        map: createLightBeamTexture(155, 200, 255, 0.20),
        transparent: true,
        opacity: 0.58,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const moonRayGeo = new THREE.PlaneGeometry(2.4, 5.4);
      [-4.5, -1.5, 1.5, 4.5].forEach((rx, idx) => {
        const ray = new THREE.Mesh(moonRayGeo, moonRayMat);
        ray.position.set(rx, 1.65, windowZ + 1.85);
        ray.rotation.set(0.62, 0.08, -0.05);
        hall.add(ray);
        moonRays.push({ mesh: ray, baseOp: 0.52 + (idx % 2) * 0.08, phase: idx * 1.4 });
      });
      stageGroup.userData.moonRays = moonRays;

      stageGroup.add(hall);
    }

    // 4. 厨房の室内構造
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM.width, ROOM.depth),
      new THREE.MeshStandardMaterial({ map: createKitchenFloorTexture(), roughness: 0.46, metalness: 0.08 })
    );
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
    stageGroup.add(floor);

    const grateMat = new THREE.MeshStandardMaterial({ color: 0x56606b, roughness: 0.4, metalness: 0.65, flatShading: true });
    [-5.15, 5.15].forEach(gx => {
      const grate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.008, 3.8), grateMat);
      grate.position.set(gx, 0.004, 0.0); grate.receiveShadow = true; stageGroup.add(grate);
    });

    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM.width, ROOM.depth),
      new THREE.MeshStandardMaterial({ color: 0xe6ebf0, roughness: 0.9, flatShading: true })
    );
    ceil.rotation.x = Math.PI / 2; ceil.position.y = ROOM.height;
    stageGroup.add(ceil);

    const flHousingMat = new THREE.MeshStandardMaterial({ color: 0xc5cdd6, roughness: 0.45, metalness: 0.4, flatShading: true });
    const flTubeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const flGeo = new THREE.BoxGeometry(1.55, 0.06, 0.18);
    const flTubeGeo = new THREE.BoxGeometry(1.48, 0.025, 0.12);
    [-4.5, -1.5, 1.5, 4.5].forEach(fx => {
      [-1.45, 1.45].forEach(fz => {
        const h = new THREE.Mesh(flGeo, flHousingMat); h.position.set(fx, ROOM.height - 0.03, fz);
        const t = new THREE.Mesh(flTubeGeo, flTubeMat); t.position.set(fx, ROOM.height - 0.068, fz);
        stageGroup.add(h, t);
      });
    });

    const wallMat = new THREE.MeshStandardMaterial({ map: createKitchenWallTexture(), roughness: 0.55, flatShading: true });
    const stainlessTrimMat = new THREE.MeshStandardMaterial({ color: 0x9aa4b0, roughness: 0.35, metalness: 0.72, flatShading: true });

    const southW = new THREE.Mesh(new THREE.BoxGeometry(ROOM.width, ROOM.height, 0.18), wallMat); southW.position.set(0, ROOM.height * 0.5, ROOM.halfD + 0.09); southW.receiveShadow = true;
    const westW = new THREE.Mesh(new THREE.BoxGeometry(0.18, ROOM.height, ROOM.depth), wallMat); westW.position.set(-ROOM.halfW - 0.09, ROOM.height * 0.5, 0); westW.receiveShadow = true;
    const eastW = new THREE.Mesh(new THREE.BoxGeometry(0.18, ROOM.height, ROOM.depth), wallMat); eastW.position.set(ROOM.halfW + 0.09, ROOM.height * 0.5, 0); eastW.receiveShadow = true;
    stageGroup.add(southW, westW, eastW);

    const passW = 7.60, passBot = 0.90, passTop = 2.40;
    const sideW = (ROOM.width - passW) * 0.5;
    const nL = new THREE.Mesh(new THREE.BoxGeometry(sideW, ROOM.height, 0.18), wallMat); nL.position.set(-ROOM.halfW + sideW * 0.5, ROOM.height * 0.5, -ROOM.halfD - 0.09);
    const nR = new THREE.Mesh(new THREE.BoxGeometry(sideW, ROOM.height, 0.18), wallMat); nR.position.set(ROOM.halfW - sideW * 0.5, ROOM.height * 0.5, -ROOM.halfD - 0.09);
    const nB = new THREE.Mesh(new THREE.BoxGeometry(passW, passBot, 0.18), wallMat); nB.position.set(0, passBot * 0.5, -ROOM.halfD - 0.09);
    const nT = new THREE.Mesh(new THREE.BoxGeometry(passW, ROOM.height - passTop, 0.18), wallMat); nT.position.set(0, passTop + (ROOM.height - passTop) * 0.5, -ROOM.halfD - 0.09);
    [nL, nR, nB, nT].forEach(m => { m.castShadow = true; m.receiveShadow = true; stageGroup.add(m); });

    const passFrameTop = new THREE.Mesh(new THREE.BoxGeometry(passW + 0.12, 0.07, 0.22), stainlessTrimMat); passFrameTop.position.set(0, passTop, -ROOM.halfD - 0.02);
    const ticketRail = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.05, 0.04), stainlessTrimMat); ticketRail.position.set(0, passTop - 0.08, -ROOM.halfD + 0.06);
    stageGroup.add(passFrameTop, ticketRail);

    const ticketMat = new THREE.MeshBasicMaterial({ color: 0xfefce8, side: THREE.DoubleSide });
    const ticketGeo = new THREE.PlaneGeometry(0.12, 0.18);
    for (let i = 0; i < 12; i++) {
      const tk = new THREE.Mesh(ticketGeo, ticketMat);
      tk.position.set(-3.1 + i * 0.56, passTop - 0.18, -ROOM.halfD + 0.07);
      tk.rotation.z = ((i % 3) - 1) * 0.07;
      stageGroup.add(tk);
    }

    // 南壁：勝手口ドア
    {
      const doorG = new THREE.Group(); doorG.position.set(0.55, 0, ROOM.halfD - 0.02);
      const dFrame = new THREE.Mesh(new THREE.BoxGeometry(1.04, 2.10, 0.06), stainlessTrimMat); dFrame.position.y = 1.05;
      const dLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.94, 2.02, 0.05), new THREE.MeshStandardMaterial({ color: 0x6b7480, roughness: 0.5, metalness: 0.45, flatShading: true })); dLeaf.position.set(0, 1.01, -0.01);
      const dWin = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.46, 0.06), new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.3 })); dWin.position.set(0, 1.50, -0.01);
      doorG.add(dFrame, dLeaf, dWin);
      stageGroup.add(doorG);
    }

    // 5. 専用機材群の構築（同じものを廃止し、シルエット・色・高さを徹底差別化）
    const makeMat = (color, rough = 0.55, metal = 0.35) => new THREE.MeshStandardMaterial({
      color, roughness: rough, metalness: metal, flatShading: true, transparent: true, opacity: 1.0
    });
    const legGeoShort = new THREE.CylinderGeometry(0.024, 0.024, 0.18, 6);
    const addFourLegs = (group, halfX, halfZ, legMat, height = 0.18) => {
      const geo = height === 0.18 ? legGeoShort : new THREE.CylinderGeometry(0.024, 0.024, height, 6);
      [[-halfX, -halfZ], [halfX, -halfZ], [-halfX, halfZ], [halfX, halfZ]].forEach(([lx, lz]) => {
        const l = new THREE.Mesh(geo, legMat); l.position.set(lx, height * 0.5, lz); group.add(l);
      });
    };

    // 1. 中央左：大理石製菓・仕込み台（スタンドミキサー・小麦粉袋・麺棒・ボウル）＋吊り下げ鍋ラック
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'pastry_island');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const marbleMat = makeMat(0xf1f5f9, 0.25, 0.08), woodBase = makeMat(0x7c5438, 0.72, 0.05);
      const mixerRed = makeMat(0xb91c1c, 0.32, 0.45), steelMat = makeMat(0xd4dce6, 0.25, 0.8), flourMat = makeMat(0xf5ead6, 0.92, 0.0), ironMat = makeMat(0x282c34, 0.55, 0.6), copperMat = makeMat(0xb8683a, 0.3, 0.75);

      const top = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.07, def.d), marbleMat); top.position.y = 0.845; top.castShadow = true; top.receiveShadow = true;
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w - 0.14, 0.62, def.d - 0.18), woodBase); body.position.y = 0.50; body.castShadow = true;
      // 大型赤いスタンドミキサー＆ステンレスボウル
      const mBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.22), mixerRed); mBase.position.set(-0.65, 0.905, -0.18);
      const mArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.18), mixerRed); mArm.position.set(-0.72, 1.05, -0.18); mArm.castShadow = true;
      const mHead = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.11, 0.16), mixerRed); mHead.position.set(-0.62, 1.15, -0.18);
      const mBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.07, 0.14, 10), steelMat); mBowl.position.set(-0.56, 0.99, -0.18);
      // 小麦粉袋・麺棒・生地
      const flour = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.18), flourMat); flour.position.set(0.68, 1.00, -0.22);
      const dough = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.22, 0.025, 12), flourMat); dough.position.set(0.05, 0.892, 0.06);
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.38, 8), woodBase); pin.rotation.z = Math.PI / 2; pin.rotation.y = 0.4; pin.position.set(0.12, 0.92, 0.12);
      g.add(top, body, mBase, mArm, mHead, mBowl, flour, dough, pin);
      addFourLegs(g, def.w * 0.45, def.d * 0.42, woodBase, 0.18);

      // 頭上の吊り下げ鍋ラック（1.84m〜1.94m）
      const rack = new THREE.Mesh(new THREE.BoxGeometry(2.20, 0.08, 0.64), ironMat); rack.position.y = 1.89; rack.castShadow = true; rack.receiveShadow = true;
      g.add(rack);
      [[-0.95, -0.26], [0.95, -0.26], [-0.95, 0.26], [0.95, 0.26]].forEach(([cx, cz]) => {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.50, 5), ironMat); rod.position.set(cx, 2.66, cz); g.add(rod);
      });
      const panGeo = new THREE.CylinderGeometry(0.11, 0.095, 0.03, 10);
      [-0.75, -0.25, 0.25, 0.75].forEach((px, pIdx) => {
        const pan = new THREE.Mesh(panGeo, pIdx % 2 === 0 ? ironMat : copperMat);
        pan.rotation.x = Math.PI / 2; pan.position.set(px, 1.70, pIdx % 2 === 0 ? 0.26 : -0.26);
        g.add(pan);
      });
      registerFurniture('pastry_island', g, [marbleMat, woodBase, mixerRed, steelMat, flourMat, ironMat, copperMat]);
    }

    // 2. 中央右：2段シェルフ付き盛り付けアイランド（下段0.88m / 上棚1.42m）＋エスプレッソマシン＆野菜まな板
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'plating_island');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const steelMat = makeMat(0xcbd3dc, 0.34, 0.72), darkSteel = makeMat(0x525d6b, 0.45, 0.65);
      const esprMat = makeMat(0x1f242d, 0.35, 0.65), brassMat = makeMat(0xd4a656, 0.3, 0.7), boardMat = makeMat(0xc49562, 0.78, 0.05);
      const tomatoMat = makeMat(0xdc2626, 0.5, 0.05), lettuceMat = makeMat(0x22c55e, 0.75, 0.05), breadMat = makeMat(0xd99b43, 0.85, 0.0);

      const top = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.06, def.d), steelMat); top.position.y = 0.85; top.castShadow = true; top.receiveShadow = true;
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w - 0.14, 0.62, def.d - 0.18), darkSteel); body.position.y = 0.50; body.castShadow = true;
      // 上段サーブシェルフ（1.34m〜1.42m）＆支柱
      const upper = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.06, 0.44), steelMat); upper.position.set(0, 1.39, -0.04); upper.castShadow = true; upper.receiveShadow = true;
      [-1.02, 1.02].forEach(px => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.54, 6), darkSteel); post.position.set(px, 1.12, -0.04); g.add(post);
      });
      // 本格エスプレッソマシン（右端）
      const espr = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.38, 0.38), esprMat); espr.position.set(0.76, 1.07, -0.16); espr.castShadow = true;
      const esprTrim = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.04), brassMat); esprTrim.position.set(0.76, 1.22, 0.04);
      // まな板＋トマト・レタス・バゲット
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.03, 0.36), boardMat); board.position.set(-0.48, 0.895, 0.16);
      const tom1 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 7, 6), tomatoMat); tom1.position.set(-0.62, 0.94, 0.12);
      const tom2 = new THREE.Mesh(new THREE.SphereGeometry(0.042, 7, 6), tomatoMat); tom2.position.set(-0.54, 0.94, 0.22);
      const lett = new THREE.Mesh(new THREE.DodecahedronGeometry(0.085, 0), lettuceMat); lett.position.set(-0.36, 0.96, 0.14);
      const bagu = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.42, 7), breadMat); bagu.rotation.z = Math.PI / 2; bagu.position.set(0.15, 0.91, -0.22);
      g.add(top, body, upper, espr, esprTrim, board, tom1, tom2, lett, bagu);
      addFourLegs(g, def.w * 0.45, def.d * 0.42, darkSteel, 0.18);
      registerFurniture('plating_island', g, [steelMat, darkSteel, esprMat, brassMat, boardMat, tomatoMat, lettuceMat, breadMat]);
    }

    // 3. 第4層空中ブリッジ：天井吊りアルミ排気ダクト橋（1.96m〜2.22m）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'overhead_duct');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const ductMat = makeMat(0xaeb8c4, 0.36, 0.72), seamMat = makeMat(0x525d6b, 0.5, 0.6);
      const duct = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.26, def.d), ductMat); duct.position.y = 2.09; duct.castShadow = true; duct.receiveShadow = true;
      g.add(duct);
      // 吊り下げボルト＆継ぎ目フランジ
      [-4.6, -2.3, 0.0, 2.3, 4.6].forEach(fx => {
        const flange = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.30, def.d + 0.06), seamMat); flange.position.set(fx, 2.09, 0);
        const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.25, 5), seamMat); hanger.position.set(fx, 2.82, 0);
        g.add(flange, hanger);
      });
      registerFurniture('overhead_duct', g, [ductMat, seamMat]);
    }

    // 4. 北側：ワイド配膳カウンター＋頭上ヒートランプ棚（1.88m〜1.96m）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'pass_counter');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const steelMat = makeMat(0xcfd6de, 0.34, 0.72), cabinetMat = makeMat(0x88929e, 0.45, 0.62), plateMat = makeMat(0xf8fafc, 0.35, 0.05), lampMat = makeMat(0x3b3532, 0.4, 0.6);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffb347 });

      const top = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.06, def.d), steelMat); top.position.y = 0.87; top.castShadow = true; top.receiveShadow = true;
      const cab = new THREE.Mesh(new THREE.BoxGeometry(def.w - 0.08, 0.66, def.d - 0.08), cabinetMat); cab.position.y = 0.51; cab.castShadow = true; cab.receiveShadow = true;
      const lampShelf = new THREE.Mesh(new THREE.BoxGeometry(6.60, 0.08, 0.44), steelMat); lampShelf.position.set(0, 1.92, 0.04); lampShelf.castShadow = true; lampShelf.receiveShadow = true;
      g.add(top, cab, lampShelf);

      const heatBeamMat = new THREE.MeshBasicMaterial({
        map: createLightBeamTexture(255, 184, 96, 0.28),
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const heatConeGeo = new THREE.ConeGeometry(0.56, 0.94, 12, 1, true);
      const heatPoolMat = new THREE.MeshBasicMaterial({
        map: createRadialGlowTexture(255, 185, 98, 0.30),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const heatPoolGeo = new THREE.PlaneGeometry(0.95, 0.62);
      const heatCones = [];
      [-2.7, -0.9, 0.9, 2.7].forEach((lx, idx) => {
        const shade = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.16, 8), lampMat); shade.position.set(lx, 1.80, 0.04);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), bulbMat); bulb.position.set(lx, 1.72, 0.04);
        const cone = new THREE.Mesh(heatConeGeo, heatBeamMat); cone.position.set(lx, 1.28, 0.04);
        const pool = new THREE.Mesh(heatPoolGeo, heatPoolMat); pool.rotation.x = -Math.PI / 2; pool.position.set(lx, 0.908, 0.04);
        g.add(shade, bulb, cone, pool);
        heatCones.push({ mesh: cone, phase: idx * 1.1 });
      });
      stageGroup.userData.heatCones = heatCones;
      [-3.35, 3.35].forEach(px => {
        const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.16, 10), plateMat); stack.position.set(px, 0.98, 0.0); stack.castShadow = true; g.add(stack);
      });
      addFourLegs(g, def.w * 0.47, def.d * 0.38, cabinetMat, 0.18);
      registerFurniture('pass_counter', g, [steelMat, cabinetMat, plateMat, lampMat]);
    }

    // 5. 北西：サラダ＆デザート冷蔵ショーケース（ガラスケース＆カラフルなトレイ）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'salad_showcase');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const steelMat = makeMat(0xc9d1da, 0.35, 0.7), baseMat = makeMat(0x64748b, 0.45, 0.55);
      const glassMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, transparent: true, opacity: 0.32, roughness: 0.1, metalness: 0.2 });
      const cakeMat = makeMat(0xf472b6, 0.8, 0.0), saladMat = makeMat(0x22c55e, 0.85, 0.0);
      const base = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.72, def.d), baseMat); base.position.y = 0.54; base.castShadow = true;
      const top = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.05, def.d), steelMat); top.position.y = 0.88;
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.36, 0.48), glassMat); hood.position.set(0, 1.08, -0.04);
      const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 10), cakeMat); c1.position.set(-0.48, 0.96, -0.04);
      const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.10, 0.32), saladMat); c2.position.set(0.32, 0.95, -0.04);
      g.add(base, top, hood, c1, c2);
      addFourLegs(g, def.w * 0.45, def.d * 0.38, baseMat, 0.18);
      registerFurniture('salad_showcase', g, [steelMat, baseMat, cakeMat, saladMat]);
    }

    // 6. 北東：ワイン＆グラスサービスワゴン（木製＋真鍮フレーム）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'wine_wagon');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const woodMat = makeMat(0x5c3724, 0.68, 0.08), brassMat = makeMat(0xd4a656, 0.32, 0.72);
      const top = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.06, def.d), woodMat); top.position.y = 0.87; top.castShadow = true;
      const mid = new THREE.Mesh(new THREE.BoxGeometry(def.w - 0.12, 0.04, def.d - 0.10), woodMat); mid.position.y = 0.48;
      const bot = new THREE.Mesh(new THREE.BoxGeometry(def.w - 0.12, 0.04, def.d - 0.10), woodMat); bot.position.y = 0.20;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(def.w - 0.06, 0.04, 0.04), brassMat); rail.position.set(0, 0.94, -0.28);
      g.add(top, mid, bot, rail);
      addFourLegs(g, def.w * 0.46, def.d * 0.40, brassMat, 0.88);
      registerFurniture('wine_wagon', g, [woodMat, brassMat]);
    }

    // 7. 西側北：業務用ガスコンロ（青い種火＆寸胴鍋）＋頭上大型レンジフード
    const flameMeshes = [];
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'gas_range');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const steelMat = makeMat(0xbcc5cf, 0.38, 0.68), ironMat = makeMat(0x272a30, 0.72, 0.45);
      const potMat = makeMat(0xd4dce6, 0.25, 0.82), knobMat = makeMat(0xdc2626, 0.5, 0.2);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.92 });

      const base = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.68, def.d), steelMat); base.position.y = 0.52; base.castShadow = true; base.receiveShadow = true;
      const grate = new THREE.Mesh(new THREE.BoxGeometry(def.w - 0.12, 0.04, def.d - 0.16), ironMat); grate.position.y = 0.88;
      g.add(base, grate);

      [-0.68, -0.22, 0.22, 0.68].forEach((bz, bidx) => {
        const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.04, 8), knobMat);
        knob.rotation.z = Math.PI / 2; knob.position.set(def.w * 0.5 + 0.015, 0.74, bz);
        const flame = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.105, 0.035, 10), flameMat);
        flame.position.set(0.0, 0.91, bz);
        g.add(knob, flame);
        flameMeshes.push({ mesh: flame, phase: bidx * 1.4 });
      });

      [-0.68, 0.22].forEach(pz => {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.19, 0.36, 12), potMat);
        pot.position.set(-0.02, 1.08, pz); pot.castShadow = true; g.add(pot);
      });

      const hood = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.40, 2.15), steelMat); hood.position.set(0.04, 1.98, 0); hood.castShadow = true; hood.receiveShadow = true;
      const duct = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.24, 0.56), ironMat); duct.position.set(-0.18, 2.78, 0);
      g.add(hood, duct);
      addFourLegs(g, def.w * 0.42, def.d * 0.44, ironMat, 0.18);
      registerFurniture('gas_range', g, [steelMat, ironMat, potMat, knobMat]);
    }

    // 8. 西側南：レンガ造りの本格ピザ窯（ドーム型1.58m・内部で赤い炎が揺らぐ）＋薪ラック（0.52mステップ）
    let pizzaFireMesh = null;
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'pizza_oven');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const brickMat = makeMat(0x9a3b2c, 0.90, 0.02), stoneMat = makeMat(0x6b6763, 0.88, 0.04);
      const fireHoleMat = makeMat(0x1c120e, 0.95, 0.0), woodMat = makeMat(0x6e472b, 0.88, 0.0);
      const fireMat = new THREE.MeshBasicMaterial({ color: 0xff6b2b });

      const base = new THREE.Mesh(new THREE.BoxGeometry(1.00, 0.92, 1.38), stoneMat); base.position.set(0, 0.46, -0.35); base.castShadow = true; base.receiveShadow = true;
      const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.64, 0.66, 10), brickMat); dome.position.set(0, 1.25, -0.35); dome.castShadow = true; dome.receiveShadow = true;
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 1.85, 8), stoneMat); chimney.position.set(-0.12, 2.45, -0.35);
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.52), fireHoleMat); mouth.position.set(0.48, 1.12, -0.35);
      pizzaFireMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), fireMat); pizzaFireMesh.position.set(0.44, 1.06, -0.35);

      // 薪ラック（0.52mステップ）＋積み上がった薪
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.52, 0.68), stoneMat); rack.position.set(-0.08, 0.26, 0.72); rack.castShadow = true;
      for (let i = 0; i < 4; i++) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.54, 6), woodMat);
        log.rotation.z = Math.PI / 2; log.position.set(-0.06, 0.56, 0.52 + i * 0.13); g.add(log);
      }
      g.add(base, dome, chimney, mouth, pizzaFireMesh, rack);
      registerFurniture('pizza_oven', g, [brickMat, stoneMat, fireHoleMat, woodMat]);
    }

    // 9. 東側北：業務用2槽シンク
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'double_sink');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const steelMat = makeMat(0xcbd3dc, 0.32, 0.75), basinMat = makeMat(0x7c8694, 0.35, 0.75), soapMat = makeMat(0x22c55e, 0.4, 0.1);
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.42, def.d), steelMat); body.position.y = 0.67; body.castShadow = true; body.receiveShadow = true;
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.04, 0.68), basinMat); b1.position.set(-0.04, 0.87, -0.45);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.04, 0.68), basinMat); b2.position.set(-0.04, 0.87, 0.45);
      const soap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.18, 7), soapMat); soap.position.set(0.24, 0.97, 0.0);
      [-0.45, 0.45].forEach(fz => {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 6), steelMat); pipe.position.set(0.32, 1.04, fz);
        const spout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.028, 0.028), steelMat); spout.position.set(0.22, 1.20, fz);
        g.add(pipe, spout);
      });
      g.add(body, b1, b2, soap);
      addFourLegs(g, def.w * 0.42, def.d * 0.45, basinMat, 0.46);
      registerFurniture('double_sink', g, [steelMat, basinMat, soapMat]);
    }

    // 10. 東側中央：ガラス扉の縦型ドリンク冷蔵ショーケース（1.78m・内部に色とりどりの瓶）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'drink_cooler');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const bodyMat = makeMat(0x1f2937, 0.45, 0.45), innerMat = makeMat(0xe2e8f0, 0.6, 0.1);
      const glassMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.28, roughness: 0.1, metalness: 0.2 });
      const bColors = [0x22c55e, 0xef4444, 0xf59e0b, 0x3b82f6];
      const bMats = bColors.map(c => makeMat(c, 0.35, 0.15));

      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.topY, def.d), bodyMat); body.position.y = def.topY * 0.5; body.castShadow = true; body.receiveShadow = true;
      const door = new THREE.Mesh(new THREE.PlaneGeometry(def.d - 0.14, def.topY - 0.24), glassMat); door.rotation.y = -Math.PI / 2; door.position.set(-def.w * 0.5 - 0.01, def.topY * 0.52, 0);
      const backPanel = new THREE.Mesh(new THREE.PlaneGeometry(def.d - 0.18, def.topY - 0.30), innerMat); backPanel.rotation.y = -Math.PI / 2; backPanel.position.set(-def.w * 0.5 + 0.02, def.topY * 0.52, 0);
      g.add(body, backPanel, door);
      const bGeo = new THREE.CylinderGeometry(0.032, 0.035, 0.20, 6);
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const bt = new THREE.Mesh(bGeo, bMats[(r + c) % bMats.length]);
          bt.position.set(-def.w * 0.5 + 0.06, 0.36 + r * 0.34, -0.34 + c * 0.22);
          g.add(bt);
        }
      }
      registerFurniture('drink_cooler', g, [bodyMat, innerMat, ...bMats]);
    }

    // 11. 東側南角：業務用大型冷凍庫（1.95m）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'walkin_freezer');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const bodyMat = makeMat(0xd8e0e8, 0.30, 0.65), seamMat = makeMat(0x475569, 0.5, 0.5), ledMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.topY, def.d), bodyMat); body.position.y = def.topY * 0.5; body.castShadow = true; body.receiveShadow = true;
      const vSeam = new THREE.Mesh(new THREE.BoxGeometry(0.02, def.topY - 0.12, 0.02), seamMat); vSeam.position.set(-def.w * 0.5 - 0.005, def.topY * 0.5, 0);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.22), ledMat); panel.position.set(-def.w * 0.5 - 0.01, 1.72, -0.25);
      g.add(body, vSeam, panel);
      registerFurniture('walkin_freezer', g, [bodyMat, seamMat]);
    }

    // 12. 南西：野菜＆ワイン木箱の段差パントリー（1.68m）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'pantry_rack');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const frameMat = makeMat(0x64748b, 0.45, 0.6), boxMat = makeMat(0xa67f56, 0.92, 0.0), crateMat = makeMat(0x22c55e, 0.7, 0.05), tinMat = makeMat(0xdc2626, 0.4, 0.5);
      const postGeo = new THREE.BoxGeometry(0.04, def.topY, 0.04);
      [[-1.14, -0.31], [1.14, -0.31], [-1.14, 0.31], [1.14, 0.31]].forEach(([lx, lz]) => {
        const p = new THREE.Mesh(postGeo, frameMat); p.position.set(lx, def.topY * 0.5, lz); p.castShadow = true; g.add(p);
      });
      [0.18, 0.68, 1.18, 1.66].forEach(sy => {
        const sh = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.035, def.d), frameMat); sh.position.y = sy; sh.castShadow = true; sh.receiveShadow = true; g.add(sh);
      });
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.38, 0.52), boxMat); b1.position.set(-0.68, 0.39, 0); b1.castShadow = true;
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.36, 0.50), crateMat); b2.position.set(0.42, 0.38, 0); b2.castShadow = true;
      const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.38, 0.52), boxMat); b3.position.set(-0.42, 0.89, 0); b3.castShadow = true;
      const b4 = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.36, 0.50), boxMat); b4.position.set(0.62, 1.38, 0); b4.castShadow = true;
      g.add(b1, b2, b3, b4);
      for (let t = 0; t < 4; t++) {
        const tin = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.22, 8), tinMat);
        tin.position.set(0.22 + t * 0.18, 0.81, -0.04); g.add(tin);
      }
      registerFurniture('pantry_rack', g, [frameMat, boxMat, crateMat, tinMat]);
    }

    // 13. 南西中央寄り：踏み台(0.42m)→ビールケース(0.78m)→段ボール(1.18m)の3段階段足場
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'step_crates');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const beerMat = makeMat(0x2563eb, 0.72, 0.05), boxMat = makeMat(0x9e7952, 0.92, 0.0), stepMat = makeMat(0xd97706, 0.65, 0.1);
      // 3段目（左：1.18m）
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.38, 0.56), beerMat); c1.position.set(-0.64, 0.19, 0); c1.castShadow = true;
      const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.38, 0.56), beerMat); c2.position.set(-0.64, 0.57, 0); c2.castShadow = true;
      const bx1 = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.42, 0.52), boxMat); bx1.position.set(-0.64, 0.97, 0); bx1.castShadow = true;
      // 2段目（中：0.78m）
      const c3 = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.38, 0.56), beerMat); c3.position.set(0.0, 0.19, 0); c3.castShadow = true;
      const bx2 = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.40, 0.52), boxMat); bx2.position.set(0.0, 0.58, 0); bx2.castShadow = true;
      // 1段目（右：0.42m 踏み台）
      const stool = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.42, 0.48), stepMat); stool.position.set(0.64, 0.21, 0); stool.castShadow = true;
      g.add(c1, c2, bx1, c3, bx2, stool);
      registerFurniture('step_crates', g, [beerMat, boxMat, stepMat]);
    }

    // 14. 南中央西寄り：ペダルゴミ箱＆モップバケツ
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'trash_mop');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const binMat = makeMat(0x475569, 0.65, 0.15), bucketMat = makeMat(0xeab308, 0.55, 0.1), stickMat = makeMat(0x8c6239, 0.8, 0.0);
      const bin = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.66, 0.52), binMat); bin.position.set(-0.28, 0.33, 0); bin.castShadow = true;
      const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.16, 0.36, 10), bucketMat); bucket.position.set(0.30, 0.18, 0); bucket.castShadow = true;
      const mop = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.25, 6), stickMat); mop.position.set(0.32, 0.72, 0); mop.rotation.z = 0.14;
      g.add(bin, bucket, mop);
      registerFurniture('trash_mop', g, [binMat, bucketMat, stickMat]);
    }

    // 15. 南東寄り：衛生用品・スプレー補充台
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'sanitation_table');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const steelMat = makeMat(0xcbd3dc, 0.35, 0.7), bodyMat = makeMat(0x88929e, 0.45, 0.6);
      const top = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.06, def.d), steelMat); top.position.y = 0.85; top.castShadow = true; top.receiveShadow = true;
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(def.w - 0.10, 0.04, def.d - 0.10), bodyMat); shelf.position.y = 0.24;
      g.add(top, shelf);
      addFourLegs(g, def.w * 0.45, def.d * 0.40, bodyMat, 0.84);
      registerFurniture('sanitation_table', g, [steelMat, bodyMat]);
    }

    // 16. 南東：食洗機＆山積み洗い物カゴ（1.32m）
    {
      const def = FURNITURE_DEFS.find(f => f.id === 'dish_station');
      const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
      const steelMat = makeMat(0xc4ccd6, 0.35, 0.7), basketMat = makeMat(0xeab308, 0.65, 0.05), panelMat = makeMat(0x334155, 0.5, 0.4);
      const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.88, def.d), steelMat); body.position.y = 0.62; body.castShadow = true; body.receiveShadow = true;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(def.w - 0.20, 0.12, 0.03), panelMat); panel.position.set(0, 0.96, -def.d * 0.5 - 0.005);
      const bk1 = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.26, 0.52), basketMat); bk1.position.set(-0.36, 1.19, 0); bk1.castShadow = true;
      const bk2 = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.26, 0.52), basketMat); bk2.position.set( 0.36, 1.19, 0); bk2.castShadow = true;
      g.add(body, panel, bk1, bk2);
      addFourLegs(g, def.w * 0.44, def.d * 0.40, panelMat, 0.18);
      registerFurniture('dish_station', g, [steelMat, basketMat, panelMat]);
    }

    // 6. 寸胴鍋の湯気パーティクル
    const steamCount = 48;
    const steamPositions = new Float32Array(steamCount * 3);
    const steamMeta = [];
    const potOrigins = [
      { x: -6.36, z: -1.93 },
      { x: -6.36, z: -1.03 }
    ];
    for (let i = 0; i < steamCount; i++) {
      const po = potOrigins[i % 2];
      steamPositions[i * 3 + 0] = po.x + (Math.random() - 0.5) * 0.22;
      steamPositions[i * 3 + 1] = 1.26 + Math.random() * 0.65;
      steamPositions[i * 3 + 2] = po.z + (Math.random() - 0.5) * 0.22;
      steamMeta.push({ ox: po.x, oz: po.z, vy: 0.28 + Math.random() * 0.22, phase: Math.random() * Math.PI * 2 });
    }
    const steamGeo = new THREE.BufferGeometry();
    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));
    const steamPoints = new THREE.Points(
      steamGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.095, transparent: true, opacity: 0.30, depthWrite: false })
    );
    stageGroup.add(steamPoints);

    // 7. 光に照らされてゆっくり漂う厨房の微細な空気粒子（油煙・ダスト）
    const hazeCount = 100;
    const hazePositions = new Float32Array(hazeCount * 3);
    const hazeVel = [];
    for (let i = 0; i < hazeCount; i++) {
      hazePositions[i * 3 + 0] = (Math.random() * 2 - 1) * (ROOM.halfW - 0.4);
      hazePositions[i * 3 + 1] = 0.35 + Math.random() * (ROOM.height - 0.7);
      hazePositions[i * 3 + 2] = (Math.random() * 2 - 1) * (ROOM.halfD - 0.4);
      hazeVel.push({
        vx: (Math.random() - 0.5) * 0.035,
        vy: 0.012 + Math.random() * 0.022,
        vz: (Math.random() - 0.5) * 0.035
      });
    }
    const hazeGeo = new THREE.BufferGeometry();
    hazeGeo.setAttribute('position', new THREE.BufferAttribute(hazePositions, 3));
    const hazePoints = new THREE.Points(
      hazeGeo,
      new THREE.PointsMaterial({ color: 0xffe8c4, size: 0.022, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    stageGroup.add(hazePoints);

    const moonRays = stageGroup.userData.moonRays || [];
    const riverGlowMeshes = stageGroup.userData.riverGlowMeshes || [];
    const heatCones = stageGroup.userData.heatCones || [];

    return {
      update(dt, timeSec) {
        // コンロの青い種火＆ピザ窯の赤い炎と点光源のゆらぎ
        for (let i = 0; i < flameMeshes.length; i++) {
          const f = flameMeshes[i];
          const s = 0.92 + Math.sin(timeSec * 14 + f.phase) * 0.10;
          f.mesh.scale.set(s, 0.85 + Math.cos(timeSec * 18 + f.phase) * 0.20, s);
        }
        stoveGlow.intensity = 0.86 + Math.sin(timeSec * 11) * 0.12;
        if (pizzaFireMesh) {
          const fs = 0.90 + Math.sin(timeSec * 12) * 0.16;
          pizzaFireMesh.scale.set(fs, 1.0 + Math.cos(timeSec * 15) * 0.22, fs);
          pizzaGlow.intensity = 1.42 + Math.sin(timeSec * 9.5) * 0.24 + Math.cos(timeSec * 16.2) * 0.12;
        }
        // ホール窓の月明かりゴッドレイ＆川面反射＆ヒートランプ光コーンの微細な呼吸
        for (let i = 0; i < moonRays.length; i++) {
          const mr = moonRays[i];
          mr.mesh.material.opacity = mr.baseOp + Math.sin(timeSec * 0.55 + mr.phase) * 0.05;
        }
        for (let i = 0; i < riverGlowMeshes.length; i++) {
          const rg = riverGlowMeshes[i];
          rg.mesh.material.opacity = rg.baseOp + Math.sin(timeSec * 1.4 + rg.phase) * 0.08;
        }
        for (let i = 0; i < heatCones.length; i++) {
          const hc = heatCones[i];
          hc.mesh.material.opacity = 0.68 + Math.sin(timeSec * 2.1 + hc.phase) * 0.05;
        }
        // 川面の流れ＆クルーズ船の航行アニメーション
        riverTex.offset.x = (timeSec * 0.015) % 1;
        if (cruiseBoat) {
          cruiseBoat.position.x += dt * 1.45;
          if (cruiseBoat.position.x > 34) cruiseBoat.position.x = -34;
          cruiseBoat.position.y = -1.45 + Math.sin(timeSec * 1.6) * 0.04;
          if (boatReflect) {
            boatReflect.material.opacity = 0.18 + Math.sin(timeSec * 2.4) * 0.04;
          }
        }
        // 寸胴鍋の湯気上昇
        const pos = steamPoints.geometry.attributes.position;
        for (let i = 0; i < steamMeta.length; i++) {
          const m = steamMeta[i];
          let y = pos.getY(i) + m.vy * dt;
          if (y > 1.92) {
            y = 1.26;
            pos.setX(i, m.ox + (Math.random() - 0.5) * 0.18);
            pos.setZ(i, m.oz + (Math.random() - 0.5) * 0.18);
          } else {
            pos.setX(i, pos.getX(i) + Math.sin(timeSec * 2.2 + m.phase) * 0.04 * dt);
            pos.setZ(i, pos.getZ(i) + Math.cos(timeSec * 1.9 + m.phase) * 0.04 * dt);
          }
          pos.setY(i, y);
        }
        pos.needsUpdate = true;

        // 厨房内の微細な空気粒子（油煙・ダスト）
        const hPos = hazePoints.geometry.attributes.position;
        for (let i = 0; i < hazeVel.length; i++) {
          const v = hazeVel[i];
          let x = hPos.getX(i) + v.vx * dt;
          let y = hPos.getY(i) + v.vy * dt;
          let z = hPos.getZ(i) + v.vz * dt;
          if (x < -ROOM.halfW + 0.3) x = ROOM.halfW - 0.3;
          if (x > ROOM.halfW - 0.3) x = -ROOM.halfW + 0.3;
          if (y > ROOM.height - 0.25) y = 0.30;
          if (z < -ROOM.halfD + 0.3) z = ROOM.halfD - 0.3;
          if (z > ROOM.halfD - 0.3) z = -ROOM.halfD + 0.3;
          hPos.setXYZ(i, x, y, z);
        }
        hPos.needsUpdate = true;
      }
    };
  }
};
