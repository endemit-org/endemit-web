/** Original procedural prototype sound. No media fetches, microphone, or artist recordings. */
export class ForestSoundscape {
  private context: AudioContext;
  private master: GainNode;
  private music: BiquadFilterNode;
  private nature: GainNode;
  private crickets: GainNode;
  private cricketVoices = [
    { frequency: 4350, pan: -0.7, gap: 0.62, next: 0 },
    { frequency: 4720, pan: 0.55, gap: 0.81, next: 0 },
    { frequency: 4080, pan: 0.15, gap: 1.07, next: 0 },
  ];
  private spatial: PannerNode;
  private timer: ReturnType<typeof setInterval> | undefined;
  private nextBeat = 0;
  private step = 0;
  private disposed = false;
  private enabled = false;
  private volume = 0.45;

  constructor() {
    this.context = new AudioContext();
    const ctx = this.context;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    this.music = ctx.createBiquadFilter();
    this.music.type = "lowpass";
    this.music.frequency.value = 220;
    this.music.Q.value = 0.55;
    this.spatial = ctx.createPanner();
    this.spatial.panningModel = "HRTF";
    this.spatial.distanceModel = "inverse";
    this.spatial.refDistance = 1;
    this.spatial.rolloffFactor = 0.16;
    this.spatial.positionZ.value = -8;
    this.music.connect(this.spatial).connect(this.master);
    this.nature = ctx.createGain();
    this.nature.gain.value = 0.09;
    this.nature.connect(this.master);
    this.crickets = ctx.createGain();
    this.crickets.gain.value = 0.2;
    this.crickets.connect(this.master);

    const buffer = ctx.createBuffer(2, ctx.sampleRate * 4, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        last = (last + (Math.random() * 2 - 1) * 0.025) / 1.025;
        data[i] = last * 6;
      }
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const water = ctx.createBiquadFilter();
    water.type = "lowpass";
    water.frequency.value = 2100;
    source.connect(water).connect(this.nature);
    source.start();
  }

  async setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (this.disposed) return;
    if (enabled && !document.hidden) {
      await this.context.resume();
      if (!this.enabled || this.disposed) return;
      this.master.gain.setTargetAtTime(
        this.volume,
        this.context.currentTime,
        0.2
      );
      this.nextBeat = this.context.currentTime + 0.04;
      if (!this.timer) this.timer = setInterval(() => this.schedule(), 80);
    } else {
      this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.035);
      if (this.timer) clearInterval(this.timer);
      this.timer = undefined;
      await this.context.suspend();
    }
  }

  setVolume(value: number) {
    this.volume = value;
    if (this.enabled)
      this.master.gain.setTargetAtTime(value, this.context.currentTime, 0.1);
  }

  setProgress(progress: number) {
    if (this.disposed) return;
    const p = Math.min(1, Math.max(0, progress));
    this.spatial.positionX.setTargetAtTime(
      Math.sin(p * Math.PI * 2) * 2.2,
      this.context.currentTime,
      0.8
    );
    this.spatial.positionZ.setTargetAtTime(
      -8 + p * 6.5,
      this.context.currentTime,
      0.8
    );
    const clarity = Math.pow(Math.min(1, p / 0.85), 2);
    this.music.frequency.setTargetAtTime(
      180 + clarity * 5200,
      this.context.currentTime,
      0.45
    );
    const river = Math.exp(-Math.pow((p - 0.34) * 7, 2));
    this.nature.gain.setTargetAtTime(
      0.055 + river * 0.11,
      this.context.currentTime,
      0.6
    );
    // Crickets stay faint on the way down and take over at the bottom.
    const night = Math.min(1, Math.max(0, (p - 0.5) / 0.45));
    this.crickets.gain.setTargetAtTime(
      0.2 + night * night * 0.8,
      this.context.currentTime,
      0.6
    );
  }

  private tone(
    time: number,
    frequency: number,
    duration: number,
    gain: number,
    type: OscillatorType,
    endFrequency?: number
  ) {
    const ctx = this.context;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    if (endFrequency)
      oscillator.frequency.exponentialRampToValueAtTime(
        endFrequency,
        time + duration
      );
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(gain, time + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(envelope).connect(this.music);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }

  /** One cricket chirp: a few short pulses of a high sine. */
  private chirp(time: number, frequency: number, pan: number) {
    const ctx = this.context;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    const panner = ctx.createStereoPanner();
    oscillator.frequency.value = frequency * (0.99 + Math.random() * 0.02);
    panner.pan.value = pan;
    envelope.gain.setValueAtTime(0, time);
    const pulses = Math.random() < 0.35 ? 4 : 3;
    for (let i = 0; i < pulses; i++) {
      const start = time + i * 0.034;
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(0.05, start + 0.006);
      envelope.gain.linearRampToValueAtTime(0, start + 0.022);
    }
    oscillator.connect(envelope).connect(panner).connect(this.crickets);
    oscillator.start(time);
    oscillator.stop(time + pulses * 0.034 + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      panner.disconnect();
    };
  }

  private schedule() {
    const ctx = this.context;
    if (!this.enabled || ctx.state !== "running") return;
    if (this.nextBeat < ctx.currentTime) this.nextBeat = ctx.currentTime + 0.02;
    while (this.nextBeat < ctx.currentTime + 0.2) {
      const t = this.nextBeat;
      if (this.step % 4 === 0) this.tone(t, 115, 0.32, 0.32, "sine", 43);
      if (this.step % 2 === 1)
        this.tone(t, 4900, 0.035, 0.018, "triangle", 3200);
      if ([0, 3, 6, 10, 14].includes(this.step % 16)) {
        const notes = [110, 130.81, 146.83, 164.81];
        this.tone(
          t,
          notes[Math.floor(this.step / 16) % 4],
          0.38,
          0.042,
          "triangle"
        );
      }
      this.nextBeat += 60 / 124 / 4;
      this.step++;
    }
    for (const voice of this.cricketVoices) {
      if (voice.next < ctx.currentTime)
        voice.next = ctx.currentTime + Math.random() * voice.gap;
      while (voice.next < ctx.currentTime + 0.2) {
        this.chirp(voice.next, voice.frequency, voice.pan);
        voice.next += voice.gap * (0.92 + Math.random() * 0.16);
        // Now and then a cricket goes quiet for a moment.
        if (Math.random() < 0.07) voice.next += 1.5 + Math.random() * 3;
      }
    }
  }

  dispose() {
    this.disposed = true;
    if (this.timer) clearInterval(this.timer);
    void this.context.close();
  }
}
