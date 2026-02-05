import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const base = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
    const adminKey = process.env.ADMIN_KEY || "";

    const r = await fetch(`${base}/admin/mark-paid`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify(body),
    });

    const text = await r.text();
    return new NextResponse(text, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
