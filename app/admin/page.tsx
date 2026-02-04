"use client";

import { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [days, setDays] = useState(7);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [result, setResult] = useState("");
  const [codes, setCodes] = useState<string[]>([]);

  async function generate() {
    setResult("Generating...");

    const res = await fetch("/api/admin/generate-trial-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password,
        days,
        expires_in_days: expiresInDays
      })
    });

    const text = await res.text();

    if (!res.ok) {
      setResult(`Error ${res.status}: ${text}`);
      return;
    }

    setResult(text);

    try {
      const json = JSON.parse(text);
      if (json.code) setCodes((prev) => [json.code, ...prev]);
    } catch {}
  }

  function copy(code: string) {
    navigator.clipboard.writeText(code);
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Admin Dashboard 🛠️</h2>

      <div style={{ marginBottom: 12 }}>
        <input
          type="password"
          placeholder="Admin dashboard password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: 280 }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <label>
          Days:
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{ width: 80, marginLeft: 6 }}
          />
        </label>

        <label>
          Expires in (days):
          <input
            type="number"
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(Number(e.target.value))}
            style={{ width: 80, marginLeft: 6 }}
          />
        </label>

        <button onClick={generate}>Generate Code</button>
      </div>

      <pre style={{ background: "#f5f5f5", padding: 12 }}>{result}</pre>

      <h3>Last codes</h3>
      {codes.length === 0 ? (
        <p>لسه مفيش أكواد</p>
      ) : (
        <ul>
          {codes.map((c) => (
            <li key={c}>
              <b>{c}</b>{" "}
              <button onClick={() => copy(c)}>Copy</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
