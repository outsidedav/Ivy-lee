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
  const { date } = body;

  if (!date) {
    return NextResponse.json({ error: "Date required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Delete all tasks for this user on this date
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("user_id", session.user.id)
    .eq("target_date", date);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
