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
  const { data } = await sb
    .from("trial_codes")
    .select("code,used,duration_days,created_at,used_at,expires_at,used_by")
    .order("created_at", { ascending: false })
    .limit(1000);

  const rows = [
    ["code","used","duration_days","created_at","used_at","expires_at","used_by"].join(","),
    ...((data ?? []).map((c) =>
      [
        csvEscape(c.code),
        csvEscape(c.used),
        csvEscape(c.duration_days),
        csvEscape(c.created_at),
        csvEscape(c.used_at),
        csvEscape(c.expires_at),
        csvEscape(c.used_by),
      ].join(",")
    )),
  ].join("\n");

  return new NextResponse(rows, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trial_codes.csv"`,
    },
  });
}
