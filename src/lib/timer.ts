export type TimerPhase = "work" | "break" | "idle";

export const WORK_DURATION = 50 * 60; // 50 minutes in seconds
export const BREAK_DURATION = 10 * 60; // 10 minutes in seconds

export interface TimerState {
  phase: TimerPhase;
  secondsLeft: number;
  sessionNumber: number;
  isRunning: boolean;
}

export function initialTimerState(): TimerState {
  return {
    phase: "idle",
    secondsLeft: WORK_DURATION,
    sessionNumber: 0,
    isRunning: false,
  };
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function phaseLabel(phase: TimerPhase): string {
  switch (phase) {
    case "work":
      return "Focus";
    case "break":
      return "Break";
    case "idle":
      return "Ready";
  }
}

export function phaseDuration(phase: TimerPhase): number {
  return phase === "break" ? BREAK_DURATION : WORK_DURATION;
}
