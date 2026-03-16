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
    .select("max_tasks_per_day")
    .eq("id", session.user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ max_tasks_per_day: data?.max_tasks_per_day ?? 6 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const maxTasks = Number(body.max_tasks_per_day);

  if (!Number.isInteger(maxTasks) || maxTasks < 1 || maxTasks > 10) {
    return NextResponse.json(
      { error: "max_tasks_per_day must be between 1 and 10" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("users")
    .update({ max_tasks_per_day: maxTasks })
    .eq("id", session.user.id)
    .select("max_tasks_per_day")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ max_tasks_per_day: data.max_tasks_per_day });
}
