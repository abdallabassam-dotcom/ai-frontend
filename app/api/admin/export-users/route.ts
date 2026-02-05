import { NextResponse } from "next/server";
import { sbAdmin } from "../_lib";
import { requireAdmin } from "../_guard";

function csvEscape(v: any) {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const sb = sbAdmin();
  const { data: profs } = await sb.from("profiles").select("id,email,username,role,created_at").order("created_at", { ascending: false }).limit(500);
  const ids = (profs ?? []).map((p) => p.id);

  let subs: any[] = [];
  if (ids.length) {
    const { data } = await sb.from("subscriptions").select("user_id,plan,active,end_at").in("user_id", ids);
    subs = data ?? [];
  }

  const subMap = new Map(subs.map((s) => [s.user_id, s]));
  const rows = [
    ["id","email","username","role","created_at","plan","active","end_at"].join(","),
    ...(profs ?? []).map((p) => {
      const s = subMap.get(p.id);
      return [
        csvEscape(p.id),
        csvEscape(p.email),
        csvEscape(p.username),
        csvEscape(p.role),
        csvEscape(p.created_at),
        csvEscape(s?.plan),
        csvEscape(s?.active),
        csvEscape(s?.end_at),
      ].join(",");
    }),
  ].join("\n");

  return new NextResponse(rows, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="users.csv"`,
    },
  });
}
