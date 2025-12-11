// app/superadmin/manage/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  Shield,
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  Filter,
  ArrowLeft,
  ArrowRight,
  UserRound,
  Hash,
  StickyNote,
  KeyRound,
  AtSign,
  Plus,
  History,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;
const SESSION_KEY = "miray_superadmin_unlocked";
const ACTIVITY_KEY = "miray_superadmin_user_activity";

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function safeJsonParse(s, fallback) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function buildHeaders() {
  const h = { "Content-Type": "application/json" };
  if (process.env.NEXT_PUBLIC_SUPERADMIN_SECRET) {
    h["x-superadmin-secret"] = process.env.NEXT_PUBLIC_SUPERADMIN_SECRET;
  }
  return h;
}

function pushActivity(entry) {
  const list = safeJsonParse(localStorage.getItem(ACTIVITY_KEY) || "[]", []);
  const next = [{ ...entry, at: new Date().toISOString() }, ...list].slice(0, 200);
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next));
  return next;
}

export default function SuperAdminManageUsers() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  // filters
  const [q, setQ] = useState(""); // userId + username + notes
  const [role, setRole] = useState("");
  const [isActive, setIsActive] = useState(""); // "" | "true" | "false"

  const [page, setPage] = useState(1);
  const limit = 20;

  const [loading, setLoading] = useState(true);

  // activity
  const [activity, setActivity] = useState([]);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  // gate
  useEffect(() => {
    const ok = sessionStorage.getItem(SESSION_KEY) === "1";
    if (!ok) {
      router.replace("/superadmin");
      return;
    }
    setReady(true);

    const list = safeJsonParse(localStorage.getItem(ACTIVITY_KEY) || "[]", []);
    setActivity(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async (targetPage = page) => {
    if (!API) {
      console.error("NEXT_PUBLIC_API_URL missing");
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const url = new URL(`${API}/superadmin/users`);
      url.searchParams.set("page", String(targetPage));
      url.searchParams.set("limit", String(limit));
      if (q) url.searchParams.set("q", q);
      if (role) url.searchParams.set("role", role);
      if (isActive !== "") url.searchParams.set("isActive", isActive);

      const r = await fetch(url.toString(), {
        method: "GET",
        headers: buildHeaders(),
        cache: "no-store",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Failed to load users");

      setItems(d.items || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error("❌ load users:", e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, page]);

  const applyFilters = () => {
    setPage(1);
    load(1);
  };

  const resetFilters = () => {
    setQ("");
    setRole("");
    setIsActive("");
    setPage(1);
    setTimeout(() => load(1), 0);
  };

  // ✅ EDIT user (no modal) — prompts
  const editUser = async (u) => {
    if (!API) return alert("Missing NEXT_PUBLIC_API_URL");
    const id = u.userId || u._id;
    if (!id) return;

    const nextUsername = prompt("Update username:", u.username || "");
    if (nextUsername === null) return;

    const nextRole = prompt("Update role (user/admin/superadmin):", u.role || "user");
    if (nextRole === null) return;

    const nextNotes = prompt("Update notes:", u.notes || "");
    if (nextNotes === null) return;

    const payload = {
      username: String(nextUsername || "").trim(),
      role: String(nextRole || "").trim() || "user",
      notes: String(nextNotes || "").trim(),
    };

    if (!payload.username) return alert("Username cannot be empty");

    try {
      const r = await fetch(`${API}/superadmin/users/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Update failed");

      const nextActivity = pushActivity({
        action: "UPDATED_USER",
        userId: d?.user?.userId || u.userId || "—",
        meta: { username: payload.username, role: payload.role },
      });
      setActivity(nextActivity);

      await load(page);
    } catch (e) {
      console.error("❌ edit user:", e);
      alert(e.message || "Update failed");
    }
  };

  const toggleActive = async (u) => {
    if (!API) return alert("Missing NEXT_PUBLIC_API_URL");
    const id = u.userId || u._id;
    if (!id) return;

    try {
      const r = await fetch(`${API}/superadmin/users/${encodeURIComponent(id)}/toggle-active`, {
        method: "PATCH",
        headers: buildHeaders(),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Toggle failed");

      const nextActivity = pushActivity({
        action: "TOGGLED_ACTIVE",
        userId: d?.user?.userId || u.userId || "—",
        meta: { isActive: d?.user?.isActive },
      });
      setActivity(nextActivity);

      await load(page);
    } catch (e) {
      console.error("❌ toggle active:", e);
      alert(e.message || "Toggle failed");
    }
  };

  const removeUser = async (u) => {
    if (!API) return alert("Missing NEXT_PUBLIC_API_URL");
    const id = u.userId || u._id;
    if (!id) return;

    if (!confirm(`Delete ${u.userId || "this user"} permanently?`)) return;

    try {
      const r = await fetch(`${API}/superadmin/users/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: buildHeaders(),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Delete failed");

      const nextActivity = pushActivity({
        action: "DELETED_USER",
        userId: u.userId || "—",
        meta: { username: u.username || "" },
      });
      setActivity(nextActivity);

      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else await load(page);
    } catch (e) {
      console.error("❌ delete user:", e);
      alert(e.message || "Delete failed");
    }
  };

  const setPasswordOnly = async (u) => {
    if (!API) return alert("Missing NEXT_PUBLIC_API_URL");
    const id = u.userId || u._id;
    if (!id) return;

    const next = prompt(`Enter new password for ${u.userId} (@${u.username || "—"}) (min 4 chars):`);
    if (next === null) return;

    const trimmed = String(next || "").trim();
    if (trimmed.length < 4) return alert("Password must be at least 4 characters");

    try {
      const r = await fetch(`${API}/superadmin/users/${encodeURIComponent(id)}/password`, {
        method: "PATCH",
        headers: buildHeaders(),
        body: JSON.stringify({ password: trimmed }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Password update failed");

      const nextActivity = pushActivity({
        action: "UPDATED_PASSWORD",
        userId: u.userId || "—",
        meta: { username: u.username || "" },
      });
      setActivity(nextActivity);

      alert("Password updated ✅");
    } catch (e) {
      console.error("❌ update password:", e);
      alert(e.message || "Password update failed");
    }
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden">
      {/* blue/white background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] bg-blue-600/15 blur-[110px] rounded-full" />
        <div className="absolute -bottom-44 -right-44 w-[620px] h-[620px] bg-sky-400/15 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(37,99,235,0.10)_1px,transparent_0)] [background-size:22px_22px] opacity-40" />
      </div>

      <div className="max-w-7xl mx-auto px-5 py-10 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Shield className="text-blue-700" size={20} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Superadmin</div>
              <div className="text-2xl font-semibold flex items-center gap-2">
                <Users className="text-blue-700" size={22} />
                Manage Users
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push("/superadmin")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 transition"
            >
              <ArrowLeft size={16} />
              Vault
            </button>

            <button
              onClick={() => load(page)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 transition"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            {/* ✅ Go to full-width Activity page */}
            <button
              onClick={() => router.push("/superadmin/activity")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 transition"
              title="View full activity"
            >
              <History size={16} />
              Activity
            </button>

            {/* ✅ Add user moved to /superadmin/add */}
            <button
              onClick={() => router.push("/superadmin/add")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 transition text-white font-semibold"
            >
              <Plus size={16} />
              Add User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 rounded-3xl bg-white/80 backdrop-blur border border-blue-100 shadow-sm p-4 md:p-5">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-800 block mb-2">Search</label>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-2">
                <Search size={16} className="text-gray-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search userId, username, or notes..."
                  className="w-full outline-none bg-transparent text-sm"
                />
              </div>
              <div className="text-[11px] text-gray-500 mt-2">
                Search checks: <b>userId</b>, <b>username</b>, <b>notes</b>.
              </div>
            </div>

            <div className="w-full lg:w-56">
              <label className="text-sm font-semibold text-gray-800 block mb-2">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl px-3 py-2 text-sm outline-none"
              >
                <option value="">All</option>
                <option value="user">user</option>
                <option value="admin">admin</option>
                <option value="superadmin">superadmin</option>
              </select>
            </div>

            <div className="w-full lg:w-56">
              <label className="text-sm font-semibold text-gray-800 block mb-2">Status</label>
              <select
                value={isActive}
                onChange={(e) => setIsActive(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl px-3 py-2 text-sm outline-none"
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 transition text-white font-semibold"
              >
                <Filter size={16} />
                Apply
              </button>

              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 transition"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 flex items-center justify-between">
            <span>
              Total: <b>{total}</b>
            </span>
            <span>
              Page <b>{page}</b> / <b>{pages}</b>
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Users list */}
          <div className="xl:col-span-2 rounded-3xl bg-white/80 backdrop-blur border border-blue-100 shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 flex items-center justify-between">
              <div className="font-semibold text-gray-900 flex items-center gap-2">
                <UserRound size={18} className="text-blue-700" />
                Users
              </div>
              <div className="text-xs text-gray-500">userId is auto-generated (U-000001...)</div>
            </div>

            {loading ? (
              <div className="p-5 text-gray-600">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-5 text-gray-600">No users found.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((u) => (
                  <motion.div key={u._id || u.userId} layout className="p-4 md:p-5 hover:bg-blue-50/40 transition">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-base font-semibold text-gray-900 truncate inline-flex items-center gap-2">
                            <Hash size={16} className="text-blue-700" />
                            {u.userId || "—"}
                          </div>

                          <span className="text-xs px-2 py-1 rounded-full border border-blue-100 bg-white text-blue-700 inline-flex items-center gap-1">
                            <AtSign size={12} />
                            {u.username || "—"}
                          </span>

                          <span className="text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-700">
                            {u.role || "user"}
                          </span>

                          <span
                            className={cx(
                              "text-xs px-2 py-1 rounded-full border",
                              u.isActive
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-700"
                            )}
                          >
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle2 size={14} /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <XCircle size={14} /> Inactive
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="mt-2 text-sm text-gray-600 flex items-start gap-2">
                          <StickyNote size={14} className="text-gray-500 mt-0.5" />
                          <div className="truncate">{u.notes || "—"}</div>
                        </div>

                        <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                          <span>
                            Created: <b>{fmtDate(u.createdAt)}</b>
                          </span>
                          <span>
                            Updated: <b>{fmtDate(u.updatedAt)}</b>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(u)}
                          className="px-3 py-2 rounded-2xl text-sm border border-gray-200 bg-white hover:bg-gray-50 transition"
                          title="Toggle Active"
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          onClick={() => setPasswordOnly(u)}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 transition"
                          title="Change Password"
                        >
                          <KeyRound size={16} />
                        </button>

                        <button
                          onClick={() => editUser(u)}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 transition"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => removeUser(u)}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-red-600 hover:bg-red-700 transition text-white"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="p-4 md:p-5 flex items-center justify-between border-t border-gray-100">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={cx(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-2xl border transition",
                  page <= 1 ? "bg-gray-50 text-gray-400 border-gray-200" : "bg-white border-gray-200 hover:bg-gray-50"
                )}
              >
                <ArrowLeft size={16} />
                Prev
              </button>

              <div className="text-sm text-gray-600">
                Page <b>{page}</b> / <b>{pages}</b>
              </div>

              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className={cx(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-2xl border transition",
                  page >= pages ? "bg-gray-50 text-gray-400 border-gray-200" : "bg-white border-gray-200 hover:bg-gray-50"
                )}
              >
                Next
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Activity panel (compact) */}
          <div className="rounded-3xl bg-white/80 backdrop-blur border border-blue-100 shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 flex items-center justify-between">
              <div className="font-semibold text-gray-900 flex items-center gap-2">
                <Activity size={18} className="text-blue-700" />
                Activity
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push("/superadmin/activity")}
                  className="text-xs px-3 py-1 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition inline-flex items-center gap-1"
                  title="Open full activity page"
                >
                  <History size={14} />
                  Full
                </button>

                <button
                  onClick={() => {
                    localStorage.removeItem(ACTIVITY_KEY);
                    setActivity([]);
                  }}
                  className="text-xs px-3 py-1 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition"
                  title="Clear local activity"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="px-4 md:px-5 pb-5">
              <div className="text-xs text-gray-500 mb-3">Local panel actions log (stored in this browser).</div>

              {activity.length === 0 ? (
                <div className="text-sm text-gray-600">No recent activity yet.</div>
              ) : (
                <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
                  {activity.map((a, idx) => (
                    <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-3">
                      <div className="text-sm font-semibold text-gray-900">{a.action}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        <span className="text-gray-500">User:</span> <b>{a.userId || "—"}</b>
                      </div>
                      {a?.meta?.username && <div className="text-xs text-gray-600 mt-1">@{a.meta.username}</div>}
                      {a?.meta?.isActive !== undefined && (
                        <div className="text-xs text-gray-600 mt-1">
                          Status:{" "}
                          <b className={a.meta.isActive ? "text-emerald-700" : "text-red-700"}>
                            {a.meta.isActive ? "Active" : "Inactive"}
                          </b>
                        </div>
                      )}
                      <div className="text-[11px] text-gray-500 mt-2">{fmtDate(a.at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          Create users is moved to <b>/superadmin/add</b>. For full logs, open <b>/superadmin/activity</b>.
        </div>
      </div>
    </div>
  );
}
