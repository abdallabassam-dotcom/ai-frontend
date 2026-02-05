import { NextResponse } from "next/server";
import { supabaseAdmin } from "../_lib";

export async function GET() {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("trial_codes")
      .select("code,used,duration_days,created_at,used_at,expires_at,used_by")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
