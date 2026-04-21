import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/tasks/trim-today
 *
 * If Today has more incomplete tasks than the user's maxTasks setting,
 * moves the lowest-priority excess tasks to Tomorrow.
 * Called after midnight rollover so the queue trims itself automatically.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { today } = body;

  if (!today) {
    return NextResponse.json({ error: "today date required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get user's max tasks setting
  const { data: user } = await supabase
    .from("users")
    .select("max_tasks_per_day")
    .eq("id", session.user.id)
    .single();
  const maxTasks = user?.max_tasks_per_day ?? 6;

  // Get all incomplete tasks for today, ordered by priority ascending
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, priority")
    .eq("user_id", session.user.id)
    .eq("target_date", today)
    .eq("is_completed", false)
    .order("priority", { ascending: true });

  if (!tasks || tasks.length <= maxTasks) {
    return NextResponse.json({ moved: 0 });
  }

  // Excess tasks (lowest priority = highest index in sorted list)
  const toMove = tasks.slice(maxTasks);

  // Calculate tomorrow's date
  const tomorrowDate = new Date(today + "T00:00:00");
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split("T")[0];

  // Get current tomorrow task count for priority calculation
  const { count: tomorrowCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("target_date", tomorrow);

  const priorityBase = (tomorrowCount ?? 0) + 1;

  await Promise.all(
    toMove.map((task, i) =>
      supabase
        .from("tasks")
        .update({ target_date: tomorrow, priority: priorityBase + i })
        .eq("id", task.id)
        .eq("user_id", session.user.id)
    )
  );

  return NextResponse.json({ moved: toMove.length });
}
