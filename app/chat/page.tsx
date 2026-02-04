"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
// @ts-ignore
import FingerprintJS from "@fingerprintjs/fingerprintjs";

async function getFingerprint(): Promise<string> {
  const fp = await FingerprintJS.load();
  const r = await fp.get();
  return r.visitorId;
}

type ChatMsg = { role: "user" | "assistant"; text: string };

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/login");
    });
  }, [router]);

  async function sendMessage() {
    if (!message.trim()) return;

    setChat((prev) => [...prev, { role: "user", text: message }]);
    setStatus("Loading...");
    const msgToSend = message;
    setMessage("");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setStatus("لازم تعمل Login الأول");
        router.push("/login");
        return;
      }

      const fingerprint = await getFingerprint();
      const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");

      const res = await fetch(`${base}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-device-fingerprint": fingerprint,
        },
        credentials: "include",
        body: JSON.stringify({ prompt: msgToSend }),
      });

      const text = await res.text();

      if (!res.ok) {
        setStatus("");
        setChat((prev) => [
          ...prev,
          { role: "assistant", text: `Error ${res.status}: ${text}` },
        ]);
        return;
      }

      const json = JSON.parse(text);
      setStatus("");
      setChat((prev) => [
        ...prev,
        { role: "assistant", text: json.reply || text },
      ]);
    } catch (e: any) {
      setStatus("");
      setChat((prev) => [
        ...prev,
        { role: "assistant", text: "Error: " + (e?.message || "unknown") },
      ]);
    }
  }

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Chat 💬</h2>
        <span className="badge">Trial / Paid Access</span>
      </div>

      <div className="hr" />

      <div style={{ minHeight: 220 }}>
        {chat.length === 0 ? (
          <div className="msg">اكتب رسالة وجرب…</div>
        ) : (
          chat.map((m, i) => (
            <div
              key={i}
              className={"msg " + (m.role === "assistant" ? "good" : "")}
              style={{ textAlign: m.role === "user" ? "right" : "left" }}
            >
              <b>{m.role === "user" ? "أنت" : "النظام"}:</b> {m.text}
            </div>
          ))
        )}
        {status && <div className="msg">{status}</div>}
      </div>

      <div className="hr" />

      <textarea
        className="textarea"
        placeholder="اكتب رسالتك هنا..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button className="btn" onClick={sendMessage}>Send</button>
        <a className="btn secondary" href="/redeem">تفعيل كود</a>
      </div>
    </div>
  );
}
