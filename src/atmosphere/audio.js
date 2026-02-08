/**
 * Ambient audio system
 * Web Audio oscillators + filtered noise = library ventilation hum
 */

export class AmbientAudio {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.enabled = false;
    this.echoTimeout = null;
  }

  _init() {
    if (this.context) return;

    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.context.destination);

    // Low frequency rumble — 45Hz
    const osc1 = this.context.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 45;
    const gain1 = this.context.createGain();
    gain1.gain.value = 0.12;
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start();

    // Very low undertone — 58Hz
    const osc2 = this.context.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 58;
    const gain2 = this.context.createGain();
    gain2.gain.value = 0.08;
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start();

    // Filtered noise (air through shafts)
    const bufferSize = 2 * this.context.sampleRate;
    const noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noiseSource = this.context.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = this.context.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 200;
    const noiseGain = this.context.createGain();
    noiseGain.gain.value = 0.03;

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noiseSource.start();

    // Occasional distant echo bursts
    this._scheduleEcho();
  }

  _scheduleEcho() {
    const delay = 8000 + Math.random() * 20000; // 8-28 seconds
    this.echoTimeout = setTimeout(() => {
      if (!this.enabled || !this.context) return;
      this._playEcho();
      this._scheduleEcho();
    }, delay);
  }

  _playEcho() {
    const osc = this.context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 80 + Math.random() * 60;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, this.context.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 2.5);

    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 3);
  }

  toggle() {
    if (!this.context) this._init();

    this.enabled = !this.enabled;

    if (this.enabled) {
      this.masterGain.gain.linearRampToValueAtTime(
        0.4, this.context.currentTime + 1.0
      );
    } else {
      this.masterGain.gain.linearRampToValueAtTime(
        0, this.context.currentTime + 1.0
      );
    }

    return this.enabled;
  }

  dispose() {
    if (this.echoTimeout) clearTimeout(this.echoTimeout);
    if (this.context) this.context.close();
  }
}
