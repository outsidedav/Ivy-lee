import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

// POST: Move all past incomplete tasks to today, preserving their priorities
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { today } = body;

  if (!today) {
    return NextResponse.json({ error: "today parameter required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Find all incomplete tasks with target_date before today
  const { data: pastTasks, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("is_completed", false)
    .lt("target_date", today)
    .order("priority", { ascending: true });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!pastTasks || pastTasks.length === 0) {
    return NextResponse.json({ promoted: 0 });
  }

  // Get current today task count
  const { count: todayCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("target_date", today);

  // Get user's max tasks
  const { data: user } = await supabase
    .from("users")
    .select("max_tasks_per_day")
    .eq("id", session.user.id)
    .single();
  const maxTasks = user?.max_tasks_per_day ?? 6;

  const currentCount = todayCount ?? 0;
  const slotsAvailable = maxTasks - currentCount;

  // Promote as many as will fit, preserving their priority order
  const toPromote = pastTasks.slice(0, slotsAvailable);

  if (toPromote.length === 0) {
    return NextResponse.json({ promoted: 0 });
  }

  // Update each task's target_date to today, keeping original priority
  await Promise.all(
    toPromote.map((task, index) =>
      supabase
        .from("tasks")
        .update({
          target_date: today,
          priority: currentCount + index + 1,
        })
        .eq("id", task.id)
        .eq("user_id", session.user.id)
    )
  );

  return NextResponse.json({ promoted: toPromote.length });
}
