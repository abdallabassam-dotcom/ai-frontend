import { sbAdmin } from "./_lib";

export async function requireAdmin(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) {
    return { ok: false as const, status: 401, error: "Missing Bearer token" };
  }

  const sb = sbAdmin();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) {
    return { ok: false as const, status: 401, error: "Invalid session" };
  }

  const user = data.user;

  const { data: prof } = await sb
    .from("profiles")
    .select("role,email")
    .eq("id", user.id)
    .maybeSingle();

  if (!prof || prof.role !== "admin") {
    return { ok: false as const, status: 403, error: "Admins only" };
  }

  return { ok: true as const, user_id: user.id, email: user.email || prof.email || "" };
}
