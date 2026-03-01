import { NextResponse } from "next/server";
import { sbAdmin } from "../_lib";
import { requireAdmin } from "../_guard";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const sb = sbAdmin();

  // 1) هات Users من Auth
  const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 2000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const authUsers = data.users || [];
  const ids = authUsers.map((u) => u.id);

  // 2) هات Profiles (username/role) من جدول profiles (لو موجود)
  let profMap = new Map<string, any>();
  if (ids.length) {
    const prof = await sb
      .from("profiles")
      .select("id,username,role,email")
      .in("id", ids);

    if (!prof.error && prof.data) {
      for (const p of prof.data) profMap.set(p.id, p);
    }
  }

  // 3) رجّع merged list
  const rows = authUsers.map((u) => {
    const p = profMap.get(u.id);
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      email_confirmed: !!u.email_confirmed_at,
      username: p?.username ?? u.user_metadata?.username ?? null,
      role: p?.role ?? "student",
    };
  });

  return NextResponse.json({ users: rows });
}
