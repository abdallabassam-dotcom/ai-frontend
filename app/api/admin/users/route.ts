import { NextResponse } from "next/server";
import { supabaseAdmin } from "../_lib";

export async function GET(req: Request) {
  try {
    const sb = supabaseAdmin();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    // نجيب users من profiles + subscriptions
    // لو q فاضي => آخر 50
    let profQuery = sb
      .from("profiles")
      .select("id,email,username,role")
      .order("created_at", { ascending: false })
      .limit(50);

    if (q) {
      // بحث بسيط: email contains OR username contains
      profQuery = sb
        .from("profiles")
        .select("id,email,username,role")
        .or(`email.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(50);
    }

    const { data: profs, error: pErr } = await profQuery;
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 });

    const ids = (profs ?? []).map((p) => p.id);
    let subs: any[] = [];
    if (ids.length) {
      const { data: s, error: sErr } = await sb
        .from("subscriptions")
        .select("user_id,plan,active,end_at")
        .in("user_id", ids);

      if (sErr) return NextResponse.json({ error: sErr.message }, { status: 400 });
      subs = s ?? [];
    }

    const subMap = new Map(subs.map((s) => [s.user_id, s]));
    const out = (profs ?? []).map((p) => {
      const s = subMap.get(p.id);
      return {
        id: p.id,
        email: p.email ?? null,
        username: p.username ?? null,
        role: p.role ?? "student",
        plan: s?.plan ?? null,
        active: s?.active ?? null,
        end_at: s?.end_at ?? null,
      };
    });

    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
