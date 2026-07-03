type ToneOptions = {
  frequency: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
  attack?: number;
  decay?: number;
  lowPass?: number;
};

type AudioContextWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

class GameAudioController {
  private audioContext: AudioContext | null = null;
  private wheelTimers: number[] = [];

  private getContext() {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextClass =
      window.AudioContext || (window as AudioContextWindow).webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!this.audioContext) {
      this.audioContext = new AudioContextClass();
    }

    if (this.audioContext.state === "suspended") {
      void this.audioContext.resume();
    }

    return this.audioContext;
  }

  private playTone({
    frequency,
    duration,
    gain,
    type = "triangle",
    attack = 0.004,
    decay = duration,
    lowPass = 1800,
  }: ToneOptions) {
    const context = this.getContext();

    if (!context) {
      return;
    }

    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const filter = context.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(context.destination);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(lowPass, context.currentTime);
    oscillator.type = type;
    oscillator.frequency.value = frequency;

    envelope.gain.setValueAtTime(0.0001, context.currentTime);
    envelope.gain.exponentialRampToValueAtTime(gain, context.currentTime + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + decay);

    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.03);
  }

  stopWheelSpin() {
    this.wheelTimers.forEach((timerId) => window.clearTimeout(timerId));
    this.wheelTimers = [];
  }

  startWheelSpin(tickCount: number, durationMs: number) {
    this.stopWheelSpin();

    const safeTickCount = Math.max(8, tickCount);

    for (let index = 0; index < safeTickCount; index += 1) {
      const progress = index / Math.max(1, safeTickCount - 1);
      const eased = 1 - (1 - progress) ** 2.6;
      const delay = Math.round(eased * durationMs);

      const timerId = window.setTimeout(() => {
        this.playTone({
          frequency: 520 - progress * 100,
          duration: 0.055,
          gain: 0.028 - progress * 0.008,
          type: "triangle",
          attack: 0.003,
          decay: 0.05,
          lowPass: 950,
        });

        window.setTimeout(() => {
          this.playTone({
            frequency: 260 - progress * 30,
            duration: 0.045,
            gain: 0.012,
            type: "sine",
            attack: 0.002,
            decay: 0.04,
            lowPass: 700,
          });
        }, 5);
      }, delay);

      this.wheelTimers.push(timerId);
    }
  }

  confirmWheelResult() {
    this.playTone({
      frequency: 640,
      duration: 0.16,
      gain: 0.032,
      type: "triangle",
      attack: 0.005,
      decay: 0.13,
      lowPass: 1300,
    });

    window.setTimeout(() => {
      this.playTone({
        frequency: 420,
        duration: 0.18,
        gain: 0.016,
        type: "sine",
        attack: 0.004,
        decay: 0.15,
        lowPass: 900,
      });
    }, 22);
  }

  playCountdownTick(second: number) {
    this.playTone({
      frequency: second <= 3 ? 880 : 760,
      duration: 0.05,
      gain: 0.03,
      type: "triangle",
      attack: 0.003,
      decay: 0.045,
      lowPass: 1200,
    });
  }

  playRoundEnd() {
    this.playTone({
      frequency: 520,
      duration: 0.12,
      gain: 0.035,
      type: "triangle",
      attack: 0.004,
      decay: 0.11,
      lowPass: 1300,
    });

    window.setTimeout(() => {
      this.playTone({
        frequency: 360,
        duration: 0.2,
        gain: 0.018,
        type: "sine",
        attack: 0.005,
        decay: 0.16,
        lowPass: 900,
      });
    }, 70);
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((note, index) => {
      window.setTimeout(() => {
        this.playTone({
          frequency: note,
          duration: 0.2,
          gain: 0.028,
          type: "triangle",
          attack: 0.005,
          decay: 0.18,
          lowPass: 1600,
        });
      }, index * 110);
    });
  }
}

export const gameAudio = new GameAudioController();
