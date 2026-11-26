// Firebase Realtime Database + Anonymous Auth 設定（移植元 gokiburi-a4fa2）
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDwU4LN47Vwmb62a4WwSiPaUbGiTOBls5Y",
  authDomain: "gokiburi-a4fa2.firebaseapp.com",
  databaseURL: "https://gokiburi-a4fa2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gokiburi-a4fa2",
  storageBucket: "gokiburi-a4fa2.firebasestorage.app",
  messagingSenderId: "513182652759",
  appId: "1:513182652759:web:f68b762796cfdc1b910612"
};

export const MAX_PLAYERS = 8;

export const IS_MOBILE = (() => {
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const ua = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return coarse || ua || ('ontouchstart' in window && window.innerWidth <= 1024);
})();

// 全バランス定数（現在の基盤から一切変更なし）
export const BALANCE = {
  matchDuration: 120.0,
  countdownDuration: 3.0,
  human: {
    walkSpeed: 2.95,
    sprintSpeed: 4.35,
    crouchSpeed: 1.75,
    staminaMax: 100,
    sprintDrainPerSec: 26.0,
    jumpCost: 18.0,
    staminaRecoverDelay: 0.6,
    staminaRecoverPerSec: 30.0
  },
  newspaper: {
    reach: 1.95,
    windupTime: 0.13,
    strikeTime: 0.09,
    recoverHitTime: 0.26,
    recoverMissTime: 0.58,
    directRadius: 0.24,
    directDamage: 100,
    grazeRadius: 0.44,
    grazeDamage: 55,
    vertTolerance: 0.55
  },
  spray: {
    fuelDrainPerSec: 20.0,
    range: 2.6,
    coneDot: 0.86,
    damagePerSec: 22.0,
    underFurnitureDamagePerSec: 42.0,
    poisonBuildPerSec: 182.0,
    poisonDecayDelay: 0.4,
    poisonDecayPerSec: 75.0,
    poisonDuration: 1.4,
    poisonSpeedMult: 0.72,
    poisonFlySpeedMult: 0.86,
    allowDashWhenPoisoned: false,
    allowClimbWhenPoisoned: true,
    allowFlyWhenPoisoned: true,
    crouchNozzleY: 0.13
  },
  roach: {
    maxHp: 100,
    baseSpeed: 2.35,
    sprintSpeed: 3.55,
    aiBaseSpeed: 1.85,
    aiSprintSpeed: 3.45,
    hungrySpeedMult: 0.52,
    hungerEmptySec: 48.0,
    starveDamagePerSec: 10.5,
    staminaMax: 100,
    sprintDrainPerSec: 24.0,
    climbMoveDrainPerSec: 18.0,
    climbHoldDrainPerSec: 26.0,
    staminaRecoverPerSec: 35.0,
    flyFuelMax: 100,
    flyStartCost: 15.0,
    flyDrainPerSec: 85.0,
    flyMinFuelToStart: 25.0,
    flyRecoverDelay: 1.5,
    flyRecoverPerSec: 6.5,
    flySpeed: 4.4,
    flyLiftSpeed: 2.1
  },
  crumb: {
    count: 5,
    minCount: 5,
    floorHungerHeal: 38,
    floorHpHeal: 8,
    elevatedHungerHeal: 58,
    elevatedHpHeal: 18,
    respawnMin: 6.5,
    respawnRand: 3.5
  }
};

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function angleDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function rayIntersectAABB(ox, oy, oz, dx, dy, dz, minX, minY, minZ, maxX, maxY, maxZ) {
  let tmin = -Infinity;
  let tmax = Infinity;
  const axes = [
    [ox, dx, minX, maxX],
    [oy, dy, minY, maxY],
    [oz, dz, minZ, maxZ]
  ];
  for (let i = 0; i < 3; i++) {
    const [o, d, mn, mx] = axes[i];
    if (Math.abs(d) < 1e-6) {
      if (o < mn || o > mx) return null;
    } else {
      let t1 = (mn - o) / d;
      let t2 = (mx - o) / d;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
  }
  return tmin > 0.03 ? tmin : (tmax > 0.03 ? tmax : null);
}

export function buildCollidersFromFurniture(furnitureDefs) {
  const colliders = [];
  for (const f of furnitureDefs) {
    for (const p of f.parts) {
      const cx = f.x + p.ox;
      const cz = f.z + p.oz;
      colliders.push({
        parentId: f.id,
        x: cx,
        z: cz,
        w: p.w,
        d: p.d,
        minX: cx - p.w * 0.5,
        maxX: cx + p.w * 0.5,
        minZ: cz - p.d * 0.5,
        maxZ: cz + p.d * 0.5,
        bottomY: p.bottomY,
        topY: p.topY,
        climbable: p.climbable
      });
    }
  }
  return colliders;
}
