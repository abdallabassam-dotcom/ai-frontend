"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function register() {
    setMsg("");

    // تحقق بسيط للـ username
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setMsg("اليوزرنيم لازم يكون 3-20 حروف/أرقام/underscore فقط");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // نخزن username مؤقتًا في metadata
        data: { username },
      },
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    // لو Confirm email شغال: غالبًا مفيش session لحد ما يؤكد الإيميل
    // فنقولّه يروح يؤكد وبعدين يعمل Login
    setMsg("✅ تم إنشاء الحساب. افتح الإيميل وخد OTP/Link للتأكيد، وبعدها اعمل Login.");
    // ممكن توديه لصفحة verify لو هنعملها
    // router.push("/verify");
  }

  return (
    <div className="card">
      <h2 style={{ margin: 0 }}>إنشاء حساب</h2>
      <div className="hr" />

      <label className="small">Username</label>
      <input className="input" value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="abdalla_01" />

      <div style={{ height: 10 }} />

      <label className="small">Email</label>
      <input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="example@mail.com" />

      <div style={{ height: 10 }} />

      <label className="small">Password</label>
      <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" />

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button className="btn" onClick={register}>Create account</button>
        <a className="btn secondary" href="/login">عندي حساب</a>
      </div>

      {msg && <div className={"msg " + (msg.includes("✅") ? "good" : "bad")} style={{ marginTop: 12 }}>{msg}</div>}
    </div>
  );
}
