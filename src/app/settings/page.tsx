"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function SettingsPage() {
  const [maxTasks, setMaxTasks] = useState(6);
  const [allowTodayAdd, setAllowTodayAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setMaxTasks(data.max_tasks_per_day ?? 6);
        setAllowTodayAdd(data.allow_today_add ?? false);
        setLoading(false);
      });
  }, []);

  async function updateMaxTasks(value: number) {
    setMaxTasks(value);
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ max_tasks_per_day: value }),
    });
    setSaving(false);
  }

  async function deleteAccount() {
    setDeleting(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      signOut({ callbackUrl: "/login" });
    } else {
      setDeleting(false);
      alert("Failed to delete account. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <span className="text-sm text-[#999]">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#eee]">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-base font-light tracking-tight text-[#1a1a1a]">
            Settings
          </h1>
          <Link
            href="/dashboard"
            className="text-xs text-[#999] hover:text-[#1a1a1a] transition-colors"
          >
            Back
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8 space-y-10">
        {/* Max tasks per day */}
        <section>
          <h2 className="text-xs font-medium tracking-widest uppercase text-[#999] mb-4">
            Tasks per day
          </h2>
          <p className="text-sm text-[#666] mb-4">
            Maximum number of tasks you can add to each day.
          </p>
          <div className="flex items-center gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => updateMaxTasks(n)}
                className={`w-8 h-8 text-xs rounded transition-colors ${
                  n === maxTasks
                    ? "bg-[#1a1a1a] text-white"
                    : "bg-white border border-[#eee] text-[#666] hover:border-[#ccc]"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {saving && (
            <p className="text-xs text-[#999] mt-2">Saving...</p>
          )}
        </section>

        {/* Allow adding to Today */}
        <section>
          <h2 className="text-xs font-medium tracking-widest uppercase text-[#999] mb-4">
            Add tasks to Today
          </h2>
          <p className="text-sm text-[#666] mb-4">
            The Ivy Lee method recommends only planning tomorrow&apos;s tasks. Enable
            this to also add tasks directly to today.
          </p>
          <button
            onClick={async () => {
              const newValue = !allowTodayAdd;
              setAllowTodayAdd(newValue);
              setSaving(true);
              await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ allow_today_add: newValue }),
              });
              setSaving(false);
            }}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              allowTodayAdd ? "bg-[#1a1a1a]" : "bg-[#ddd]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                allowTodayAdd ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </section>

        {/* Completed tasks link */}
        <section>
          <h2 className="text-xs font-medium tracking-widest uppercase text-[#999] mb-4">
            History
          </h2>
          <Link
            href="/completed"
            className="text-sm text-[#1a1a1a] hover:text-[#666] transition-colors underline underline-offset-2"
          >
            View completed tasks
          </Link>
        </section>

        {/* Delete account */}
        <section>
          <h2 className="text-xs font-medium tracking-widest uppercase text-[#999] mb-4">
            Account
          </h2>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-[#c00] hover:text-[#900] transition-colors"
            >
              Delete my account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#666]">
                This will permanently delete your account, all tasks, and all
                points. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={deleteAccount}
                  disabled={deleting}
                  className="px-4 py-2 text-xs bg-[#c00] text-white rounded hover:bg-[#900] transition-colors disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Yes, delete everything"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 text-xs text-[#666] hover:text-[#1a1a1a] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
