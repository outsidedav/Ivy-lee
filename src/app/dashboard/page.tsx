"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { signOut } from "next-auth/react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import TaskItem from "@/components/TaskItem";
import AddTaskForm from "@/components/AddTaskForm";
import PointsDisplay from "@/components/PointsDisplay";
import CoffeeBreakButton from "@/components/CoffeeBreakButton";
import BacklogPanel from "@/components/BacklogPanel";

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

function TomorrowHeader({
  tomorrow,
  hasTasks,
  onReset,
  onMoveToToday,
}: {
  tomorrow: string;
  hasTasks: boolean;
  onReset: () => void;
  onMoveToToday: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="flex items-baseline justify-between mb-4">
      <h2 className="text-xs font-medium tracking-widest uppercase text-[#999]">
        Tomorrow
      </h2>
      <div className="flex items-baseline gap-3">
        <span className="text-xs text-[#ccc]">{formatDate(tomorrow)}</span>
        {hasTasks && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen(!open)}
              className="text-sm text-[#ccc] hover:text-[#1a1a1a] transition-colors px-1 leading-none"
              title="More actions"
            >
              ⋮
            </button>
            {open && (
              <div className="absolute right-0 top-5 bg-white border border-[#eee] shadow-sm rounded-md py-1 z-10 min-w-[160px]">
                <button
                  onClick={() => { onMoveToToday(); setOpen(false); }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors"
                >
                  Move all to Today
                </button>
                <button
                  onClick={() => { onReset(); setOpen(false); }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-[#c00] hover:bg-[#f5f5f5] transition-colors"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const today = getLocalDate(0);
  const tomorrow = getLocalDate(1);

  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [tomorrowTasks, setTomorrowTasks] = useState<Task[]>([]);
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [todayRes, tomorrowRes, backlogRes, rewardsRes] = await Promise.all([
      fetch(`/api/tasks?date=${today}`),
      fetch(`/api/tasks?date=${tomorrow}`),
      fetch(`/api/tasks/backlog?today=${today}`),
      fetch("/api/rewards"),
    ]);

    const [todayData, tomorrowData, backlogData, rewardsData] =
      await Promise.all([
        todayRes.json(),
        tomorrowRes.json(),
        backlogRes.json(),
        rewardsRes.json(),
      ]);

    setTodayTasks(Array.isArray(todayData) ? todayData : []);
    setTomorrowTasks(Array.isArray(tomorrowData) ? tomorrowData : []);
    setBacklogTasks(Array.isArray(backlogData) ? backlogData : []);
    setBalance(rewardsData.balance ?? 0);
    setLoading(false);
  }, [today, tomorrow]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function addTask(title: string, targetDate: string) {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, target_date: targetDate }),
    });
    fetchAll();
  }

  async function completeTask(id: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_completed: true }),
    });
    fetchAll();
  }

  async function editTask(id: string, title: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    fetchAll();
  }

  async function resetDay(date: string) {
    if (!confirm("Clear all tasks for this day? This cannot be undone.")) return;
    await fetch("/api/tasks/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    fetchAll();
  }

  async function moveTomorrowToToday() {
    const incomplete = tomorrowTasks.filter((t) => !t.is_completed);
    if (incomplete.length === 0) return;
    if (todayTasks.length + incomplete.length > 6) {
      alert(`Can't move ${incomplete.length} tasks — today already has ${todayTasks.length} (max 6).`);
      return;
    }
    if (!confirm("Move all tomorrow's tasks to today?")) return;
    await Promise.all(
      incomplete.map((t) =>
        fetch(`/api/tasks/${t.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_date: today }),
        })
      )
    );
    fetchAll();
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchAll();
  }

  async function moveToToday(id: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_date: today }),
    });
    fetchAll();
  }

  async function redeemCoffee() {
    const res = await fetch("/api/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "redeem_coffee" }),
    });
    const data = await res.json();
    if (res.ok) {
      setBalance(data.balance);
    }
  }

  async function handleDragEnd(result: DropResult, listId: string) {
    if (!result.destination) return;

    const tasks = listId === "today" ? todayTasks : tomorrowTasks;
    const setTasks = listId === "today" ? setTodayTasks : setTomorrowTasks;

    // Only reorder incomplete tasks
    const incomplete = tasks.filter((t) => !t.is_completed);
    const completed = tasks.filter((t) => t.is_completed);

    const reordered = [...incomplete];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    // Assign new priorities
    const updated = reordered.map((t, i) => ({ ...t, priority: i + 1 }));
    setTasks([...updated, ...completed]);

    // Persist
    await fetch("/api/tasks/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: updated.map((t) => t.id) }),
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <span className="text-sm text-[#999]">Loading...</span>
      </div>
    );
  }

  const todayIncomplete = todayTasks.filter((t) => !t.is_completed);
  const todayCompleted = todayTasks.filter((t) => t.is_completed);
  const tomorrowIncomplete = tomorrowTasks.filter((t) => !t.is_completed);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="border-b border-[#eee]">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-base font-light tracking-tight text-[#1a1a1a]">
            Ivy Lee
          </h1>
          <div className="flex items-center gap-5">
            <PointsDisplay balance={balance} />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-[#999] hover:text-[#1a1a1a] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        {/* Today Section */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xs font-medium tracking-widest uppercase text-[#999]">
              Today
            </h2>
            <div className="flex items-baseline gap-3">
              {todayTasks.length > 0 && (
                <button
                  onClick={() => resetDay(today)}
                  className="text-xs text-[#ccc] hover:text-[#c00] transition-colors"
                >
                  Reset
                </button>
              )}
              <span className="text-xs text-[#ccc]">{formatDate(today)}</span>
            </div>
          </div>

          <DragDropContext
            onDragEnd={(result) => handleDragEnd(result, "today")}
          >
            <Droppable droppableId="today-tasks">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {todayIncomplete.map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={snapshot.isDragging ? "opacity-80" : ""}
                        >
                          <TaskItem
                            task={task}
                            onComplete={completeTask}
                            onEdit={editTask}
                            showDragHandle
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Completed today tasks */}
          {todayCompleted.map((task) => (
            <TaskItem key={task.id} task={task} onComplete={() => {}} />
          ))}

          {todayTasks.length === 0 && (
            <p className="text-sm text-[#ccc] py-4">
              No tasks for today. Add tomorrow&apos;s tasks below.
            </p>
          )}
        </section>

        {/* Divider */}
        <div className="my-8 border-t border-[#eee]" />

        {/* Tomorrow Section */}
        <section>
          <TomorrowHeader
            tomorrow={tomorrow}
            hasTasks={tomorrowTasks.length > 0}
            onReset={() => resetDay(tomorrow)}
            onMoveToToday={moveTomorrowToToday}
          />

          <DragDropContext
            onDragEnd={(result) => handleDragEnd(result, "tomorrow")}
          >
            <Droppable droppableId="tomorrow-tasks">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {tomorrowIncomplete.map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={snapshot.isDragging ? "opacity-80" : ""}
                        >
                          <TaskItem
                            task={task}
                            onComplete={completeTask}
                            onEdit={editTask}
                            showDragHandle
                            actions={
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="text-xs text-[#ccc] hover:text-[#c00] transition-colors"
                              >
                                ✕
                              </button>
                            }
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <AddTaskForm
            onAdd={(title) => addTask(title, tomorrow)}
            taskCount={tomorrowTasks.length}
            label="ADD"
          />
        </section>

        {/* Backlog */}
        <BacklogPanel
          tasks={backlogTasks}
          todayCount={todayTasks.length}
          onMoveToToday={moveToToday}
          onDismiss={deleteTask}
        />

        {/* Coffee Break */}
        <div className="mt-8">
          <CoffeeBreakButton balance={balance} onRedeem={redeemCoffee} />
        </div>
      </main>
    </div>
  );
}
