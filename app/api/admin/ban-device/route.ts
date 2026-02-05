import { NextResponse } from "next/server";
import { sbAdmin } from "../_lib";
import { requireAdmin } from "../_guard";

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const sb = sbAdmin();
  const body = await req.json();
  const reason = (body.reason || "").trim();
  const ban = !!body.ban;

  const device_id = (body.device_id || "").trim() || null;
  const fingerprint = (body.fingerprint || "").trim() || null;
  const ip = (body.ip || "").trim() || null;

  if (!device_id && !fingerprint && !ip) {
    return NextResponse.json({ error: "Provide device_id or fingerprint or ip" }, { status: 400 });
  }

  if (ban) {
    await sb.from("device_bans").insert({
      device_id, fingerprint, ip,
      reason: reason || "banned",
      banned_by: guard.user_id,
    });

    await sb.from("audit_logs").insert({
      actor_id: guard.user_id,
      actor_email: guard.email,
      action: "BAN_DEVICE",
      target: JSON.stringify({ device_id, fingerprint, ip }),
      meta: { reason },
    });

    return NextResponse.json({ success: true, banned: true });
  } else {
    // unban by matching any provided fields
    let del = sb.from("device_bans").delete();
    if (device_id) del = del.eq("device_id", device_id);
    if (fingerprint) del = del.eq("fingerprint", fingerprint);
    if (ip) del = del.eq("ip", ip);
    await del;

    await sb.from("audit_logs").insert({
      actor_id: guard.user_id,
      actor_email: guard.email,
      action: "UNBAN_DEVICE",
      target: JSON.stringify({ device_id, fingerprint, ip }),
      meta: {},
    });

    return NextResponse.json({ success: true, banned: false });
  }
}
