import { NextResponse } from "next/server";
import { sbAdmin } from "../_lib";
import { requireAdmin } from "../_guard";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const sb = sbAdmin();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  let query = sb.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);

  if (q) {
    query = sb.from("audit_logs").select("*").or(
      `action.ilike.%${q}%,actor_email.ilike.%${q}%,target.ilike.%${q}%`
    ).order("created_at", { ascending: false }).limit(200);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}
