import { NextResponse } from "next/server";
import { sbAdmin } from "../_lib";
import { requireAdmin } from "../_guard";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const sb = sbAdmin();
  const { searchParams } = new URL(req.url);
  const user_id = (searchParams.get("user_id") || "").trim();

  let q = sb
    .from("user_devices")
    .select("id,user_id,device_id,fingerprint,ip,last_seen,created_at")
    .order("last_seen", { ascending: false })
    .limit(200);

  if (user_id) q = q.eq("user_id", user_id);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // banned devices list
  const { data: bans } = await sb.from("device_bans").select("device_id,fingerprint,ip,reason,banned_at");
  const bansArr = bans ?? [];

  const isBanned = (d: any) =>
    bansArr.some((b) =>
      (b.device_id && d.device_id && b.device_id === d.device_id) ||
      (b.fingerprint && d.fingerprint && b.fingerprint === d.fingerprint) ||
      (b.ip && d.ip && b.ip === d.ip)
    );

  const out = (data ?? []).map((d: any) => ({ ...d, banned: isBanned(d) }));
  return NextResponse.json(out);
}
