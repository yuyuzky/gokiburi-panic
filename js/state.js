import { BALANCE, IS_MOBILE, clamp, lerp, angleDiff, rayIntersectAABB } from './config.js';
import { NavGrid } from './nav.js';
import { DEFAULT_STAGE_ID, getStageById } from './stages/index.js';

function createCrumbAtSpot(id, spot) {
  const types = ['bread', 'cookie', 'chip'];
  const j = spot.jitter || 0.2;
  return {
    id,
    type: types[id % types.length],
    x: spot.x + (Math.random() - 0.5) * j,
    y: spot.y,
    z: spot.z + (Math.random() - 0.5) * j,
    elevated: !!spot.elevated,
    active: true,
    respawnTimer: 0
  };
}

function pickDispersedCrumbSpot(spawnPoints, crumbs, excludeId) {
  let bestSpot = spawnPoints[0];
  let bestScore = -1;
  for (let i = 0; i < spawnPoints.length; i++) {
    const sp = spawnPoints[i];
    let minDist = Infinity;
    for (let j = 0; j < crumbs.length; j++) {
      const c = crumbs[j];
      if (!c.active || c.id === excludeId) continue;
      const d = Math.hypot(c.x - sp.x, c.z - sp.z);
      if (d < minDist) minDist = d;
    }
    const score = (minDist === Infinity ? 10.0 : minDist) + Math.random() * 0.85;
    if (score > bestScore) {
      bestScore = score;
      bestSpot = sp;
    }
  }
  return bestSpot;
}

// 最大8人・複数人間・観戦切替対応のゲーム状態・ロジック層（3カウント・独立飛行ゲージ・毒蓄積・家具遮蔽スプレー完全維持）
export class GameState {
  constructor() {
    this.mode = 'title';
    this.playerSide = 'human';
    this.networkMode = 'offline'; // 'offline' | 'host' | 'guest'
    this.localUid = 'local';
    this.localHumanIndex = 0;
    this.localRoachIndex = -1;
    this.spectateRoachIndex = 0;
    this.remoteInputs = {}; // uid -> remote payload

    this.stageId = DEFAULT_STAGE_ID;
    this.stage = getStageById(this.stageId);
    this.navGrid = new NavGrid(this.stage.room, this.stage.colliders, 0.4, 0.34);

    this.matchDuration = BALANCE.matchDuration;
    this.timeLeft = BALANCE.matchDuration;
    this.elapsed = 0.0;
    this.countdown = 0.0;
    this.lastCountdownCeil = 0;
    this.goBannerTimer = 0.0;
    this.result = null;

    this.stats = { kills: 0, propsKnocked: 0 };
    this.hitstopTimer = 0;
    this.urgentSyncNeeded = false;

    this.input = {
      forward: 0,
      right: 0,
      jump: false,
      jumpHold: false,
      crouch: false,
      sprint: false,
      interact: false,
      primary: false,
      secondary: false,
      lookDeltaX: 0,
      lookDeltaY: 0
    };

    this.roachCameraShake = 0;
    this.humans = [];
    this.roaches = [];
    this.crumbs = [];
    this.props = [];

    this.train = { active: true, x: -28, direction: 1, speed: 7.5, waitTimer: 0, clackTimer: 0 };

    this.events = [];
    this.netEventSeq = 0;
    this.netEventBuffer = [];
    this.lastAppliedNetSeq = 0;
    this.alerts = [];

    this.resetWorld({
      humans: [{ uid: 'local', name: '人間 #1', isAI: false }],
      roaches: [
        { uid: 'ai_r_0', name: 'ゴキブリAI 1', isAI: true },
        { uid: 'ai_r_1', name: 'ゴキブリAI 2', isAI: true },
        { uid: 'ai_r_2', name: 'ゴキブリAI 3', isAI: true }
      ]
    }, 'local', 'offline', this.stageId);
  }

  setStage(stageId) {
    const next = getStageById(stageId);
    if (this.stage && this.stage.id === next.id) return false;
    this.stageId = next.id;
    this.stage = next;
    this.navGrid = new NavGrid(this.stage.room, this.stage.colliders, 0.4, 0.34);
    this.resetWorld({
      humans: [{ uid: 'local', name: '人間 #1', isAI: false }],
      roaches: [
        { uid: 'ai_r_0', name: 'ゴキブリAI 1', isAI: true },
        { uid: 'ai_r_1', name: 'ゴキブリAI 2', isAI: true },
        { uid: 'ai_r_2', name: 'ゴキブリAI 3', isAI: true }
      ]
    }, 'local', 'offline', this.stageId);
    return true;
  }

  createHumanEntity(idx, info, isLocal) {
    const list = this.stage.humanSpawns || [this.stage.humanSpawn];
    const sp = list[idx % list.length];
    const baseFov = IS_MOBILE ? 82 : 72;
    return {
      id: idx,
      uid: info.uid,
      name: info.name || `人間 #${idx + 1}`,
      isAI: !!info.isAI,
      isLocal: !!isLocal,
      x: sp.x,
      y: sp.y || 0.0,
      z: sp.z,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: sp.yaw,
      pitch: sp.pitch ?? -0.18,
      eyeHeight: 1.56,
      crouching: false,
      sprinting: false,
      stamina: BALANCE.human.staminaMax,
      staminaRecoverDelay: 0,
      grounded: true,
      walkCycle: 0,
      swingPhase: 'idle',
      swingTimer: 0,
      swingHitDone: false,
      swingRecoverDuration: BALANCE.newspaper.recoverHitTime,
      sprayFuel: 100,
      spraying: false,
      sprayParticleTimer: 0,
      cameraShake: 0,
      fov: baseFov,
      refillProgress: 0,
      refillCooldown: 0,
      refillInRange: false,
      refilling: false,
      actSeq: 0,
      lastActSeq: 0,
      aiPatrolPoint: { x: 0, z: 0 },
      aiPath: [],
      aiPathTimer: 0,
      aiStateTimer: 0,
      aiAttackCooldown: 0,
      aiStuckTimer: 0,
      aiLastPos: { x: sp.x, z: sp.z },
      aiAvoidTimer: 0,
      aiAvoidDir: { x: 0, z: 0 },
      aiFlankGoal: null,
      aiFlankTimer: 0,
      netTarget: null
    };
  }

  createRoachEntity(idx, info, isLocal) {
    const list = this.stage.roachSpawns;
    const sp = list[idx % list.length];
    return {
      id: idx,
      uid: info.uid,
      name: info.name || `ゴキブリ #${idx + 1}`,
      isAI: !!info.isAI,
      isPlayer: !!isLocal,
      alive: true,
      x: sp.x,
      y: 0.0,
      z: sp.z,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: sp.yaw,
      camYaw: sp.yaw,
      camPitch: 0.24,
      surface: 'floor',
      normal: { x: 0, y: 1, z: 0 },
      climbingWall: null,
      grounded: true,
      airTime: 0,
      hp: BALANCE.roach.maxHp,
      maxHp: BALANCE.roach.maxHp,
      hunger: 100,
      stamina: BALANCE.roach.staminaMax,
      flyFuel: BALANCE.roach.flyFuelMax,
      flyRecoverDelay: 0,
      flying: false,
      flyAlertTimer: 0,
      poisonBuild: 0,
      poisonDecayTimer: 0,
      poisonTimer: 0,
      poisonPuffTimer: 0,
      sprinting: false,
      wingFlutter: 0,
      legPhase: Math.random() * Math.PI * 2,
      antennaSeed: idx * 3.17 + Math.random() * 5,
      breathPhase: Math.random() * Math.PI * 2,
      skitterSoundTimer: 0,
      hungrySoundTimer: 0,
      damageFlash: 0,
      aiTimer: 0,
      aiGoal: null,
      netTarget: null
    };
  }

  resetWorld(roster, localUid = 'local', networkMode = 'offline', stageId = this.stageId) {
    const nextStage = getStageById(stageId);
    if (this.stage.id !== nextStage.id) {
      this.stage = nextStage;
      this.stageId = nextStage.id;
      this.navGrid = new NavGrid(this.stage.room, this.stage.colliders, 0.4, 0.34);
    }

    this.localUid = localUid;
    this.networkMode = networkMode;
    this.timeLeft = this.matchDuration;
    this.elapsed = 0;
    this.countdown = BALANCE.countdownDuration;
    this.lastCountdownCeil = Math.ceil(BALANCE.countdownDuration);
    this.goBannerTimer = 0;
    this.result = null;
    this.hitstopTimer = 0;
    this.urgentSyncNeeded = false;
    this.roachCameraShake = 0;
    this.stats = { kills: 0, propsKnocked: 0 };
    this.events = [];
    this.netEventSeq = 0;
    this.netEventBuffer = [];
    this.lastAppliedNetSeq = 0;
    this.alerts = [];

    const humanList = (roster && roster.humans && roster.humans.length > 0)
      ? roster.humans
      : [{ uid: 'ai_h_0', name: '人間AI', isAI: true }];
    const roachList = (roster && roster.roaches && roster.roaches.length > 0)
      ? roster.roaches
      : [{ uid: 'ai_r_0', name: 'ゴキブリAI 1', isAI: true }];

    this.localHumanIndex = humanList.findIndex(p => p.uid === localUid);
    this.localRoachIndex = roachList.findIndex(p => p.uid === localUid);
    this.playerSide = this.localHumanIndex >= 0 ? 'human' : 'roach';
    this.spectateRoachIndex = Math.max(0, this.localRoachIndex);

    this.humans = humanList.map((info, idx) => this.createHumanEntity(idx, info, idx === this.localHumanIndex));
    this.roaches = roachList.map((info, idx) => this.createRoachEntity(idx, info, idx === this.localRoachIndex));

    const crumbCount = Math.max(BALANCE.crumb.minCount, this.roaches.length + 2);
    this.crumbs = [];
    const pts = this.stage.crumbSpawnPoints;
    const floorSpots = pts.filter(s => !s.elevated).sort(() => Math.random() - 0.5);
    const elevatedSpots = pts.filter(s => s.elevated).sort(() => Math.random() - 0.5);
    for (let i = 0; i < crumbCount; i++) {
      const useElev = i % 3 === 2 && elevatedSpots.length > 0;
      const pool = useElev ? elevatedSpots : floorSpots;
      const spot = pool[Math.floor(i / (useElev ? 3 : 1)) % pool.length];
      this.crumbs.push(createCrumbAtSpot(i, spot));
    }

    this.props = this.stage.initialProps.map(p => ({
      ...p,
      vx: 0, vy: 0, vz: 0,
      rx: 0, ry: Math.random() * Math.PI * 2, rz: 0,
      vrx: 0, vry: 0, vrz: 0,
      knocked: false,
      dirtyNet: false,
      netTarget: null
    }));
  }

