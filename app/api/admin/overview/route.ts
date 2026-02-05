import { NextResponse } from "next/server";
import { sbAdmin } from "../_lib";
import { requireAdmin } from "../_guard";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const sb = sbAdmin();

  const [
    totalUsers,
    activeTrials,
    activePaid,
    unusedCodes,
    bannedUsers,
    bannedDevices,
  ] = await Promise.all([
    sb.from("profiles").select("id", { count: "exact", head: true }),
    sb.from("subscriptions").select("user_id", { count: "exact", head: true }).eq("active", true).eq("plan", "trial"),
    sb.from("subscriptions").select("user_id", { count: "exact", head: true }).eq("active", true).eq("plan", "paid"),
    sb.from("trial_codes").select("code", { count: "exact", head: true }).eq("used", false),
    sb.from("user_bans").select("user_id", { count: "exact", head: true }),
    sb.from("device_bans").select("id", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    total_users: totalUsers.count ?? 0,
    active_trials: activeTrials.count ?? 0,
    active_paid: activePaid.count ?? 0,
    unused_codes: unusedCodes.count ?? 0,
    banned_users: bannedUsers.count ?? 0,
    banned_devices: bannedDevices.count ?? 0,
  });
}
