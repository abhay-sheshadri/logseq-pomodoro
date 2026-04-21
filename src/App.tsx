import React, { useState, useEffect, useRef, useCallback } from "react";
import TimerDisplay from "./components/TimerDisplay";
import TimerControls from "./components/TimerControls";
import SessionNotes from "./components/SessionNotes";
import SessionHistory from "./components/SessionHistory";
import { TimerPhase, WORK_DURATION, BREAK_DURATION } from "./lib/timer";
import {
  TodoBlock,
  CompletedTodo,
  ProgressEntry,
  SessionLog,
  getTodayTodos,
  markTodoDone,
  markTodoDoing,
  markTodoOpen,
  addTodoToToday,
  formatTimeOfDay,
  logSessionToDaily,
  logDailySummary,
} from "./lib/logseq-api";
import { playWorkComplete, playBreakComplete } from "./lib/sounds";

const App: React.FC = () => {
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionNumber, setSessionNumber] = useState(0);

  const [focus, setFocus] = useState("");
  const [todos, setTodos] = useState<TodoBlock[]>([]);
  const [completedUuids, setCompletedUuids] = useState<Set<string>>(new Set());
  const [sessionCompleted, setSessionCompleted] = useState<CompletedTodo[]>([]);
  const [progressUuids, setProgressUuids] = useState<Set<string>>(new Set());

  const [sessions, setSessions] = useState<SessionLog[]>([]);

  const sessionStartRef = useRef<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTodos = useCallback(async () => {
    const items = await getTodayTodos();
    setTodos(items);
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const buildProgressEntries = useCallback((): ProgressEntry[] => {
    const entries: ProgressEntry[] = [];
    for (const uuid of progressUuids) {
      if (completedUuids.has(uuid)) continue;
      const todo = todos.find((t) => t.uuid === uuid);
      if (todo) {
        entries.push({ uuid: todo.uuid, content: todo.content });
      }
    }
    return entries;
  }, [progressUuids, completedUuids, todos]);

  const finishWorkSession = useCallback(async () => {
    clearTimer();
    playWorkComplete();

    const endTime = new Date();
    const startTime = sessionStartRef.current ?? endTime;

    const session: SessionLog = {
      sessionNumber,
      startTime: formatTimeOfDay(startTime),
      endTime: formatTimeOfDay(endTime),
      focus,
      completed: [...sessionCompleted],
      progress: buildProgressEntries(),
    };

    setSessions((prev) => [...prev, session]);
    await logSessionToDaily(session);

    setSessionCompleted([]);
    setProgressUuids(new Set());
    setFocus("");

    setPhase("break");
    setSecondsLeft(BREAK_DURATION);
    setIsRunning(true);
    sessionStartRef.current = new Date();
  }, [clearTimer, sessionNumber, focus, sessionCompleted, buildProgressEntries]);

  const finishBreak = useCallback(() => {
    clearTimer();
    playBreakComplete();
    setPhase("idle");
    setSecondsLeft(WORK_DURATION);
    setIsRunning(false);
    sessionStartRef.current = null;
  }, [clearTimer]);

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (phase === "work") finishWorkSession();
          else if (phase === "break") finishBreak();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [isRunning, phase, clearTimer, finishWorkSession, finishBreak]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        logseq.hideMainUI({ restoreEditingCursor: true });
      }
      if (
        e.key === " " &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        if (phase === "idle") handleStart();
        else if (isRunning) setIsRunning(false);
        else setIsRunning(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [phase, isRunning]);

  const handleStart = async () => {
    await fetchTodos();
    const next = sessionNumber + 1;
    setSessionNumber(next);
    setPhase("work");
    setSecondsLeft(WORK_DURATION);
    setIsRunning(true);
    sessionStartRef.current = new Date();
    setFocus("");
    setSessionCompleted([]);
    setCompletedUuids(new Set());
    setProgressUuids(new Set());
  };

  const handleSkip = () => {
    if (phase === "work") finishWorkSession();
    else if (phase === "break") finishBreak();
  };

  const handleReset = () => {
    clearTimer();
    setPhase("idle");
    setSecondsLeft(WORK_DURATION);
    setIsRunning(false);
    setSessionNumber(0);
    setFocus("");
    setTodos([]);
    setCompletedUuids(new Set());
    setSessionCompleted([]);
    setProgressUuids(new Set());
    setSessions([]);
    sessionStartRef.current = null;
  };

  const handleCompleteTodo = async (uuid: string) => {
    if (completedUuids.has(uuid)) return;
    await markTodoDone(uuid);
    const todo = todos.find((t) => t.uuid === uuid);
    if (todo) {
      setSessionCompleted((prev) => [
        ...prev,
        { uuid: todo.uuid, content: todo.content },
      ]);
    }
    setCompletedUuids((prev) => new Set(prev).add(uuid));
  };

  const handleUncompleteTodo = async (uuid: string) => {
    await markTodoOpen(uuid);
    setCompletedUuids((prev) => {
      const next = new Set(prev);
      next.delete(uuid);
      return next;
    });
    setSessionCompleted((prev) => prev.filter((t) => t.uuid !== uuid));
  };

  const handleToggleProgress = async (uuid: string) => {
    if (progressUuids.has(uuid)) {
      await markTodoOpen(uuid);
      setProgressUuids((prev) => {
        const next = new Set(prev);
        next.delete(uuid);
        return next;
      });
    } else {
      await markTodoDoing(uuid);
      setProgressUuids((prev) => new Set(prev).add(uuid));
    }
  };

  const handleAddTodo = async (content: string) => {
    const todo = await addTodoToToday(content);
    if (todo) {
      setTodos((prev) => [...prev, todo]);
    }
  };

  const handleLogSummary = async () => {
    const totalCompleted = sessions.reduce(
      (sum, s) => sum + s.completed.length,
      0
    );
    const totalInProgress = sessions.reduce(
      (sum, s) => sum + s.progress.length,
      0
    );
    await logDailySummary(
      sessions.length,
      sessions.length * 50,
      totalCompleted,
      totalInProgress
    );
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("pomodoro-backdrop")) {
      logseq.hideMainUI({ restoreEditingCursor: true });
    }
  };

  return (
    <div className="pomodoro-backdrop" onClick={handleBackdropClick}>
      <div className="pomodoro-dashboard">
        <div className="pomodoro-title-bar">
          <h1 className="pomodoro-title">Pomodoro Timer</h1>
          <span className="pomodoro-split-label">50 / 10</span>
          <button
            className="pomodoro-close"
            onClick={() => logseq.hideMainUI({ restoreEditingCursor: true })}
            title="Close (Esc)"
          >
            &times;
          </button>
        </div>

        <div className="pomodoro-body">
          <div className="pomodoro-timer-section">
            <TimerDisplay
              phase={phase}
              secondsLeft={secondsLeft}
              sessionNumber={sessionNumber}
              isRunning={isRunning}
            />
            <TimerControls
              phase={phase}
              isRunning={isRunning}
              onStart={handleStart}
              onPause={() => setIsRunning(false)}
              onResume={() => setIsRunning(true)}
              onSkip={handleSkip}
              onReset={handleReset}
            />
          </div>

          {phase !== "idle" && (
            <div className="pomodoro-notes-section">
              <SessionNotes
                focus={focus}
                todos={todos}
                completedUuids={completedUuids}
                progressUuids={progressUuids}
                onSetFocus={setFocus}
                onCompleteTodo={handleCompleteTodo}
                onUncompleteTodo={handleUncompleteTodo}
                onToggleProgress={handleToggleProgress}
                onAddTodo={handleAddTodo}
              />
            </div>
          )}
        </div>

        <SessionHistory sessions={sessions} onLogSummary={handleLogSummary} />
      </div>
    </div>
  );
};

export default App;
