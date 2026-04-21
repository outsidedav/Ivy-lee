"use client";

import { useState, useRef, useEffect } from "react";

interface AddTaskFormProps {
  onAdd: (title: string, linkUrl?: string) => Promise<void>;
  taskCount: number;
  label: string;
  /** Pass 0 for unlimited (e.g. Tomorrow queue) */
  maxTasks?: number;
}

export default function AddTaskForm({ onAdd, taskCount, label, maxTasks = 6 }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const isUnlimited = maxTasks === 0;
  const isFull = !isUnlimited && taskCount >= maxTasks;

  useEffect(() => {
    if (showLinkInput && linkInputRef.current) {
      linkInputRef.current.focus();
    }
  }, [showLinkInput]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || isFull || isSubmitting) return;

    const value = title.trim();
    const url = linkUrl.trim() || undefined;

    setTitle("");
    setLinkUrl("");
    setShowLinkInput(false);
    setIsSubmitting(true);
    try {
      await onAdd(value, url);
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

  const placeholder = isUnlimited
    ? `Add a task (${taskCount})`
    : `Add a task (${taskCount}/${maxTasks})`;

  return (
    <form onSubmit={handleSubmit} className="py-3 space-y-2">
      <div className="flex gap-3 items-center">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={placeholder}
          maxLength={280}
          className="flex-1 text-sm bg-transparent border-b border-[#ddd] focus:border-[#1a1a1a] outline-none py-1 placeholder:text-[#aaa] text-[#1a1a1a] transition-colors"
        />
        {/* Link icon toggle */}
        <button
          type="button"
          onClick={() => setShowLinkInput((v) => !v)}
          title="Attach a link"
          className={`flex-shrink-0 transition-colors ${
            showLinkInput || linkUrl ? "text-[#1a1a1a]" : "text-[#ccc] hover:text-[#999]"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 9.5a4 4 0 005.66 0l2-2a4 4 0 00-5.66-5.66l-1 1" />
            <path d="M9.5 6.5a4 4 0 00-5.66 0l-2 2a4 4 0 005.66 5.66l1-1" />
          </svg>
        </button>
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="text-xs font-medium tracking-wide text-[#1a1a1a] disabled:text-[#aaa] transition-colors flex-shrink-0"
        >
          {label}
        </button>
      </div>

      {showLinkInput && (
        <input
          ref={linkInputRef}
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://..."
          className="w-full text-xs bg-transparent border-b border-[#ddd] focus:border-[#1a1a1a] outline-none py-1 placeholder:text-[#bbb] text-[#666] transition-colors"
        />
      )}
    </form>
  );
}
