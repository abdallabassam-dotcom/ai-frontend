"use client";

import { useApp } from "./providers";

export default function TopNav() {
  const { t, lang, setLang, userEmail, username, role, loadingAuth, logout } = useApp();

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

          <button
            className="badge"
            style={{ cursor: "pointer" }}
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          >
            {lang === "ar" ? "EN" : "AR"}
          </button>

          <span className="badge">
            {loadingAuth
              ? "..."
              : loggedIn
              ? `${t.signedIn}: ${username || userEmail}`
              : t.signedOut}
            {loggedIn && role && ` | ${t.role}: ${role}`}
          </span>

          {loggedIn && (
            <button
              className="badge"
              style={{ cursor: "pointer" }}
              onClick={logout}   // ✅ بدون router.push
            >
              {t.logout}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
