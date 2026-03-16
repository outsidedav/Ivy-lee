import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { pointsForPriority } from "@/lib/points";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const supabase = createServiceClient();

  // Verify ownership
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Handle completion
  if (body.is_completed === true && !task.is_completed) {
    const { data, error } = await supabase
      .from("tasks")
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Award points
    const points = pointsForPriority(task.priority);
    await supabase.from("points_ledger").insert({
      user_id: session.user.id,
      delta: points,
      reason: "task_complete",
      task_id: id,
    });

    return NextResponse.json(data);
  }

  // Handle un-complete (return task)
  if (body.is_completed === false && task.is_completed) {
    const targetDate = body.target_date ?? task.target_date;

    // Get user's max tasks setting
    const { data: user } = await supabase
      .from("users")
      .select("max_tasks_per_day")
      .eq("id", session.user.id)
      .single();
    const maxTasks = user?.max_tasks_per_day ?? 6;

    // Check task count for the target date
    const { count } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("target_date", targetDate)
      .eq("is_completed", false);

    if (count !== null && count >= maxTasks) {
      return NextResponse.json(
        { error: `That day already has ${maxTasks} tasks` },
        { status: 400 }
      );
    }

    const newPriority = (count ?? 0) + 1;
    const { data, error } = await supabase
      .from("tasks")
      .update({
        is_completed: false,
        completed_at: null,
        target_date: targetDate,
        priority: newPriority,
      })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Reverse the points that were awarded
    const points = pointsForPriority(task.priority);
    await supabase.from("points_ledger").insert({
      user_id: session.user.id,
      delta: -points,
      reason: "task_returned",
      task_id: id,
    });

    return NextResponse.json(data);
  }

  // Handle title edit
  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (title.length < 1 || title.length > 280) {
      return NextResponse.json({ error: "Title must be 1-280 characters" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("tasks")
      .update({ title })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  // Handle priority update
  if (body.priority !== undefined) {
    const priority = Number(body.priority);
    if (priority < 1 || priority > 10) {
      return NextResponse.json({ error: "Priority must be 1-10" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("tasks")
      .update({ priority })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  // Handle moving to another date (for backlog items or cross-list drag)
  if (body.target_date) {
    // Get user's max tasks setting
    const { data: user } = await supabase
      .from("users")
      .select("max_tasks_per_day")
      .eq("id", session.user.id)
      .single();
    const maxTasks = user?.max_tasks_per_day ?? 6;

    const { count } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("target_date", body.target_date);

    if (count !== null && count >= maxTasks) {
      return NextResponse.json(
        { error: `That day already has ${maxTasks} tasks` },
        { status: 400 }
      );
    }

    const newPriority = (count ?? 0) + 1;
    const { data, error } = await supabase
      .from("tasks")
      .update({ target_date: body.target_date, priority: newPriority })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "No valid update provided" }, { status: 400 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
