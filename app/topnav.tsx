"use client";

import { useApp } from "./providers";
import { useRouter } from "next/navigation";

export default function TopNav() {
  const { t, lang, setLang, userEmail, role, loadingAuth, logout } = useApp();
  const router = useRouter();

  const loggedIn = !!userEmail;

  return (
    <div className="nav">
      <div className="navinner">
        <div className="logo">🚀 {t.homeTitle}</div>

        <div className="navlinks">
          <a className="badge" href="/">{t.start}</a>

          {loggedIn && <a className="badge" href="/chat">{t.chat}</a>}
          {loggedIn && <a className="badge" href="/redeem">{t.redeem}</a>}

          {!loggedIn && <a className="badge" href="/login">{t.login}</a>}
          {!loggedIn && <a className="badge" href="/register">{t.register}</a>}

          {role === "admin" && <a className="badge" href="/admin">{t.admin}</a>}

          {/* Language toggle */}
          <button
            className="badge"
            style={{ cursor: "pointer" }}
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          >
            {lang === "ar" ? "EN" : "AR"}
          </button>

          {/* Status pill */}
          <span className="badge">
            {loadingAuth ? "..." : loggedIn ? `${t.signedIn}: ${userEmail}` : t.signedOut}
            {loggedIn && role && ` | ${t.role}: ${role}`}
          </span>

          {loggedIn && (
            <button
              className="badge"
              style={{ cursor: "pointer" }}
              onClick={async () => {
                await logout();
                router.push("/");
              }}
            >
              {t.logout}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
