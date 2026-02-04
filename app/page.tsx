"use client";

import { useRouter } from "next/navigation";
import { useApp } from "./providers";

export default function Home() {
  const router = useRouter();
  const { t, userEmail } = useApp();

  const loggedIn = !!userEmail;

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <h1 className="h1">{t.homeTitle} 🎓</h1>
          <p className="p">
            {t.start} ثم فعّل كود التجربة. صفحة تفعيل الكود لا تظهر إلا بعد تسجيل الدخول.
          </p>

          <div className="hr" />

          <div className="row">
            <button
              className="btn"
              onClick={() => router.push(loggedIn ? "/chat" : "/login")}
            >
              {t.start}
            </button>

            <button
              className="btn secondary"
              onClick={() => router.push(loggedIn ? "/redeem" : "/login")}
            >
              {t.redeem}
            </button>
          </div>

          <div style={{ marginTop: 12 }} className="small">
            Trial: جهاز واحد + IP واحد ✅ | Paid لاحقًا: جهازين + IPين ✅
          </div>
        </div>
      </div>

      <div className="col">
        <div className="card">
          <div className="badge">✨ Features</div>
          <div className="hr" />
          <div className="msg">✅ Auth + Roles (student/admin)</div>
          <div className="msg">✅ Trial Code Redeem (بعد تسجيل الدخول)</div>
          <div className="msg">✅ Anti-fraud (Cookies + Fingerprint + IP)</div>
          <div className="msg">✅ Admin يظهر فقط للـ admin</div>
        </div>
      </div>
    </div>
  );
}
