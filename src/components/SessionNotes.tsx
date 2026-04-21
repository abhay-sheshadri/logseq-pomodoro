import React, { useState } from "react";
import { TodoBlock } from "../lib/logseq-api";
import "./SessionNotes.css";

interface SessionNotesProps {
  focus: string;
  todos: TodoBlock[];
  completedUuids: Set<string>;
  progressUuids: Set<string>;
  progressNotes: Map<string, string>;
  interruptions: number;
  onSetFocus: (focus: string) => void;
  onCompleteTodo: (uuid: string) => void;
  onProgressTodo: (uuid: string) => void;
  onSetProgressNote: (uuid: string, note: string) => void;
  onAddTodo: (content: string) => void;
  onInterrupt: () => void;
}

const SessionNotes: React.FC<SessionNotesProps> = ({
  focus,
  todos,
  completedUuids,
  progressUuids,
  progressNotes,
  interruptions,
  onSetFocus,
  onCompleteTodo,
  onProgressTodo,
  onSetProgressNote,
  onAddTodo,
  onInterrupt,
}) => {
  const [newTodo, setNewTodo] = useState("");
  const [expandedUuid, setExpandedUuid] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTodo.trim();
    if (!text) return;
    onAddTodo(text);
    setNewTodo("");
  };

  const handleProgressClick = (uuid: string) => {
    if (!progressUuids.has(uuid)) {
      onProgressTodo(uuid);
    }
    setExpandedUuid(expandedUuid === uuid ? null : uuid);
  };

  const pending = todos.filter(
    (t) => !completedUuids.has(t.uuid) && !progressUuids.has(t.uuid)
  );
  const inProgress = todos.filter(
    (t) => progressUuids.has(t.uuid) && !completedUuids.has(t.uuid)
  );
  const done = todos.filter((t) => completedUuids.has(t.uuid));

  const doneCount = completedUuids.size;
  const progressCount = inProgress.length;

  return (
    <div className="session-panel">
      <div className="focus-section">
        <label className="section-label">Focus</label>
        <input
          type="text"
          className="focus-input"
          value={focus}
          onChange={(e) => onSetFocus(e.target.value)}
          placeholder="What's the goal for this session?"
        />
      </div>

      <div className="todos-section">
        <label className="section-label">
          TODOs
          {todos.length > 0 && (
            <span className="todo-count">
              {doneCount} done
              {progressCount > 0 && `, ${progressCount} in progress`}
            </span>
          )}
        </label>

        <div className="todo-list">
          {pending.map((todo) => (
            <TodoRow
              key={todo.uuid}
              todo={todo}
              status="pending"
              expanded={expandedUuid === todo.uuid}
              progressNote={progressNotes.get(todo.uuid) ?? ""}
              onComplete={() => onCompleteTodo(todo.uuid)}
              onProgress={() => handleProgressClick(todo.uuid)}
              onSetNote={(note) => onSetProgressNote(todo.uuid, note)}
            />
          ))}
          {inProgress.map((todo) => (
            <TodoRow
              key={todo.uuid}
              todo={todo}
              status="doing"
              expanded={expandedUuid === todo.uuid}
              progressNote={progressNotes.get(todo.uuid) ?? ""}
              onComplete={() => onCompleteTodo(todo.uuid)}
              onProgress={() => handleProgressClick(todo.uuid)}
              onSetNote={(note) => onSetProgressNote(todo.uuid, note)}
            />
          ))}
          {done.map((todo) => (
            <div key={todo.uuid} className="todo-row done">
              <span className="todo-checkbox checked" />
              <span className="todo-text">{todo.content}</span>
            </div>
          ))}
          {todos.length === 0 && (
            <p className="todo-empty">No TODOs for today yet</p>
          )}
        </div>

        <form className="todo-add-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="todo-add-input"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a TODO..."
          />
          <button
            type="submit"
            className="todo-add-btn"
            disabled={!newTodo.trim()}
          >
            Add
          </button>
        </form>
      </div>

      <div className="interrupt-section">
        <button className="interrupt-btn" onClick={onInterrupt}>
          + Interruption
        </button>
        {interruptions > 0 && (
          <span className="interrupt-count">{interruptions}</span>
        )}
      </div>
    </div>
  );
};

interface TodoRowProps {
  todo: TodoBlock;
  status: "pending" | "doing";
  expanded: boolean;
  progressNote: string;
  onComplete: () => void;
  onProgress: () => void;
  onSetNote: (note: string) => void;
}

const TodoRow: React.FC<TodoRowProps> = ({
  todo,
  status,
  expanded,
  progressNote,
  onComplete,
  onProgress,
  onSetNote,
}) => {
  return (
    <div className={`todo-row-wrapper ${status}`}>
      <div className="todo-row">
        <button
          className="todo-checkbox-btn"
          onClick={onComplete}
          title="Mark done"
        >
          <span className="todo-checkbox" />
        </button>
        <span className="todo-text">{todo.content}</span>
        <button
          className={`todo-progress-btn ${status === "doing" ? "active" : ""}`}
          onClick={onProgress}
          title={status === "doing" ? "Edit progress note" : "Mark in progress"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </button>
      </div>
      {expanded && (
        <div className="progress-note-row">
          <input
            type="text"
            className="progress-note-input"
            value={progressNote}
            onChange={(e) => onSetNote(e.target.value)}
            placeholder="Where did you leave off?"
            autoFocus
          />
        </div>
      )}
      {!expanded && status === "doing" && progressNote && (
        <div className="progress-note-preview" onClick={onProgress}>
          {progressNote}
        </div>
      )}
    </div>
  );
};

export default SessionNotes;
