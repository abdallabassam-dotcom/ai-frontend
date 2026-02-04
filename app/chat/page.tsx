"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
// @ts-ignore
import FingerprintJS from "@fingerprintjs/fingerprintjs";

async function getFingerprint() {
  const fp = await FingerprintJS.load();
  return (await fp.get()).visitorId;
}

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/login");
      }
    });
  }, [router]);

  async function sendMessage() {
    try {
      setReply("Loading...");

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setReply("لازم تعمل Login الأول");
        return;
      }

      const fingerprint = await getFingerprint();
      const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");

      const res = await fetch(`${base}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-device-fingerprint": fingerprint
        },
        credentials: "include",
        body: JSON.stringify({ prompt: message })
      });

      const text = await res.text();
      if (!res.ok) {
        setReply(`Error ${res.status}: ${text}`);
        return;
      }

      const dataJson = JSON.parse(text);
