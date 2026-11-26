import { clamp } from './config.js';

// Web Audio API プロシージャル音声エンジン
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.noiseBuffer = null;
    this.sprayNode = null;
    this.sprayGain = null;
    this.buzzOsc = null;
    this.buzzLfo = null;
    this.buzzGain = null;
    this.muted = false;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      const sr = this.ctx.sampleRate;
      const len = sr * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, len, sr);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } catch (e) {
      this.ctx = null;
    }
  }

  // カウントダウン音（3, 2, 1 は低め、START! は高め）
  playCountdown(isGo = false) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isGo ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
    if (isGo) {
      osc.frequency.exponentialRampToValueAtTime(1174, now + 0.14);
    }
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(isGo ? 0.24 : 0.18, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.32 : 0.18));
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + (isGo ? 0.34 : 0.20));
  }

  playSwish() {
    if (!this.ctx || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.08);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.16);
    filter.Q.value = 1.8;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
    src.stop(now + 0.18);
  }

  playMiss() {
    if (!this.ctx || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.18);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.20);
  }

  playSlap(intensity = 1.0) {
    if (!this.ctx || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const vol = clamp(intensity, 0.25, 1.2);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(155, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.16);
    oscGain.gain.setValueAtTime(0.55 * vol, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.exponentialRampToValueAtTime(340, now + 0.12);
    filter.Q.value = 0.9;

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.48 * vol, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    src.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.ctx.destination);
    src.start(now);
    src.stop(now + 0.16);
  }

  playHit(killed = false) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = killed ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(killed ? 680 : 480, now);
    osc.frequency.exponentialRampToValueAtTime(killed ? 220 : 760, now + (killed ? 0.22 : 0.10));
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (killed ? 0.24 : 0.12));
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  setSprayActive(active, volume = 1.0) {
    if (!this.ctx || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    if (active) {
      if (!this.sprayNode) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        src.loop = true;

        const hp = this.ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 2400;

        const bp = this.ctx.createBiquadFilter();
        bp.type = 'peaking';
        bp.frequency.value = 5200;
        bp.gain.value = 6;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);

        src.connect(hp);
        hp.connect(bp);
        bp.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(now);

        this.sprayNode = src;
        this.sprayGain = gain;
      }
      this.sprayGain.gain.setTargetAtTime(0.14 * clamp(volume, 0.1, 1.0), now, 0.04);
    } else if (this.sprayGain) {
      this.sprayGain.gain.setTargetAtTime(0.0001, now, 0.05);
    }
  }

  setFlyBuzzActive(active, volume = 0.8) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    if (active) {
      if (!this.buzzOsc) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 118;

        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 34;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 14;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 420;
        bp.Q.value = 1.6;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);

        osc.connect(bp);
        bp.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        lfo.start(now);

        this.buzzOsc = osc;
        this.buzzLfo = lfo;
        this.buzzGain = gain;
      }
      this.buzzGain.gain.setTargetAtTime(0.18 * clamp(volume, 0.1, 1.0), now, 0.03);
    } else if (this.buzzGain) {
      this.buzzGain.gain.setTargetAtTime(0.0001, now, 0.05);
    }
  }

  playSkitter(volume = 0.2) {
    if (!this.ctx || !this.noiseBuffer || this.muted || volume <= 0.02) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3400 + Math.random() * 1400, now);
    filter.Q.value = 4.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09 * clamp(volume, 0, 1), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
    src.stop(now + 0.05);
  }

  playHungry(volume = 0.6) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.linearRampToValueAtTime(92, now + 0.42);

    lfo.frequency.value = 26;
    lfoGain.gain.value = 18;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16 * clamp(volume, 0.15, 1), now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    osc.connect(lp);
    lp.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + 0.5);
    lfo.stop(now + 0.5);
  }

  playEat() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playRefill() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    [440, 660, 880].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.16, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.15);
    });
  }

  playTrainClack(volume = 0.08) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const playBeat = (offset, freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + offset);
      osc.frequency.exponentialRampToValueAtTime(34, now + offset + 0.09);
      gain.gain.setValueAtTime(volume, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.11);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.12);
    };
    playBeat(0.0, 92);
    playBeat(0.13, 78);
  }
}