  getLocalHuman() {
    return this.localHumanIndex >= 0 ? this.humans[this.localHumanIndex] : null;
  }

  getLocalRoach() {
    return this.localRoachIndex >= 0 ? this.roaches[this.localRoachIndex] : null;
  }

  getCameraRoach() {
    const local = this.getLocalRoach();
    if (local && local.alive) return local;
    const cur = this.roaches[this.spectateRoachIndex];
    if (cur && cur.alive) return cur;
    const alive = this.roaches.find(r => r.alive);
    if (alive) {
      this.spectateRoachIndex = alive.id;
      return alive;
    }
    return local || this.roaches[0];
  }

  cycleSpectateRoach() {
    const aliveList = this.roaches.filter(r => r.alive);
    if (aliveList.length === 0) return null;
    const curIdx = aliveList.findIndex(r => r.id === this.spectateRoachIndex);
    const next = aliveList[(curIdx + 1) % aliveList.length];
    this.spectateRoachIndex = next.id;
    return next;
  }

  startMatch(roster, localUid = 'local', networkMode = 'offline', stageId = this.stageId) {
    this.resetWorld(roster, localUid, networkMode, stageId);
    this.mode = 'playing';
    this.emit('sound_countdown', { isGo: false });
  }

  emit(type, payload = {}, replicateToNet = false) {
    this.events.push({ type, ...payload });
    if (replicateToNet && this.networkMode === 'host') {
      this.netEventSeq++;
      this.netEventBuffer.push({ seq: this.netEventSeq, type, ...payload });
      if (this.netEventBuffer.length > 16) {
        this.netEventBuffer.shift();
      }
    }
  }

  update(dt) {
    this.events.length = 0;
    if (this.stage.hasTrain) {
      this.updateTrain(dt);
    }

    if (this.mode !== 'playing') {
      for (const r of this.roaches) r.breathPhase += dt * 2.4;
      return;
    }

    if (this.goBannerTimer > 0) {
      this.goBannerTimer = Math.max(0, this.goBannerTimer - dt);
    }

    if (this.networkMode === 'guest') {
      this.updateGuestClient(dt);
      return;
    }

    // 開始3カウント進行（ホスト正本）
    if (this.countdown > 0) {
      this.countdown = Math.max(0, this.countdown - dt);
      const curCeil = Math.ceil(this.countdown);
      if (curCeil !== this.lastCountdownCeil) {
        this.lastCountdownCeil = curCeil;
        if (curCeil > 0) {
          this.emit('sound_countdown', { isGo: false }, true);
        } else {
          this.goBannerTimer = 0.85;
          this.emit('sound_countdown', { isGo: true }, true);
          this.urgentSyncNeeded = true;
        }
      }
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      const lh = this.getLocalHuman();
      if (lh) lh.cameraShake = Math.max(0, lh.cameraShake - dt * 2.0);
      return;
    }

    const humanLocked = this.countdown > 0;
    if (!humanLocked) {
      this.elapsed += dt;
      this.timeLeft = Math.max(0, this.timeLeft - dt);
    }

    // 全人間の更新（ローカル／リモートゲスト／AI）
    for (const h of this.humans) {
      const remote = (this.networkMode === 'host' && !h.isLocal && !h.isAI) ? this.remoteInputs[h.uid] : null;
      if (h.isLocal) {
        this.updateHumanPlayer(h, dt, true, humanLocked);
      } else if (remote) {
        this.applyRemoteGuestToHuman(h, remote, dt, humanLocked);
      } else {
        this.updateHumanAI(h, dt, humanLocked);
      }
    }

    // 全ゴキブリの更新（カウント中も自由に移動可能）
    for (const r of this.roaches) {
      if (!r.alive) continue;
      const remote = (this.networkMode === 'host' && !r.isPlayer && !r.isAI) ? this.remoteInputs[r.uid] : null;
      if (remote) {
        this.applyRemoteGuestToRoach(r, remote, dt);
      } else if (r.isPlayer) {
        this.updateRoachPlayer(r, dt);
      } else {
        this.updateRoachAI(r, dt);
      }
      this.updateRoachCommon(r, dt, humanLocked);
    }

    for (const c of this.crumbs) {
      if (!c.active) {
        c.respawnTimer -= dt;
        if (c.respawnTimer <= 0) {
          const spot = pickDispersedCrumbSpot(this.stage.crumbSpawnPoints, this.crumbs, c.id);
          const j = spot.jitter || 0.2;
          c.x = spot.x + (Math.random() - 0.5) * j;
          c.y = spot.y;
          c.z = spot.z + (Math.random() - 0.5) * j;
          c.elevated = !!spot.elevated;
          c.active = true;
        }
      }
    }

    this.roachCameraShake = Math.max(0, this.roachCameraShake - dt * 3.2);
    this.updateProps(dt);

    for (let i = this.alerts.length - 1; i >= 0; i--) {
      this.alerts[i].ttl -= dt;
      if (this.alerts[i].ttl <= 0) this.alerts.splice(i, 1);
    }

    if (!humanLocked) {
      this.checkWinConditions();
    }

    this.input.lookDeltaX = 0;
    this.input.lookDeltaY = 0;
    this.input.jump = false;
  }

  applyRemoteGuestToHuman(h, g, dt, locked) {
    const room = this.stage.room;
    const k = clamp(dt * 18, 0, 1);
    h.yaw += angleDiff(h.yaw, g.yaw ?? h.yaw) * k;
    h.pitch = lerp(h.pitch, g.pitch ?? h.pitch, k);

    if (locked) {
      h.spraying = false;
      return;
    }

    h.x = lerp(h.x, clamp(g.x ?? h.x, -room.halfW + 0.3, room.halfW - 0.3), k);
    h.y = lerp(h.y, clamp(g.y ?? h.y, 0, room.height - 0.5), k);
    h.z = lerp(h.z, clamp(g.z ?? h.z, -room.halfD + 0.3, room.halfD - 0.3), k);
    h.eyeHeight = lerp(h.eyeHeight, g.eh ?? 1.56, k);
    h.crouching = !!g.cr;
    h.swingPhase = g.swP || 'idle';
    h.swingTimer = g.swT ?? 0;
    h.walkCycle = g.wc ?? h.walkCycle;
    h.sprayFuel = g.spF ?? h.sprayFuel;
    h.spraying = !!g.sp && h.sprayFuel > 0;

    if ((g.actSeq || 0) > h.lastActSeq) {
      h.lastActSeq = g.actSeq;
      this.emit('sound_swish', {}, true);
      this.resolveNewspaperImpact(h);
    }

    if (h.spraying) {
      this.applySprayEffectsAndDamage(h, dt, true);
    }
  }

  applyRemoteGuestToRoach(r, g, dt) {
    const room = this.stage.room;
    const k = clamp(dt * 20, 0, 1);
    r.x = lerp(r.x, clamp(g.x ?? r.x, -room.halfW + 0.05, room.halfW - 0.05), k);
    r.y = lerp(r.y, clamp(g.y ?? r.y, 0, room.height - 0.12), k);
    r.z = lerp(r.z, clamp(g.z ?? r.z, -room.halfD + 0.05, room.halfD - 0.05), k);
    r.vx = g.vx ?? 0;
    r.vz = g.vz ?? 0;
    r.yaw += angleDiff(r.yaw, g.yaw ?? r.yaw) * k;
    r.surface = g.sf || 'floor';
    r.normal = { x: g.nx ?? 0, y: g.sf === 'wall' ? 0 : 1, z: g.nz ?? 0 };
    r.climbingWall = r.surface === 'wall' ? { nx: r.normal.x, nz: r.normal.z } : null;
    r.sprinting = !!g.sp;
    r.flying = !!g.fl;
    r.wingFlutter = r.flying ? 0.3 : (g.wf ?? 0);
    r.legPhase = g.lp ?? r.legPhase;
    r.stamina = g.st ?? r.stamina;
    r.flyFuel = g.ff ?? r.flyFuel;
  }

