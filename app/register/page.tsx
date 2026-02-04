"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function register() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);
    alert("تم إنشاء الحساب ✅ دلوقتي اعمل Login");
    router.push("/login");
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Register</h2>
      <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
      <br /><br />
      <input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
      <br /><br />
      <button onClick={register}>Create account</button>
    </div>
  );
}
