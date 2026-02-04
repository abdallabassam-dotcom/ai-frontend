"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
  role: Role | null;
  loadingAuth: boolean;

  logout: () => Promise<void>;
};

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const t = dict[lang];

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("lang", l);
  }

  async function loadProfile(userId: string, email?: string | null) {
    // حاول تجيب role
    const { data: prof } = await supabase
      .from("profiles")
      .select("role,email")
      .eq("id", userId)
      .maybeSingle();

    // لو مفيش profile اعمله insert student
    if (!prof) {
      await supabase.from("profiles").insert({
        id: userId,
        email: email || null,
        role: "student",
      });
      setRole("student");
      return;
    }

    setRole((prof.role as Role) || "student");

    // sync email لو فاضي
    if (!prof.email && email) {
      await supabase.from("profiles").update({ email }).eq("id", userId);
    }
  }

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    if (saved === "ar" || saved === "en") setLangState(saved);

    // ضبط اتجاه الصفحة حسب اللغة
    const applyDir = (l: Lang) => {
      document.documentElement.lang = l;
      document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    };
    applyDir(saved === "en" ? "en" : "ar");
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoadingAuth(true);
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!mounted) return;

      if (!session) {
        setUserEmail(null);
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

  async function logout() {
    await supabase.auth.signOut();
  }

  const value = useMemo(
    () => ({
      lang,
      t,
      setLang,
      userEmail,
      role,
      loadingAuth,
      logout,
    }),
    [lang, userEmail, role, loadingAuth]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within AppProvider");
  return v;
}
