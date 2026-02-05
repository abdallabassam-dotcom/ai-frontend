"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Role = "student" | "admin";
type Lang = "ar" | "en";

type DictShape = {
  homeTitle: string;
  start: string;
  redeem: string;
  login: string;
  register: string;
  chat: string;
  admin: string;
  signedOut: string;
  signedIn: string;
  role: string;
  logout: string;
};

const dict: Record<Lang, DictShape> = {
  ar: {
    homeTitle: "منصة الطلاب الذكية",
    start: "ابدأ الآن",
    redeem: "تفعيل كود",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    chat: "الشات",
    admin: "الأدمن",
    signedOut: "غير مسجل",
    signedIn: "مسجل",
    role: "الدور",
    logout: "تسجيل خروج",
  },
  en: {
    homeTitle: "AI Student Platform",
    start: "Start",
    redeem: "Redeem code",
    login: "Login",
    register: "Create account",
    chat: "Chat",
    admin: "Admin",
    signedOut: "Signed out",
    signedIn: "Signed in",
    role: "Role",
    logout: "Logout",
  },
};

type AppState = {
  lang: Lang;
  t: DictShape;
  setLang: (l: Lang) => void;

  userEmail: string | null;
  username: string | null;
  role: Role | null;
  loadingAuth: boolean;

  logout: () => Promise<void>;
};

const Ctx = createContext<AppState | null>(null);

// =======================
// Idle timeout settings
// =======================
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const LAST_ACTIVITY_KEY = "last_activity_ts";
const nowTs = () => Date.now();

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const t = dict[lang];

  function setLang(l: Lang) {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", l);
    }
  }

  async function loadProfile(userId: string, email?: string | null) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("role,email,username")
      .eq("id", userId)
      .maybeSingle();

    // لو مفيش profile اعمله insert student
    if (!prof) {
      await supabase.from("profiles").insert({
        id: userId,
        email: email || null,
        role: "student",
        username: null,
      });
      setRole("student");
      setUsername(null);
      return;
    }

    setRole((prof.role as Role) || "student");
    setUsername((prof.username as string) || null);

    // sync email لو فاضي
    if (!prof.email && email) {
      await supabase.from("profiles").update({ email }).eq("id", userId);
    }
  }

  // تحميل اللغة + اتجاه الصفحة أول مرة
  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? (localStorage.getItem("lang") as Lang | null) : null;

    const initialLang: Lang = saved === "en" ? "en" : "ar";
    if (saved === "ar" || saved === "en") setLangState(saved);

    document.documentElement.lang = initialLang;
    document.documentElement.dir = initialLang === "ar" ? "rtl" : "ltr";
  }, []);

  // تحديث الاتجاه مع تغيير اللغة
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  // Logout helper (يمسح state + يودّي /login)
  async function hardLogout() {
    try {
      await supabase.auth.signOut();
    } finally {
      setUserEmail(null);
      setUsername(null);
      setRole(null);
      setLoadingAuth(false);

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  // Session + Profile
  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoadingAuth(true);

      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!mounted) return;

      if (!session) {
        setUserEmail(null);
        setUsername(null);
        setRole(null);
        setLoadingAuth(false);
        return;
      }

      setUserEmail(session.user.email || null);
      await loadProfile(session.user.id, session.user.email);
      setLoadingAuth(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      if (!mounted) return;

      if (!session) {
        setUserEmail(null);
        setUsername(null);
        setRole(null);
        setLoadingAuth(false);
        return;
      }

      setUserEmail(session.user.email || null);
      await loadProfile(session.user.id, session.user.email);
      setLoadingAuth(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // =======================
  // Idle timeout (10 min)
  // =======================
  useEffect(() => {
    if (typeof window === "undefined") return;

    let timer: any = null;

    const resetTimer = () => {
      // ما نعملش تايمر لو مش عامل login اصلا
      // (هتشتغل برضو لو عايزها حتى وهو guest، بس ده أنسب)
      if (!userEmail) return;

      const ts = nowTs();
      localStorage.setItem(LAST_ACTIVITY_KEY, String(ts));

      if (timer) clearTimeout(timer);

      timer = setTimeout(() => {
        hardLogout();
      }, IDLE_TIMEOUT_MS);
    };

    // لو رجع للموقع بعد وقت طويل
    const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || "0");
    if (userEmail && last && nowTs() - last > IDLE_TIMEOUT_MS) {
      hardLogout();
      return;
    }

    // أول ما يبقى logged in نبدأ
    resetTimer();

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const onActivity = () => resetTimer();

    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    const onVisibility = () => {
      if (!document.hidden) resetTimer();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // مزامنة بين التابات
    const onStorage = (e: StorageEvent) => {
      if (e.key === LAST_ACTIVITY_KEY && userEmail) resetTimer();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, onActivity as any));
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
    };
  }, [userEmail]); // مهم: يتفعل لما يعمل login

  async function logout() {
    // زرار logout بتاعك
    await supabase.auth.signOut();
    setUserEmail(null);
    setUsername(null);
    setRole(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  const value = useMemo(
    () => ({
      lang,
      t,
      setLang,
      userEmail,
      username,
      role,
      loadingAuth,
      logout,
    }),
    [lang, userEmail, username, role, loadingAuth]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within AppProvider");
  return v;
}
