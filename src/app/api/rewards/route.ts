import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { COFFEE_BREAK_COST } from "@/lib/points";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("points_ledger")
    .select("delta")
    .eq("user_id", session.user.id);

  const balance = (data ?? []).reduce(
    (sum: number, row: { delta: number }) => sum + Number(row.delta),
    0
  );

  return NextResponse.json({ balance, coffeeBreakCost: COFFEE_BREAK_COST });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (body.action !== "redeem_coffee") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Calculate current balance
  const { data } = await supabase
    .from("points_ledger")
    .select("delta")
    .eq("user_id", session.user.id);

  const balance = (data ?? []).reduce(
    (sum: number, row: { delta: number }) => sum + Number(row.delta),
    0
  );

  if (balance < COFFEE_BREAK_COST) {
    return NextResponse.json(
      { error: "Insufficient points", balance },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("points_ledger").insert({
    user_id: session.user.id,
    delta: -COFFEE_BREAK_COST,
    reason: "coffee_break_redeem",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ balance: balance - COFFEE_BREAK_COST });
}