  updateGuestClient(dt) {
    const humanLocked = this.countdown > 0;

    if (this.playerSide === 'human') {
      const lh = this.getLocalHuman();
      if (lh) this.updateHumanPlayer(lh, dt, false, humanLocked);
    } else {
      const lr = this.getLocalRoach();
      if (lr && lr.alive) {
        this.updateRoachPlayer(lr, dt);
        lr.breathPhase += dt * 3.1;
        lr.damageFlash = Math.max(0, lr.damageFlash - dt);
        lr.wingFlutter = Math.max(0, lr.wingFlutter - dt);
        const horizSpeed = Math.hypot(lr.vx, lr.vz);
        if (lr.surface !== 'wall' && !lr.flying && horizSpeed > 0.08) {
          lr.legPhase += dt * horizSpeed * 16.5;
        }
        if (!lr.flying && (horizSpeed > 0.85 || lr.surface === 'wall')) {
          lr.skitterSoundTimer -= dt;
          if (lr.skitterSoundTimer <= 0) {
            lr.skitterSoundTimer = lr.sprinting ? 0.14 : 0.24;
            this.emit('sound_skitter', { volume: 0.22 });
          }
        }
      } else {
        if (lr) {
          lr.flying = false;
          lr.vx = 0; lr.vy = 0; lr.vz = 0;
        }
        const camR = this.getCameraRoach();
        if (camR) {
          camR.camYaw -= this.input.lookDeltaX * 0.0024;
          camR.camPitch = clamp(camR.camPitch + this.input.lookDeltaY * 0.0020, -0.35, 0.88);
        }
      }
    }

    const k = clamp(dt * 16, 0, 1);
    for (const h of this.humans) {
      if (h.isLocal || !h.netTarget) continue;
      const nt = h.netTarget;
      h.x = lerp(h.x, nt.x, k);
      h.y = lerp(h.y, nt.y, k);
      h.z = lerp(h.z, nt.z, k);
      h.yaw += angleDiff(h.yaw, nt.yaw) * k;
      h.pitch = lerp(h.pitch, nt.pitch, k);
      h.eyeHeight = lerp(h.eyeHeight, nt.eh, k);
      h.crouching = !!nt.cr;
      h.swingPhase = nt.swP || 'idle';
      h.swingTimer = nt.swT ?? 0;
      h.sprayFuel = nt.spF ?? 100;
      h.spraying = !!nt.sp;
      h.walkCycle = nt.wc ?? 0;
    }

    for (const roach of this.roaches) {
      roach.breathPhase += dt * 3.1;
      if (roach.isPlayer || !roach.netTarget) continue;
      const nt = roach.netTarget;
      roach.x = lerp(roach.x, nt.x, k);
      roach.y = lerp(roach.y, nt.y, k);
      roach.z = lerp(roach.z, nt.z, k);
      roach.yaw += angleDiff(roach.yaw, nt.yaw) * k;
      roach.legPhase = nt.lp;
      roach.flying = !!nt.fl;
      roach.wingFlutter = roach.flying ? 0.3 : nt.wf;
      roach.surface = nt.sf;
      roach.normal = { x: nt.nx, y: nt.sf === 'wall' ? 0 : 1, z: nt.nz };
      roach.climbingWall = nt.sf === 'wall' ? { nx: nt.nx, nz: nt.nz } : null;

      if (this.playerSide === 'human' && roach.alive) {
        if (roach.flying) {
          roach.flyAlertTimer -= dt;
          if (roach.flyAlertTimer <= 0) {
            roach.flyAlertTimer = 0.25;
            this.pushAlert(roach.x, roach.z, 'fly', 0.8);
          }
        }
        if (nt.hu <= 30) {
          roach.hungrySoundTimer -= dt;
          if (roach.hungrySoundTimer <= 0) {
            roach.hungrySoundTimer = 3.0;
            this.pushAlert(roach.x, roach.z, 'hungry', 1.8);
          }
        }
      }
    }

    for (const p of this.props) {
      if (!p.netTarget) continue;
      p.x = lerp(p.x, p.netTarget[0], k);
      p.y = lerp(p.y, p.netTarget[1], k);
      p.z = lerp(p.z, p.netTarget[2], k);
      p.rx = lerp(p.rx, p.netTarget[3], k);
      p.ry = lerp(p.ry, p.netTarget[4], k);
      p.rz = lerp(p.rz, p.netTarget[5], k);
    }

    for (let i = this.alerts.length - 1; i >= 0; i--) {
      this.alerts[i].ttl -= dt;
      if (this.alerts[i].ttl <= 0) this.alerts.splice(i, 1);
    }

    this.roachCameraShake = Math.max(0, this.roachCameraShake - dt * 3.2);
    this.input.lookDeltaX = 0;
    this.input.lookDeltaY = 0;
    this.input.jump = false;
  }

  applyHostSnapshot(snap) {
    if (!snap) return;
    this.timeLeft = snap.t ?? this.timeLeft;
    this.elapsed = snap.e ?? this.elapsed;

    const prevCd = this.countdown;
    this.countdown = snap.cd ?? 0;
    if (prevCd > 0 && this.countdown <= 0) {
      this.goBannerTimer = 0.85;
    }

    if (snap.st) this.stats = snap.st;

    if (Array.isArray(snap.h)) {
      for (let i = 0; i < this.humans.length && i < snap.h.length; i++) {
        if (this.humans[i].isLocal) continue;
        this.humans[i].netTarget = snap.h[i];
      }
    }

    if (Array.isArray(snap.r)) {
      for (let i = 0; i < this.roaches.length && i < snap.r.length; i++) {
        const sr = snap.r[i];
        const lr = this.roaches[i];
        const wasAlive = lr.alive;
        lr.alive = !!sr.al;
        lr.hp = sr.hp;
        lr.hunger = sr.hu;
        lr.poisonTimer = sr.po;
        lr.poisonBuild = sr.pb ?? 0;
        if (lr.isPlayer) {
          if (sr.df > lr.damageFlash) lr.damageFlash = sr.df;
          if (wasAlive && !lr.alive) {
            lr.flying = false;
            this.emit('toast', { text: lr.hunger <= 0 ? '空腹で力尽きた！観戦モードへ移行' : '駆除された！仲間の観戦モードへ移行' });
          }
        } else {
          lr.netTarget = sr;
        }
      }
    }

    if (Array.isArray(snap.c)) {
      for (let i = 0; i < this.crumbs.length && i < snap.c.length; i++) {
        const sc = snap.c[i];
        const lc = this.crumbs[i];
        lc.x = sc.x; lc.y = sc.y; lc.z = sc.z;
        lc.elevated = !!sc.el;
        lc.active = !!sc.ac;
      }
    }

    if (snap.p && typeof snap.p === 'object') {
      for (const key of Object.keys(snap.p)) {
        const idx = Number(key);
        if (this.props[idx]) this.props[idx].netTarget = snap.p[key];
      }
    }

    if (Array.isArray(snap.ev)) {
      const pr = this.getCameraRoach();
      for (const ev of snap.ev) {
        if (ev.seq <= this.lastAppliedNetSeq) continue;
        this.lastAppliedNetSeq = ev.seq;
        if (ev.type === 'impact' && pr && this.playerSide === 'roach') {
          const d = Math.hypot(pr.x - ev.x, pr.y - ev.y, pr.z - ev.z);
          if (d < 1.35) {
            const prox = 1.0 - d / 1.35;
            this.roachCameraShake = Math.max(this.roachCameraShake, prox * prox * 0.16);
          }
          this.emit('sound_slap', { intensity: clamp(1.15 - d * 0.2, 0.2, 1.05) });
        }
        if (ev.type === 'roach_eat' && this.getLocalRoach() && ev.id === this.getLocalRoach().id) {
          this.emit('sound_eat');
          this.emit('toast', { text: ev.elevated ? '家具上の食べかすを食べて大幅回復！' : '食べかすを食べて空腹と体力が回復！' });
          continue;
        }
        if (ev.type === 'crosshair_hit' && this.playerSide === 'human' && ev.uid === this.localUid) {
          this.emit('crosshair_hit', ev);
          continue;
        }
        this.emit(ev.type, ev);
      }
    }

    if (snap.m === 'result' && snap.res) {
      this.mode = 'result';
      this.result = {
        winner: snap.res.winner,
        playerWon: snap.res.winner === this.playerSide,
        reason: snap.res.winner === 'roach'
          ? '120秒間逃げ切った！ゴキブリ陣営の勝利だ！'
          : 'すべてのゴキブリが駆除された！人間陣営の勝利だ！'
      };
    }
  }

  exportHostSnapshot() {
    const movedProps = {};
    for (let i = 0; i < this.props.length; i++) {
      const p = this.props[i];
      if (p.dirtyNet) {
        movedProps[i] = [
          +p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2),
          +p.rx.toFixed(2), +p.ry.toFixed(2), +p.rz.toFixed(2)
        ];
      }
    }

