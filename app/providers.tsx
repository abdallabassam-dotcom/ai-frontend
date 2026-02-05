"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

const IDLE_MS = 10 * 60 * 1000; // 10 minutes

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const bootedRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);
  const loggingOutRef = useRef(false);

  const t = dict[lang];

  function setLang(l: Lang) {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  }

  async function ensureProfile(userId: string, email?: string | null) {
    // نقرأ profile
    const { data: prof, error } = await supabase
      .from("profiles")
      .select("role,email,username")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      // لو فشل profiles لأي سبب، ما نوقفش الدنيا
      setRole("student");
      setUsername(null);
      return;
    }

    if (!prof) {
      // Profile مش موجود => ننشئه student (ده أول مرة فقط)
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

    // موجود => ما نعملش overwrite للـ role
    setRole(((prof.role as Role) || "student") as Role);
    setUsername((prof.username as string) || null);

    // sync email لو فاضي فقط
    if (!prof.email && email) {
      await supabase.from("profiles").update({ email }).eq("id", userId);
    }
  }

  // ===== Language + dir =====
  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? (localStorage.getItem("lang") as Lang | null)
        : null;

    const initialLang: Lang = saved === "en" ? "en" : "ar";
    setLangState(initialLang);
    document.documentElement.lang = initialLang;
    document.documentElement.dir = initialLang === "ar" ? "rtl" : "ltr";
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  // ===== Idle timer =====
  function clearIdleTimer() {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }

  function armIdleTimer() {
    clearIdleTimer();
    // لو مش مسجل دخول، مفيش تايمر
    if (!userEmail) return;

    idleTimerRef.current = window.setTimeout(() => {
      // لو المستخدم سايب الموقع 10 دقايق => logout
      logout();
    }, IDLE_MS);
  }

  useEffect(() => {
    // أي activity يعيد التايمر
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    const onActivity = () => armIdleTimer();

    // لما يكون logged in شغّل التتبع
    if (userEmail) {
      armIdleTimer();
      events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    }

    return () => {
      clearIdleTimer();
      events.forEach((e) => window.removeEventListener(e, onActivity as any));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  // ===== Auth session =====
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
      await ensureProfile(session.user.id, session.user.email);
      setLoadingAuth(false);
    }

    async function init() {
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

  // ===== Logout (stable) =====
  async function logout() {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;

    try {
      clearIdleTimer();

      // Local أفضل/أثبت لمشاكل الكوكيز/الـ SSR
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // ignore
    } finally {
      setUserEmail(null);
      setUsername(null);
      setRole(null);
      setLoadingAuth(false);

      // امسح مفاتيح الادمن لو بتخزنها (سيب lang)
      if (typeof window !== "undefined") {
        // لو عندك adminKey مخزنه هنا
        // localStorage.removeItem("admin_key");
      }

      // ريديركت قوي يضمن إن كل حاجة اتصفرت
      if (typeof window !== "undefined") window.location.assign("/login");
      loggingOutRef.current = false;
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
