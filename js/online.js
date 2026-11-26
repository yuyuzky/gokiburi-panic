import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set, get, update, remove, onValue, onDisconnect, off } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { FIREBASE_CONFIG, MAX_PLAYERS } from './config.js';
import { DEFAULT_STAGE_ID } from './stages/index.js';

let firebaseDb = null;
let firebaseAuth = null;
try {
  const fbApp = initializeApp(FIREBASE_CONFIG);
  firebaseDb = getDatabase(fbApp);
  firebaseAuth = getAuth(fbApp);
} catch (e) {
  console.warn('Firebase 初期化に失敗（オフライン動作のみ有効）:', e);
}

// Firebase Realtime Database オンライン対戦マネージャー（最大8人・players/{uid}構造・stageId同期・インフライト制御・即時フラッシュ）
export class OnlineManager {
  constructor(callbacks) {
    this.db = firebaseDb;
    this.auth = firebaseAuth;
    this.cb = callbacks;
    this.authUid = null;
    this.tabId = Math.random().toString(36).slice(2, 8);
    this.uid = null; // タブごとに一意なプレイヤーID (${authUid}_${tabId})
    this.roomCode = null;
    this.role = null; // 'host' | 'guest'
    this.stageId = DEFAULT_STAGE_ID;
    this.listeners = [];
    this.syncAcc = 0;
    this.syncInterval = 1 / 15;
    this.syncInFlight = false;
  }

  isConnected() {
    return !!(this.roomCode && this.role && this.uid);
  }

  async ensureAuth() {
    if (!this.db || !this.auth) {
      throw new Error('Firebase が初期化されていません。');
    }
    if (this.auth.currentUser) {
      this.authUid = this.auth.currentUser.uid;
      this.uid = `${this.authUid}_${this.tabId}`;
      return this.uid;
    }
    try {
      const cred = await signInAnonymously(this.auth);
      this.authUid = cred.user.uid;
      this.uid = `${this.authUid}_${this.tabId}`;
      return this.uid;
    } catch (err) {
      throw new Error('匿名ログインに失敗しました。FirebaseのAuthenticationで「匿名」を有効にしてください。');
    }
  }

  trackListener(dbRef, handler) {
    onValue(dbRef, handler);
    this.listeners.push({ dbRef, handler });
  }

  async createRoom(stageId = DEFAULT_STAGE_ID) {
    const uid = await this.ensureAuth();
    await this.leaveRoom();

    let code = null;
    for (let i = 0; i < 8; i++) {
      const cand = String(Math.floor(1000 + Math.random() * 9000));
      const snap = await get(ref(this.db, `gokiburi_rooms/${cand}/meta`));
      if (!snap.exists()) {
        code = cand;
        break;
      }
    }
    if (!code) throw new Error('ルームコードの生成に失敗しました。もう一度お試しください。');

    this.roomCode = code;
    this.role = 'host';
    this.stageId = stageId;

    const roomRef = ref(this.db, `gokiburi_rooms/${code}`);
    await set(roomRef, {
      meta: {
        status: 'lobby',
        hostUid: this.authUid,
        hostPlayerId: uid,
        stageId,
        aiFill: true,
        createdAt: Date.now(),
        roster: null
      },
      players: {
        [uid]: { uid, name: 'ホスト', side: 'human', isHost: true, joinedAt: Date.now() }
      },
      inputs: {},
      state: null
    });

    onDisconnect(roomRef).remove();
    this.attachRoomListeners(code);
    return code;
  }

  async joinRoom(rawCode) {
    const uid = await this.ensureAuth();
    const code = String(rawCode || '').trim();
    if (!/^\d{4}$/.test(code)) throw new Error('4桁の数字コードを入力してください。');

    await this.leaveRoom();

    const roomSnap = await get(ref(this.db, `gokiburi_rooms/${code}`));
    if (!roomSnap.exists()) throw new Error('指定されたルームが見つかりません。');
    const roomData = roomSnap.val();
    if (!roomData.meta || roomData.meta.status !== 'lobby') {
      throw new Error('このルームはすでに対戦中または終了しています。');
    }

    const players = roomData.players || {};
    const count = Object.keys(players).length;
    if (!players[uid] && count >= MAX_PLAYERS) {
      throw new Error(`このルームは満員（最大${MAX_PLAYERS}人）です。`);
    }

    this.roomCode = code;
    this.role = 'guest';
    this.stageId = roomData.meta.stageId || DEFAULT_STAGE_ID;

    const myPlayerRef = ref(this.db, `gokiburi_rooms/${code}/players/${uid}`);
    const myInputRef = ref(this.db, `gokiburi_rooms/${code}/inputs/${uid}`);
    await set(myPlayerRef, {
      uid,
      name: `プレイヤー ${count + 1}`,
      side: 'roach',
      isHost: false,
      joinedAt: Date.now()
    });
    onDisconnect(myPlayerRef).remove();
    onDisconnect(myInputRef).remove();

    this.attachRoomListeners(code);
    return { code, stageId: this.stageId };
  }

