"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../providers";

type Overview = {
  total_users: number;
  active_trials: number;
  active_paid: number;
  unused_codes: number;
};

type TrialCodeRow = {
  code: string;
  used: boolean;
  duration_days: number | null;
  created_at: string | null;
  used_at: string | null;
  expires_at: string | null;
  used_by: string | null;
};

type UserRow = {
  id: string;
  email: string | null;
  username: string | null;
  role: string | null;
  plan: string | null;
  active: boolean | null;
  end_at: string | null;
};

function fmtDate(d?: string | null) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

export default function AdminDashboard() {
  const { role, loadingAuth, userEmail } = useApp();
  const router = useRouter();

  const [tab, setTab] = useState<"overview" | "codes" | "users" | "subs">("overview");

  // overview
  const [ov, setOv] = useState<Overview | null>(null);
  const [ovMsg, setOvMsg] = useState("");

  // generate code
  const [days, setDays] = useState(7);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [genMsg, setGenMsg] = useState("");
  const [codes, setCodes] = useState<TrialCodeRow[]>([]);
  const [codesMsg, setCodesMsg] = useState("");

  // users
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersMsg, setUsersMsg] = useState("");

  // manual paid
  const [paidUserId, setPaidUserId] = useState("");
  const [paidDays, setPaidDays] = useState(30);
  const [paidMsg, setPaidMsg] = useState("");

  // Guard
  useEffect(() => {
    if (loadingAuth) return;
    if (!userEmail) router.replace("/login");
    else if (role !== "admin") router.replace("/");
  }, [loadingAuth, userEmail, role, router]);

  const canRender = useMemo(() => !loadingAuth && userEmail && role === "admin", [loadingAuth, userEmail, role]);
  if (!canRender) return <div className="card">...</div>;

  async function loadOverview() {
    setOvMsg("Loading...");
    const r = await fetch("/api/admin/overview", { method: "GET" });
    const text = await r.text();
    if (!r.ok) return setOvMsg(text);
    setOvMsg("");
    setOv(JSON.parse(text));
  }

  async function loadCodes() {
    setCodesMsg("Loading...");
    const r = await fetch("/api/admin/trial-codes", { method: "GET" });
    const text = await r.text();
    if (!r.ok) return setCodesMsg(text);
    setCodesMsg("");
    setCodes(JSON.parse(text));
  }

  async function generateCode() {
    setGenMsg("Generating...");
    const r = await fetch("/api/admin/generate-trial-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days, expires_in_days: expiresInDays }),
    });
    const text = await r.text();
    if (!r.ok) return setGenMsg(text);
    setGenMsg(text);
    await loadCodes();
    await loadOverview();
  }

  async function loadUsers() {
    setUsersMsg("Loading...");
    const r = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`, { method: "GET" });
    const text = await r.text();
    if (!r.ok) return setUsersMsg(text);
    setUsersMsg("");
    setUsers(JSON.parse(text));
  }

  async function markPaid() {
    setPaidMsg("...");
    const r = await fetch("/api/admin/mark-paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: paidUserId, days: paidDays }),
    });
    const text = await r.text();
    if (!r.ok) return setPaidMsg(text);
    setPaidMsg(text);
    await loadUsers();
    await loadOverview();
  }

  useEffect(() => {
    // load initial
    loadOverview();
    loadCodes();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="card">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Admin Dashboard 🛠️</h2>

        <button className="badge" onClick={() => setTab("overview")}>Overview</button>
        <button className="badge" onClick={() => setTab("codes")}>Trial Codes</button>
        <button className="badge" onClick={() => setTab("users")}>Users</button>
        <button className="badge" onClick={() => setTab("subs")}>Subscriptions</button>

        <span className="badge" style={{ marginLeft: "auto" }}>
          admin: {userEmail}
        </span>
      </div>

      <div className="hr" />

      {tab === "overview" && (
        <>
          <div className="row">
            <div className="col card">
              <div className="small">Total users</div>
              <div className="h1">{ov?.total_users ?? "-"}</div>
            </div>
            <div className="col card">
              <div className="small">Active trials</div>
              <div className="h1">{ov?.active_trials ?? "-"}</div>
            </div>
            <div className="col card">
              <div className="small">Active paid</div>
              <div className="h1">{ov?.active_paid ?? "-"}</div>
            </div>
            <div className="col card">
              <div className="small">Unused codes</div>
              <div className="h1">{ov?.unused_codes ?? "-"}</div>
            </div>
          </div>

          {ovMsg && <div className="msg bad">{ovMsg}</div>}

          <button className="btn" onClick={loadOverview} style={{ marginTop: 12 }}>
            Refresh
          </button>
        </>
      )}

      {tab === "codes" && (
        <>
          <h3 style={{ marginTop: 0 }}>Generate trial code</h3>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <label className="small">
              Days:
              <input className="input" style={{ width: 110, marginLeft: 8 }} type="number" value={days}
                onChange={(e) => setDays(Number(e.target.value))} />
            </label>

            <label className="small">
              Expires in (days):
              <input className="input" style={{ width: 140, marginLeft: 8 }} type="number" value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))} />
            </label>

            <button className="btn" onClick={generateCode}>Generate</button>
            <button className="btn secondary" onClick={loadCodes}>Reload codes</button>
          </div>

          {genMsg && <div className={"msg " + (genMsg.includes("code") ? "good" : "bad")}>{genMsg}</div>}
          {codesMsg && <div className="msg bad">{codesMsg}</div>}

          <div className="hr" />

          <h3 style={{ marginTop: 0 }}>Last codes</h3>
          {codes.length === 0 ? (
            <div className="small">لسه مفيش أكواد</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Code","Used","Duration","Expires","Used at","Used by"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.code}>
                      <td style={{ padding: 8 }}>
                        <b>{c.code}</b>{" "}
                        <button className="btn secondary" onClick={() => navigator.clipboard.writeText(c.code)}>Copy</button>
                      </td>
                      <td style={{ padding: 8 }}>{c.used ? "yes" : "no"}</td>
                      <td style={{ padding: 8 }}>{c.duration_days ?? 7}</td>
                      <td style={{ padding: 8 }}>{fmtDate(c.expires_at)}</td>
                      <td style={{ padding: 8 }}>{fmtDate(c.used_at)}</td>
                      <td style={{ padding: 8 }}>{c.used_by ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "users" && (
        <>
          <h3 style={{ marginTop: 0 }}>Users</h3>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input
              className="input"
              style={{ maxWidth: 380 }}
              placeholder="Search by email/username"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn" onClick={loadUsers}>Search</button>
            <button className="btn secondary" onClick={() => { setQ(""); setTimeout(loadUsers, 0); }}>Reset</button>
          </div>

          {usersMsg && <div className="msg bad">{usersMsg}</div>}

          <div className="hr" />

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Email","Username","Role","Plan","Active","End","User ID"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ padding: 8 }}>{u.email ?? "-"}</td>
                    <td style={{ padding: 8 }}>{u.username ?? "-"}</td>
                    <td style={{ padding: 8 }}><b>{u.role ?? "student"}</b></td>
                    <td style={{ padding: 8 }}>{u.plan ?? "-"}</td>
                    <td style={{ padding: 8 }}>{u.active ? "yes" : "no"}</td>
                    <td style={{ padding: 8 }}>{fmtDate(u.end_at)}</td>
                    <td style={{ padding: 8, fontFamily: "monospace" }}>{u.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "subs" && (
        <>
          <h3 style={{ marginTop: 0 }}>Manual subscription (Paid)</h3>
          <div className="small">
            لحد ما تعمل الدفع: اكتب user_id ومدة الاشتراك، وهيتحول Paid (device/ip = 2).
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <input
              className="input"
              style={{ minWidth: 360 }}
              placeholder="user_id (UUID)"
              value={paidUserId}
              onChange={(e) => setPaidUserId(e.target.value)}
            />
            <input
              className="input"
              style={{ width: 120 }}
              type="number"
              value={paidDays}
              onChange={(e) => setPaidDays(Number(e.target.value))}
            />
            <button className="btn" onClick={markPaid}>Mark Paid</button>
          </div>

          {paidMsg && <div className={"msg " + (paidMsg.includes("success") ? "good" : "bad")}>{paidMsg}</div>}
        </>
      )}
    </div>
  );
}
