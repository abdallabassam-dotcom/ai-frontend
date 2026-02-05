"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [days, setDays] = useState(7);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [result, setResult] = useState("");
  const [codes, setCodes] = useState<string[]>([]);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_key");
    if (saved) setAdminKey(saved);
  }, []);

  async function generate() {
    setResult("Generating...");

    // خزّنها session فقط (اختياري)
    sessionStorage.setItem("admin_key", adminKey);

    const res = await fetch("/api/admin/generate-trial-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify({
        days,
        expires_in_days: expiresInDays,
      }),
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
          placeholder="Admin key"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          style={{ width: 320 }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
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

        <button onClick={generate} disabled={!adminKey}>
          Generate Code
        </button>
      </div>

      <pre style={{ background: "#f5f5f5", padding: 12, whiteSpace: "pre-wrap" }}>{result}</pre>

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
