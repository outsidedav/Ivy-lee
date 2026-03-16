import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Delete all tasks for this user
  const { error: tasksError } = await supabase
    .from("tasks")
    .delete()
    .eq("user_id", session.user.id);

  if (tasksError) {
    return NextResponse.json({ error: tasksError.message }, { status: 500 });
  }

  // Delete all points ledger entries for this user
  const { error: pointsError } = await supabase
    .from("points_ledger")
    .delete()
    .eq("user_id", session.user.id);

  if (pointsError) {
    return NextResponse.json({ error: pointsError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
