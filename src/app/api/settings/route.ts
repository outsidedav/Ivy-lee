import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("users")
    .select("max_tasks_per_day, allow_today_add")
    .eq("id", session.user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    max_tasks_per_day: data?.max_tasks_per_day ?? 6,
    allow_today_add: data?.allow_today_add ?? false,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.max_tasks_per_day !== undefined) {
    const maxTasks = Number(body.max_tasks_per_day);
    if (!Number.isInteger(maxTasks) || maxTasks < 1 || maxTasks > 10) {
      return NextResponse.json(
        { error: "max_tasks_per_day must be between 1 and 10" },
        { status: 400 }
      );
    }
    updates.max_tasks_per_day = maxTasks;
  }

  if (body.allow_today_add !== undefined) {
    updates.allow_today_add = Boolean(body.allow_today_add);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid update provided" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", session.user.id)
    .select("max_tasks_per_day, allow_today_add")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    max_tasks_per_day: data.max_tasks_per_day,
    allow_today_add: data.allow_today_add,
  });
}
