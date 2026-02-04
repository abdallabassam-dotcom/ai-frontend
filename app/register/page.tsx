"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function register() {
    try {
      setLoading(true);
      setMsg("");

      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMsg(error.message);
        return;
      }

      setMsg("تم إنشاء الحساب ✅ دلوقتي اعمل Login");
      setTimeout(() => router.push("/login"), 700);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>إنشاء حساب</h2>
        <span className="badge">7 Days Trial via Code</span>
      </div>

      <div className="hr" />

      <div className="row">
        <div className="col">
          <label className="small">Email</label>
          <input
            className="input"
            placeholder="example@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="col">
          <label className="small">Password</label>
          <input
            className="input"
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button className="btn" onClick={register} disabled={loading}>
          {loading ? "جاري الإنشاء..." : "Create account"}
        </button>
        <a className="btn secondary" href="/login">عندي حساب</a>
      </div>

      {msg && (
        <div className={"msg " + (msg.includes("✅") ? "good" : "bad")} style={{ marginTop: 12 }}>
          {msg}
        </div>
      )}

      <div className="small" style={{ marginTop: 10 }}>
        بعد إنشاء الحساب: سجل دخول ثم فعّل كود التجربة من الأدمن.
      </div>
    </div>
  );
}
