import React from "react";
import { TimerPhase } from "../lib/timer";
import "./TimerControls.css";

interface TimerControlsProps {
  phase: TimerPhase;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onReset: () => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  phase,
  isRunning,
  onStart,
  onPause,
  onResume,
  onSkip,
  onReset,
}) => {
  return (
    <div className="timer-controls">
      {phase === "idle" ? (
        <button className="ctrl-btn primary" onClick={onStart}>
          Start Focus
        </button>
      ) : (
        <>
          {isRunning ? (
            <button className="ctrl-btn secondary" onClick={onPause}>
              Pause
            </button>
          ) : (
            <button className="ctrl-btn primary" onClick={onResume}>
              Resume
            </button>
          )}
          <button className="ctrl-btn ghost" onClick={onSkip} title="Skip to next phase">
            Skip
          </button>
          <button className="ctrl-btn ghost" onClick={onReset} title="Reset timer">
            Reset
          </button>
        </>
      )}
    </div>
  );
};

export default TimerControls;
