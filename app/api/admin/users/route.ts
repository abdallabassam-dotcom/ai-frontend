import { NextResponse } from "next/server";
import { sbAdmin } from "../_lib";
import { requireAdmin } from "../_guard";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const sb = sbAdmin();
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const plan = (searchParams.get("plan") || "").trim();       // trial / paid / none
  const active = (searchParams.get("active") || "").trim();   // true / false

  let profQ = sb.from("profiles").select("id,email,username,role,created_at").order("created_at", { ascending: false }).limit(100);

  if (q) profQ = sb.from("profiles").select("id,email,username,role,created_at").or(`email.ilike.%${q}%,username.ilike.%${q}%`).limit(100);

  const { data: profs, error: pErr } = await profQ;
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 });

  const ids = (profs ?? []).map((p) => p.id);
  let subs: any[] = [];
  if (ids.length) {
    let sQ = sb.from("subscriptions").select("user_id,plan,active,end_at,device_limit,ip_limit").in("user_id", ids);

    if (plan) sQ = sQ.eq("plan", plan);
    if (active === "true") sQ = sQ.eq("active", true);
    if (active === "false") sQ = sQ.eq("active", false);

    const { data: s, error: sErr } = await sQ;
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 400 });
    subs = s ?? [];
  }

  const subMap = new Map(subs.map((s) => [s.user_id, s]));

  // bans
  const { data: bans } = await sb.from("user_bans").select("user_id,reason,banned_at");
  const banMap = new Map((bans ?? []).map((b) => [b.user_id, b]));

  const out = (profs ?? []).map((p) => {
    const s = subMap.get(p.id);
    const b = banMap.get(p.id);
    return {
      id: p.id,
      email: p.email ?? null,
      username: p.username ?? null,
      role: p.role ?? "student",
      created_at: p.created_at ?? null,
      plan: s?.plan ?? null,
      active: s?.active ?? null,
      end_at: s?.end_at ?? null,
      device_limit: s?.device_limit ?? null,
      ip_limit: s?.ip_limit ?? null,
      banned: !!b,
      ban_reason: b?.reason ?? null,
      banned_at: b?.banned_at ?? null,
    };
  });

  // لو فيه فلترة plan/active هنخليها post-filter لأن subscriptions قد تكون null
  const filtered = out.filter((u) => {
    if (plan && u.plan !== plan) return false;
    if (active === "true" && u.active !== true) return false;
    if (active === "false" && u.active !== false) return false;
    return true;
  });

  return NextResponse.json(filtered);
}
