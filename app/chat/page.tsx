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

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/login");
    });
  }, [router]);

  async function sendMessage() {
    try {
      setReply("Loading...");

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setReply("لازم تعمل Login الأول");
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
        body: JSON.stringify({ prompt: message }),
      });

      const text = await res.text();

      if (!res.ok) {
        setReply(`Error ${res.status}: ${text}`);
        return;
      }

      const dataJson = JSON.parse(text);
      setReply(dataJson.reply || text);
    } catch (e: any) {
      setReply("Error: " + (e?.message || "unknown"));
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Chat Page 💬</h2>

      <textarea
        rows={5}
        style={{ width: "100%" }}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="اكتب رسالتك هنا..."
      />

      <br />
      <br />

      <button onClick={sendMessage}>Send</button>

      <hr />

      <pre>{reply}</pre>
    </div>
  );
}
