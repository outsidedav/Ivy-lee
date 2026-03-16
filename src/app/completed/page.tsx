"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  priority: number;
  is_completed: boolean;
  target_date: string;
  completed_at: string | null;
}

function getLocalDate(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function groupByDate(tasks: Task[]): Record<string, Task[]> {
  const groups: Record<string, Task[]> = {};
  for (const task of tasks) {
    const date = task.completed_at
      ? task.completed_at.split("T")[0]
      : task.target_date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(task);
  }
  return groups;
}

export default function CompletedPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState<string | null>(null);
  const tomorrow = getLocalDate(1);

  useEffect(() => {
    fetch("/api/tasks/completed")
      .then((r) => r.json())
      .then((data) => {
        setTasks(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  async function returnToTomorrow(id: string) {
    setReturning(id);
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_completed: false, target_date: tomorrow }),
    });

    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } else {
      const data = await res.json();
      alert(data.error || "Failed to return task");
    }
    setReturning(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <span className="text-sm text-[#999]">Loading...</span>
      </div>
    );
  }

  const grouped = groupByDate(tasks);
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#eee]">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-base font-light tracking-tight text-[#1a1a1a]">
            Completed Tasks
          </h1>
          <Link
            href="/dashboard"
            className="text-xs text-[#999] hover:text-[#1a1a1a] transition-colors"
          >
            Back
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        {tasks.length === 0 ? (
          <p className="text-sm text-[#ccc] py-4">No completed tasks yet.</p>
        ) : (
          dates.map((date) => (
            <section key={date} className="mb-8">
              <h2 className="text-xs font-medium tracking-widest uppercase text-[#999] mb-3">
                {formatDate(date)}
              </h2>
              <div className="space-y-0">
                {grouped[date].map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between py-2 border-b border-[#f0f0f0] group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-[#ccc] w-4 text-right flex-shrink-0">
                        {task.priority}
                      </span>
                      <span className="text-sm text-[#999] line-through truncate">
                        {task.title}
                      </span>
                    </div>
                    <button
                      onClick={() => returnToTomorrow(task.id)}
                      disabled={returning === task.id}
                      className="text-xs text-[#ccc] hover:text-[#1a1a1a] transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 ml-3 disabled:opacity-50"
                    >
                      {returning === task.id ? "..." : "Return"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
