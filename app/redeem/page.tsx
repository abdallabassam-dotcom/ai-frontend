"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
// @ts-ignore
import FingerprintJS from "@fingerprintjs/fingerprintjs";

async function getFingerprint() {
  const fp = await FingerprintJS.load();
  return (await fp.get()).visitorId;
}

export default function RedeemPage() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/login");
    });
  }, [router]);

  async function redeem() {
    try {
      setLoading(true);
      setMsg("");

      const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setMsg("لازم تعمل Login الأول");
        router.push("/login");
        return;
      }

      const fingerprint = await getFingerprint();

      const res = await fetch(`${base}/redeem-trial-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-device-fingerprint": fingerprint,
        },
        credentials: "include",
        body: JSON.stringify({ code }),
      });

      const text = await res.text();

      if (!res.ok) {
        setMsg(`Error ${res.status}: ${text}`);
        return;
      }

      setMsg("✅ تم تفعيل التجربة بنجاح! ادخل على الشات.");
      setTimeout(() => router.push("/chat"), 700);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>تفعيل Trial Code</h2>
        <span className="badge">Single-use code</span>
      </div>

      <div className="hr" />

      <label className="small">الكود</label>
      <input
        className="input"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="مثال: TRIAL-78FCCBB0"
      />

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button className="btn" onClick={redeem} disabled={loading}>
          {loading ? "جاري التفعيل..." : "تفعيل"}
        </button>
        <a className="btn secondary" href="/admin">أنا الأدمن</a>
      </div>

      {msg && (
        <div className={"msg " + (msg.includes("✅") ? "good" : "bad")} style={{ marginTop: 12 }}>
          {msg}
        </div>
      )}

      <div className="small" style={{ marginTop: 10 }}>
        بعد التفعيل: الشات يفتح لك لمدة 7 أيام. (Trial = IP واحد + جهاز واحد)
      </div>
    </div>
  );
}
