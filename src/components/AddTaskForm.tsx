"use client";

import { useState } from "react";

interface AddTaskFormProps {
  onAdd: (title: string) => Promise<void>;
  taskCount: number;
  label: string;
  maxTasks?: number;
}

export default function AddTaskForm({ onAdd, taskCount, label, maxTasks = 6 }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFull = taskCount >= maxTasks;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || isFull || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd(title.trim());
      setTitle("");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isFull) {
    return (
      <p className="text-xs text-[#999] py-3">
        {maxTasks} tasks set. Focus on these.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 py-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={`Add a task (${taskCount}/${maxTasks})`}
        maxLength={280}
        className="flex-1 text-sm bg-transparent border-b border-[#ddd] focus:border-[#1a1a1a] outline-none py-1 placeholder:text-[#aaa] text-[#1a1a1a] transition-colors"
      />
      <button
        type="submit"
        disabled={!title.trim() || isSubmitting}
        className="text-xs font-medium tracking-wide text-[#1a1a1a] disabled:text-[#aaa] transition-colors"
      >
        {label}
      </button>
    </form>
  );
}
