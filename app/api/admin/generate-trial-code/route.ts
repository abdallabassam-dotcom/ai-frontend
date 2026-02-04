import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { days = 7, expires_in_days = 30, password } = body || {};

    // حماية الداشبورد بباسورد
    if (!password || password !== process.env.ADMIN_DASH_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backendBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
    if (!backendBase) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_API_BASE" }, { status: 500 });
    }

    const adminKey = process.env.ADMIN_KEY;
    if (!adminKey) {
      return NextResponse.json({ error: "Missing ADMIN_KEY" }, { status: 500 });
    }

    const res = await fetch(`${backendBase}/admin/generate-trial-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey
      },
      body: JSON.stringify({ days, expires_in_days })
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json({ error: text }, { status: res.status });
    }

    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
