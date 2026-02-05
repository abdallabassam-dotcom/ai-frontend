"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useApp } from "../providers";

type Overview = {
  total_users: number;
  active_trials: number;
  active_paid: number;
  unused_codes: number;
  banned_users: number;
  banned_devices: number;
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
  created_at: string | null;
  plan: string | null;
  active: boolean | null;
  end_at: string | null;
  device_limit: number | null;
  ip_limit: number | null;
  banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
};

type DeviceRow = {
  id: number;
  user_id: string;
  device_id: string | null;
  fingerprint: string | null;
  ip: string | null;
  last_seen: string | null;
  created_at: string | null;
  banned: boolean;
};

type LogRow = {
  id: number;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_user_id: string | null;
  target: string | null;
  meta: any;
  created_at: string;
};

function fmtDate(d?: string | null) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

async function adminFetch(url: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers: any = {
    ...(init?.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  return fetch(url, { ...init, headers });
}

export default function AdminDashboard() {
  const { role, loadingAuth, userEmail } = useApp();
  const router = useRouter();

  const [tab, setTab] = useState<"overview" | "codes" | "users" | "subs" | "devices" | "logs" | "export">("overview");

  // overview
  const [ov, setOv] = useState<Overview | null>(null);
  const [ovMsg, setOvMsg] = useState("");

  // codes
  const [days, setDays] = useState(7);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [genMsg, setGenMsg] = useState("");
  const [codes, setCodes] = useState<TrialCodeRow[]>([]);
  const [codesMsg, setCodesMsg] = useState("");

  // users
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersMsg, setUsersMsg] = useState("");

  // subs
  const [paidUserId, setPaidUserId] = useState("");
  const [paidDays, setPaidDays] = useState(30);
  const [paidMsg, setPaidMsg] = useState("");

  // devices
  const [deviceUserId, setDeviceUserId] = useState("");
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [devicesMsg, setDevicesMsg] = useState("");

  // bans
  const [banReason, setBanReason] = useState("");
  const [banMsg, setBanMsg] = useState("");

  // logs
  const [logQ, setLogQ] = useState("");
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logsMsg, setLogsMsg] = useState("");

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
    const r = await adminFetch("/api/admin/overview");
    const text = await r.text();
    if (!r.ok) return setOvMsg(text);
    setOvMsg("");
    setOv(JSON.parse(text));
  }

  async function loadCodes() {
    setCodesMsg("Loading...");
    const r = await adminFetch("/api/admin/trial-codes");
    const text = await r.text();
    if (!r.ok) return setCodesMsg(text);
    setCodesMsg("");
    setCodes(JSON.parse(text));
  }

  async function generateCode() {
    setGenMsg("Generating...");
    const r = await adminFetch("/api/admin/generate-trial-code", {
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
    const url = `/api/admin/users?q=${encodeURIComponent(q)}&plan=${encodeURIComponent(planFilter)}&active=${encodeURIComponent(activeFilter)}`;
    const r = await adminFetch(url);
    const text = await r.text();
    if (!r.ok) return setUsersMsg(text);
    setUsersMsg("");
    setUsers(JSON.parse(text));
  }

  async function markPaid() {
    setPaidMsg("...");
    const r = await adminFetch("/api/admin/mark-paid", {
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

  async function loadDevices() {
    setDevicesMsg("Loading...");
    const url = `/api/admin/devices?user_id=${encodeURIComponent(deviceUserId)}`;
    const r = await adminFetch(url);
    const text = await r.text();
    if (!r.ok) return setDevicesMsg(text);
    setDevicesMsg("");
    setDevices(JSON.parse(text));
  }

  async function resetDevices(user_id: string) {
    setDevicesMsg("Resetting...");
    const r = await adminFetch("/api/admin/reset-devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id }),
    });
    const text = await r.text();
    if (!r.ok) return setDevicesMsg(text);
    setDevicesMsg(text);
    await loadDevices();
  }

  async function banUser(user_id: string, ban: boolean) {
    setBanMsg("...");
    const r = await adminFetch("/api/admin/ban-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, ban, reason: banReason }),
    });
    const text = await r.text();
    if (!r.ok) return setBanMsg(text);
    setBanMsg(text);
    await loadUsers();
    await loadOverview();
  }

  async function banDevice(row: DeviceRow, ban: boolean) {
    setBanMsg("...");
    const r = await adminFetch("/api/admin/ban-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ban,
        reason: banReason,
        device_id: row.device_id,
        fingerprint: row.fingerprint,
        ip: row.ip,
      }),
    });
    const text = await r.text();
    if (!r.ok) return setBanMsg(text);
    setBanMsg(text);
    await loadDevices();
    await loadOverview();
  }

  async function loadLogs() {
    setLogsMsg("Loading...");
    const r = await adminFetch(`/api/admin/logs?q=${encodeURIComponent(logQ)}`);
    const text = await r.text();
    if (!r.ok) return setLogsMsg(text);
    setLogsMsg("");
    setLogs(JSON.parse(text));
  }

  useEffect(() => {
    loadOverview();
    loadCodes();
    loadUsers();
    loadDevices();
    loadLogs();
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
        <button className="badge" onClick={() => setTab("devices")}>Devices</button>
        <button className="badge" onClick={() => setTab("logs")}>Audit Logs</button>
        <button className="badge" onClick={() => setTab("export")}>Export</button>

        <span className="badge" style={{ marginLeft: "auto" }}>
          admin: {userEmail}
        </span>
      </div>

      <div className="hr" />

      {/* Overview */}
      {tab === "overview" && (
        <>
          <div className="row">
            <div className="col card"><div className="small">Total users</div><div className="h1">{ov?.total_users ?? "-"}</div></div>
            <div className="col card"><div className="small">Active trials</div><div className="h1">{ov?.active_trials ?? "-"}</div></div>
            <div className="col card"><div className="small">Active paid</div><div className="h1">{ov?.active_paid ?? "-"}</div></div>
            <div className="col card"><div className="small">Unused codes</div><div className="h1">{ov?.unused_codes ?? "-"}</div></div>
            <div className="col card"><div className="small">Banned users</div><div className="h1">{ov?.banned_users ?? "-"}</div></div>
            <div className="col card"><div className="small">Banned devices</div><div className="h1">{ov?.banned_devices ?? "-"}</div></div>
          </div>

          {ovMsg && <div className="msg bad">{ovMsg}</div>}
          <button className="btn" onClick={loadOverview} style={{ marginTop: 12 }}>Refresh</button>
        </>
      )}

      {/* Codes */}
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
            <button className="btn secondary" onClick={loadCodes}>Reload</button>
          </div>

          {genMsg && <div className="msg">{genMsg}</div>}
          {codesMsg && <div className="msg bad">{codesMsg}</div>}

          <div className="hr" />

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
        </>
      )}

      {/* Users */}
      {tab === "users" && (
        <>
          <h3 style={{ marginTop: 0 }}>Users</h3>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input className="input" style={{ maxWidth: 320 }} placeholder="Search email/username"
              value={q} onChange={(e) => setQ(e.target.value)} />

            <select className="input" style={{ maxWidth: 150 }} value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
              <option value="">plan: all</option>
              <option value="trial">trial</option>
              <option value="paid">paid</option>
              <option value="none">none</option>
            </select>

            <select className="input" style={{ maxWidth: 150 }} value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
              <option value="">active: all</option>
              <option value="true">active</option>
              <option value="false">inactive</option>
            </select>

            <button className="btn" onClick={loadUsers}>Search</button>
            <button className="btn secondary" onClick={() => { setQ(""); setPlanFilter(""); setActiveFilter(""); setTimeout(loadUsers, 0); }}>Reset</button>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
            <input className="input" style={{ maxWidth: 320 }} placeholder="Ban reason (optional)" value={banReason} onChange={(e) => setBanReason(e.target.value)} />
            {banMsg && <span className="badge">{banMsg}</span>}
          </div>

          {usersMsg && <div className="msg bad">{usersMsg}</div>}

          <div className="hr" />

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Email","Username","Role","Plan","Active","End","Banned","Actions","User ID"].map((h) => (
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
                    <td style={{ padding: 8 }}>{u.banned ? "YES" : "no"}</td>
                    <td style={{ padding: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="btn secondary" onClick={() => setDeviceUserId(u.id)}>Show devices</button>
                      {!u.banned ? (
                        <button className="btn" onClick={() => banUser(u.id, true)}>Ban</button>
                      ) : (
                        <button className="btn secondary" onClick={() => banUser(u.id, false)}>Unban</button>
                      )}
                      <button className="btn secondary" onClick={() => resetDevices(u.id)}>Reset devices</button>
                    </td>
                    <td style={{ padding: 8, fontFamily: "monospace" }}>{u.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Subs */}
      {tab === "subs" && (
        <>
          <h3 style={{ marginTop: 0 }}>Manual subscription (Paid)</h3>
          <div className="small">تحويل يدوي لحد ما تعمل الدفع — Paid (device/ip = 2)</div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <input className="input" style={{ minWidth: 360 }} placeholder="user_id (UUID)"
              value={paidUserId} onChange={(e) => setPaidUserId(e.target.value)} />
            <input className="input" style={{ width: 120 }} type="number"
              value={paidDays} onChange={(e) => setPaidDays(Number(e.target.value))} />
            <button className="btn" onClick={markPaid}>Mark Paid</button>
          </div>

          {paidMsg && <div className="msg">{paidMsg}</div>}
        </>
      )}

      {/* Devices */}
      {tab === "devices" && (
        <>
          <h3 style={{ marginTop: 0 }}>Devices</h3>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input className="input" style={{ minWidth: 360 }} placeholder="user_id (optional)"
              value={deviceUserId} onChange={(e) => setDeviceUserId(e.target.value)} />
            <button className="btn" onClick={loadDevices}>Load</button>
            <button className="btn secondary" onClick={() => { setDeviceUserId(""); setTimeout(loadDevices, 0); }}>All</button>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
            <input className="input" style={{ maxWidth: 320 }} placeholder="Ban reason (optional)" value={banReason} onChange={(e) => setBanReason(e.target.value)} />
            {banMsg && <span className="badge">{banMsg}</span>}
          </div>

          {devicesMsg && <div className="msg">{devicesMsg}</div>}

          <div className="hr" />

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["User","Device ID","Fingerprint","IP","Last seen","Banned","Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.id}>
                    <td style={{ padding: 8, fontFamily: "monospace" }}>{d.user_id}</td>
                    <td style={{ padding: 8 }}>{d.device_id ?? "-"}</td>
                    <td style={{ padding: 8 }}>{d.fingerprint ?? "-"}</td>
                    <td style={{ padding: 8 }}>{d.ip ?? "-"}</td>
                    <td style={{ padding: 8 }}>{fmtDate(d.last_seen)}</td>
                    <td style={{ padding: 8 }}>{d.banned ? "YES" : "no"}</td>
                    <td style={{ padding: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {!d.banned ? (
                        <button className="btn" onClick={() => banDevice(d, true)}>Ban</button>
                      ) : (
                        <button className="btn secondary" onClick={() => banDevice(d, false)}>Unban</button>
                      )}
                      <button className="btn secondary" onClick={() => navigator.clipboard.writeText(JSON.stringify(d, null, 2))}>Copy JSON</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Logs */}
      {tab === "logs" && (
        <>
          <h3 style={{ marginTop: 0 }}>Audit Logs</h3>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input className="input" style={{ maxWidth: 360 }} placeholder="Search action/email/target"
              value={logQ} onChange={(e) => setLogQ(e.target.value)} />
            <button className="btn" onClick={loadLogs}>Search</button>
            <button className="btn secondary" onClick={() => { setLogQ(""); setTimeout(loadLogs, 0); }}>Reset</button>
          </div>

          {logsMsg && <div className="msg bad">{logsMsg}</div>}

          <div className="hr" />

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Time","Action","Actor","Target user","Target","Meta"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ padding: 8 }}>{fmtDate(l.created_at)}</td>
                    <td style={{ padding: 8 }}><b>{l.action}</b></td>
                    <td style={{ padding: 8 }}>{l.actor_email ?? l.actor_id ?? "-"}</td>
                    <td style={{ padding: 8, fontFamily: "monospace" }}>{l.target_user_id ?? "-"}</td>
                    <td style={{ padding: 8 }}>{l.target ?? "-"}</td>
                    <td style={{ padding: 8 }}>
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(l.meta ?? {}, null, 2)}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Export */}
      {tab === "export" && (
        <>
          <h3 style={{ marginTop: 0 }}>Export</h3>
          <div className="small">ينزل CSV (Users / Codes)</div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <button className="btn" onClick={async () => {
              const r = await adminFetch("/api/admin/export-users");
              const blob = await r.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "users.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}>Download users.csv</button>

            <button className="btn secondary" onClick={async () => {
              const r = await adminFetch("/api/admin/export-codes");
              const blob = await r.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "trial_codes.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}>Download trial_codes.csv</button>
          </div>
        </>
      )}
    </div>
  );
}
