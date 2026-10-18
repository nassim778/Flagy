/**
 * AudioEngine.js
 * 100% procedural WebAudio synthesis for Flag Finder: World Tour.
 * Requires zero external audio files. Generates rich, travel-themed soundscapes.
 */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.isMuted = false;
    this.isAdMuted = false;
    this.ambientOsc = null;
    this.ambientGain = null;
    this.initialized = false;
  }

  /**
   * Initializes AudioContext upon user gesture.
   */
  init() {
    if (this.initialized) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initialized = true;
    } catch (err) {
      // AudioContext unavailable or restricted
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    this.updateGain();
  }

  setAdMuted(adMuted) {
    this.isAdMuted = Boolean(adMuted);
    this.updateGain();
  }

  updateGain() {
    if (!this.masterGain || !this.ctx) return;
    const effectiveMute = this.isMuted || this.isAdMuted;
    const targetGain = effectiveMute ? 0.0 : 1.0;
    this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
  }

  /**
   * Subtle UI click sound.
   */
  playClick() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.04);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  /**
   * Correct country guess - cheerful melodic chime arpeggio.
   */
  playCorrect() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  /**
   * Incorrect country guess - soft, informative low thud.
   */
  playWrong() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * Near miss / warmer-colder sound: pitch varies by distance factor (0.0=cold, 1.0=very warm).
   */
  playProximity(warmthFactor = 0.5) {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const minFreq = 220; // A3
    const maxFreq = 660; // E5
    const freq = minFreq + (maxFreq - minFreq) * Math.max(0, Math.min(1, warmthFactor));

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.linearRampToValueAtTime(freq * 1.05, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  /**
   * Paper airplane whoosh sound: bandpass-filtered noise + rising resonance.
   */
  playPlaneWhoosh() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.25);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.45);
    filter.Q.setValueAtTime(3.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.45);
  }

  /**
   * Passport rubber stamp impact sound: low pop + punchy resonance.
   */
  playStamp() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;

    const t = this.ctx.currentTime;

    // Body thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);

    // Click/snap transient
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(800, t);
    snapOsc.frequency.exponentialRampToValueAtTime(200, t + 0.04);

    snapGain.gain.setValueAtTime(0.3, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    snapOsc.connect(snapGain);
    snapGain.connect(this.sfxGain);

    snapOsc.start(t);
    snapOsc.stop(t + 0.04);
  }

  /**
   * Streak fanfare when maintaining high combos (e.g. 5x, 10x).
   */
  playFanfare() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;

    const chords = [
      { f: 523.25, time: 0 },    // C5
      { f: 659.25, time: 0.1 },  // E5
      { f: 783.99, time: 0.2 },  // G5
      { f: 1046.5, time: 0.32 }, // C6
      { f: 1318.5, time: 0.45 }  // E6
    ];

    chords.forEach(({ f, time }) => {
      const t = this.ctx.currentTime + time;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.5);
    });
  }
}
