import React from "react";
import { TimerPhase, formatTime, phaseLabel, phaseDuration } from "../lib/timer";
import "./TimerDisplay.css";

interface TimerDisplayProps {
  phase: TimerPhase;
  secondsLeft: number;
  sessionNumber: number;
  isRunning: boolean;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  phase,
  secondsLeft,
  sessionNumber,
  isRunning,
}) => {
  const total = phaseDuration(phase);
  const progress = phase === "idle" ? 0 : 1 - secondsLeft / total;
  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="timer-display">
      <div className="timer-ring-container">
        <svg className="timer-ring" viewBox="0 0 260 260">
          <circle
            className="timer-ring-bg"
            cx="130"
            cy="130"
            r="120"
            fill="none"
            strokeWidth="6"
          />
          <circle
            className={`timer-ring-progress ${phase}`}
            cx="130"
            cy="130"
            r="120"
            fill="none"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 130 130)"
          />
        </svg>

        <div className="timer-inner">
          <span className={`timer-phase-label ${phase}`}>
            {phaseLabel(phase)}
          </span>
          <span className={`timer-time ${isRunning ? "running" : ""}`}>
            {formatTime(secondsLeft)}
          </span>
          {sessionNumber > 0 && (
            <span className="timer-session-count">
              Session {sessionNumber}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimerDisplay;
