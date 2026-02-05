"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const bootedRef = useRef(false);
  const t = dict[lang];

  function setLang(l: Lang) {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  }

  async function loadProfile(userId: string, email?: string | null) {
    const { data: prof, error } = await supabase
      .from("profiles")
      .select("role,email,username")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      // ما نعلقش بسبب خطأ profiles
      setRole("student");
      setUsername(null);
      return;
    }

    if (!prof) {
      // إنشاء profile جديد — مهم: ما نلمسش admin إلا لو انت مديه يدويًا
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

    setRole(((prof.role as Role) || "student") as Role);
    setUsername((prof.username as string) || null);

    if (!prof.email && email) {
      await supabase.from("profiles").update({ email }).eq("id", userId);
    }
  }

  // أول مرة: language + dir
  useEffect(() => {
    const saved = (typeof window !== "undefined" ? (localStorage.getItem("lang") as Lang | null) : null);
    const initialLang: Lang = saved === "en" ? "en" : "ar";
    setLangState(initialLang);
    document.documentElement.lang = initialLang;
    document.documentElement.dir = initialLang === "ar" ? "rtl" : "ltr";
  }, []);

  // تحديث الاتجاه مع تغيير اللغة
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  // Session + Profile
  useEffect(() => {
    let mounted = true;

    async function applySession(session: any) {
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

    async function init() {
      // منع init مرتين في Next dev
      if (bootedRef.current) return;
      bootedRef.current = true;

      setLoadingAuth(true);
      const { data } = await supabase.auth.getSession();
      await applySession(data.session);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      setLoadingAuth(true);
      await applySession(session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    try {
      // global أفضل عشان ينهي الجلسة تمامًا
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      // حتى لو فشل… هنكمل
    } finally {
      setUserEmail(null);
      setUsername(null);
      setRole(null);
      setLoadingAuth(false);

      // مهم: امسح أي مفاتيح انت مستخدمها للمشروع (غير lang)
      // لو انت مخزن adminKey في localStorage خليه باسم واضح زي: admin_key
      if (typeof window !== "undefined") {
        // مثال:
        // localStorage.removeItem("admin_key");
        // متحذفش "lang"
      }

      // Hard redirect يضمن إن كل حاجة اتصفرت
      if (typeof window !== "undefined") window.location.assign("/login");
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
