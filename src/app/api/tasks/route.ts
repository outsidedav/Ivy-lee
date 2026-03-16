import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = req.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date parameter required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("target_date", date)
    .order("priority", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, target_date } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0 || title.length > 280) {
    return NextResponse.json({ error: "Title must be 1-280 characters" }, { status: 400 });
  }

  if (!target_date) {
    return NextResponse.json({ error: "target_date required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get user's max tasks setting
  const { data: user } = await supabase
    .from("users")
    .select("max_tasks_per_day")
    .eq("id", session.user.id)
    .single();
  const maxTasks = user?.max_tasks_per_day ?? 6;

  // Check task count for this date
  const { count } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("target_date", target_date);

  if (count !== null && count >= maxTasks) {
    return NextResponse.json(
      { error: `Maximum ${maxTasks} tasks per day` },
      { status: 400 }
    );
  }

  const priority = (count ?? 0) + 1;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: session.user.id,
      title: title.trim(),
      priority,
      target_date,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
