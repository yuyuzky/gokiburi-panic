import { BALANCE, MAX_PLAYERS, IS_MOBILE, clamp, angleDiff } from './config.js';
import { SoundEngine } from './sound.js';
import { GameState } from './state.js';
import { GameRenderer } from './renderer.js';
import { OnlineManager } from './online.js';
import { STAGES, getStageById } from './stages/index.js';

// モバイル判定クラス付与＆PWAマニフェスト動的注入
if (IS_MOBILE) document.body.classList.add('is-mobile');

(function setupInlinePWA() {
  try {
    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="36" fill="#24161c"/><circle cx="96" cy="96" r="64" fill="#d96b38" opacity="0.25"/><text x="96" y="118" font-size="84" text-anchor="middle">🪳</text></svg>`;
    const iconUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(iconSvg);
    const manifest = {
      name: 'ゴキブリパニック！〜3D非対称対戦アクション〜',
      short_name: 'ゴキパニ',
      display: 'fullscreen',
      orientation: 'landscape',
      background_color: '#1a1118',
      theme_color: '#1a1118',
      start_url: location.href,
      icons: [{ src: iconUrl, sizes: '192x192', type: 'image/svg+xml' }]
    };
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manifest));
    document.head.appendChild(link);
  } catch (e) {}
})();

class GameApp {
  constructor() {
    this.state = new GameState();
    this.sound = new SoundEngine();
    this.renderer = new GameRenderer(document.getElementById('canvas-mount'), this.state.stage);

    this.lobbyPlayers = {};
    this.lobbyMeta = { status: 'lobby', aiFill: true, stageId: this.state.stageId };

    this.online = new OnlineManager({
      onPlayersChanged: (players) => this.handleOnlinePlayersChanged(players),
      onMetaChanged: (meta) => this.handleOnlineMetaChanged(meta),
      onRemoteInputsChanged: (inputs) => { this.state.remoteInputs = inputs || {}; },
      onHostState: (snap) => this.handleOnlineHostState(snap),
      onRoomClosed: () => this.handleOnlineRoomClosed()
    });

    this.keys = new Set();
    this.lastWTime = 0;
    this.doubleWSprint = false;
    this.mouseDownL = false;
    this.mouseDownR = false;
    this.menuOpen = false;
    this.toastTimer = 0;
    this.lastShownCountdown = '';
    this.sensStorageKey = IS_MOBILE ? 'gp_sens_mobile' : 'gp_sens_pc';
    this.lookSensitivity = this.loadLookSensitivity();

    this.mobileInput = {
      joyId: null, joyOriginX: 0, joyOriginY: 0,
      forward: 0, right: 0, autoSprint: false,
      lookId: null, lookLastX: 0, lookLastY: 0,
      primary: false, secondary: false, crouchToggle: false,
      interact: false, sprintBtn: false, jumpHold: false
    };

    this.cacheDOM();
    this.renderStageSelector();
    this.bindEvents();
    this.setupMobileControls();
    this.checkOrientationOverlay();

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  cacheDOM() {
    this.elTitle = document.getElementById('title-screen');
    this.elStageSelector = document.getElementById('stage-selector');
    this.elLobby = document.getElementById('lobby-screen');
    this.elLobbyStageName = document.getElementById('lobby-stage-name');
    this.elPause = document.getElementById('pause-screen');
    this.elPauseTitle = document.getElementById('pause-title');
    this.elPauseDesc = document.getElementById('pause-desc');
    this.elLookSensLabel = document.getElementById('look-sens-label');
    this.elLookSensInput = document.getElementById('input-look-sens');
    this.elLookSensVal = document.getElementById('look-sens-val');
    this.elBtnResetSens = document.getElementById('btn-reset-sens');
    this.elResult = document.getElementById('result-screen');
    this.elHud = document.getElementById('hud');
    this.elCrosshair = document.getElementById('crosshair');
    this.elIndicatorLayer = document.getElementById('indicator-layer');
    this.elOrientationOverlay = document.getElementById('orientation-overlay');

    this.elCountdownOverlay = document.getElementById('countdown-overlay');
    this.elCountdownNum = document.getElementById('countdown-number');
    this.elCountdownSub = document.getElementById('countdown-sub');

    this.elRoleBadge = document.getElementById('hud-role-badge');
    this.elRoachCount = document.getElementById('hud-roach-count');
    this.elHumanCount = document.getElementById('hud-human-count');
    this.elNetTag = document.getElementById('hud-net-tag');
    this.elTimer = document.getElementById('hud-timer');
    this.elQuickTip = document.getElementById('hud-quick-tip');
    this.elControlsDetail = document.getElementById('hud-controls-detail');

    this.elSpectateBar = document.getElementById('spectate-bar');
    this.elSpectateTargetName = document.getElementById('spectate-target-name');

    this.elHumanBars = document.getElementById('hud-human-bars');
    this.elSprayLabel = document.getElementById('hud-spray-label');
    this.elSprayBar = document.getElementById('hud-spray-bar');
    this.elSprayVal = document.getElementById('hud-spray-val');
    this.elHumanStaminaBar = document.getElementById('hud-human-stamina-bar');
    this.elHumanStaminaVal = document.getElementById('hud-human-stamina-val');
    this.elHumanStance = document.getElementById('hud-human-stance');

    this.elRefillGuide = document.getElementById('refill-guide');
    this.elRefillGuideDist = document.getElementById('refill-guide-dist');
    this.elRefillPrompt = document.getElementById('refill-prompt');
    this.elRefillPromptText = document.getElementById('refill-prompt-text');
    this.elRefillProgressWrap = document.getElementById('refill-progress-wrap');
    this.elRefillProgressBar = document.getElementById('refill-progress-bar');

    this.elRoachBars = document.getElementById('hud-roach-bars');
    this.elHpBar = document.getElementById('hud-hp-bar');
    this.elHpVal = document.getElementById('hud-hp-val');
    this.elHungerBar = document.getElementById('hud-hunger-bar');
    this.elHungerVal = document.getElementById('hud-hunger-val');
    this.elStaminaLabel = document.getElementById('hud-stamina-label');
    this.elStaminaBar = document.getElementById('hud-stamina-bar');
    this.elStaminaVal = document.getElementById('hud-stamina-val');
    this.elFlyLabel = document.getElementById('hud-fly-label');
    this.elFlyBar = document.getElementById('hud-fly-bar');
    this.elFlyVal = document.getElementById('hud-fly-val');
    this.elRoachState = document.getElementById('hud-roach-state');

    this.elToast = document.getElementById('hud-toast');
    this.elToastText = document.getElementById('hud-toast-text');
    this.elDmgVignette = document.getElementById('damage-vignette');
    this.elPoisonVignette = document.getElementById('poison-vignette');
    this.elStarveVignette = document.getElementById('starve-vignette');

    this.elMobileControls = document.getElementById('mobile-controls');
    this.elMobileHumanBtns = document.getElementById('mobile-human-btns');
    this.elMobileRoachBtns = document.getElementById('mobile-roach-btns');
    this.elMbtnRefill = document.getElementById('mbtn-refill');
    this.elMbtnCrouch = document.getElementById('mbtn-crouch');
    this.elMbtnJumpR = document.getElementById('mbtn-jump-r');
    this.elMbtnJumpRLabel = document.getElementById('mbtn-jump-r-label');
    this.elMbtnJumpRSub = document.getElementById('mbtn-jump-r-sub');
    this.elJoyKnob = document.getElementById('joy-knob');

    this.elInputRoomCode = document.getElementById('input-room-code');
    this.elOnlineError = document.getElementById('online-error-msg');
    this.elLobbyCode = document.getElementById('lobby-room-code');
    this.elBtnPickHuman = document.getElementById('btn-lobby-pick-human');
    this.elBtnPickRoach = document.getElementById('btn-lobby-pick-roach');
    this.elChkAiFill = document.getElementById('chk-lobby-ai-fill');
    this.elAiStatusBadge = document.getElementById('lobby-ai-status-badge');
    this.elLobbyTotalCount = document.getElementById('lobby-total-count');
    this.elLobbyHumanCount = document.getElementById('lobby-human-count');
    this.elLobbyRoachCount = document.getElementById('lobby-roach-count');
    this.elLobbyPlayerList = document.getElementById('lobby-player-list');
    this.elLobbyStartHint = document.getElementById('lobby-start-hint');
    this.elBtnLobbyStart = document.getElementById('btn-lobby-start');
    this.elBtnRetry = document.getElementById('btn-retry');
  }

  renderStageSelector() {
    this.elStageSelector.innerHTML = '';
    STAGES.forEach(st => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const active = st.id === this.state.stageId;
      btn.className = `stage-card rounded-2xl p-3 text-left cursor-pointer ${active ? 'active' : ''}`;
      btn.innerHTML = `
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm font-extrabold text-amber-100">${st.name}</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/35 text-amber-200 font-bold">${st.badge}</span>
        </div>
        <div class="text-[11px] text-amber-200/85 font-semibold mb-0.5">${st.subtitle}</div>
        <div class="text-[10px] text-amber-100/65 leading-snug">${st.description}</div>
      `;
      btn.addEventListener('click', () => {
        if (this.state.setStage(st.id)) {
          this.renderer.loadStage(this.state.stage);
          this.renderStageSelector();
        }
      });
      this.elStageSelector.appendChild(btn);
    });
  }

  async enterFullscreenLandscape() {
    try {
      const el = document.documentElement;
      if (!document.fullscreenElement) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      }
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (e) {}
    this.checkOrientationOverlay();
  }

  checkOrientationOverlay() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const shouldWarn = IS_MOBILE && isPortrait && (this.state.mode === 'playing');
    this.elOrientationOverlay.classList.toggle('hidden', !shouldWarn);
  }

  loadLookSensitivity() {
    try {
      const raw = parseFloat(localStorage.getItem(this.sensStorageKey));
      if (Number.isFinite(raw)) return clamp(Math.round(raw * 10) / 10, 0.3, 2.5);
    } catch (e) {}
    return 1.0;
  }

  setLookSensitivity(val) {
    const clamped = clamp(Math.round(Number(val) * 10) / 10, 0.3, 2.5);
    this.lookSensitivity = Number.isFinite(clamped) ? clamped : 1.0;
    try {
      localStorage.setItem(this.sensStorageKey, String(this.lookSensitivity));
    } catch (e) {}
    this.syncSensitivityUI();
  }

  syncSensitivityUI() {
    if (this.elLookSensLabel) {
      this.elLookSensLabel.textContent = IS_MOBILE ? '視点感度（スマホ）' : '視点感度（マウス）';
    }
    if (this.elLookSensInput) {
      this.elLookSensInput.value = String(this.lookSensitivity);
    }
    if (this.elLookSensVal) {
      this.elLookSensVal.textContent = `${this.lookSensitivity.toFixed(1)}x`;
    }
  }

  bindEvents() {
    this.syncSensitivityUI();
    if (this.elLookSensInput) {
      this.elLookSensInput.addEventListener('input', (e) => {
        this.setLookSensitivity(e.target.value);
      });
    }
    if (this.elBtnResetSens) {
      this.elBtnResetSens.addEventListener('click', () => {
        this.setLookSensitivity(1.0);
      });
    }
    window.addEventListener('resize', () => this.checkOrientationOverlay());
    window.addEventListener('orientationchange', () => setTimeout(() => this.checkOrientationOverlay(), 150));

    document.getElementById('btn-fullscreen-landscape').addEventListener('click', () => this.enterFullscreenLandscape());
    document.getElementById('btn-rotate-fullscreen').addEventListener('click', () => this.enterFullscreenLandscape());

    document.getElementById('btn-start-human').addEventListener('click', () => this.startOfflineGame('human'));
    document.getElementById('btn-start-roach').addEventListener('click', () => this.startOfflineGame('roach'));

    // スマホで右側視点ドラッグと誤干渉しないよう touchstart 伝播を遮断
    const btnHudPause = document.getElementById('btn-hud-pause');
    btnHudPause.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    btnHudPause.addEventListener('click', () => this.pauseGame());

    const btnSpectateNext = document.getElementById('btn-spectate-next');
    btnSpectateNext.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    btnSpectateNext.addEventListener('click', () => {
      const next = this.state.cycleSpectateRoach();
      if (next) this.showToast(`${next.name} を観戦中`);
    });
    this.elSpectateBar.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });

    document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());
    document.getElementById('btn-back-title').addEventListener('click', () => this.returnToTitle());
    document.getElementById('btn-result-title').addEventListener('click', () => this.returnToTitle());

    this.elBtnRetry.addEventListener('click', async () => {
      if (this.state.networkMode === 'host') {
        await this.online.returnToLobbyAsHost();
        this.openLobbyView();
      } else if (this.state.networkMode === 'offline') {
        this.startOfflineGame(this.state.playerSide);
      }
    });

    document.getElementById('btn-create-room').addEventListener('click', () => this.onClickCreateRoom());
    document.getElementById('btn-join-room').addEventListener('click', () => this.onClickJoinRoom());
    document.getElementById('btn-copy-code').addEventListener('click', () => {
      if (this.online.roomCode && navigator.clipboard) {
        navigator.clipboard.writeText(this.online.roomCode).catch(() => {});
        this.showToast(`ルームコード ${this.online.roomCode} をコピーしました`);
      }
    });
    this.elBtnPickHuman.addEventListener('click', () => this.online.setMySide('human'));
    this.elBtnPickRoach.addEventListener('click', () => this.online.setMySide('roach'));
    this.elChkAiFill.addEventListener('change', () => {
      if (this.online.role === 'host') this.online.setAiFill(this.elChkAiFill.checked);
    });
    this.elBtnLobbyStart.addEventListener('click', () => this.onClickLobbyStart());
    document.getElementById('btn-lobby-leave').addEventListener('click', () => this.returnToTitle());

    this.renderer.renderer.domElement.addEventListener('click', () => {
      if (IS_MOBILE) return;
      if (this.state.mode === 'playing' && !this.menuOpen) {
        if (this.state.playerSide === 'roach') {
          const lr = this.state.getLocalRoach();
          if (lr && !lr.alive) {
            const next = this.state.cycleSpectateRoach();
            if (next) this.showToast(`${next.name} を観戦中`);
          }
        }
        if (document.pointerLockElement !== this.renderer.renderer.domElement) this.requestLock();
      } else if (this.state.mode === 'paused' || this.menuOpen) {
        this.resumeGame();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      if (IS_MOBILE) return;
      const locked = document.pointerLockElement === this.renderer.renderer.domElement;
      if (!locked && this.state.mode === 'playing' && !this.menuOpen) this.pauseGame();
    });

    window.addEventListener('keydown', (e) => {
      if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
      if (e.code === 'Escape') {
        if (this.state.mode === 'playing' && !this.menuOpen) this.pauseGame();
        else if (this.state.mode === 'paused' || this.menuOpen) this.resumeGame();
        return;
      }
      if (e.code === 'KeyW' && !this.keys.has('KeyW')) {
        const now = performance.now();
        if (now - this.lastWTime < 280) this.doubleWSprint = true;
        this.lastWTime = now;
      }
      if (e.code === 'Space' && this.state.mode === 'playing' && !this.menuOpen) {
        e.preventDefault();
        if (!this.keys.has('Space')) {
          this.state.input.jump = true;
        }
      }
      this.keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (e.code === 'KeyW') this.doubleWSprint = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (IS_MOBILE || this.state.mode !== 'playing' || this.menuOpen) return;
      if (document.pointerLockElement === this.renderer.renderer.domElement) {
        this.state.input.lookDeltaX += (e.movementX || 0) * this.lookSensitivity;
        this.state.input.lookDeltaY += (e.movementY || 0) * this.lookSensitivity;
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (IS_MOBILE || this.state.mode !== 'playing' || this.menuOpen) return;
      if (e.button === 0) this.mouseDownL = true;
      if (e.button === 2) this.mouseDownR = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDownL = false;
      if (e.button === 2) this.mouseDownR = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setupMobileControls() {
    const joyZone = document.getElementById('joy-zone');
    const joyBase = document.getElementById('joy-base');
    const lookZone = document.getElementById('look-zone');
    const maxR = 44;

    joyZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.mobileInput.joyId !== null) return;
      const t = e.changedTouches[0];
      const rect = joyBase.getBoundingClientRect();
      this.mobileInput.joyId = t.identifier;
      this.mobileInput.joyOriginX = rect.left + rect.width * 0.5;
      this.mobileInput.joyOriginY = rect.top + rect.height * 0.5;
      this.updateJoyFromTouch(t, maxR);
    }, { passive: false });

    joyZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this.mobileInput.joyId) this.updateJoyFromTouch(t, maxR);
      }
    }, { passive: false });

    const endJoy = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.mobileInput.joyId) {
          this.mobileInput.joyId = null;
          this.mobileInput.forward = 0; this.mobileInput.right = 0; this.mobileInput.autoSprint = false;
          this.elJoyKnob.style.transform = 'translate(0px, 0px)';
          this.elJoyKnob.classList.remove('dash');
        }
      }
    };
    joyZone.addEventListener('touchend', endJoy);
    joyZone.addEventListener('touchcancel', endJoy);

    lookZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.mobileInput.lookId !== null) return;
      const t = e.changedTouches[0];
      this.mobileInput.lookId = t.identifier;
      this.mobileInput.lookLastX = t.clientX;
      this.mobileInput.lookLastY = t.clientY;
    }, { passive: false });

    lookZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this.mobileInput.lookId) {
          const dx = t.clientX - this.mobileInput.lookLastX;
          const dy = t.clientY - this.mobileInput.lookLastY;
          this.mobileInput.lookLastX = t.clientX;
          this.mobileInput.lookLastY = t.clientY;
          this.state.input.lookDeltaX += dx * 2.1 * this.lookSensitivity;
          this.state.input.lookDeltaY += dy * 1.9 * this.lookSensitivity;
        }
      }
    }, { passive: false });

    const endLook = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.mobileInput.lookId) this.mobileInput.lookId = null;
      }
    };
    lookZone.addEventListener('touchend', endLook);
    lookZone.addEventListener('touchcancel', endLook);

    const bindHold = (id, prop) => {
      const el = document.getElementById(id);
      el.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        this.mobileInput[prop] = true;
        el.classList.add('active');
      }, { passive: false });
      const end = (e) => {
        e.preventDefault();
        this.mobileInput[prop] = false;
        el.classList.remove('active');
      };
      el.addEventListener('touchend', end, { passive: false });
      el.addEventListener('touchcancel', end, { passive: false });
    };

    bindHold('mbtn-slap', 'primary');
    bindHold('mbtn-spray', 'secondary');
    bindHold('mbtn-refill', 'interact');
    bindHold('mbtn-sprint-r', 'sprintBtn');

    this.elMbtnCrouch.addEventListener('touchstart', (e) => {
      e.preventDefault(); e.stopPropagation();
      this.mobileInput.crouchToggle = !this.mobileInput.crouchToggle;
      this.elMbtnCrouch.classList.toggle('active', this.mobileInput.crouchToggle);
    }, { passive: false });

    document.getElementById('mbtn-jump-h').addEventListener('touchstart', (e) => {
      e.preventDefault(); e.stopPropagation();
      this.state.input.jump = true;
    }, { passive: false });

    // ゴキブリ用ジャンプボタン：タップでジャンプ＋押しっぱなしで空中緊急飛行（jumpHold）
    this.elMbtnJumpR.addEventListener('touchstart', (e) => {
      e.preventDefault(); e.stopPropagation();
      this.state.input.jump = true;
      this.mobileInput.jumpHold = true;
      this.elMbtnJumpR.classList.add('active');
    }, { passive: false });
    const endJumpR = (e) => {
      e.preventDefault();
      this.mobileInput.jumpHold = false;
      this.elMbtnJumpR.classList.remove('active');
    };
    this.elMbtnJumpR.addEventListener('touchend', endJumpR, { passive: false });
    this.elMbtnJumpR.addEventListener('touchcancel', endJumpR, { passive: false });
  }

  updateJoyFromTouch(t, maxR) {
    let dx = t.clientX - this.mobileInput.joyOriginX;
    let dy = t.clientY - this.mobileInput.joyOriginY;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) { dx = (dx / dist) * maxR; dy = (dy / dist) * maxR; }
    this.elJoyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    this.mobileInput.right = clamp(dx / maxR, -1, 1);
    this.mobileInput.forward = clamp(-dy / maxR, -1, 1);
    const ratio = Math.min(dist, maxR) / maxR;
    this.mobileInput.autoSprint = ratio >= 0.80 && this.mobileInput.forward > 0.35;
    this.elJoyKnob.classList.toggle('dash', this.mobileInput.autoSprint);
  }

  showOnlineError(msg) {
    if (!msg) { this.elOnlineError.classList.add('hidden'); return; }
    this.elOnlineError.textContent = msg;
    this.elOnlineError.classList.remove('hidden');
  }

  async onClickCreateRoom() {
    this.showOnlineError('');
    this.sound.init();
    try {
      const code = await this.online.createRoom(this.state.stageId);
      this.state.remoteInputs = {};
      this.openLobbyView();
      this.elLobbyCode.textContent = code;
    } catch (err) {
      this.showOnlineError(err.message || 'ルーム作成に失敗しました。Firebaseのルールと匿名認証を確認してください。');
    }
  }

  async onClickJoinRoom() {
    this.showOnlineError('');
    this.sound.init();
    try {
      const { code, stageId } = await this.online.joinRoom(this.elInputRoomCode.value);
      if (this.state.setStage(stageId)) {
        this.renderer.loadStage(this.state.stage);
      }
      this.openLobbyView();
      this.elLobbyCode.textContent = code;
    } catch (err) {
      this.showOnlineError(err.message || 'ルーム参加に失敗しました。');
    }
  }

  openLobbyView() {
    this.state.mode = 'lobby';
    this.menuOpen = false;
    this.exitLock();
    this.elTitle.classList.add('hidden');
    this.elHud.classList.add('hidden');
    this.elPause.classList.add('hidden');
    this.elResult.classList.add('hidden');
    this.elCrosshair.classList.add('hidden');
    this.elCountdownOverlay.classList.add('hidden');
    this.elMobileControls.classList.add('hidden');
    this.elLobby.classList.remove('hidden');
    this.renderLobbyUI();
  }

  buildOnlineRoster(playersMap, aiFill) {
    const list = Object.values(playersMap || {}).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
    const humans = list.filter(p => p.side === 'human').map((p, i) => ({ uid: p.uid, name: p.name || `人間 #${i + 1}`, isAI: false }));
    const roaches = list.filter(p => p.side !== 'human').map((p, i) => ({ uid: p.uid, name: p.name || `ゴキブリ #${i + 1}`, isAI: false }));

    if (aiFill) {
      if (humans.length === 0 && (humans.length + roaches.length) < MAX_PLAYERS) {
        humans.push({ uid: 'ai_h_0', name: '人間AI 1', isAI: true });
      }
      let aiR = 1;
      while (humans.length + roaches.length < MAX_PLAYERS) {
        roaches.push({ uid: `ai_r_${aiR}`, name: `ゴキブリAI ${aiR}`, isAI: true });
        aiR++;
      }
    }
    return { humans, roaches };
  }

  renderLobbyUI() {
    const players = Object.values(this.lobbyPlayers || {}).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
    const aiFill = this.lobbyMeta.aiFill !== false;
    const isHost = this.online.role === 'host';
    const me = this.lobbyPlayers[this.online.uid];
    const mySide = me ? me.side : (isHost ? 'human' : 'roach');

    const st = getStageById(this.online.stageId || this.state.stageId);
    this.elLobbyStageName.textContent = `ステージ: ${st.name}`;

    const activeCls = 'bg-amber-500/35 border-amber-300 text-amber-50';
    const idleCls = 'bg-black/30 border-amber-200/20 text-amber-200/70 hover:bg-white/10';
    this.elBtnPickHuman.className = `rounded-xl py-2 px-3 text-xs font-extrabold border transition cursor-pointer ${mySide === 'human' ? activeCls : idleCls}`;
    this.elBtnPickRoach.className = `rounded-xl py-2 px-3 text-xs font-extrabold border transition cursor-pointer ${mySide === 'roach' ? 'bg-rose-500/35 border-rose-300 text-rose-50' : idleCls}`;

    this.elChkAiFill.checked = aiFill;
    this.elChkAiFill.disabled = !isHost;
    this.elAiStatusBadge.textContent = aiFill ? 'ON' : 'OFF';
    this.elAiStatusBadge.className = `text-xs font-extrabold ${aiFill ? 'text-emerald-300' : 'text-rose-300'}`;

    const humanCount = players.filter(p => p.side === 'human').length;
    const roachCount = players.filter(p => p.side !== 'human').length;
    this.elLobbyTotalCount.textContent = `${players.length} / ${MAX_PLAYERS}`;
    this.elLobbyHumanCount.textContent = String(humanCount);
    this.elLobbyRoachCount.textContent = String(roachCount);

    let html = '';
    players.forEach(p => {
      const isMe = p.uid === this.online.uid;
      const badge = p.side === 'human'
        ? '<span class="px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 text-[10px] font-bold">人間</span>'
        : '<span class="px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 text-[10px] font-bold">ゴキブリ</span>';
      html += `<div class="rounded-xl bg-black/35 border ${isMe ? 'border-amber-400/60' : 'border-amber-200/15'} px-3 py-2 flex items-center justify-between gap-2">
        <span class="text-xs font-semibold text-amber-100 truncate">${p.name}${p.isHost ? ' ★' : ''}${isMe ? ' (あなた)' : ''}</span>
        ${badge}
      </div>`;
    });
    this.elLobbyPlayerList.innerHTML = html;

    const previewRoster = this.buildOnlineRoster(this.lobbyPlayers, aiFill);
    const canStart = previewRoster.humans.length > 0 && previewRoster.roaches.length > 0;

    this.elBtnLobbyStart.classList.toggle('hidden', !isHost);
    this.elBtnLobbyStart.disabled = !canStart;

    if (!canStart) {
      this.elLobbyStartHint.textContent = '両陣営に1人以上必要です（陣営を変更するか、AI補充をONにしてください）';
      this.elLobbyStartHint.className = 'text-center text-xs font-bold text-rose-300 mb-4';
    } else if (isHost) {
      this.elLobbyStartHint.textContent = `開始予定：人間 ${previewRoster.humans.length}人 vs ゴキブリ ${previewRoster.roaches.length}匹（計${previewRoster.humans.length + previewRoster.roaches.length}体）`;
      this.elLobbyStartHint.className = 'text-center text-xs text-emerald-300 mb-4';
    } else {
      this.elLobbyStartHint.textContent = 'ホストが対戦を開始するのを待っています…';
      this.elLobbyStartHint.className = 'text-center text-xs text-amber-200/80 mb-4';
    }
  }

  async onClickLobbyStart() {
    if (this.online.role !== 'host') return;
    const aiFill = this.lobbyMeta.aiFill !== false;
    const roster = this.buildOnlineRoster(this.lobbyPlayers, aiFill);
    if (roster.humans.length === 0 || roster.roaches.length === 0) return;

    this.startMatchWithRoster(roster, this.online.uid, 'host', this.online.stageId);
    await this.online.startOnlineMatch(roster, this.state.exportHostSnapshot());
  }

  handleOnlinePlayersChanged(players) {
    this.lobbyPlayers = players || {};
    if (this.state.mode === 'lobby') this.renderLobbyUI();
  }

  handleOnlineMetaChanged(meta) {
    this.lobbyMeta = meta || { status: 'lobby', aiFill: true };
    if (meta.stageId && this.state.setStage(meta.stageId)) {
      this.renderer.loadStage(this.state.stage);
    }
    if (this.state.mode === 'lobby') this.renderLobbyUI();
    if (this.online.role === 'guest') {
      if (meta.status === 'playing' && meta.roster && this.state.mode !== 'playing') {
        this.startMatchWithRoster(meta.roster, this.online.uid, 'guest', meta.stageId || this.state.stageId);
      } else if (meta.status === 'lobby' && this.state.mode !== 'lobby') {
        this.openLobbyView();
      }
    }
  }

  handleOnlineHostState(snap) {
    if (this.online.role !== 'guest') return;
    const prevMode = this.state.mode;
    this.state.applyHostSnapshot(snap);
    if (prevMode === 'playing' && this.state.mode === 'result') {
      this.showResultScreen();
    }
  }

  handleOnlineRoomClosed() {
    if (this.online.role !== 'guest') return;
    this.returnToTitle();
    this.showOnlineError('ホストがルームを閉じたため、タイトルへ戻りました。');
  }

  startOfflineGame(side) {
    const roster = side === 'human'
      ? {
          humans: [{ uid: 'local', name: 'あなた', isAI: false }],
          roaches: [
            { uid: 'ai_r_0', name: 'ゴキブリAI 1', isAI: true },
            { uid: 'ai_r_1', name: 'ゴキブリAI 2', isAI: true },
            { uid: 'ai_r_2', name: 'ゴキブリAI 3', isAI: true }
          ]
        }
      : {
          humans: [{ uid: 'ai_h_0', name: '人間AI', isAI: true }],
          roaches: [
            { uid: 'local', name: 'あなた', isAI: false },
            { uid: 'ai_r_1', name: '仲間AI 1', isAI: true },
            { uid: 'ai_r_2', name: '仲間AI 2', isAI: true }
          ]
        };
    this.startMatchWithRoster(roster, 'local', 'offline', this.state.stageId);
  }

  startMatchWithRoster(roster, localUid, networkMode, stageId = this.state.stageId) {
    this.sound.init();
    this.state.startMatch(roster, localUid, networkMode, stageId);
    this.renderer.loadStage(this.state.stage);
    this.mouseDownL = false; this.mouseDownR = false; this.menuOpen = false;
    this.lastShownCountdown = '';
    this.mobileInput.crouchToggle = false;
    this.mobileInput.jumpHold = false;
    this.elMbtnCrouch.classList.remove('active');
    this.keys.clear();

    this.elTitle.classList.add('hidden');
    this.elLobby.classList.add('hidden');
    this.elPause.classList.add('hidden');
    this.elResult.classList.add('hidden');
    this.elHud.classList.remove('hidden');

    this.elNetTag.textContent = networkMode === 'offline' ? this.state.stage.name : `ONLINE #${this.online.roomCode}`;

    const side = this.state.playerSide;
    if (side === 'human') {
      this.elCrosshair.classList.remove('hidden');
      this.elHumanBars.classList.remove('hidden');
      this.elRoachBars.classList.add('hidden');
      this.elSpectateBar.classList.add('hidden');
      this.elRoleBadge.textContent = networkMode === 'host' ? '人間 (HOST)' : '人間 (FPS)';
      this.elQuickTip.textContent = '右: 継続照射で毒鈍足 / 左: 新聞紙でトドメ';
      this.elControlsDetail.innerHTML = '<b>WASD</b> 移動 / <b>Shift</b> しゃがみ(家具下スプレー可) / <b>Ctrl</b> ダッシュ<br><b>右クリック</b> スプレー / <b>左クリック</b> 新聞紙 / <b>E長押し</b> 補充';
    } else {
      this.elCrosshair.classList.add('hidden');
      this.elHumanBars.classList.add('hidden');
      this.elRoachBars.classList.remove('hidden');
      this.elRefillGuide.classList.add('hidden');
      this.elRefillPrompt.classList.add('hidden');
      this.elRoleBadge.textContent = networkMode === 'host' ? 'ゴキブリ (HOST)' : 'ゴキブリ (TPS)';
      this.elQuickTip.textContent = '空中Space長押しで独立飛行 / 毒中でも壁登り・飛行可';
      this.elControlsDetail.innerHTML = '<b>WASD</b> 移動 / <b>Shift</b> ダッシュ / <b>Space</b> ジャンプ＆空中長押し飛行<br>家具側面へ前進で登攀（家の壁は登れません）';
    }

    this.elMobileControls.classList.toggle('hidden', !IS_MOBILE);
    this.elMobileHumanBtns.classList.toggle('hidden', !(IS_MOBILE && side === 'human'));
    this.elMobileRoachBtns.classList.toggle('hidden', !(IS_MOBILE && side === 'roach'));

    if (!IS_MOBILE) this.requestLock();
    this.checkOrientationOverlay();
  }

  requestLock() {
    try {
      const el = this.renderer.renderer.domElement;
      if (el.requestPointerLock) { const r = el.requestPointerLock(); if (r && r.catch) r.catch(() => {}); }
    } catch (e) {}
  }

  exitLock() {
    try { if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock(); } catch (e) {}
  }

  pauseGame() {
    if (this.state.mode !== 'playing') return;
    this.mouseDownL = false; this.mouseDownR = false; this.keys.clear();
    this.mobileInput.jumpHold = false;
    this.sound.setSprayActive(false);
    this.sound.setFlyBuzzActive(false);

    if (this.state.networkMode === 'offline') {
      this.state.mode = 'paused';
      this.elPauseTitle.textContent = '一時停止中';
      this.elPauseDesc.textContent = '下のボタンからそのまま対戦に復帰できます。';
    } else {
      this.menuOpen = true;
      this.elPauseTitle.textContent = 'オンライン対戦中';
      this.elPauseDesc.textContent = 'オンライン対戦は裏で進行しています。すぐ復帰してください。';
    }
    this.elPause.classList.remove('hidden');
    this.exitLock();
  }

  resumeGame() {
    if (this.state.mode === 'paused') this.state.mode = 'playing';
    this.menuOpen = false;
    this.elPause.classList.add('hidden');
    if (!IS_MOBILE) this.requestLock();
  }

  async returnToTitle() {
    await this.online.leaveRoom();
    this.state.remoteInputs = {};
    this.state.networkMode = 'offline';
    this.state.mode = 'title';
    this.menuOpen = false;
    this.mouseDownL = false; this.mouseDownR = false; this.keys.clear();
    this.mobileInput.jumpHold = false;
    this.sound.setSprayActive(false);
    this.sound.setFlyBuzzActive(false);
    this.elHud.classList.add('hidden');
    this.elLobby.classList.add('hidden');
    this.elPause.classList.add('hidden');
    this.elResult.classList.add('hidden');
    this.elCrosshair.classList.add('hidden');
    this.elCountdownOverlay.classList.add('hidden');
    this.elMobileControls.classList.add('hidden');
    this.elRefillGuide.classList.add('hidden');
    this.elRefillPrompt.classList.add('hidden');
    this.elSpectateBar.classList.add('hidden');
    this.elStarveVignette.classList.remove('pulsing');
    this.elPoisonVignette.style.opacity = '0';
    this.elDmgVignette.style.opacity = '0';
    this.elTitle.classList.remove('hidden');
    this.renderStageSelector();
    this.checkOrientationOverlay();
    this.exitLock();
  }

  showResultScreen() {
    this.sound.setSprayActive(false);
    this.sound.setFlyBuzzActive(false);
    this.menuOpen = false;
    this.mobileInput.jumpHold = false;
    this.exitLock();
    this.elHud.classList.add('hidden');
    this.elPause.classList.add('hidden');
    this.elCrosshair.classList.add('hidden');
    this.elCountdownOverlay.classList.add('hidden');
    this.elMobileControls.classList.add('hidden');
    this.elRefillGuide.classList.add('hidden');
    this.elRefillPrompt.classList.add('hidden');
    this.elSpectateBar.classList.add('hidden');
    this.elStarveVignette.classList.remove('pulsing');
    this.elResult.classList.remove('hidden');
    this.checkOrientationOverlay();

    if (this.state.networkMode === 'host') {
      this.elBtnRetry.classList.remove('hidden');
      this.elBtnRetry.textContent = 'ロビーへ戻って再戦準備';
    } else if (this.state.networkMode === 'guest') {
      this.elBtnRetry.classList.add('hidden');
    } else {
      this.elBtnRetry.classList.remove('hidden');
      this.elBtnRetry.textContent = '同じ陣営でもう一度';
    }

    const res = this.state.result;
    document.getElementById('result-title').textContent = res.playerWon ? '勝利！' : '敗北…';
    document.getElementById('result-badge').textContent = res.playerWon ? 'VICTORY' : 'DEFEAT';
    document.getElementById('result-desc').textContent = res.reason;

    const sec = Math.floor(this.state.elapsed);
    document.getElementById('result-stat-time').textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
    document.getElementById('result-stat-kills').textContent = `${this.state.stats.kills} / ${this.state.roaches.length}`;
    document.getElementById('result-stat-props').textContent = `${this.state.stats.propsKnocked} 個`;
  }

  showToast(text) {
    this.elToastText.textContent = text;
    this.elToast.classList.remove('opacity-0', '-translate-y-2');
    this.toastTimer = 2.6;
  }

  syncInputToState() {
    const inp = this.state.input;
    if (this.menuOpen) {
      inp.forward = 0; inp.right = 0; inp.interact = false;
      inp.crouch = false; inp.sprint = false; inp.jumpHold = false;
      inp.primary = false; inp.secondary = false;
      return;
    }
    if (IS_MOBILE) {
      const m = this.mobileInput;
      inp.forward = m.forward;
      inp.right = m.right;
      inp.interact = m.interact;
      inp.primary = m.primary;
      inp.secondary = m.secondary;
      inp.jumpHold = m.jumpHold;
      if (this.state.playerSide === 'human') {
        inp.crouch = m.crouchToggle;
        inp.sprint = m.autoSprint;
      } else {
        inp.crouch = false;
        inp.sprint = m.autoSprint || m.sprintBtn;
      }
      return;
    }
    inp.forward = (this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0);
    inp.right = (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0);
    inp.interact = this.keys.has('KeyE');
    inp.jumpHold = this.keys.has('Space');
    if (this.state.playerSide === 'human') {
      inp.crouch = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.keys.has('KeyC');
      inp.sprint = this.keys.has('ControlLeft') || this.keys.has('ControlRight') || this.doubleWSprint;
    } else {
      inp.crouch = false;
      inp.sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    }
    inp.primary = this.mouseDownL;
    inp.secondary = this.mouseDownR;
  }

  handleStateEvents() {
    for (const ev of this.state.events) {
      switch (ev.type) {
        case 'sound_countdown': this.sound.playCountdown(ev.isGo); break;
        case 'sound_swish': this.sound.playSwish(); break;
        case 'sound_miss': this.sound.playMiss(); break;
        case 'sound_slap': this.sound.playSlap(ev.intensity); break;
        case 'sound_hit': this.sound.playHit(ev.killed); break;
        case 'sound_skitter': this.sound.playSkitter(ev.volume); break;
        case 'sound_hungry': this.sound.playHungry(ev.volume); break;
        case 'sound_eat': this.sound.playEat(); break;
        case 'sound_refill': this.sound.playRefill(); break;
        case 'sound_train': this.sound.playTrainClack(ev.volume); break;
        case 'impact': this.renderer.spawnImpactEffects(ev.x, ev.y, ev.z); break;
        case 'spray_puff': this.renderer.spawnSprayPuff(ev.x, ev.y, ev.z, ev.dx, ev.dy, ev.dz); break;
        case 'poison_puff': this.renderer.spawnPoisonPuff(ev.x, ev.y, ev.z, !!ev.dense); break;
        case 'crosshair_hit':
          this.elCrosshair.classList.remove('hit-flash');
          void this.elCrosshair.offsetWidth;
          this.elCrosshair.classList.add('hit-flash');
          break;
        case 'roach_killed':
          this.showToast(ev.isPlayer ? 'やられてしまった！' : `ゴキブリを駆除！（残り ${this.state.roaches.filter(r => r.alive).length} 匹）`);
          break;
        case 'roach_starved':
          this.showToast(ev.isPlayer ? '空腹で力尽きた！' : `ゴキブリが餓死！（残り ${this.state.roaches.filter(r => r.alive).length} 匹）`);
          break;
        case 'toast': this.showToast(ev.text); break;
      }
    }

    const anySpraying = this.state.mode === 'playing' && this.state.humans.some(h => h.spraying);
    let sprayVol = 0.85;
    if (anySpraying && this.state.playerSide === 'roach') {
      const r = this.state.getCameraRoach();
      if (r) {
        let minD = Infinity;
        for (const h of this.state.humans) {
          if (!h.spraying) continue;
          minD = Math.min(minD, Math.hypot(r.x - h.x, r.z - h.z));
        }
        sprayVol = clamp(1.1 - minD * 0.2, 0.1, 1.0);
      }
    }
    this.sound.setSprayActive(anySpraying, sprayVol);

    let buzzVol = 0;
    if (this.state.mode === 'playing') {
      const lh = this.state.getLocalHuman();
      const camR = this.state.getCameraRoach();
      for (const r of this.state.roaches) {
        if (!r.alive || !r.flying) continue;
        if (this.state.playerSide === 'roach' && r.isPlayer) {
          buzzVol = Math.max(buzzVol, 0.9);
        } else {
          const refX = this.state.playerSide === 'human' && lh ? lh.x : (camR ? camR.x : 0);
          const refZ = this.state.playerSide === 'human' && lh ? lh.z : (camR ? camR.z : 0);
          const d = Math.hypot(r.x - refX, r.z - refZ);
          buzzVol = Math.max(buzzVol, clamp(1.1 - d * 0.14, 0.15, 1.0));
        }
      }
    }
    this.sound.setFlyBuzzActive(buzzVol > 0.05, buzzVol);
  }

  updateCountdownUI() {
    if (this.state.mode !== 'playing') {
      this.elCountdownOverlay.classList.add('hidden');
      return;
    }

    if (this.state.countdown > 0) {
      const txt = String(Math.ceil(this.state.countdown));
      this.elCountdownOverlay.classList.remove('hidden');
      if (this.lastShownCountdown !== txt) {
        this.lastShownCountdown = txt;
        this.elCountdownNum.textContent = txt;
        this.elCountdownNum.classList.remove('count-pop');
        void this.elCountdownNum.offsetWidth;
        this.elCountdownNum.classList.add('count-pop');
      }
      this.elCountdownSub.textContent = this.state.playerSide === 'human'
        ? '開始まで待機中（視点見回し可・移動と攻撃ロック）'
        : 'カウント中に有利な家具へ逃げ込め！';
    } else if (this.state.goBannerTimer > 0) {
      this.elCountdownOverlay.classList.remove('hidden');
      if (this.lastShownCountdown !== 'START!') {
        this.lastShownCountdown = 'START!';
        this.elCountdownNum.textContent = 'START!';
        this.elCountdownNum.classList.remove('count-pop');
        void this.elCountdownNum.offsetWidth;
        this.elCountdownNum.classList.add('count-pop');
      }
      this.elCountdownSub.textContent = this.state.playerSide === 'human'
        ? `駆除開始！120秒以内に ${this.state.roaches.length}匹 仕留めろ！`
        : '人間が動き出した！120秒逃げ切れ！';
    } else {
      this.elCountdownOverlay.classList.add('hidden');
      this.lastShownCountdown = '';
    }
  }

  updateHUD(dt) {
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.elToast.classList.add('opacity-0', '-translate-y-2');
    }

    this.updateCountdownUI();
    if (this.state.mode !== 'playing') return;

    const sec = Math.ceil(this.state.timeLeft);
    this.elTimer.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

    const alive = this.state.roaches.filter(r => r.alive).length;
    this.elRoachCount.textContent = `${alive} / ${this.state.roaches.length}`;
    this.elHumanCount.textContent = `${this.state.humans.length}人`;

    if (this.state.playerSide === 'human') {
      const h = this.state.getLocalHuman();
      if (!h) return;
      const spot = this.state.stage.refillSpot;
      const fuel = Math.round(h.sprayFuel);
      const stam = Math.round((h.stamina / BALANCE.human.staminaMax) * 100);

      this.elSprayBar.style.width = `${fuel}%`;
      this.elSprayVal.textContent = `${fuel}%`;
      this.elHumanStaminaBar.style.width = `${stam}%`;
      this.elHumanStaminaVal.textContent = `${stam}%`;
      this.elHumanStaminaBar.classList.toggle('low-fuel-warning', stam <= 20);

      this.elHumanStance.textContent = this.state.countdown > 0
        ? '待機中: カウント終了待ち'
        : (h.crouching ? '姿勢: しゃがみ（家具下スプレー可）' : (h.sprinting ? '姿勢: ダッシュ' : '姿勢: 立ち'));

      const isLowFuel = fuel <= 30;
      this.elSprayBar.classList.toggle('low-fuel-warning', isLowFuel);
      this.elSprayVal.classList.toggle('low-fuel-text', isLowFuel);
      this.elSprayLabel.textContent = isLowFuel ? '残量低下！補充缶へ' : 'ゴキジェット残量 (足止め用)';

      if (isLowFuel) {
        const proj = this.renderer.projectToScreen(spot.x, spot.y + 0.35, spot.z);
        const dRefill = Math.hypot(h.x - spot.x, h.z - spot.z);
        this.elRefillGuide.classList.remove('hidden');
        this.elRefillGuide.style.left = `${proj.x}px`;
        this.elRefillGuide.style.top = `${proj.y}px`;
        this.elRefillGuideDist.textContent = `${dRefill.toFixed(1)}m`;
      } else {
        this.elRefillGuide.classList.add('hidden');
      }

      const showRefillUI = h.refillInRange && fuel < 100 && this.state.countdown <= 0;
      if (IS_MOBILE) {
        this.elMbtnRefill.classList.toggle('hidden', !(showRefillUI && h.refillCooldown <= 0));
      }
      if (showRefillUI) {
        this.elRefillPrompt.classList.remove('hidden');
        if (h.refillCooldown > 0) {
          this.elRefillPromptText.textContent = `再補充クールダウン（あと ${Math.ceil(h.refillCooldown)} 秒）`;
          this.elRefillProgressWrap.classList.add('hidden');
        } else if (h.refilling) {
          this.elRefillPromptText.textContent = 'スプレー補充中...';
          this.elRefillProgressWrap.classList.remove('hidden');
          this.elRefillProgressBar.style.width = `${Math.round(h.refillProgress * 100)}%`;
        } else {
          this.elRefillPromptText.textContent = IS_MOBILE ? '「補充」ボタン長押しで補充' : '[E] 長押しでスプレー補充（2秒）';
          this.elRefillProgressWrap.classList.add('hidden');
        }
      } else {
        this.elRefillPrompt.classList.add('hidden');
      }

      this.renderHumanIndicators(h);
      this.elDmgVignette.style.opacity = '0';
      this.elPoisonVignette.style.opacity = '0';
      this.elStarveVignette.classList.remove('pulsing');
    } else {
      const localR = this.state.getLocalRoach();
      const camR = this.state.getCameraRoach();
      const isSpectating = localR && !localR.alive;
      this.elSpectateBar.classList.toggle('hidden', !isSpectating);
      if (isSpectating && camR) {
        this.elSpectateTargetName.textContent = camR.name;
      }

      const r = camR || localR;
      if (!r) return;
      const hpPct = Math.round((r.hp / r.maxHp) * 100);
      const hungerPct = Math.round(r.hunger);
      const stamPct = Math.round((r.stamina / BALANCE.roach.staminaMax) * 100);
      const flyPct = Math.round((r.flyFuel / BALANCE.roach.flyFuelMax) * 100);

      this.elHpBar.style.width = `${hpPct}%`;
      this.elHpVal.textContent = `${Math.ceil(r.hp)} / ${r.maxHp}`;
      this.elHungerBar.style.width = `${hungerPct}%`;
      this.elHungerVal.textContent = `${hungerPct}%`;

      this.elStaminaBar.style.width = `${stamPct}%`;
      this.elStaminaVal.textContent = `${stamPct}%`;
      const isLowStam = stamPct <= 25;
      this.elStaminaBar.classList.toggle('low-fuel-warning', isLowStam);
      this.elStaminaVal.classList.toggle('low-fuel-text', isLowStam);
      this.elStaminaLabel.textContent = isLowStam ? 'スタミナ低下！' : 'スタミナ (走・壁登り)';

      this.elFlyBar.style.width = `${flyPct}%`;
      this.elFlyVal.textContent = `${flyPct}%`;
      const flyLow = flyPct < BALANCE.roach.flyMinFuelToStart;
      this.elFlyBar.classList.toggle('low-fuel-warning', flyLow);
      this.elFlyLabel.textContent = r.flying ? '飛行中！(羽音注意)' : (flyLow ? '飛行回復待ち(25%)' : '飛行ゲージ');

      // スマホ用「ジャンプ／飛行」ボタンのラベル＆発光フィードバック
      if (IS_MOBILE && localR) {
        const canFlyNow = localR.alive && !localR.grounded && localR.flyFuel >= BALANCE.roach.flyMinFuelToStart && localR.hunger > 0;
        this.elMbtnJumpR.classList.toggle('flying', !!localR.flying);
        this.elMbtnJumpR.classList.toggle('fly-ready', !localR.flying && canFlyNow);
        if (localR.flying) {
          this.elMbtnJumpRLabel.textContent = '飛行中';
          this.elMbtnJumpRSub.textContent = `${flyPct}%`;
        } else if (canFlyNow) {
          this.elMbtnJumpRLabel.textContent = '長押し飛行';
          this.elMbtnJumpRSub.textContent = 'ホールド';
        } else {
          this.elMbtnJumpRLabel.textContent = 'ジャンプ';
          this.elMbtnJumpRSub.textContent = '長押し飛行';
        }
      }

      let st = '状態: 床を移動中';
      if (isSpectating) st = `観戦中（${r.name}）`;
      else if (r.flying) st = '状態: 緊急飛行中！（羽音で位置露見）';
      else if (r.hunger <= 0) st = '危険: 飢餓ダメージ中！食べかすへ！';
      else if (r.poisonTimer > 0) st = '異常: 毒で鈍足＆ダッシュ不可（登攀・飛行可）';
      else if (r.poisonBuild > 5) st = `注意: スプレー毒蓄積中（${Math.round(r.poisonBuild)}%）`;
      else if (r.hunger <= 30) st = '警告: 空腹で音が発生中（位置露見）';
      else if (r.surface === 'wall') st = '状態: 家具の側面を登攀中';
      else if (this.state.isUnderFurniture(r.x, r.z, r.y)) st = '状態: 家具の下に潜伏中';
      else if (r.surface === 'furniture_top') st = '状態: 家具の上';
      this.elRoachState.textContent = st;

      this.elIndicatorLayer.innerHTML = '';
      this.elDmgVignette.style.opacity = String(clamp(r.damageFlash * 2.2, 0, 0.85));
      const poisonOp = !r.alive
        ? 0
        : (r.poisonTimer > 0 ? 0.68 : clamp((r.poisonBuild / 100) * 0.36, 0, 0.36));
      this.elPoisonVignette.style.opacity = String(poisonOp);
      this.elStarveVignette.classList.toggle('pulsing', r.hunger <= 0 && r.alive);
    }
  }

  renderHumanIndicators(h) {
    let html = '';
    for (const a of this.state.alerts) {
      const worldAngle = Math.atan2(-(a.x - h.x), -(a.z - h.z));
      const deg = (-angleDiff(h.yaw, worldAngle) * 180) / Math.PI;
      const op = clamp(a.ttl / a.maxTtl, 0.15, 0.95);
      const cls = a.type === 'hungry' ? 'dir-arrow hungry' : (a.type === 'fly' ? 'dir-arrow fly' : 'dir-arrow');
      html += `<div class="dir-indicator" style="transform: rotate(${deg.toFixed(1)}deg); opacity: ${op.toFixed(2)};"><div class="${cls}"></div></div>`;
    }
    this.elIndicatorLayer.innerHTML = html;
  }

  loop(now) {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    const timeSec = now * 0.001;
    const prevMode = this.state.mode;

    if (this.state.mode === 'playing') this.syncInputToState();
    this.state.update(dt);
    this.handleStateEvents();

    if (this.state.networkMode === 'host' && (this.state.urgentSyncNeeded || (prevMode === 'playing' && this.state.mode === 'result'))) {
      this.state.urgentSyncNeeded = false;
      this.online.flushStateNow(this.state);
    } else {
      this.online.tickSync(dt, this.state);
    }

    this.renderer.render(this.state, dt, timeSec);
    this.updateHUD(dt);

    if (prevMode === 'playing' && this.state.mode === 'result') {
      this.showResultScreen();
    }
    requestAnimationFrame(this.loop);
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => new GameApp());
} else {
  new GameApp();
}