    return {
      t: Math.round(this.timeLeft * 10) / 10,
      e: Math.round(this.elapsed * 10) / 10,
      cd: Math.round(this.countdown * 10) / 10,
      m: this.mode,
      res: this.result ? { winner: this.result.winner } : null,
      st: this.stats,
      h: this.humans.map(h => ({
        x: +h.x.toFixed(3), y: +h.y.toFixed(3), z: +h.z.toFixed(3),
        yaw: +h.yaw.toFixed(3), pitch: +h.pitch.toFixed(3),
        eh: +h.eyeHeight.toFixed(2), cr: h.crouching,
        swP: h.swingPhase, swT: +h.swingTimer.toFixed(2),
        spF: Math.round(h.sprayFuel), sp: h.spraying,
        wc: +h.walkCycle.toFixed(2)
      })),
      r: this.roaches.map(r => ({
        al: r.alive,
        x: +r.x.toFixed(3), y: +r.y.toFixed(3), z: +r.z.toFixed(3),
        yaw: +r.yaw.toFixed(3),
        hp: Math.round(r.hp), hu: Math.round(r.hunger),
        po: +r.poisonTimer.toFixed(2),
        pb: Math.round(r.poisonBuild),
        sf: r.surface, nx: r.normal.x, nz: r.normal.z,
        lp: +r.legPhase.toFixed(2), wf: +r.wingFlutter.toFixed(2),
        fl: r.flying,
        df: +r.damageFlash.toFixed(2)
      })),
      c: this.crumbs.map(c => ({
        x: +c.x.toFixed(2), y: +c.y.toFixed(2), z: +c.z.toFixed(2),
        el: c.elevated, ac: c.active
      })),
      p: movedProps,
      ev: this.netEventBuffer
    };
  }

  updateTrain(dt) {
    const t = this.train;
    if (t.active) {
      t.x += t.direction * t.speed * dt;
      if (Math.abs(t.x) < 12) {
        t.clackTimer -= dt;
        if (t.clackTimer <= 0) {
          t.clackTimer = 0.72;
          const distFactor = 1.0 - clamp(Math.abs(t.x) / 14, 0, 0.85);
          this.emit('sound_train', { volume: 0.055 * distFactor });
        }
      }
      if (Math.abs(t.x) > 46) {
        t.active = false;
        t.waitTimer = 5.5 + Math.random() * 5.0;
      }
    } else {
      t.waitTimer -= dt;
      if (t.waitTimer <= 0) {
        t.active = true;
        t.direction = Math.random() < 0.5 ? 1 : -1;
        t.x = -t.direction * 44;
        t.speed = 6.8 + Math.random() * 2.4;
      }
    }
  }

  updateHumanPlayer(h, dt, isAuthoritative, locked) {
    const inp = this.input;
    const hb = BALANCE.human;
    const baseFov = IS_MOBILE ? 82 : 72;

    h.yaw -= inp.lookDeltaX * 0.0022;
    h.pitch = clamp(h.pitch - inp.lookDeltaY * 0.0022, -1.35, 1.25);

    if (locked) {
      h.vx = 0; h.vz = 0; h.spraying = false; h.sprinting = false;
      return;
    }

    h.crouching = inp.crouch;
    h.sprinting = inp.sprint && !h.crouching && (inp.forward > 0.1) && h.stamina > 1.0;

    if (h.sprinting) {
      h.stamina = Math.max(0, h.stamina - hb.sprintDrainPerSec * dt);
      h.staminaRecoverDelay = hb.staminaRecoverDelay;
    } else {
      if (h.staminaRecoverDelay > 0) {
        h.staminaRecoverDelay = Math.max(0, h.staminaRecoverDelay - dt);
      } else {
        h.stamina = Math.min(hb.staminaMax, h.stamina + hb.staminaRecoverPerSec * dt);
      }
    }

    const targetEye = h.crouching ? 0.58 : 1.56;
    h.eyeHeight = lerp(h.eyeHeight, targetEye, clamp(dt * 12, 0, 1));

    const targetFov = h.sprinting ? baseFov + 10 : (h.crouching ? baseFov - 4 : baseFov);
    h.fov = lerp(h.fov, targetFov, clamp(dt * 10, 0, 1));

    const sinY = Math.sin(h.yaw);
    const cosY = Math.cos(h.yaw);
    let mx = -sinY * inp.forward + cosY * inp.right;
    let mz = -cosY * inp.forward - sinY * inp.right;
    const mLen = Math.hypot(mx, mz);
    if (mLen > 0.001) { mx /= mLen; mz /= mLen; }

    const speed = h.crouching ? hb.crouchSpeed : (h.sprinting ? hb.sprintSpeed : hb.walkSpeed);
    h.vx = lerp(h.vx, mx * speed, clamp(dt * 14, 0, 1));
    h.vz = lerp(h.vz, mz * speed, clamp(dt * 14, 0, 1));

    if (inp.jump && h.grounded && h.stamina >= hb.jumpCost) {
      h.vy = 4.6;
      h.grounded = false;
      h.stamina = Math.max(0, h.stamina - hb.jumpCost);
      h.staminaRecoverDelay = hb.staminaRecoverDelay;
    }
    h.vy -= 13.5 * dt;

    this.moveHumanWithCollision(h, dt);

    if (mLen > 0.1 && h.grounded) {
      h.walkCycle += dt * (h.sprinting ? 12 : (h.crouching ? 6 : 9));
    }

    this.updateSprayRefill(h, dt);

    if (inp.primary && h.swingPhase === 'idle' && !h.refilling) {
      h.swingPhase = 'windup';
      h.swingTimer = 0;
      h.swingHitDone = false;
      h.swingRecoverDuration = BALANCE.newspaper.recoverMissTime;
      h.actSeq++;
      this.emit('sound_swish', {}, isAuthoritative);
    }
    this.updateHumanSwing(h, dt, isAuthoritative);

    const wantsSpray = inp.secondary && h.sprayFuel > 0 && h.swingPhase === 'idle' && !h.refilling;
    this.updateHumanSpray(h, wantsSpray, dt, isAuthoritative);

    h.cameraShake = Math.max(0, h.cameraShake - dt * 2.8);
  }

  updateSprayRefill(h, dt) {
    const spot = this.stage.refillSpot;
    h.refillCooldown = Math.max(0, h.refillCooldown - dt);

    const dist = Math.hypot(h.x - spot.x, h.z - spot.z);
    h.refillInRange = dist <= spot.interactDist;

    const canRefill = h.refillInRange && h.refillCooldown <= 0 && h.sprayFuel < 99.5;
    if (canRefill && this.input.interact) {
      h.refilling = true;
      h.refillProgress += dt / spot.holdDuration;
      if (h.refillProgress >= 1.0) {
        h.refillProgress = 0;
        h.refilling = false;
        h.refillCooldown = spot.cooldownDuration;
        h.sprayFuel = 100;
        this.emit('sound_refill');
        this.emit('toast', { text: 'ゴキジェットを補充しました！（次回補充まで15秒）' });
      }
    } else {
      h.refilling = false;
      h.refillProgress = 0;
    }
  }

  hasSprayLineOfSight(ox, oy, oz, tx, ty, tz) {
    const dx = tx - ox, dy = ty - oy, dz = tz - oz;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 0.05) return true;
    const ndx = dx / dist, ndy = dy / dist, ndz = dz / dist;

    for (const col of this.stage.colliders) {
      const t = rayIntersectAABB(ox, oy, oz, ndx, ndy, ndz, col.minX, col.bottomY, col.minZ, col.maxX, col.topY, col.maxZ);
      if (t !== null && t < dist - 0.10) return false;
    }
    return true;
  }

  canNewspaperReachTarget(h, r) {
    const ox = h.x, oy = h.y + h.eyeHeight, oz = h.z;
    const dx = r.x - ox, dy = (r.y + 0.03) - oy, dz = r.z - oz;
    const dist = Math.hypot(dx, dy, dz);
    if (dist > BALANCE.newspaper.reach - 0.08 || dist < 0.05) return false;
    const ndx = dx / dist, ndy = dy / dist, ndz = dz / dist;

    for (const col of this.stage.colliders) {
      const t = rayIntersectAABB(ox, oy, oz, ndx, ndy, ndz, col.minX, col.bottomY, col.minZ, col.maxX, col.topY, col.maxZ);
      if (t !== null && t < dist - 0.14) return false;
    }
    if (this.isUnderFurniture(r.x, r.z, r.y) && !h.crouching) return false;
    return true;
  }

  updateHumanAI(h, dt, locked) {
    const spot = this.stage.refillSpot;

    if (locked) {
      h.vx = 0; h.vz = 0; h.spraying = false;
      const aliveRoach = this.roaches.find(r => r.alive);
      if (aliveRoach) {
        const desiredYaw = Math.atan2(-(aliveRoach.x - h.x), -(aliveRoach.z - h.z));
        h.yaw += angleDiff(h.yaw, desiredYaw) * clamp(dt * 4.5, 0, 1);
      }
      return;
    }

    h.aiAttackCooldown = Math.max(0, h.aiAttackCooldown - dt);
    h.aiStateTimer -= dt;
    h.aiPathTimer -= dt;
    h.aiFlankTimer = Math.max(0, h.aiFlankTimer - dt);
    h.refillCooldown = Math.max(0, h.refillCooldown - dt);

    const needsRefill = h.sprayFuel <= 5 && h.refillCooldown <= 0;
    if (needsRefill) {
      const dRefill = Math.hypot(spot.x - h.x, spot.z - h.z);
      if (dRefill < 1.55) {
        h.vx = lerp(h.vx, 0, clamp(dt * 12, 0, 1));
        h.vz = lerp(h.vz, 0, clamp(dt * 12, 0, 1));
        h.refillProgress += dt / spot.holdDuration;
        if (h.refillProgress >= 1.0) {
          h.refillProgress = 0;
          h.refillCooldown = spot.cooldownDuration;
          h.sprayFuel = 100;
        }
        this.updateHumanSwing(h, dt, true);
        this.updateHumanSpray(h, false, dt, true);
        return;
      }
    } else {
      h.refillProgress = 0;
    }

    let bestTarget = null, bestScore = Infinity;
    for (const r of this.roaches) {
      if (!r.alive) continue;
      const dist = Math.hypot(r.x - h.x, r.z - h.z);
      const underFurniture = this.isUnderFurniture(r.x, r.z, r.y);
      let score = dist;
      if (underFurniture && r.hunger > 30) score += 2.0;
      if (r.hunger <= 30) score -= 2.5;
      if (r.flying) score -= 3.0;
      if (r.poisonTimer > 0) score -= 1.4;
      if (score < bestScore) { bestScore = score; bestTarget = r; }
    }

    let goalX = h.aiPatrolPoint.x, goalZ = h.aiPatrolPoint.z, chasing = false;
    if (needsRefill) {
      goalX = spot.x; goalZ = spot.z; h.aiFlankGoal = null;
    } else if (bestTarget && bestScore < 6.5) {
      chasing = true;
      if (h.aiFlankTimer > 0 && h.aiFlankGoal) {
        goalX = h.aiFlankGoal.x; goalZ = h.aiFlankGoal.z;
      } else {
        goalX = bestTarget.x; goalZ = bestTarget.z;
      }
    } else if (h.aiStateTimer <= 0 || Math.hypot(goalX - h.x, goalZ - h.z) < 0.55) {
      h.aiPatrolPoint = this.navGrid.getRandomWalkablePoint();
      h.aiStateTimer = 3.5 + Math.random() * 2.5;
      h.aiPathTimer = 0;
      goalX = h.aiPatrolPoint.x; goalZ = h.aiPatrolPoint.z;
    }

    if (h.aiPathTimer <= 0 || h.aiPath.length === 0) {
      h.aiPath = this.navGrid.findPath(h.x, h.z, goalX, goalZ);
      h.aiPathTimer = 0.32;
    }

    while (h.aiPath.length > 1 && Math.hypot(h.aiPath[0].x - h.x, h.aiPath[0].z - h.z) < 0.34) {
      h.aiPath.shift();
    }

    const wp = h.aiPath.length > 0 ? h.aiPath[0] : { x: goalX, z: goalZ };
    const directDist = bestTarget ? Math.hypot(bestTarget.x - h.x, bestTarget.z - h.z) : Math.hypot(goalX - h.x, goalZ - h.z);
    const wpDx = wp.x - h.x, wpDz = wp.z - h.z, wpDist = Math.hypot(wpDx, wpDz);

    const lookDx = (chasing && bestTarget ? bestTarget.x : wp.x) - h.x;
    const lookDz = (chasing && bestTarget ? bestTarget.z : wp.z) - h.z;
    h.yaw += angleDiff(h.yaw, Math.atan2(-lookDx, -lookDz)) * clamp(dt * 7.2, 0, 1);

    const targetY = bestTarget ? bestTarget.y + 0.04 : 0.2;
    const desiredPitch = chasing
      ? clamp(Math.atan2(targetY - h.eyeHeight, Math.max(0.42, directDist)), -1.2, 0.95)
      : -0.18;
    h.pitch = lerp(h.pitch, desiredPitch, clamp(dt * 7.5, 0, 1));

    const targetUnder = !!(bestTarget && this.isUnderFurniture(bestTarget.x, bestTarget.z, bestTarget.y) && directDist < 2.8);
    const targetHigh = !!(bestTarget && bestTarget.y >= 0.45 && directDist < BALANCE.spray.range + 0.3);
    const canHitWithPaper = !!(chasing && bestTarget && this.canNewspaperReachTarget(h, bestTarget));

    if (chasing && bestTarget && directDist < 2.1 && !canHitWithPaper && h.aiFlankTimer <= 0) {
      h.aiFlankGoal = this.navGrid.findFlankPoint(bestTarget.x, bestTarget.z, h.x, h.z);
      h.aiFlankTimer = 1.6;
      h.aiPathTimer = 0;
    }

    const speed = chasing ? 2.95 : 1.95;
    const wantsMove = (!canHitWithPaper && wpDist > 0.24) || (chasing && directDist > 1.25);

    if (h.aiAvoidTimer > 0) {
      h.aiAvoidTimer -= dt;
      h.vx = lerp(h.vx, h.aiAvoidDir.x * speed, clamp(dt * 12, 0, 1));
      h.vz = lerp(h.vz, h.aiAvoidDir.z * speed, clamp(dt * 12, 0, 1));
      h.walkCycle += dt * 8.5;
    } else if (wantsMove && wpDist > 0.05) {
      h.vx = lerp(h.vx, (wpDx / wpDist) * speed, clamp(dt * 10, 0, 1));
      h.vz = lerp(h.vz, (wpDz / wpDist) * speed, clamp(dt * 10, 0, 1));
      h.walkCycle += dt * (chasing ? 10.0 : 6.8);

      if (Math.hypot(h.x - h.aiLastPos.x, h.z - h.aiLastPos.z) < 0.04) {
        h.aiStuckTimer += dt;
        if (h.aiStuckTimer >= 0.35) {
          h.aiStuckTimer = 0;
          const sideSign = Math.random() < 0.5 ? 1 : -1;
          h.aiAvoidDir = { x: (-wpDz / wpDist) * sideSign, z: (wpDx / wpDist) * sideSign };
          h.aiAvoidTimer = 0.32;
          h.aiPathTimer = 0;
        }
      } else {
        h.aiStuckTimer = 0;
        h.aiLastPos.x = h.x; h.aiLastPos.z = h.z;
      }
    } else {
      h.vx = lerp(h.vx, 0, clamp(dt * 12, 0, 1));
      h.vz = lerp(h.vz, 0, clamp(dt * 12, 0, 1));
      h.aiStuckTimer = 0;
    }

    h.crouching = targetUnder && !targetHigh;
    h.eyeHeight = lerp(h.eyeHeight, h.crouching ? 0.60 : 1.56, clamp(dt * 9, 0, 1));
    h.vy -= 13.5 * dt;
    this.moveHumanWithCollision(h, dt);

    let wantsSpray = false;
    if (chasing && bestTarget && h.aiAttackCooldown <= 0) {
      const nozzleY = h.crouching ? BALANCE.spray.crouchNozzleY : (h.y + h.eyeHeight - 0.14);
      const sprayHasLOS = this.hasSprayLineOfSight(h.x, nozzleY, h.z, bestTarget.x, bestTarget.y + 0.04, bestTarget.z);
      const canSprayReach = directDist < BALANCE.spray.range - 0.1 && h.sprayFuel > 10 && sprayHasLOS;
      if (canHitWithPaper && h.swingPhase === 'idle' && (bestTarget.poisonTimer > 0 || directDist < 1.35)) {
        h.swingPhase = 'windup';
        h.swingTimer = 0;
        h.swingHitDone = false;
        h.swingRecoverDuration = BALANCE.newspaper.recoverMissTime;
        h.aiAttackCooldown = 0.95;
        this.emit('sound_swish', {}, true);
      } else if (canSprayReach && (targetUnder || targetHigh || !canHitWithPaper || bestTarget.poisonTimer <= 0)) {
        wantsSpray = true;
      } else if (canHitWithPaper && h.swingPhase === 'idle') {
        h.swingPhase = 'windup';
        h.swingTimer = 0;
        h.swingHitDone = false;
        h.swingRecoverDuration = BALANCE.newspaper.recoverMissTime;
        h.aiAttackCooldown = 1.0;
        this.emit('sound_swish', {}, true);
      }
    }

    this.updateHumanSwing(h, dt, true);
    this.updateHumanSpray(h, wantsSpray, dt, true);
  }

  moveHumanWithCollision(h, dt) {
    const room = this.stage.room;
    const radius = 0.30;
    let nx = clamp(h.x + h.vx * dt, -room.halfW + radius, room.halfW - radius);
    let nz = clamp(h.z + h.vz * dt, -room.halfD + radius, room.halfD - radius);

    for (const col of this.stage.colliders) {
      if (col.bottomY > 1.75) continue;
      const minX = col.minX - radius, maxX = col.maxX + radius;
      const minZ = col.minZ - radius, maxZ = col.maxZ + radius;
      if (nx > minX && nx < maxX && nz > minZ && nz < maxZ) {
        const penL = Math.abs(nx - minX), penR = Math.abs(maxX - nx);
        const penT = Math.abs(nz - minZ), penB = Math.abs(maxZ - nz);
        const m = Math.min(penL, penR, penT, penB);
        if (m === penL) nx = minX;
        else if (m === penR) nx = maxX;
        else if (m === penT) nz = minZ;
        else nz = maxZ;
      }
    }

    h.x = nx; h.z = nz; h.y += h.vy * dt;
    if (h.y <= 0) { h.y = 0; h.vy = 0; h.grounded = true; }
  }

  updateHumanSwing(h, dt, isAuthoritative) {
    if (h.swingPhase === 'idle') return;
    h.swingTimer += dt;

    if (h.swingPhase === 'windup' && h.swingTimer >= BALANCE.newspaper.windupTime) {
      h.swingPhase = 'strike';
      h.swingTimer = 0;
    } else if (h.swingPhase === 'strike') {
      if (!h.swingHitDone && h.swingTimer >= 0.04) {
        h.swingHitDone = true;
        if (isAuthoritative) {
          this.resolveNewspaperImpact(h);
        } else {
          h.cameraShake = 0.18;
        }
      }
      if (h.swingTimer >= BALANCE.newspaper.strikeTime) {
        h.swingPhase = 'recover';
        h.swingTimer = 0;
      }
    } else if (h.swingPhase === 'recover' && h.swingTimer >= h.swingRecoverDuration) {
      h.swingPhase = 'idle';
      h.swingTimer = 0;
    }
  }

  resolveNewspaperImpact(h) {
    const room = this.stage.room;
    const cosP = Math.cos(h.pitch);
    const dirX = -Math.sin(h.yaw) * cosP, dirY = Math.sin(h.pitch), dirZ = -Math.cos(h.yaw) * cosP;
    const ox = h.x, oy = h.y + h.eyeHeight, oz = h.z;
    const maxReach = BALANCE.newspaper.reach;

    let bestT = Infinity;
    if (dirY < -0.001) { const t = -oy / dirY; if (t > 0.05 && t < bestT) bestT = t; }
    else if (dirY > 0.001) { const t = (room.height - oy) / dirY; if (t > 0.05 && t < bestT) bestT = t; }
    if (Math.abs(dirX) > 0.001) {
      const tx1 = (-room.halfW - ox) / dirX, tx2 = (room.halfW - ox) / dirX;
      if (tx1 > 0.05 && tx1 < bestT) bestT = tx1;
      if (tx2 > 0.05 && tx2 < bestT) bestT = tx2;
    }
    if (Math.abs(dirZ) > 0.001) {
      const tz1 = (-room.halfD - oz) / dirZ, tz2 = (room.halfD - oz) / dirZ;
      if (tz1 > 0.05 && tz1 < bestT) bestT = tz1;
      if (tz2 > 0.05 && tz2 < bestT) bestT = tz2;
    }

    for (const col of this.stage.colliders) {
      const t = rayIntersectAABB(ox, oy, oz, dirX, dirY, dirZ, col.minX, col.bottomY, col.minZ, col.maxX, col.topY, col.maxZ);
      if (t !== null && t < bestT) bestT = t;
    }

    for (const r of this.roaches) {
      if (!r.alive) continue;
      const rx = r.x - ox, ry = (r.y + 0.03) - oy, rz = r.z - oz;
      const proj = rx * dirX + ry * dirY + rz * dirZ;
      if (proj > 0.05 && proj < maxReach) {
        const distSq = (rx * rx + ry * ry + rz * rz) - proj * proj;
        if (distSq < 0.24 * 0.24 && proj < bestT) bestT = proj;
      }
    }

    if (bestT > maxReach) {
      h.swingRecoverDuration = BALANCE.newspaper.recoverMissTime;
      if (h.isLocal) this.emit('sound_miss');
      return;
    }

    const hitX = clamp(ox + dirX * bestT, -room.halfW + 0.04, room.halfW - 0.04);
    const hitY = clamp(oy + dirY * bestT, 0.015, room.height - 0.05);
    const hitZ = clamp(oz + dirZ * bestT, -room.halfD + 0.04, room.halfD - 0.04);

    if (h.isLocal) h.cameraShake = 0.26;
    this.emit('impact', { x: +hitX.toFixed(2), y: +hitY.toFixed(2), z: +hitZ.toFixed(2) }, true);

    let soundVol = 0.95;
    if (this.playerSide === 'roach') {
      const pr = this.getCameraRoach();
      if (pr) {
        const d = Math.hypot(pr.x - hitX, pr.y - hitY, pr.z - hitZ);
        soundVol = clamp(1.15 - d * 0.2, 0.2, 1.05);
        if (d < 1.35) {
          const prox = 1.0 - d / 1.35;
          this.roachCameraShake = Math.max(this.roachCameraShake, prox * prox * 0.16);
        }
      }
    }
    this.emit('sound_slap', { intensity: soundVol });

    for (const p of this.props) {
      const d = Math.hypot(p.x - hitX, p.y - hitY, p.z - hitZ);
      if (d < 1.05) {
        const power = (1.05 - d) * 4.8 + 1.6;
        const nx = (p.x - hitX) / (d + 0.15) + dirX * 0.5;
        const nz = (p.z - hitZ) / (d + 0.15) + dirZ * 0.5;
        p.vx += nx * power; p.vy += 2.4 + Math.random() * 2.0; p.vz += nz * power;
        p.vrx += (Math.random() - 0.5) * 14; p.vry += (Math.random() - 0.5) * 14; p.vrz += (Math.random() - 0.5) * 14;
        p.dirtyNet = true;
        if (!p.knocked) { p.knocked = true; this.stats.propsKnocked++; }
      }
    }

    let anyHit = false, anyKill = false;
    const np = BALANCE.newspaper;
    for (const r of this.roaches) {
      if (!r.alive) continue;
      const horizD = Math.hypot(r.x - hitX, r.z - hitZ);
      const vertD = Math.abs(r.y - hitY);
      const under = this.isUnderFurniture(r.x, r.z, r.y);
      if (under && !h.crouching && hitY < 0.35) continue;

      if (horizD < np.grazeRadius && vertD < np.vertTolerance) {
        const dmg = horizD < np.directRadius ? np.directDamage : np.grazeDamage;
        r.hp = Math.max(0, r.hp - dmg);
        r.damageFlash = 0.35;
        anyHit = true;

        const kAngle = Math.atan2(r.z - h.z, r.x - h.x);
        r.vx += Math.cos(kAngle) * 3.2; r.vz += Math.sin(kAngle) * 3.2; r.vy = Math.max(r.vy, 1.6);

        if (r.hp <= 0) {
          r.alive = false;
          r.flying = false;
          this.stats.kills++;
          anyKill = true;
          this.emit('roach_killed', { id: r.id, x: +r.x.toFixed(2), y: +r.y.toFixed(2), z: +r.z.toFixed(2), isPlayer: r.isPlayer }, true);
        }
      }
    }

    if (anyHit) {
      h.swingRecoverDuration = np.recoverHitTime;
      if (h.isLocal) this.hitstopTimer = anyKill ? 0.065 : 0.04;
      this.urgentSyncNeeded = true;
      this.emit('sound_hit', { killed: anyKill }, true);
      this.emit('crosshair_hit', { killed: anyKill, uid: h.uid }, true);
    } else {
      h.swingRecoverDuration = np.recoverMissTime;
    }
  }

  updateHumanSpray(h, wantsSpray, dt, isAuthoritative) {
    if (wantsSpray && h.sprayFuel > 0) {
      h.spraying = true;
      h.sprayFuel = Math.max(0, h.sprayFuel - BALANCE.spray.fuelDrainPerSec * dt);
      if (isAuthoritative) {
        this.applySprayEffectsAndDamage(h, dt, true);
      } else {
        // ゲスト人間側のクライアント予測霧パーティクル
        h.sprayParticleTimer -= dt;
        if (h.sprayParticleTimer <= 0) {
          h.sprayParticleTimer = 0.04;
          const sp = BALANCE.spray;
          const cosP = Math.cos(h.pitch);
          const dirX = -Math.sin(h.yaw) * cosP;
          const dirY = h.crouching ? clamp(Math.sin(h.pitch), -0.35, 0.35) : Math.sin(h.pitch);
          const dirZ = -Math.cos(h.yaw) * cosP;
          const dLen = Math.hypot(dirX, dirY, dirZ) || 1;
          const ndx = dirX / dLen, ndy = dirY / dLen, ndz = dirZ / dLen;
          const nozzleY = h.crouching ? sp.crouchNozzleY : (h.y + h.eyeHeight - 0.14);
          this.emit('spray_puff', {
            x: h.x + ndx * 0.38, y: nozzleY + ndy * 0.25, z: h.z + ndz * 0.38,
            dx: ndx, dy: ndy, dz: ndz
          });
        }
      }
    } else {
      h.spraying = false;
    }
  }

  applySprayEffectsAndDamage(h, dt, replicatePuff) {
    const sp = BALANCE.spray;
    const cosP = Math.cos(h.pitch);
    const dirX = -Math.sin(h.yaw) * cosP;
    const dirY = h.crouching ? clamp(Math.sin(h.pitch), -0.35, 0.35) : Math.sin(h.pitch);
    const dirZ = -Math.cos(h.yaw) * cosP;
    const dLen = Math.hypot(dirX, dirY, dirZ) || 1;
    const ndx = dirX / dLen, ndy = dirY / dLen, ndz = dirZ / dLen;

    const nozzleY = h.crouching ? sp.crouchNozzleY : (h.y + h.eyeHeight - 0.14);
    const ox = h.x, oz = h.z;

    h.sprayParticleTimer -= dt;
    if (h.sprayParticleTimer <= 0) {
      h.sprayParticleTimer = 0.036;
      this.emit('spray_puff', {
        x: +(ox + ndx * 0.38).toFixed(2),
        y: +(nozzleY + ndy * 0.25).toFixed(2),
        z: +(oz + ndz * 0.38).toFixed(2),
        dx: +ndx.toFixed(2), dy: +ndy.toFixed(2), dz: +ndz.toFixed(2)
      }, replicatePuff);
    }

    for (const r of this.roaches) {
      if (!r.alive) continue;
      const rx = r.x - ox, ry = (r.y + 0.04) - nozzleY, rz = r.z - oz;
      const dist = Math.hypot(rx, ry, rz);
      if (dist > 0.12 && dist < sp.range) {
        const dot = (rx * ndx + ry * ndy + rz * ndz) / dist;
        if (dot > sp.coneDot) {
          if (!this.hasSprayLineOfSight(ox, nozzleY, oz, r.x, r.y + 0.04, r.z)) continue;
          const under = !!this.isUnderFurniture(r.x, r.z, r.y);
          const dps = under ? sp.underFurnitureDamagePerSec : sp.damagePerSec;
          r.hp = Math.max(0, r.hp - dps * dt);
          r.damageFlash = Math.max(r.damageFlash, 0.15);

          r.poisonBuild = Math.min(100, r.poisonBuild + sp.poisonBuildPerSec * dt);
          r.poisonDecayTimer = sp.poisonDecayDelay;
          if (r.poisonBuild >= 100) {
            r.poisonTimer = sp.poisonDuration;
          }

          if (r.hp <= 0) {
            r.alive = false;
            r.flying = false;
            this.stats.kills++;
            this.urgentSyncNeeded = true;
            this.emit('roach_killed', { id: r.id, x: +r.x.toFixed(2), y: +r.y.toFixed(2), z: +r.z.toFixed(2), isPlayer: r.isPlayer }, true);
            this.emit('sound_hit', { killed: true }, true);
          }
        }
      }
    }
  }

  updateRoachPlayer(r, dt) {
    const inp = this.input;
    const rb = BALANCE.roach;
    const sp = BALANCE.spray;
    const room = this.stage.room;

    r.camYaw -= inp.lookDeltaX * 0.0024;
    r.camPitch = clamp(r.camPitch + inp.lookDeltaY * 0.0020, -0.35, 0.88);

    const sinC = Math.sin(r.camYaw), cosC = Math.cos(r.camYaw);
    const fwdX = -sinC, fwdZ = -cosC, rightX = cosC, rightZ = -sinC;

    let mx = fwdX * inp.forward + rightX * inp.right;
    let mz = fwdZ * inp.forward + rightZ * inp.right;
    const mLen = Math.hypot(mx, mz);
    if (mLen > 0.001) { mx /= mLen; mz /= mLen; }

    const isHungry = r.hunger <= 0;
    const isPoisoned = r.poisonTimer > 0;
    const canDash = !isHungry && (sp.allowDashWhenPoisoned || !isPoisoned);
    const canClimb = sp.allowClimbWhenPoisoned || !isPoisoned;
    const canFly = !isHungry && (sp.allowFlyWhenPoisoned || !isPoisoned);

    const stopFlying = () => {
      if (!r.flying) return;
      r.flying = false;
      r.flyRecoverDelay = rb.flyRecoverDelay;
    };

    if (!r.flying) {
      if (r.flyRecoverDelay > 0) r.flyRecoverDelay = Math.max(0, r.flyRecoverDelay - dt);
      else r.flyFuel = Math.min(rb.flyFuelMax, r.flyFuel + rb.flyRecoverPerSec * dt);
    }

    if (r.flying) {
      r.flyFuel = Math.max(0, r.flyFuel - rb.flyDrainPerSec * dt);
      if (!inp.jumpHold || r.flyFuel <= 0 || !canFly) {
        stopFlying();
      } else {
        const flyDirX = mLen > 0.1 ? mx : fwdX;
        const flyDirZ = mLen > 0.1 ? mz : fwdZ;
        const flySpd = isPoisoned ? rb.flySpeed * sp.poisonFlySpeedMult : rb.flySpeed;
        r.vx = lerp(r.vx, flyDirX * flySpd, clamp(dt * 12, 0, 1));
        r.vz = lerp(r.vz, flyDirZ * flySpd, clamp(dt * 12, 0, 1));
        const lift = clamp(rb.flyLiftSpeed - r.camPitch * 1.4, 0.35, 2.4);
        r.vy = lerp(r.vy, lift, clamp(dt * 10, 0, 1));
        r.yaw += angleDiff(r.yaw, Math.atan2(-flyDirX, -flyDirZ)) * clamp(dt * 16, 0, 1);
        r.wingFlutter = 0.25;
        r.sprinting = false;
        this.moveRoachWithClimbCheck(r, dt, false);
        if (r.y >= room.height - 0.16) {
          r.y = room.height - 0.16;
          r.vy = Math.min(r.vy, 0);
        }
        return;
      }
    }

    if (r.surface === 'wall' && r.climbingWall) {
      const w = r.climbingWall;
      let sideX = w.nz, sideZ = -w.nx;
      if (sideX * rightX + sideZ * rightZ < 0) { sideX = -sideX; sideZ = -sideZ; }

      r.sprinting = inp.sprint && canDash && r.stamina > 2;
      let baseSpeed = r.sprinting ? rb.sprintSpeed : rb.baseSpeed;
      if (isHungry) baseSpeed *= rb.hungrySpeedMult;
      if (isPoisoned) baseSpeed *= sp.poisonSpeedMult;

      const upSpeed = inp.forward * baseSpeed * 0.82;
      const sideSpeed = inp.right * baseSpeed * 0.72;
      const isMovingOnWall = Math.abs(upSpeed) > 0.05 || Math.abs(sideSpeed) > 0.05;

      const drain = isMovingOnWall ? rb.climbMoveDrainPerSec : rb.climbHoldDrainPerSec;
      r.stamina = Math.max(0, r.stamina - drain * dt);

      if (r.stamina <= 0 || !canClimb) {
        r.surface = 'floor'; r.normal = { x: 0, y: 1, z: 0 };
        r.x += w.nx * 0.06; r.z += w.nz * 0.06;
        r.vx = w.nx * 0.9; r.vz = w.nz * 0.9; r.vy = 0;
        r.climbingWall = null; r.grounded = false; r.airTime = 0.1;
        if (r.stamina <= 0) this.emit('toast', { text: 'スタミナが切れて落下した！' });
        return;
      }

      r.y += upSpeed * dt; r.x += sideX * sideSpeed * dt; r.z += sideZ * sideSpeed * dt;
      if (w.bounds) {
        r.x = clamp(r.x, w.bounds.minX, w.bounds.maxX);
        r.z = clamp(r.z, w.bounds.minZ, w.bounds.maxZ);
      }
      if (isMovingOnWall) r.legPhase += dt * (r.sprinting ? 44 : 30);

      if (r.y >= w.topY) {
        r.y = w.topY; r.x -= w.nx * 0.10; r.z -= w.nz * 0.10;
        r.surface = 'furniture_top'; r.normal = { x: 0, y: 1, z: 0 };
        r.climbingWall = null; r.grounded = true; r.airTime = 0;
        return;
      }
      if (r.y <= 0.01 && inp.forward < 0) {
        r.y = 0; r.surface = 'floor'; r.normal = { x: 0, y: 1, z: 0 };
        r.climbingWall = null; r.grounded = true; r.airTime = 0;
        return;
      }
      if (inp.jump) {
        r.surface = 'floor'; r.normal = { x: 0, y: 1, z: 0 };
        r.vx = w.nx * 2.2; r.vz = w.nz * 2.2; r.vy = 2.6;
        r.climbingWall = null; r.grounded = false; r.airTime = 0.05; r.wingFlutter = 0.45;
      }
      return;
    }

    r.sprinting = inp.sprint && mLen > 0.1 && canDash && r.stamina > 1.5;
    if (r.sprinting) {
      r.stamina = Math.max(0, r.stamina - rb.sprintDrainPerSec * dt);
    } else if (r.grounded) {
      r.stamina = Math.min(rb.staminaMax, r.stamina + rb.staminaRecoverPerSec * dt);
    }

    let baseSpeed = r.sprinting ? rb.sprintSpeed : rb.baseSpeed;
    if (isHungry) baseSpeed *= rb.hungrySpeedMult;
    if (isPoisoned) baseSpeed *= sp.poisonSpeedMult;

    r.vx = lerp(r.vx, mx * baseSpeed, clamp(dt * 15, 0, 1));
    r.vz = lerp(r.vz, mz * baseSpeed, clamp(dt * 15, 0, 1));
    if (mLen > 0.08) r.yaw += angleDiff(r.yaw, Math.atan2(-mx, -mz)) * clamp(dt * 16, 0, 1);

    if (r.grounded) {
      r.airTime = 0;
      if (inp.jump) { r.vy = 3.15; r.grounded = false; r.airTime = 0.01; r.wingFlutter = 0.45; }
    } else {
      r.airTime += dt;
      if (inp.jumpHold && r.airTime >= 0.14 && r.flyFuel >= rb.flyMinFuelToStart && canFly) {
        r.flying = true;
        r.flyFuel = Math.max(0, r.flyFuel - rb.flyStartCost);
        r.wingFlutter = 0.5;
      }
    }

    r.vy -= 11.5 * dt;
    const canStartClimb = inp.forward > 0.25 && canClimb && r.stamina > 10;
    this.moveRoachWithClimbCheck(r, dt, canStartClimb);
  }

  getNearestHuman(x, z) {
    let best = this.humans[0], bestD = Infinity;
    for (const h of this.humans) {
      const d = Math.hypot(x - h.x, z - h.z);
      if (d < bestD) { bestD = d; best = h; }
    }
    return { human: best, dist: bestD };
  }

  updateRoachAI(r, dt) {
    r.aiTimer -= dt;
    const rb = BALANCE.roach;
    const room = this.stage.room;
    const { human: h, dist: distToHuman } = this.getNearestHuman(r.x, r.z);

    if (r.surface === 'wall') {
      r.surface = 'floor'; r.normal = { x: 0, y: 1, z: 0 }; r.climbingWall = null;
    }

    const isHungry = r.hunger <= 0, isPoisoned = r.poisonTimer > 0;
    let goalX = r.x, goalZ = r.z, sprint = false;

    if (h && (distToHuman < 3.6 || isPoisoned)) {
      sprint = !isHungry && !isPoisoned;
      let bestHide = null, bestScore = Infinity;
      for (const f of this.stage.furnitureDefs) {
        if (!f.canHideUnder) continue;
        const score = Math.hypot(f.x - r.x, f.z - r.z) - Math.hypot(f.x - h.x, f.z - h.z) * 0.75;
        if (score < bestScore) { bestScore = score; bestHide = f; }
      }
      if (bestHide && Math.hypot(bestHide.x - h.x, bestHide.z - h.z) > 1.35) {
        goalX = bestHide.x; goalZ = bestHide.z;
      } else {
        const awayAngle = Math.atan2(r.z - h.z, r.x - h.x) + Math.sin(this.elapsed * 2.5 + r.id) * 0.45;
        goalX = r.x + Math.cos(awayAngle) * 2.6;
        goalZ = r.z + Math.sin(awayAngle) * 2.6;
      }
    } else if (r.hunger < 45) {
      let bestC = null, bestD = Infinity;
      for (const c of this.crumbs) {
        if (!c.active || c.elevated) continue;
        const d = Math.hypot(c.x - r.x, c.z - r.z);
        if (d < bestD) { bestD = d; bestC = c; }
      }
      if (bestC) {
        goalX = bestC.x; goalZ = bestC.z;
        if (r.hunger < 25) sprint = !isHungry && !isPoisoned;
      }
    } else {
      if (!r.aiGoal || r.aiTimer <= 0 || Math.hypot(r.aiGoal.x - r.x, r.aiGoal.z - r.z) < 0.35) {
        if (Math.random() < 0.65) {
          const hideSpots = this.stage.furnitureDefs.filter(f => f.canHideUnder);
          const pick = hideSpots[Math.floor(Math.random() * hideSpots.length)];
          r.aiGoal = { x: pick.x + (Math.random() - 0.5) * pick.w * 0.7, z: pick.z + (Math.random() - 0.5) * pick.d * 0.7 };
        } else {
          r.aiGoal = { x: (Math.random() * 2 - 1) * (room.halfW - 0.5), z: (Math.random() * 2 - 1) * (room.halfD - 0.5) };
        }
        r.aiTimer = 2.2 + Math.random() * 3.0;
      }
      goalX = r.aiGoal.x; goalZ = r.aiGoal.z;
    }

    const dx = goalX - r.x, dz = goalZ - r.z, d = Math.hypot(dx, dz);
    r.sprinting = sprint;
    let speed = sprint ? rb.aiSprintSpeed : rb.aiBaseSpeed;
    if (isHungry) speed *= rb.hungrySpeedMult;
    if (isPoisoned) speed *= BALANCE.spray.poisonSpeedMult;

    if (d > 0.12) {
      const mx = dx / d, mz = dz / d;
      r.vx = lerp(r.vx, mx * speed, clamp(dt * 10, 0, 1));
      r.vz = lerp(r.vz, mz * speed, clamp(dt * 10, 0, 1));
      r.yaw += angleDiff(r.yaw, Math.atan2(-mx, -mz)) * clamp(dt * 12, 0, 1);
    } else {
      r.vx = lerp(r.vx, 0, clamp(dt * 10, 0, 1));
      r.vz = lerp(r.vz, 0, clamp(dt * 10, 0, 1));
    }

    r.vy -= 11.5 * dt;
    this.moveRoachWithClimbCheck(r, dt, false);
  }

  moveRoachWithClimbCheck(r, dt, allowClimb) {
    const room = this.stage.room;
    const margin = 0.045;
    let nx = clamp(r.x + r.vx * dt, -room.halfW + margin, room.halfW - margin);
    let nz = clamp(r.z + r.vz * dt, -room.halfD + margin, room.halfD - margin);
    let ny = r.y + r.vy * dt;
    let floorSupportY = 0;

    for (const col of this.stage.colliders) {
      const minX = col.minX - margin, maxX = col.maxX + margin;
      const minZ = col.minZ - margin, maxZ = col.maxZ + margin;

      if (nx > minX && nx < maxX && nz > minZ && nz < maxZ) {
        if (r.y >= col.topY - 0.06) { floorSupportY = Math.max(floorSupportY, col.topY); continue; }
        if (col.bottomY >= 0.10 && ny < col.bottomY - 0.03) continue;
        if (ny > col.topY) continue;

        const penL = Math.abs(nx - minX), penR = Math.abs(maxX - nx);
        const penT = Math.abs(nz - minZ), penB = Math.abs(maxZ - nz);
        const m = Math.min(penL, penR, penT, penB);

        let cNx = 0, cNz = 0;
        if (m === penL) { nx = minX; cNx = -1; }
        else if (m === penR) { nx = maxX; cNx = 1; }
        else if (m === penT) { nz = minZ; cNz = -1; }
        else { nz = maxZ; cNz = 1; }

        if (allowClimb && r.isPlayer && col.climbable) {
          r.surface = 'wall';
          r.normal = { x: cNx, y: 0, z: cNz };
          r.climbingWall = { nx: cNx, nz: cNz, topY: col.topY, bounds: { minX, maxX, minZ, maxZ } };
          r.x = nx; r.z = nz; r.vx = 0; r.vy = 0; r.vz = 0; r.grounded = true; r.airTime = 0;
          return;
        }
      }
    }

    r.x = nx; r.z = nz;
    if (ny <= floorSupportY) {
      r.y = floorSupportY; r.vy = 0; r.grounded = true; r.airTime = 0;
      r.surface = floorSupportY > 0.05 ? 'furniture_top' : 'floor';
    } else {
      r.y = ny; r.grounded = false;
    }
  }

  updateRoachCommon(r, dt, isCountdown) {
    const rb = BALANCE.roach;
    const sp = BALANCE.spray;
    r.breathPhase += dt * 3.1;
    r.damageFlash = Math.max(0, r.damageFlash - dt);
    r.poisonTimer = Math.max(0, r.poisonTimer - dt);
    r.wingFlutter = Math.max(0, r.wingFlutter - dt);

    if (r.poisonDecayTimer > 0) r.poisonDecayTimer = Math.max(0, r.poisonDecayTimer - dt);
    else if (r.poisonBuild > 0) r.poisonBuild = Math.max(0, r.poisonBuild - sp.poisonDecayPerSec * dt);

    if (r.sprinting || !r.grounded || r.flying) r.wingFlutter = Math.max(r.wingFlutter, 0.16);

    if (r.flying && this.playerSide === 'human') {
      r.flyAlertTimer -= dt;
      if (r.flyAlertTimer <= 0) {
        r.flyAlertTimer = 0.25;
        this.pushAlert(r.x, r.z, 'fly', 0.8);
      }
    }

    if (r.poisonTimer > 0) {
      r.poisonPuffTimer -= dt;
      if (r.poisonPuffTimer <= 0) {
        r.poisonPuffTimer = r.flying ? 0.065 : 0.16;
        this.emit('poison_puff', { x: +r.x.toFixed(2), y: +(r.y + 0.04).toFixed(2), z: +r.z.toFixed(2), dense: r.flying }, true);
      }
    }

    if (!isCountdown) {
      r.hunger = Math.max(0, r.hunger - (100 / rb.hungerEmptySec) * dt);
      if (r.hunger <= 0) {
        r.hp = Math.max(0, r.hp - rb.starveDamagePerSec * dt);
        if (r.hp <= 0) {
          r.alive = false;
          r.flying = false;
          this.stats.kills++;
          this.urgentSyncNeeded = true;
          this.emit('roach_starved', { id: r.id, isPlayer: r.isPlayer }, true);
          return;
        }
      }
    }

    for (const c of this.crumbs) {
      if (!c.active) continue;
      if (Math.hypot(r.x - c.x, r.z - c.z) < 0.28 && Math.abs(r.y - c.y) < 0.22) {
        c.active = false;
        c.respawnTimer = BALANCE.crumb.respawnMin + Math.random() * BALANCE.crumb.respawnRand;
        r.hunger = Math.min(100, r.hunger + (c.elevated ? BALANCE.crumb.elevatedHungerHeal : BALANCE.crumb.floorHungerHeal));
        r.hp = Math.min(r.maxHp, r.hp + (c.elevated ? BALANCE.crumb.elevatedHpHeal : BALANCE.crumb.floorHpHeal));
        if (r.isPlayer) {
          this.emit('sound_eat');
          this.emit('toast', { text: c.elevated ? '家具上の食べかすを食べて大幅回復！' : '食べかすを食べて空腹と体力が回復！' });
        } else if (this.networkMode === 'host') {
          this.emit('roach_eat', { id: r.id, elevated: c.elevated }, true);
        }
      }
    }

    const horizSpeed = Math.hypot(r.vx, r.vz);
    if (r.surface !== 'wall' && !r.flying && horizSpeed > 0.08 && !this.remoteInputs[r.uid]) {
      r.legPhase += dt * horizSpeed * 16.5;
    }

    const localH = this.getLocalHuman();
    if (!r.flying && (horizSpeed > 0.85 || r.surface === 'wall')) {
      r.skitterSoundTimer -= dt;
      if (r.skitterSoundTimer <= 0) {
        r.skitterSoundTimer = r.sprinting ? 0.14 : 0.24;
        if (this.playerSide === 'human' && localH) {
          const dHuman = Math.hypot(r.x - localH.x, r.z - localH.z);
          if (dHuman < 4.5) {
            this.emit('sound_skitter', { volume: clamp(1.0 - dHuman / 4.5, 0.08, 0.75) });
            if (r.sprinting && dHuman < 3.6) this.pushAlert(r.x, r.z, 'step', 0.45);
          }
        } else if (r.isPlayer) {
          this.emit('sound_skitter', { volume: 0.22 });
        }
      }
    }

    if (r.hunger <= 30) {
      r.hungrySoundTimer -= dt;
      if (r.hungrySoundTimer <= 0) {
        r.hungrySoundTimer = r.hunger <= 0 ? 2.1 : 3.2;
        if (this.playerSide === 'human' && localH) {
          const dHuman = Math.hypot(r.x - localH.x, r.z - localH.z);
          this.emit('sound_hungry', { volume: clamp(1.0 - dHuman / 9.5, 0.2, 0.85) });
          this.pushAlert(r.x, r.z, 'hungry', 2.0);
        } else if (r.isPlayer) {
          this.emit('sound_hungry', { volume: 0.65 });
          this.emit('toast', {
            text: r.hunger <= 0 ? '飢餓ダメージ中！今すぐ食べかすを食べないと餓死する！' : '空腹でお腹が鳴った！人間に居場所がバレています！'
          });
        }
      }
    }
  }

  pushAlert(x, z, type, ttl) {
    for (const a of this.alerts) {
      if (a.type === type && Math.hypot(a.x - x, a.z - z) < 0.8) {
        a.x = x; a.z = z; a.ttl = ttl; a.maxTtl = ttl;
        return;
      }
    }
    this.alerts.push({ x, z, type, ttl, maxTtl: ttl });
  }

  updateProps(dt) {
    const room = this.stage.room;
    for (const p of this.props) {
      const moving = Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(p.vz) > 0.02 || p.y > p.halfH + 0.01;
      if (!moving) continue;

      p.dirtyNet = true;
      p.vy -= 12.0 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      p.rx += p.vrx * dt; p.ry += p.vry * dt; p.rz += p.vrz * dt;

      if (p.x < -room.halfW + p.radius) { p.x = -room.halfW + p.radius; p.vx *= -0.5; }
      if (p.x > room.halfW - p.radius) { p.x = room.halfW - p.radius; p.vx *= -0.5; }
      if (p.z < -room.halfD + p.radius) { p.z = -room.halfD + p.radius; p.vz *= -0.5; }
      if (p.z > room.halfD - p.radius) { p.z = room.halfD - p.radius; p.vz *= -0.5; }

      let supportY = p.halfH;
      for (const col of this.stage.colliders) {
        if (p.x > col.minX && p.x < col.maxX && p.z > col.minZ && p.z < col.maxZ && p.y >= col.topY - 0.05) {
          supportY = Math.max(supportY, col.topY + p.halfH);
        }
      }

      if (p.y <= supportY) {
        p.y = supportY;
        p.vy = Math.abs(p.vy) > 0.8 ? p.vy * -0.35 : 0;
        p.vx *= Math.pow(0.08, dt); p.vz *= Math.pow(0.08, dt);
        p.vrx *= Math.pow(0.05, dt); p.vry *= Math.pow(0.05, dt); p.vrz *= Math.pow(0.05, dt);
      }
    }
  }

  isUnderFurniture(x, z, y) {
    if (y > 0.25) return null;
    for (const f of this.stage.furnitureDefs) {
      if (!f.canHideUnder) continue;
      if (Math.abs(x - f.x) < f.w * 0.52 && Math.abs(z - f.z) < f.d * 0.52) return f.id;
    }
    return null;
  }

  checkWinConditions() {
    const aliveCount = this.roaches.filter(r => r.alive).length;
    const localR = this.getLocalRoach();

    if (this.networkMode === 'offline' && this.playerSide === 'roach' && localR && !localR.alive) {
      this.mode = 'result';
      this.result = {
        winner: 'human',
        playerWon: false,
        reason: localR.hunger <= 0
          ? '空腹に耐えきれず力尽きてしまった…部屋に静寂が戻った。'
          : '人間に駆除されてしまった…部屋に静寂が戻った。'
      };
      return;
    }

    if (aliveCount === 0) {
      this.mode = 'result';
      this.urgentSyncNeeded = true;
      this.result = {
        winner: 'human',
        playerWon: this.playerSide === 'human',
        reason: 'すべてのゴキブリを駆除した！部屋の平和は守られた。'
      };
      return;
    }

    if (this.timeLeft <= 0) {
      this.mode = 'result';
      this.urgentSyncNeeded = true;
      this.result = {
        winner: 'roach',
        playerWon: this.playerSide === 'roach',
        reason: this.playerSide === 'roach'
          ? '120秒間見事に逃げ切った！今夜のこの部屋は君たちのものだ。'
          : '時間切れ…ゴキブリたちは家具の奥へと姿を消した。'
      };
    }
  }
}
