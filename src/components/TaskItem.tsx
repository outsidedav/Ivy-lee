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
  const [popping, setPopping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function handleComplete() {
    if (task.is_completed) return;
    setPopping(true);
    // Small delay so the pop animation plays before the state change
    setTimeout(() => {
      onComplete(task.id);
    }, 300);
  }

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
        <span className="text-[#aaa] cursor-grab select-none text-xs tracking-widest">
          &#x2807;
        </span>
      )}

      <span className="w-5 text-right text-xs font-mono text-[#bbb]">
        {task.priority}
      </span>

      {/* Checkbox with pop animation */}
      <div className="relative flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {/* Ripple ring */}
        {popping && (
          <span className="absolute inset-0 rounded-full border-2 border-[#1a1a1a] animate-[ripple_0.5s_ease-out_forwards]" />
        )}
        <button
          onClick={handleComplete}
          disabled={task.is_completed}
          className={`relative w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-all duration-150 ${
            task.is_completed
              ? "bg-[#1a1a1a] border-[#1a1a1a]"
              : popping
                ? "bg-[#1a1a1a] border-[#1a1a1a] scale-125"
                : "border-[#aaa] hover:border-[#777] hover:scale-110 active:scale-90"
          }`}
          style={
            popping
              ? {
                  animation: "checkPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                }
              : undefined
          }
        >
          {(task.is_completed || popping) && (
            <svg
              className="w-2.5 h-2.5 text-white"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={
                popping
                  ? {
                      animation: "checkDraw 0.3s ease-out 0.1s both",
                    }
                  : undefined
              }
            >
              <path d="M2 6l3 3 5-5" strokeDasharray="12" strokeDashoffset={popping ? undefined : "0"} />
            </svg>
          )}
        </button>
      </div>

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
              className="text-xs text-[#aaa] hover:text-[#1a1a1a] transition-colors px-1"
              title="Edit"
            >
              &#x270E;
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
