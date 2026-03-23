"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
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
import OverflowMenu from "@/components/OverflowMenu";
import HeaderMenu from "@/components/HeaderMenu";

const LoadingAnimation = dynamic(() => import("@/components/LoadingAnimation"), {
  ssr: false,
});

const FlipClockTimer = dynamic(() => import("@/components/FlipClockTimer"), {
  ssr: false,
});

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

export default function DashboardPage() {
  const [today, setToday] = useState(getLocalDate(0));
  const [tomorrow, setTomorrow] = useState(getLocalDate(1));

  // Check for date change (midnight rollover) every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const currentToday = getLocalDate(0);
      if (currentToday !== today) {
        setToday(currentToday);
        setTomorrow(getLocalDate(1));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [today]);

  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [tomorrowTasks, setTomorrowTasks] = useState<Task[]>([]);
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [balance, setBalance] = useState(0);
  const [maxTasks, setMaxTasks] = useState(6);
  const [loading, setLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [timerTaskId, setTimerTaskId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    // Auto-promote past tasks to today on load
    await fetch("/api/tasks/promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ today }),
    });

    const [todayRes, tomorrowRes, backlogRes, rewardsRes, settingsRes] =
      await Promise.all([
        fetch(`/api/tasks?date=${today}`),
        fetch(`/api/tasks?date=${tomorrow}`),
        fetch(`/api/tasks/backlog?today=${today}`),
        fetch("/api/rewards"),
        fetch("/api/settings"),
      ]);

    const [todayData, tomorrowData, backlogData, rewardsData, settingsData] =
      await Promise.all([
        todayRes.json(),
        tomorrowRes.json(),
        backlogRes.json(),
        rewardsRes.json(),
        settingsRes.json(),
      ]);

    setTodayTasks(Array.isArray(todayData) ? todayData : []);
    setTomorrowTasks(Array.isArray(tomorrowData) ? tomorrowData : []);
    setBacklogTasks(Array.isArray(backlogData) ? backlogData : []);
    setBalance(rewardsData.balance ?? 0);
    setMaxTasks(settingsData.max_tasks_per_day ?? 6);
    setLoading(false);
  }, [today, tomorrow]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function addTask(title: string, targetDate: string) {
    // Optimistic update — show the task immediately
    const tempId = `temp-${Date.now()}`;
    const setTasks = targetDate === today ? setTodayTasks : setTomorrowTasks;
    const currentTasks = targetDate === today ? todayTasks : tomorrowTasks;
    const optimisticTask: Task = {
      id: tempId,
      title,
      priority: currentTasks.length + 1,
      is_completed: false,
      target_date: targetDate,
      completed_at: null,
    };
    setTasks((prev) => [...prev, optimisticTask]);

    // Persist in background, then reconcile
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
    if (todayTasks.length + incomplete.length > maxTasks) {
      alert(
        `Can't move ${incomplete.length} tasks — today already has ${todayTasks.length} (max ${maxTasks}).`
      );
      return;
    }
    if (!confirm("Move all tomorrow's tasks to today?")) return;

    // Show cassette loading animation
    setShowLoading(true);
    const loadingStart = Date.now();

    // Move each task sequentially to preserve priority ordering
    // Sort by priority first so they get correct new priorities
    const sorted = [...incomplete].sort((a, b) => a.priority - b.priority);
    for (const t of sorted) {
      await fetch(`/api/tasks/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_date: today }),
      });
    }

    // Now reorder to preserve original priority values
    const reorderIds = sorted.map((t) => t.id);
    // Also include existing today tasks first
    const existingTodayIds = todayTasks
      .filter((t) => !t.is_completed)
      .sort((a, b) => a.priority - b.priority)
      .map((t) => t.id);

    await fetch("/api/tasks/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: [...existingTodayIds, ...reorderIds] }),
    });

    await fetchAll();

    // Ensure animation shows for at least 1.5s
    const elapsed = Date.now() - loadingStart;
    if (elapsed < 1500) {
      await new Promise((r) => setTimeout(r, 1500 - elapsed));
    }
    setShowLoading(false);
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

  async function resetAll() {
    if (!confirm("This will delete ALL your tasks and points. Are you sure?"))
      return;
    await fetch("/api/tasks/reset-all", { method: "POST" });
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

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const sourceList = result.source.droppableId;
    const destList = result.destination.droppableId;

    const sourceTasks =
      sourceList === "today-tasks" ? todayTasks : tomorrowTasks;
    const destTasks = destList === "today-tasks" ? todayTasks : tomorrowTasks;
    const setSourceTasks =
      sourceList === "today-tasks" ? setTodayTasks : setTomorrowTasks;
    const setDestTasks =
      destList === "today-tasks" ? setTodayTasks : setTomorrowTasks;
    const destDate = destList === "today-tasks" ? today : tomorrow;

    const sourceIncomplete = sourceTasks.filter((t) => !t.is_completed);
    const sourceCompleted = sourceTasks.filter((t) => t.is_completed);

    if (sourceList === destList) {
      // Same-list reorder
      const reordered = [...sourceIncomplete];
      const [moved] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, moved);

      const updated = reordered.map((t, i) => ({ ...t, priority: i + 1 }));
      setSourceTasks([...updated, ...sourceCompleted]);

      await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: updated.map((t) => t.id) }),
      });
    } else {
      // Cross-list move
      const destIncomplete = destTasks.filter((t) => !t.is_completed);
      const destCompleted = destTasks.filter((t) => t.is_completed);

      if (destIncomplete.length >= maxTasks) {
        alert(`That list already has ${maxTasks} tasks.`);
        return;
      }

      // Remove from source
      const newSource = [...sourceIncomplete];
      const [moved] = newSource.splice(result.source.index, 1);

      // Insert into destination
      const newDest = [...destIncomplete];
      newDest.splice(result.destination.index, 0, {
        ...moved,
        target_date: destDate,
      });

      // Re-prioritize both lists
      const updatedSource = newSource.map((t, i) => ({
        ...t,
        priority: i + 1,
      }));
      const updatedDest = newDest.map((t, i) => ({ ...t, priority: i + 1 }));

      setSourceTasks([...updatedSource, ...sourceCompleted]);
      setDestTasks([...updatedDest, ...destCompleted]);

      // Persist: move task to new date, then reorder both lists
      await Promise.all([
        fetch(`/api/tasks/${moved.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_date: destDate }),
        }),
        fetch("/api/tasks/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderedIds: updatedSource.map((t) => t.id),
          }),
        }),
        fetch("/api/tasks/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds: updatedDest.map((t) => t.id) }),
        }),
      ]);
    }
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
            <HeaderMenu onResetAll={resetAll} />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        <DragDropContext onDragEnd={handleDragEnd}>
          {/* Today Section */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xs font-medium tracking-widest uppercase text-[#999]">
                Today
              </h2>
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-[#aaa]">
                  {formatDate(today)}
                </span>
                {todayTasks.length > 0 && (
                  <OverflowMenu
                    items={[
                      {
                        label: "Reset",
                        onClick: () => resetDay(today),
                        className: "text-[#c00]",
                      },
                    ]}
                  />
                )}
              </div>
            </div>

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
                            onStartTimer={(id) => setTimerTaskId(id)}
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

            {/* Completed today tasks */}
            {todayCompleted.map((task) => (
              <TaskItem key={task.id} task={task} onComplete={() => {}} />
            ))}

            {tomorrowTasks.length === 0 && backlogTasks.length === 0 && (
              <>
                {todayTasks.length === 0 && (
                  <p className="text-sm text-[#aaa] py-4">
                    No tasks yet. Add your first tasks for today.
                  </p>
                )}
                <AddTaskForm
                  onAdd={(title) => addTask(title, today)}
                  taskCount={todayTasks.length}
                  maxTasks={maxTasks}
                  label="ADD"
                />
              </>
            )}
            {todayTasks.length === 0 && (tomorrowTasks.length > 0 || backlogTasks.length > 0) && (
              <p className="text-sm text-[#aaa] py-4">
                No tasks for today. Add tomorrow&apos;s tasks below.
              </p>
            )}
          </section>

          {/* Divider */}
          <div className="my-8 border-t border-[#eee]" />

          {/* Tomorrow Section */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xs font-medium tracking-widest uppercase text-[#999]">
                Tomorrow
              </h2>
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-[#aaa]">
                  {formatDate(tomorrow)}
                </span>
                {tomorrowTasks.length > 0 && (
                  <OverflowMenu
                    items={[
                      {
                        label: "Move all to Today",
                        onClick: moveTomorrowToToday,
                      },
                      {
                        label: "Reset",
                        onClick: () => resetDay(tomorrow),
                        className: "text-[#c00]",
                      },
                    ]}
                  />
                )}
              </div>
            </div>

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
                            onStartTimer={(id) => setTimerTaskId(id)}
                            showDragHandle
                            actions={
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="text-xs text-[#aaa] hover:text-[#c00] transition-colors"
                              >
                                &#x2715;
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

            <AddTaskForm
              onAdd={(title) => addTask(title, tomorrow)}
              taskCount={tomorrowTasks.length}
              maxTasks={maxTasks}
              label="ADD"
            />
          </section>
        </DragDropContext>

        {/* Backlog */}
        <BacklogPanel
          tasks={backlogTasks}
          todayCount={todayTasks.length}
          maxTasks={maxTasks}
          onMoveToToday={moveToToday}
          onDismiss={deleteTask}
        />

        {/* Coffee Break */}
        <div className="mt-8">
          <CoffeeBreakButton balance={balance} onRedeem={redeemCoffee} />
        </div>
      </main>

      {showLoading && <LoadingAnimation onClose={() => setShowLoading(false)} />}
      {timerTaskId && (
        <FlipClockTimer
          onClose={() => setTimerTaskId(null)}
          taskTitle={
            [...todayTasks, ...tomorrowTasks].find((t) => t.id === timerTaskId)?.title
          }
        />
      )}
    </div>
  );
}
