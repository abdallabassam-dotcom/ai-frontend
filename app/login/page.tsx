"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function login() {
    try {
      setLoading(true);
      setMsg("");

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMsg(error.message);
        return;
      }

      router.push("/redeem");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>تسجيل الدخول</h2>
        <span className="badge">Supabase Auth</span>
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
        <button className="btn" onClick={login} disabled={loading}>
          {loading ? "جاري الدخول..." : "Login"}
        </button>
        <a className="btn secondary" href="/register">إنشاء حساب</a>
      </div>

      {msg && <div className="msg bad" style={{ marginTop: 12 }}>{msg}</div>}

      <div className="small" style={{ marginTop: 10 }}>
        بعد تسجيل الدخول هنوديك مباشرة لصفحة تفعيل الكود.
      </div>
    </div>
  );
}
