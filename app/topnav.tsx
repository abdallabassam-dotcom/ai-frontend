"use client";

import Link from "next/link";
import { useApp } from "./providers";

export default function TopNav() {
  const { t, lang, setLang, userEmail, username, role, loadingAuth, logout } = useApp();

  const loggedIn = !!userEmail;

  return (
    <div className="nav">
      <div className="navinner">
        <div className="logo">🚀 {t.homeTitle}</div>

        <div className="navlinks">
          <Link className="badge" href="/">
            {t.start}
          </Link>

          {loggedIn && (
            <>
              <Link className="badge" href="/chat">
                {t.chat}
              </Link>
              <Link className="badge" href="/redeem">
                {t.redeem}
              </Link>
            </>
          )}

          {!loggedIn && (
            <>
              <Link className="badge" href="/login">
                {t.login}
              </Link>
              <Link className="badge" href="/register">
                {t.register}
              </Link>
            </>
          )}

          {role === "admin" && (
            <Link className="badge" href="/admin">
              {t.admin}
            </Link>
          )}

          <button
            type="button"
            className="badge"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            style={{ cursor: "pointer" }}
          >
            {lang === "ar" ? "EN" : "AR"}
          </button>

          <span className="badge" style={{ userSelect: "none" }}>
            {loadingAuth
              ? "..."
              : loggedIn
              ? `${t.signedIn}: ${username || userEmail}`
              : t.signedOut}
            {loggedIn && role && ` | ${t.role}: ${role}`}
          </span>

          {loggedIn && (
            <button
              type="button"
              className="badge"
              onClick={logout}   // ✅ هنا بس
              style={{ cursor: "pointer" }}
            >
              {t.logout}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
