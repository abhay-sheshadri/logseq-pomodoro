let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, volume = 0.3) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.value = volume;

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

function notify(title: string, body: string) {
  try {
    if (Notification.permission === "granted") {
      new Notification(title, { body, silent: true });
    }
  } catch {
    // Notifications not available
  }
}

export function requestNotificationPermission() {
  try {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  } catch {
    // Notifications not available
  }
}

export function playWorkComplete() {
  playTone(880, 0.15);
  setTimeout(() => playTone(1100, 0.15), 180);
  setTimeout(() => playTone(1320, 0.25), 360);
  notify("Focus session complete", "Time for a 10 minute break.");
}

export function playBreakComplete() {
  playTone(660, 0.2);
  setTimeout(() => playTone(880, 0.3), 250);
  notify("Break over", "Ready for another session?");
}
