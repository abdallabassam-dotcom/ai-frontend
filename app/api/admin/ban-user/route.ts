import { NextResponse } from "next/server";
import { sbAdmin } from "../_lib";
import { requireAdmin } from "../_guard";

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const sb = sbAdmin();
  const body = await req.json();
  const user_id = (body.user_id || "").trim();
  const reason = (body.reason || "").trim();
  const ban = !!body.ban; // true=ban, false=unban

  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  if (ban) {
    await sb.from("user_bans").upsert({ user_id, reason: reason || "banned", banned_by: guard.user_id });
    await sb.from("audit_logs").insert({
      actor_id: guard.user_id,
      actor_email: guard.email,
      action: "BAN_USER",
      target_user_id: user_id,
      target: user_id,
      meta: { reason },
    });
    return NextResponse.json({ success: true, banned: true });
  } else {
    await sb.from("user_bans").delete().eq("user_id", user_id);
    await sb.from("audit_logs").insert({
      actor_id: guard.user_id,
      actor_email: guard.email,
      action: "UNBAN_USER",
      target_user_id: user_id,
      target: user_id,
      meta: {},
    });
    return NextResponse.json({ success: true, banned: false });
  }
}
