import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { encryptTitle, encryptLinkUrl, decryptTasks } from "@/lib/encryption";

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

  return NextResponse.json(decryptTasks(data ?? [], session.user.id));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, target_date, link_url } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0 || title.length > 280) {
    return NextResponse.json({ error: "Title must be 1-280 characters" }, { status: 400 });
  }

  if (!target_date) {
    return NextResponse.json({ error: "target_date required" }, { status: 400 });
  }

  // Validate link_url if provided
  const cleanUrl = link_url ? String(link_url).trim() : null;
  if (cleanUrl && !cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    return NextResponse.json({ error: "link_url must start with http or https" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get task count for this date
  const { count } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("target_date", target_date);

  // Only enforce maxTasks for today — tomorrow is an unlimited queue
  const serverToday = new Date().toISOString().split("T")[0];
  const isToday = target_date === serverToday;

  if (isToday) {
    const { data: user } = await supabase
      .from("users")
      .select("max_tasks_per_day")
      .eq("id", session.user.id)
      .single();
    const maxTasks = user?.max_tasks_per_day ?? 6;

    if (count !== null && count >= maxTasks) {
      return NextResponse.json(
        { error: `Maximum ${maxTasks} tasks per day` },
        { status: 400 }
      );
    }
  }

  const priority = (count ?? 0) + 1;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: session.user.id,
      title: encryptTitle(title.trim(), session.user.id),
      priority,
      target_date,
      link_url: cleanUrl ? encryptLinkUrl(cleanUrl, session.user.id) : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { ...data, title: title.trim(), link_url: cleanUrl },
    { status: 201 }
  );
}
