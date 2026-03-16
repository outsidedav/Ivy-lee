"use client";

import { useState, useRef, useEffect } from "react";

interface Task {
  id: string;
  title: string;
  priority: number;
  is_completed: boolean;
  target_date: string;
  completed_at: string | null;
}

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
  onEdit?: (id: string, title: string) => void;
  showDragHandle?: boolean;
  actions?: React.ReactNode;
}

export default function TaskItem({
  task,
  onComplete,
  onEdit,
  showDragHandle = false,
  actions,
}: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function handleSave() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.title && onEdit) {
      onEdit(task.id, trimmed);
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditValue(task.title);
      setEditing(false);
    }
  }

  return (
    <div
      className={`group flex items-center gap-4 py-3 border-b border-[#eee] last:border-b-0 ${
        task.is_completed ? "opacity-40" : ""
      }`}
    >
      {showDragHandle && !task.is_completed && (
        <span className="text-[#ccc] cursor-grab select-none text-xs tracking-widest">
          ⠿
        </span>
      )}

      <span className="w-5 text-right text-xs font-mono text-[#bbb]">
        {task.priority}
      </span>

      <button
        onClick={() => !task.is_completed && onComplete(task.id)}
        disabled={task.is_completed}
        className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
          task.is_completed
            ? "bg-[#1a1a1a] border-[#1a1a1a]"
            : "border-[#ccc] hover:border-[#999]"
        }`}
      >
        {task.is_completed && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 6l3 3 5-5" />
          </svg>
        )}
      </button>

      {editing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          maxLength={280}
          className="flex-1 text-sm text-[#1a1a1a] bg-transparent border-b border-[#ccc] outline-none py-0"
        />
      ) : (
        <span
          className={`flex-1 text-sm ${
            task.is_completed
              ? "line-through text-[#aaa]"
              : "text-[#1a1a1a]"
          }`}
        >
          {task.title}
        </span>
      )}

      {!task.is_completed && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {onEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-[#ccc] hover:text-[#1a1a1a] transition-colors px-1"
              title="Edit"
            >
              ✎
            </button>
          )}
          {actions}
        </div>
      )}

      {task.is_completed && actions && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {actions}
        </div>
      )}
    </div>
  );
}
