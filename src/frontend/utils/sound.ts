// Sound utility to play a 4-5 second audio chime upon successful SERP ranking checks

export function playRankingSuccessSound(): void {
  try {
    // Primary: Play the user's custom MP3 audio file
    const audio = new Audio('/ranking-success.mp3');
    audio.volume = 0.8;
    audio.currentTime = 0;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('MP3 playback notice:', err);
        synthFallbackChime();
      });
    }
  } catch (err) {
    console.warn('Audio play error:', err);
    synthFallbackChime();
  }
}

// Failsafe Web Audio API synthesizer for 4.5s harmonic chime
function synthFallbackChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const notes = [
      { start: 0.0, freq: 523.25, duration: 2.0 },  // C5
      { start: 0.5, freq: 659.25, duration: 2.0 },  // E5
      { start: 1.0, freq: 783.99, duration: 2.5 },  // G5
      { start: 1.5, freq: 1046.50, duration: 3.0 }  // C6
    ];

    const now = ctx.currentTime;

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      // Envelope: Instant attack, smooth exponential decay
      gain.gain.setValueAtTime(0.25, now + n.start);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.start);
      osc.stop(now + n.start + n.duration);
    });

    // Close audio context after 4.8s
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 4800);
  } catch (e) {
    console.error('Web Audio API synth failed:', e);
  }
}
