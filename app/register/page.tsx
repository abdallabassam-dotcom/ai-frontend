"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const DISPOSABLE_DOMAINS = [
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "getnada.com",
];

function isDisposable(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  return DISPOSABLE_DOMAINS.includes(domain);
}

export default function RegisterPage() {
  const [step, setStep] = useState<"signup" | "otp">("signup");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function register() {
    setMsg("");
    if (!username.match(/^[a-zA-Z0-9_]{3,20}$/)) {
      setMsg("اليوزرنيم لازم 3-20 ويكون حروف/أرقام/underscore فقط");
      return;
    }
    if (!email.includes("@")) {
      setMsg("اكتب إيميل صحيح");
      return;
    }
    if (isDisposable(email)) {
      setMsg("الإيميلات المؤقتة غير مسموحة. استخدم Gmail/Outlook…");
      return;
    }
    if (password.length < 8) {
      setMsg("الباسورد لازم يكون 8 حروف أو أكثر");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }, // user_metadata
        },
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      // لو عندك OTP هيحتاج تدخل الكود
      setStep("otp");
      setMsg("اتأكد من الإيميل: هيوصلك كود OTP. اكتبه هنا.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setMsg("");
    if (otp.trim().length < 4) {
      setMsg("اكتب كود OTP صحيح");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      // بعد التأكيد: خزّن البيانات في profiles
      const user = data.user;
      if (user) {
        const uname = (user.user_metadata?.username as string) || username;

        const { error: upErr } = await supabase.from("profiles").upsert({
          id: user.id,
          email: user.email,
          username: uname,
          role: "student",
        });

        if (upErr) {
          // لو username متكرر، هترجع unique violation
          setMsg("تم التأكيد ✅ لكن حفظ اليوزرنيم فشل: " + upErr.message);
          return;
        }
      }

      setMsg("✅ تم تأكيد الإيميل وإنشاء الحساب!");
      setTimeout(() => router.push("/redeem"), 600);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>إنشاء حساب</h2>
      <div className="hr" />

      {step === "signup" ? (
        <>
          <label className="small">Username</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="مثال: abdalla_01" />

          <div style={{ height: 10 }} />

          <label className="small">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@mail.com" />

          <div style={{ height: 10 }} />

          <label className="small">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button className="btn" onClick={register} disabled={loading}>
              {loading ? "جاري..." : "Create account"}
            </button>
            <a className="btn secondary" href="/login">عندي حساب</a>
          </div>
        </>
      ) : (
        <>
          <label className="small">OTP Code (وصل على الإيميل)</label>
          <input className="input" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="مثال: 123456" />

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button className="btn" onClick={verifyOtp} disabled={loading}>
              {loading ? "جاري..." : "تأكيد"}
            </button>
            <button className="btn secondary" onClick={() => setStep("signup")} disabled={loading}>
              رجوع
            </button>
          </div>
        </>
      )}

      {msg && <div className={"msg " + (msg.includes("✅") ? "good" : "bad")} style={{ marginTop: 12 }}>{msg}</div>}

      <div className="small" style={{ marginTop: 10 }}>
        ملاحظة: ممنوع إيميلات مؤقتة + لازم تأكيد الإيميل قبل استخدام الكود.
      </div>
    </div>
  );
}
