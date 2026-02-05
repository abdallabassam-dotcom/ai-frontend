import { NextResponse } from "next/server";
import { supabaseAdmin } from "../_lib";

export async function GET() {
  try {
    const sb = supabaseAdmin();

    const [{ count: total_users }, { count: active_trials }, { count: active_paid }, { count: unused_codes }] =
      await Promise.all([
        sb.from("profiles").select("id", { count: "exact", head: true }),
        sb.from("subscriptions").select("user_id", { count: "exact", head: true }).eq("active", true).eq("plan", "trial"),
        sb.from("subscriptions").select("user_id", { count: "exact", head: true }).eq("active", true).eq("plan", "paid"),
        sb.from("trial_codes").select("code", { count: "exact", head: true }).eq("used", false),
      ]);

    return NextResponse.json({
      total_users: total_users ?? 0,
      active_trials: active_trials ?? 0,
      active_paid: active_paid ?? 0,
      unused_codes: unused_codes ?? 0,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
