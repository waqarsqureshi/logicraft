/**
 * Web Audio Sound Generator for Buzzer and Feedback
 */

class SoundController {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private isPlaying: boolean = false;
  private muted: boolean = false;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (muted && this.isPlaying) {
      this.stopBuzzer();
    }
  }

  public getMuted(): boolean {
    return this.muted;
  }

  public startBuzzer(freq: number = 880) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (this.isPlaying) return;

    try {
      this.osc = this.ctx.createOscillator();
      this.gain = this.ctx.createGain();

      this.osc.type = 'sine';
      this.osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      this.gain.gain.setValueAtTime(0.08, this.ctx.currentTime); // gentle volume

      this.osc.connect(this.gain);
      this.gain.connect(this.ctx.destination);

      this.osc.start();
      this.isPlaying = true;
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  public stopBuzzer() {
    if (!this.isPlaying || !this.osc) return;
    try {
      this.osc.stop();
      this.osc.disconnect();
      this.osc = null;
      this.isPlaying = false;
    } catch {
      this.isPlaying = false;
    }
  }

  public playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {}
  }
}

export const soundFx = new SoundController();
