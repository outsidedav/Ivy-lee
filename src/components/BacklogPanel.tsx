"use client";

import { useState } from "react";
import TaskItem from "./TaskItem";

interface Task {
  id: string;
  title: string;
  priority: number;
  is_completed: boolean;
  target_date: string;
  completed_at: string | null;
}

interface BacklogPanelProps {
  tasks: Task[];
  todayCount: number;
  onMoveToToday: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
}

export default function BacklogPanel({
  tasks,
  todayCount,
  onMoveToToday,
  onDismiss,
}: BacklogPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <div className="mt-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-medium tracking-wide text-[#999] hover:text-[#666] transition-colors"
      >
        <span
          className="inline-block transition-transform"
          style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▸
        </span>
        Backlog ({tasks.length})
      </button>

      {isOpen && (
        <div className="mt-3 pl-0">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={() => {}}
              actions={
                <>
                  {todayCount < 6 && (
                    <button
                      onClick={() => onMoveToToday(task.id)}
                      className="text-xs text-[#999] hover:text-[#1a1a1a] transition-colors"
                    >
                      → Today
                    </button>
                  )}
                  <button
                    onClick={() => onDismiss(task.id)}
                    className="text-xs text-[#999] hover:text-[#c00] transition-colors"
                  >
                    Dismiss
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