  attachRoomListeners(code) {
    this.trackListener(ref(this.db, `gokiburi_rooms/${code}/meta`), (snap) => {
      if (!snap.exists()) {
        this.cb.onRoomClosed();
        return;
      }
      const meta = snap.val();
      if (meta.stageId) this.stageId = meta.stageId;
      this.cb.onMetaChanged(meta);
    });
    this.trackListener(ref(this.db, `gokiburi_rooms/${code}/players`), (snap) => {
      this.cb.onPlayersChanged(snap.val() || {});
    });
    if (this.role === 'host') {
      this.trackListener(ref(this.db, `gokiburi_rooms/${code}/inputs`), (snap) => {
        this.cb.onRemoteInputsChanged(snap.val() || {});
      });
    } else {
      this.trackListener(ref(this.db, `gokiburi_rooms/${code}/state`), (snap) => {
        if (snap.exists()) this.cb.onHostState(snap.val());
      });
    }
  }

  async setMySide(side) {
    if (!this.isConnected()) return;
    await update(ref(this.db, `gokiburi_rooms/${this.roomCode}/players/${this.uid}`), { side });
  }

  async setAiFill(enabled) {
    if (this.role !== 'host' || !this.roomCode) return;
    await update(ref(this.db, `gokiburi_rooms/${this.roomCode}/meta`), { aiFill: !!enabled });
  }

  async startOnlineMatch(roster, initialSnapshot) {
    if (this.role !== 'host' || !this.roomCode) return;
    await update(ref(this.db, `gokiburi_rooms/${this.roomCode}`), {
      'meta/roster': roster,
      'meta/status': 'playing',
      inputs: {},
      state: initialSnapshot
    });
  }

  async returnToLobbyAsHost() {
    if (this.role !== 'host' || !this.roomCode) return;
    await update(ref(this.db, `gokiburi_rooms/${this.roomCode}`), {
      'meta/status': 'lobby',
      'meta/roster': null,
      inputs: {},
      state: null
    });
  }

  // 命中・撃破・カウント終了・勝敗確定時はスロットルを待たず即時配信
  flushStateNow(state) {
    if (!this.isConnected() || this.role !== 'host') return;
    this.syncAcc = 0;
    set(ref(this.db, `gokiburi_rooms/${this.roomCode}/state`), state.exportHostSnapshot()).catch(() => {});
  }

  // 通常同期（インフライト制御でキュー詰まりによる遅延を防止）
  tickSync(dt, state) {
    if (!this.isConnected() || state.mode !== 'playing') return;
    this.syncAcc += dt;
    if (this.syncAcc < this.syncInterval || this.syncInFlight) return;
    this.syncAcc = 0;

    if (this.role === 'host') {
      this.syncInFlight = true;
      set(ref(this.db, `gokiburi_rooms/${this.roomCode}/state`), state.exportHostSnapshot())
        .catch(() => {})
        .finally(() => { this.syncInFlight = false; });
    } else if (this.role === 'guest') {
      if (state.playerSide === 'human') {
        const h = state.getLocalHuman();
        if (!h) return;
        this.syncInFlight = true;
        set(ref(this.db, `gokiburi_rooms/${this.roomCode}/inputs/${this.uid}`), {
          x: +h.x.toFixed(3), y: +h.y.toFixed(3), z: +h.z.toFixed(3),
          yaw: +h.yaw.toFixed(3), pitch: +h.pitch.toFixed(3),
          eh: +h.eyeHeight.toFixed(2), cr: h.crouching,
          swP: h.swingPhase, swT: +h.swingTimer.toFixed(2),
          spF: Math.round(h.sprayFuel), sp: h.spraying,
          wc: +h.walkCycle.toFixed(2), actSeq: h.actSeq
        })
          .catch(() => {})
          .finally(() => { this.syncInFlight = false; });
      } else {
        const r = state.getLocalRoach();
        if (!r || !r.alive) return;
        this.syncInFlight = true;
        set(ref(this.db, `gokiburi_rooms/${this.roomCode}/inputs/${this.uid}`), {
          x: +r.x.toFixed(3), y: +r.y.toFixed(3), z: +r.z.toFixed(3),
          vx: +r.vx.toFixed(2), vz: +r.vz.toFixed(2), yaw: +r.yaw.toFixed(3),
          sf: r.surface, nx: r.normal.x, nz: r.normal.z,
          sp: r.sprinting, fl: r.flying, wf: +r.wingFlutter.toFixed(2),
          lp: +r.legPhase.toFixed(2), st: Math.round(r.stamina), ff: Math.round(r.flyFuel)
        })
          .catch(() => {})
          .finally(() => { this.syncInFlight = false; });
      }
    }
  }

  async leaveRoom() {
    for (const l of this.listeners) off(l.dbRef, 'value', l.handler);
    this.listeners = [];
    if (this.db && this.roomCode) {
      try {
        if (this.role === 'host') {
          await remove(ref(this.db, `gokiburi_rooms/${this.roomCode}`));
        } else if (this.uid) {
          await remove(ref(this.db, `gokiburi_rooms/${this.roomCode}/players/${this.uid}`));
          await remove(ref(this.db, `gokiburi_rooms/${this.roomCode}/inputs/${this.uid}`));
        }
      } catch (e) {}
    }
    this.roomCode = null;
    this.role = null;
    this.syncAcc = 0;
    this.syncInFlight = false;
  }
}
