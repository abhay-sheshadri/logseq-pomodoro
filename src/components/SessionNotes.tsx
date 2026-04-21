import React, { useState } from "react";
import { TodoBlock } from "../lib/logseq-api";
import "./SessionNotes.css";

interface SessionNotesProps {
  focus: string;
  todos: TodoBlock[];
  completedUuids: Set<string>;
  progressUuids: Set<string>;
  onSetFocus: (focus: string) => void;
  onCompleteTodo: (uuid: string) => void;
  onUncompleteTodo: (uuid: string) => void;
  onToggleProgress: (uuid: string) => void;
  onAddTodo: (content: string) => void;
}

const SessionNotes: React.FC<SessionNotesProps> = ({
  focus,
  todos,
  completedUuids,
  progressUuids,
  onSetFocus,
  onCompleteTodo,
  onUncompleteTodo,
  onToggleProgress,
  onAddTodo,
}) => {
  const [newTodo, setNewTodo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTodo.trim();
    if (!text) return;
    onAddTodo(text);
    setNewTodo("");
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
            <div key={todo.uuid} className="todo-row-wrapper">
              <div className="todo-row">
                <button
                  className="todo-checkbox-btn"
                  onClick={() => onCompleteTodo(todo.uuid)}
                  title="Mark done"
                >
                  <span className="todo-checkbox" />
                </button>
                <button
                  className="todo-doing-btn"
                  onClick={() => onToggleProgress(todo.uuid)}
                  title="Mark in progress"
                >
                  <span className="todo-doing-icon" />
                </button>
                <span className="todo-text">{todo.content}</span>
              </div>
            </div>
          ))}
          {inProgress.map((todo) => (
            <div key={todo.uuid} className="todo-row-wrapper doing">
              <div className="todo-row">
                <button
                  className="todo-checkbox-btn"
                  onClick={() => onCompleteTodo(todo.uuid)}
                  title="Mark done"
                >
                  <span className="todo-checkbox" />
                </button>
                <button
                  className="todo-doing-btn active"
                  onClick={() => onToggleProgress(todo.uuid)}
                  title="Undo in progress"
                >
                  <span className="todo-doing-icon active" />
                </button>
                <span className="todo-text">{todo.content}</span>
              </div>
            </div>
          ))}
          {done.map((todo) => (
            <button
              key={todo.uuid}
              className="todo-row done"
              onClick={() => onUncompleteTodo(todo.uuid)}
              title="Undo"
            >
              <span className="todo-checkbox checked" />
              <span className="todo-text">{todo.content}</span>
            </button>
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
    </div>
  );
};

export default SessionNotes;
