"use client";
import { useState } from "react";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");

  async function sendMessage() {
    setReply("Loading...");

    const res = await fetch(
      process.env.NEXT_PUBLIC_API_BASE + "/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: message })
      }
    );

    const data = await res.json();
    setReply(data.reply || JSON.stringify(data));
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Chat Page 💬</h2>

      <textarea
        rows={5}
        style={{ width: "100%" }}
        placeholder="اكتب رسالتك هنا..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <br /><br />

      <button onClick={sendMessage}>
        Send
      </button>

      <hr />

      <pre>{reply}</pre>
    </div>
  );
}
