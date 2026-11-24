let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function ensureAudio(): AudioContext | null {
  if (!soundEnabled) return null;
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainVal = 0.08,
  delay = 0
): void {
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function sfxRotate(): void {
  playTone(440, 0.07, 'triangle', 0.07);
  playTone(660, 0.05, 'sine', 0.04, 0.02);
}

export function sfxSlide(): void {
  playTone(300, 0.07, 'sine', 0.06);
  playTone(520, 0.08, 'triangle', 0.05, 0.03);
}

export function sfxUndo(): void {
  playTone(360, 0.07, 'sine', 0.05);
  playTone(270, 0.08, 'sine', 0.04, 0.02);
}

export function sfxGateOpen(): void {
  playTone(392, 0.12, 'triangle', 0.07);
  playTone(587.33, 0.18, 'sine', 0.06, 0.06);
}

export function sfxGemLit(): void {
  playTone(587.33, 0.16, 'sine', 0.07);
  playTone(880, 0.22, 'triangle', 0.05, 0.05);
}

export function sfxWin(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, i) => playTone(n, 0.35, 'triangle', 0.09, i * 0.08));
}

export function sfxHint(): void {
  playTone(340, 0.12, 'sine', 0.06);
  playTone(510, 0.16, 'sine', 0.06, 0.08);
}

export function sfxTimeOver(): void {
  playTone(330, 0.2, 'sawtooth', 0.06);
  playTone(220, 0.35, 'triangle', 0.07, 0.12);
}
