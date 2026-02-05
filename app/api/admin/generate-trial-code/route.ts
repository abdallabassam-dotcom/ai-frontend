import { NextResponse } from "next/server";
import { sbAdmin } from "../_lib";
import { requireAdmin } from "../_guard";
import crypto from "crypto";

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const sb = sbAdmin();
  const body = await req.json().catch(() => ({}));

  const days = Number(body?.days ?? 7);
  const expiresInDays = Number(body?.expires_in_days ?? 30);

  const code = "TRIAL-" + crypto.randomBytes(4).toString("hex").toUpperCase();

  const { data, error } = await sb
    .from("trial_codes")
    .insert({
      code,
      used: false,
      duration_days: days,
      expires_at: expiresInDays ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : null,
    })
    .select("code,used,duration_days,created_at,used_at,expires_at,used_by")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit log
  await sb.from("audit_logs").insert({
    actor_id: guard.user_id,
    actor_email: guard.email,
    action: "GENERATE_TRIAL_CODE",
    target: code,
    meta: { days, expires_in_days: expiresInDays },
  });

  return NextResponse.json({ row: data });
}
