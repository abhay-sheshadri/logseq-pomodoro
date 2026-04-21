import React from "react";
import { SessionLog } from "../lib/logseq-api";
import "./SessionHistory.css";

interface SessionHistoryProps {
  sessions: SessionLog[];
  onLogSummary: () => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  onLogSummary,
}) => {
  if (sessions.length === 0) return null;

  const totalCompleted = sessions.reduce(
    (sum, s) => sum + s.completed.length,
    0
  );
  const totalProgress = sessions.reduce(
    (sum, s) => sum + s.progress.length,
    0
  );

  return (
    <div className="session-history">
      <div className="history-header">
        <span className="history-title">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          <span className="history-dot" />
          {totalCompleted} done
          {totalProgress > 0 && (
            <>
              <span className="history-dot" />
              {totalProgress} in progress
            </>
          )}
        </span>
        <button className="history-log-btn" onClick={onLogSummary}>
          Log Summary
        </button>
      </div>

      <div className="history-list">
        {sessions.map((s, i) => (
          <div key={i} className="history-item">
            <div className="history-item-header">
              <span className="history-number">#{s.sessionNumber}</span>
              <span className="history-time">
                {s.startTime} - {s.endTime}
              </span>
              {s.focus && (
                <span className="history-focus">{s.focus}</span>
              )}
            </div>
            {s.completed.length > 0 && (
              <div className="history-entries">
                {s.completed.map((todo, j) => (
                  <span key={j} className="history-entry done">
                    {todo.content}
                  </span>
                ))}
              </div>
            )}
            {s.progress.length > 0 && (
              <div className="history-entries">
                {s.progress.map((entry, j) => (
                  <span key={j} className="history-entry progress">
                    {entry.content}
                    {entry.note && (
                      <span className="history-entry-note">
                        {" "}&mdash; {entry.note}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionHistory;
