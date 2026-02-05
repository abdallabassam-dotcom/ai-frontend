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
  const isLoggingOutRef = useRef(false);

  const t = dict[lang];

  function setLang(l: Lang) {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", l);
    }
  }

  async function ensureProfile(userId: string, email?: string | null) {
    const { data: prof, error } = await supabase
      .from("profiles")
      .select("role,email,username")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      setRole("student");
      setUsername(null);
      return;
    }

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

    setRole(((prof.role as Role) || "student") as Role);
    setUsername((prof.username as string) || null);

    if (!prof.email && email) {
      await supabase.from("profiles").update({ email }).eq("id", userId);
    }
  }

  // ===== lang/dir on first load =====
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
    if (!userEmail) return;

    idleTimerRef.current = window.setTimeout(() => {
      logout(); // logout after idle
    }, IDLE_MS);
  }

  useEffect(() => {
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    const onActivity = () => armIdleTimer();

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

  // ===== FORCE LOGOUT (works even if signOut hangs) =====
  async function logout() {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    // 1) Clear UI immediately
    clearIdleTimer();
    setUserEmail(null);
    setUsername(null);
    setRole(null);
    setLoadingAuth(false);

    // 2) Try signOut but don't block
    const timeout = new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      await Promise.race([supabase.auth.signOut({ scope: "local" }), timeout]);
    } catch {
      // ignore
    }

    // 3) Remove Supabase auth token keys from localStorage
    if (typeof window !== "undefined") {
      try {
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith("sb-") && k.endsWith("-auth-token")) {
            localStorage.removeItem(k);
          }
        }
      } catch {
        // ignore
      }

      // 4) Hard redirect
      window.location.replace("/login");
    }

    isLoggingOutRef.current = false;
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
