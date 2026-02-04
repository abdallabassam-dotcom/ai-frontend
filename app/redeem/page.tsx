"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
// @ts-ignore
import FingerprintJS from "@fingerprintjs/fingerprintjs";

async function getFingerprint() {
  const fp = await FingerprintJS.load();
  return (await fp.get()).visitorId;
}

export default function RedeemPage() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  async function redeem() {
    setMsg("...");

    const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const fingerprint = await getFingerprint();

    const res = await fetch(`${base}/redeem-trial-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-device-fingerprint": fingerprint
      },
      credentials: "include",
      body: JSON.stringify({ code })
    });

    setMsg(await res.text());
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>تفعيل Trial Code</h2>
      <input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="اكتب الكود" />
      <button onClick={redeem} style={{ marginLeft: 10 }}>تفعيل</button>
      <pre style={{ marginTop: 20 }}>{msg}</pre>
    </div>
  );
}
