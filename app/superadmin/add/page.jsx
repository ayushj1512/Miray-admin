// app/superadmin/add/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  UserPlus,
  ArrowLeft,
  Save,
  AtSign,
  KeyRound,
  StickyNote,
  UserRound,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;
const SESSION_KEY = "miray_superadmin_unlocked";
const ACTIVITY_KEY = "miray_superadmin_user_activity";

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

function normalizeUsername(v) {
  return String(v ?? "").trim().toLowerCase();
}

export default function SuperAdminAddUser() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [toast, setToast] = useState(null); // {type:'success'|'error', msg:string}

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "user",
    isActive: true,
    notes: "",
  });

  // gate
  useEffect(() => {
    const ok = sessionStorage.getItem(SESSION_KEY) === "1";
    if (!ok) {
      router.replace("/superadmin");
      return;
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const username = useMemo(() => normalizeUsername(form.username), [form.username]);
  const pass = useMemo(() => String(form.password || ""), [form.password]);

  const canSubmit = useMemo(() => {
    return username.length >= 1 && pass.trim().length >= 4 && !saving;
  }, [username, pass, saving]);

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    if (!API) {
      setToast({ type: "error", msg: "Missing NEXT_PUBLIC_API_URL" });
      return;
    }

    const u = normalizeUsername(form.username);
    const p = String(form.password || "").trim();

    if (!u) {
      setToast({ type: "error", msg: "Username is required." });
      return;
    }
    if (p.length < 4) {
      setToast({ type: "error", msg: "Password must be at least 4 characters." });
      return;
    }

    setSaving(true);
    setToast(null);

    try {
      const r = await fetch(`${API}/superadmin/users`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          username: u,
          password: p,
          role: form.role || "user",
          isActive: !!form.isActive,
          notes: String(form.notes || ""),
        }),
      });

      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Failed to create user");

      pushActivity({
        action: "CREATED_USER",
        userId: d?.user?.userId || "—",
        meta: { username: u, role: form.role, isActive: !!form.isActive },
      });

      setToast({ type: "success", msg: `User created: ${d?.user?.userId || "✅"}` });

      // Reset form (keep role/active if you want)
      setForm((p0) => ({
        ...p0,
        username: "",
        password: "",
        notes: "",
      }));

      // Optional: auto go back
      setTimeout(() => router.push("/superadmin/manage"), 450);
    } catch (err) {
      console.error("❌ create user:", err);
      setToast({ type: "error", msg: err?.message || "Create failed" });
    } finally {
      setSaving(false);
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

      <div className="max-w-4xl mx-auto px-5 py-10 relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Shield className="text-blue-700" size={20} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Superadmin</div>
              <div className="text-2xl font-semibold flex items-center gap-2">
                <UserPlus className="text-blue-700" size={22} />
                Add User
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/superadmin/manage")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 transition"
            >
              <ArrowLeft size={16} />
              Back to Manage
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: info card */}
          <div className="lg:col-span-2 rounded-3xl bg-white/80 backdrop-blur border border-blue-100 shadow-sm p-5">
            <div className="flex items-center gap-2">
              <UserRound className="text-blue-700" size={18} />
              <div className="font-semibold">New Account</div>
            </div>
            <div className="mt-3 text-sm text-gray-600 leading-relaxed">
              Create a new user with:
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>
                  Unique <b>username</b> (auto lowercased)
                </li>
                <li>
                  <b>password</b> (min 4 chars, stored hashed)
                </li>
                <li>
                  <b>role</b> and active status
                </li>
              </ul>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
              Tip: Keep usernames simple like <b>admin1</b>, <b>ayush</b>, <b>staff02</b>.
            </div>
          </div>

          {/* Right: form */}
          <div className="lg:col-span-3 rounded-3xl bg-white/80 backdrop-blur border border-blue-100 shadow-sm overflow-hidden">
            <form onSubmit={onSubmit}>
              <div className="p-5 border-b border-gray-100">
                <div className="font-semibold text-gray-900">Create User</div>
                <div className="text-sm text-gray-600 mt-1">Fill details below and hit Save.</div>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <Field label="Username *">
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-2">
                    <AtSign size={16} className="text-gray-500" />
                    <input
                      value={form.username}
                      onChange={(e) => setField("username", e.target.value)}
                      className="w-full outline-none bg-transparent"
                      placeholder="e.g. admin1"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>
                  <div className="text-[11px] text-gray-500 mt-2">
                    Saved as: <b>@{username || "—"}</b>
                  </div>
                </Field>

                {/* Role */}
                <Field label="Role">
                  <select
                    value={form.role}
                    onChange={(e) => setField("role", e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-3 py-2 outline-none"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                    <option value="superadmin">superadmin</option>
                  </select>
                </Field>

                {/* Password */}
                <Field label="Password *" full>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-2 flex-1">
                      <KeyRound size={16} className="text-gray-500" />
                      <input
                        type={showPass ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setField("password", e.target.value)}
                        className="w-full outline-none bg-transparent"
                        placeholder="min 4 chars"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      className="inline-flex items-center justify-center w-12 h-10 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 transition"
                      title={showPass ? "Hide" : "Show"}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div className="text-[11px] text-gray-500 mt-2">
                    Password is stored hashed (bcrypt). It is never shown again.
                  </div>
                </Field>

                {/* Active */}
                <Field label="Active">
                  <button
                    type="button"
                    onClick={() => setField("isActive", !form.isActive)}
                    className={cx(
                      "w-full inline-flex items-center justify-between px-3 py-2 rounded-2xl border transition",
                      form.isActive
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-red-50 border-red-200 text-red-800"
                    )}
                  >
                    <span className="text-sm font-semibold">{form.isActive ? "Active" : "Inactive"}</span>
                    {form.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                </Field>

                {/* Notes */}
                <Field label="Notes" full>
                  <div className="flex items-start gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-2">
                    <StickyNote size={16} className="text-gray-500 mt-0.5" />
                    <textarea
                      value={form.notes}
                      onChange={(e) => setField("notes", e.target.value)}
                      className="w-full outline-none bg-transparent min-h-[90px]"
                      placeholder="Optional notes..."
                    />
                  </div>
                </Field>
              </div>

              <div className="p-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <AnimatePresence mode="popLayout">
                  {toast && (
                    <motion.div
                      key={toast.type + toast.msg}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className={cx(
                        "flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm",
                        toast.type === "success"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      )}
                    >
                      {toast.type === "success" ? (
                        <CheckCircle2 size={16} className="mt-0.5" />
                      ) : (
                        <AlertTriangle size={16} className="mt-0.5" />
                      )}
                      <div>{toast.msg}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => router.push("/superadmin/manage")}
                    className="px-4 py-2 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={cx(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-white font-semibold transition",
                      canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300"
                    )}
                  >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save User"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          After creating, you’ll be redirected to <b>/superadmin/manage</b>.
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="text-sm font-semibold text-gray-800 block mb-2">{label}</label>
      {children}
    </div>
  );
}
