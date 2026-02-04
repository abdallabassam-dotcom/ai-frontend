"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function verify() {
    setMsg("");

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("✅ تم تأكيد الإيميل! دلوقتي سجل دخول.");
    setTimeout(() => router.push("/login"), 800);
  }

  return (
    <div className="card">
      <h2 style={{ margin: 0 }}>تأكيد الإيميل (OTP)</h2>
      <div className="hr" />

      <label className="small">Email</label>
      <input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="example@mail.com" />

      <div style={{ height: 10 }} />

      <label className="small">OTP</label>
      <input className="input" value={otp} onChange={(e)=>setOtp(e.target.value)} placeholder="123456" />

      <div style={{ marginTop: 12 }}>
        <button className="btn" onClick={verify}>Verify</button>
      </div>

      {msg && <div className={"msg " + (msg.includes("✅") ? "good" : "bad")} style={{ marginTop: 12 }}>{msg}</div>}
    </div>
  );
}
