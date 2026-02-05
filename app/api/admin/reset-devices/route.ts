import { NextResponse } from "next/server";
import { sbAdmin } from "../_lib";
import { requireAdmin } from "../_guard";

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const sb = sbAdmin();
  const body = await req.json();
  const user_id = (body.user_id || "").trim();
  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  await sb.from("user_devices").delete().eq("user_id", user_id);

  await sb.from("audit_logs").insert({
    actor_id: guard.user_id,
    actor_email: guard.email,
    action: "RESET_DEVICES",
    target_user_id: user_id,
    target: user_id,
    meta: {},
  });

  return NextResponse.json({ success: true });
}
