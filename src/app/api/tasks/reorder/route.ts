import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { orderedIds } = body;

  if (!Array.isArray(orderedIds) || orderedIds.length === 0 || orderedIds.length > 6) {
    return NextResponse.json({ error: "Invalid orderedIds" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify all tasks belong to the user
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", session.user.id)
    .in("id", orderedIds);

  if (!tasks || tasks.length !== orderedIds.length) {
    return NextResponse.json({ error: "Tasks not found" }, { status: 404 });
  }

  // Update priorities based on new order
  const updates = orderedIds.map((id: string, index: number) =>
    supabase
      .from("tasks")
      .update({ priority: index + 1 })
      .eq("id", id)
      .eq("user_id", session.user.id)
  );

  await Promise.all(updates);

  return NextResponse.json({ success: true });
}
