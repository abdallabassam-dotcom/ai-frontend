"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "./providers";

export default function TopNav() {
  const { t, lang, setLang, userEmail, role, loadingAuth, logout } = useApp();
  const router = useRouter();

  const loggedIn = !!userEmail;

  async function handleLogout(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    try {
      await logout();
    } finally {
      // أهم سطرين
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="nav">
      <div className="navinner">
        <div className="logo">🚀 {t.homeTitle}</div>

        <div className="navlinks">
          <Link className="badge" href="/">{t.start}</Link>

          {loggedIn && <Link className="badge" href="/chat">{t.chat}</Link>}
          {loggedIn && <Link className="badge" href="/redeem">{t.redeem}</Link>}

          {!loggedIn && <Link className="badge" href="/login">{t.login}</Link>}
          {!loggedIn && <Link className="badge" href="/register">{t.register}</Link>}

          {role === "admin" && <Link className="badge" href="/admin">{t.admin}</Link>}

          <button
            type="button"
            className="badge"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            style={{ cursor: "pointer" }}
          >
            {lang === "ar" ? "EN" : "AR"}
          </button>

          <span className="badge" style={{ userSelect: "none" }}>
            {loadingAuth ? "..." : loggedIn ? `${t.signedIn}: ${userEmail}` : t.signedOut}
            {loggedIn && role && ` | ${t.role}: ${role}`}
          </span>

          {loggedIn && (
            <button
              type="button"
              className="badge"
              onClick={handleLogout}
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
