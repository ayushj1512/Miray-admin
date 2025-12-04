"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, RefreshCcw, Filter, Clock, BadgeCheck, AlertCircle, ExternalLink, Mail, Phone, Image as ImageIcon, ListChecks, Loader2 } from "lucide-react";

/** Admin Support Dashboard (/support-tickets)
 * ✅ GET   /api/support/tickets                  (admin list)     query: status,q,issueType,page,limit
 * ✅ GET   /api/support/tickets/by-email         (by email)       query: email,status,page,limit
 * ✅ GET   /api/support/tickets/:ticketId        (details)
 * ✅ PATCH /api/support/tickets/:ticketId/status (update)
 */

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const API_BASE = `${BACKEND}/api/support`;
const STATUS_TABS = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const ISSUE_TYPES = ["All", "Order Issue", "Delivery / Shipment", "Exchange / Return", "Payment / Refund", "Product / Quality", "Other"];

const safe = (v) => String(v ?? "").trim();
const upper = (v) => safe(v).toUpperCase();
const fmtDate = (d) => (d ? new Date(d).toLocaleString() : "-");

const qs = (params) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    const val = safe(v);
    if (!val) return;
    sp.set(k, val);
  });
  return sp.toString();
};

const pill = (status) => {
  const s = upper(status);
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";
  if (s === "OPEN") return `${base} bg-blue-50 text-blue-700 ring-blue-200`;
  if (s === "IN_PROGRESS") return `${base} bg-amber-50 text-amber-700 ring-amber-200`;
  if (s === "RESOLVED") return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200`;
  if (s === "CLOSED") return `${base} bg-gray-100 text-gray-700 ring-gray-200`;
  return `${base} bg-gray-100 text-gray-700 ring-gray-200`;
};

const statCardTone = (kind) => {
  if (kind === "open") return "border-blue-200 bg-blue-50/60 text-blue-700";
  if (kind === "progress") return "border-amber-200 bg-amber-50/60 text-amber-700";
  if (kind === "resolved") return "border-emerald-200 bg-emerald-50/60 text-emerald-700";
  return "border-gray-200 bg-gray-50 text-gray-700";
};

export default function SupportTicketsDashboard() {
  // Draft filters (inputs)
  const [tab, setTab] = useState("ALL");
  const [qText, setQText] = useState("");
  const [email, setEmail] = useState("");
  const [issueType, setIssueType] = useState("All");

  // Applied filters (used for realtime list)
  const [applied, setApplied] = useState({ tab: "ALL", q: "", email: "", issueType: "All" });
  const appliedKey = useMemo(() => JSON.stringify(applied), [applied]); // stable dep key

  // List data
  const [page, setPage] = useState(1);
  const limit = 15;
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  // Realtime/poll
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pollMs, setPollMs] = useState(7000);

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Selection (details panel)
  const [selectedId, setSelectedId] = useState("");
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // Status update
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const inflightList = useRef(null);
  const inflightDetails = useRef(null);

  const pages = useMemo(() => Math.max(1, Math.ceil((Number(total) || 0) / limit)), [total]);
  const pageStats = useMemo(() => {
    const c = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 };
    items.forEach((t) => {
      const s = upper(t?.status);
      if (c[s] !== undefined) c[s] += 1;
    });
    return c;
  }, [items]);

  const buildListUrl = () => {
    const status = applied.tab !== "ALL" ? applied.tab : "";
    const it = applied.issueType !== "All" ? applied.issueType : "";
    if (safe(applied.email)) return `${API_BASE}/tickets/by-email?${qs({ email: applied.email, status, page, limit })}`;
    return `${API_BASE}/tickets?${qs({ status, q: applied.q, issueType: it, page, limit })}`;
  };

  const fetchList = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setRefreshing(!!silent);
    setError("");

    try {
      if (inflightList.current) inflightList.current.abort();
      const ctrl = new AbortController();
      inflightList.current = ctrl;

      const res = await fetch(buildListUrl(), { method: "GET", cache: "no-store", signal: ctrl.signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) throw new Error(data?.message || `Failed (${res.status})`);

      const list = Array.isArray(data?.tickets) ? data.tickets : Array.isArray(data?.items) ? data.items : [];
      const tot = Number(data?.total ?? data?.count ?? list.length ?? 0);

      setItems(list);
      setTotal(tot);

      const first = safe(list?.[0]?.ticketId);
      setSelectedId((prev) => {
        const cur = safe(prev);
        if (!list.length) return "";
        if (!cur && first) return first;
        if (cur && !list.some((x) => safe(x?.ticketId) === cur)) return first || "";
        return cur;
      });
    } catch (e) {
      if (e?.name === "AbortError") return;
      setError(e?.message || "Failed to load tickets");
      setItems([]);
      setTotal(0);
      setSelectedId("");
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDetails = async (ticketId) => {
    const id = safe(ticketId);
    if (!id) return;

    setDetails(null);
    setDetailsError("");
    setDetailsLoading(true);

    try {
      if (inflightDetails.current) inflightDetails.current.abort();
      const ctrl = new AbortController();
      inflightDetails.current = ctrl;

      const res = await fetch(`${API_BASE}/tickets/${encodeURIComponent(id)}`, { method: "GET", cache: "no-store", signal: ctrl.signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) throw new Error(data?.message || `Failed (${res.status})`);

      setDetails(data?.ticket || null);
      setAdminNotes(safe(data?.ticket?.adminNotes));
    } catch (e) {
      if (e?.name === "AbortError") return;
      setDetailsError(e?.message || "Failed to load ticket details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateStatus = async (nextStatus) => {
    const id = safe(selectedId);
    const st = upper(nextStatus);
    if (!id || !st) return;

    setUpdating(true);
    setDetailsError("");

    try {
      const res = await fetch(`${API_BASE}/tickets/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: st, adminNotes: safe(adminNotes) || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) throw new Error(data?.message || `Failed (${res.status})`);

      await Promise.all([fetchDetails(id), fetchList({ silent: true })]);
    } catch (e) {
      setDetailsError(e?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchList({ silent: false });
    return () => {
      if (inflightList.current) inflightList.current.abort();
      if (inflightDetails.current) inflightDetails.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // apply tab immediately
  useEffect(() => {
    setApplied((p) => ({ ...p, tab }));
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // refetch on applied/page
  useEffect(() => {
    fetchList({ silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedKey, page]);

  // details on selection change
  useEffect(() => {
    if (!safe(selectedId)) return;
    fetchDetails(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // polling (realtime)
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => fetchList({ silent: true }), Math.max(3000, Number(pollMs) || 7000));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, pollMs, appliedKey, page]);

  const onApply = (e) => {
    e.preventDefault();
    setPage(1);
    setApplied({ tab, q: qText, email, issueType });
  };

  const onClear = () => {
    setQText("");
    setEmail("");
    setIssueType("All");
    setTab("ALL");
    setPage(1);
    setApplied({ tab: "ALL", q: "", email: "", issueType: "All" });
  };

  return (
    <main className="min-h-screen w-full bg-gray-50 text-gray-900">
      <div className="w-full px-4 md:px-8 py-7">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-widest uppercase text-blue-700">Admin • Support</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Support Dashboard</h1>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:opacity-80 transition">Back to Admin <ExternalLink className="h-4 w-4" /></Link>
          </div>
          <p className="text-sm text-gray-600">Realtime = polling. Apply filters, pick ticket, update status/notes, view attachments.</p>
        </div>

        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((s) => (
                <button key={s} type="button" onClick={() => setTab(s)} className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition ${tab === s ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50"}`}>{s === "ALL" ? "All" : s.replaceAll("_", " ")}</button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => fetchList({ silent: true })} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"><RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh</button>
              <label className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"><input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="h-4 w-4 accent-blue-600" /> Auto refresh</label>
              <select value={pollMs} onChange={(e) => setPollMs(Number(e.target.value))} className="h-9 rounded-full border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none"><option value={5000}>5s</option><option value={7000}>7s</option><option value={10000}>10s</option><option value={15000}>15s</option></select>
            </div>
          </div>

          <form onSubmit={onApply} className="mt-4 flex flex-col lg:flex-row lg:items-end gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-700">Search (admin list)</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2"><Search className="h-4 w-4 text-gray-400" /><input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Search subject/message…" className="w-full bg-transparent text-sm outline-none" /></div>
              <p className="mt-1 text-[11px] text-gray-500">Uses GET <span className="font-semibold">/api/support/tickets?q=</span> (when email empty).</p>
            </div>

            <div className="w-full lg:w-[300px]">
              <label className="text-xs font-semibold text-gray-700">Filter by email (optional)</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2"><Mail className="h-4 w-4 text-gray-400" /><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@email.com" className="w-full bg-transparent text-sm outline-none" /></div>
              <p className="mt-1 text-[11px] text-gray-500">If email filled → calls <span className="font-semibold">/tickets/by-email</span>.</p>
            </div>

            <div className="w-full lg:w-[280px]">
              <label className="text-xs font-semibold text-gray-700">Issue type</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2"><Filter className="h-4 w-4 text-gray-400" /><select value={issueType} onChange={(e) => setIssueType(e.target.value)} className="w-full bg-transparent text-sm outline-none">{ISSUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition">Apply</button>
              <button type="button" onClick={onClear} className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition">Clear</button>
            </div>
          </form>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={`rounded-2xl border p-4 ${statCardTone("open")}`}><div className="flex items-center justify-between"><p className="text-xs font-semibold">OPEN (page)</p><ListChecks className="h-4 w-4" /></div><p className="mt-1 text-2xl font-extrabold">{pageStats.OPEN}</p><p className="mt-1 text-[11px] text-gray-600">Count from current page.</p></div>
          <div className={`rounded-2xl border p-4 ${statCardTone("progress")}`}><div className="flex items-center justify-between"><p className="text-xs font-semibold">IN PROGRESS (page)</p><Clock className="h-4 w-4" /></div><p className="mt-1 text-2xl font-extrabold">{pageStats.IN_PROGRESS}</p><p className="mt-1 text-[11px] text-gray-600">Count from current page.</p></div>
          <div className={`rounded-2xl border p-4 ${statCardTone("resolved")}`}><div className="flex items-center justify-between"><p className="text-xs font-semibold">RESOLVED (page)</p><BadgeCheck className="h-4 w-4" /></div><p className="mt-1 text-2xl font-extrabold">{pageStats.RESOLVED}</p><p className="mt-1 text-[11px] text-gray-600">Count from current page.</p></div>
          <div className={`rounded-2xl border p-4 ${statCardTone("closed")}`}><div className="flex items-center justify-between"><p className="text-xs font-semibold">TOTAL (query)</p><Filter className="h-4 w-4" /></div><p className="mt-1 text-2xl font-extrabold">{total}</p><p className="mt-1 text-[11px] text-gray-600">Total from API (filters applied).</p></div>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50"><p className="text-sm font-bold text-gray-900">Tickets</p><p className="text-xs text-gray-600">Page <span className="font-semibold">{page}</span> / <span className="font-semibold">{pages}</span></p></div>
            {error ? <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-start gap-2"><AlertCircle className="h-4 w-4 mt-0.5" /> {error}</div> : null}
            {loading ? (
              <div className="p-4 space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={`sk-${i}`} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}</div>
            ) : items.length ? (
              <div className="divide-y divide-gray-100 max-h-[70vh] overflow-auto">
                {items.map((t) => {
                  const id = safe(t?.ticketId);
                  const active = id && id === safe(selectedId);
                  const subject = safe(t?.subject) || "(No subject)";
                  const issue = safe(t?.issueType);
                  const atCount = Array.isArray(t?.attachments) ? t.attachments.length : 0;
                  return (
                    <button key={id} type="button" onClick={() => setSelectedId(id)} className={`w-full text-left px-4 py-3 transition ${active ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-blue-700">{id || "-"}</p>
                          <p className="text-sm font-bold text-gray-900 line-clamp-1">{subject}</p>
                          <p className="mt-1 text-xs text-gray-600 line-clamp-1">{issue || "-"}</p>
                        </div>
                        <span className={pill(t?.status)}>{upper(t?.status) ? upper(t.status).replaceAll("_", " ") : "—"}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1"><Mail className="h-3.5 w-3.5" /> {safe(t?.email) || "-"}</span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1"><Clock className="h-3.5 w-3.5" /> {fmtDate(t?.createdAt)}</span>
                        {atCount ? <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1"><ImageIcon className="h-3.5 w-3.5" /> {atCount}</span> : null}
                        {safe(t?.name) ? <span className="text-gray-500">• {safe(t.name)}</span> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-sm text-gray-600">No tickets found. Try changing filters.</div>
            )}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className={`rounded-xl px-4 py-2 text-sm font-semibold ring-1 ring-inset transition ${page <= 1 ? "bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed" : "bg-white text-gray-900 ring-gray-200 hover:bg-gray-50"}`}>Prev</button>
              <button type="button" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} className={`rounded-xl px-4 py-2 text-sm font-semibold ring-1 ring-inset transition ${page >= pages ? "bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed" : "bg-white text-gray-900 ring-gray-200 hover:bg-gray-50"}`}>Next</button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <p className="text-sm font-bold text-gray-900">Ticket Details</p>
              <Link href={selectedId ? `/support-tickets/${encodeURIComponent(selectedId)}` : "#"} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ring-1 ring-inset transition ${selectedId ? "bg-white text-blue-700 ring-blue-200 hover:bg-blue-50" : "bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed pointer-events-none"}`}>Open page <ExternalLink className="h-3.5 w-3.5" /></Link>
            </div>

            {detailsError ? <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-start gap-2"><AlertCircle className="h-4 w-4 mt-0.5" /> {detailsError}</div> : null}

            {!selectedId ? (
              <div className="p-6 text-sm text-gray-600">Select a ticket from the left.</div>
            ) : detailsLoading ? (
              <div className="p-6 flex items-center gap-2 text-sm text-gray-600"><Loader2 className="h-4 w-4 animate-spin" /> Loading ticket…</div>
            ) : details ? (
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-blue-700">{safe(details?.ticketId)}</p>
                    <h2 className="mt-1 text-lg md:text-xl font-extrabold text-gray-900">{safe(details?.subject) || "(No subject)"}</h2>
                    <p className="mt-1 text-sm text-gray-600">{safe(details?.issueType) || "-"}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1"><Clock className="h-3.5 w-3.5" /> {fmtDate(details?.createdAt)}</span>
                      <span className={pill(details?.status)}>{upper(details?.status).replaceAll("_", " ")}</span>
                      {safe(details?.orderId) ? <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1">Order: <span className="ml-1 font-semibold">{safe(details.orderId)}</span></span> : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full md:w-[260px]">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-semibold text-gray-700">Customer</p>
                      <p className="mt-1 text-sm font-bold text-gray-900">{safe(details?.name) || "-"}</p>
                      <div className="mt-2 flex flex-col gap-1">
                        <a href={safe(details?.email) ? `mailto:${safe(details.email)}` : "#"} className={`inline-flex items-center gap-2 text-xs font-semibold ${safe(details?.email) ? "text-blue-700 hover:opacity-80" : "text-gray-400 pointer-events-none"}`}><Mail className="h-4 w-4" /> {safe(details?.email) || "-"}</a>
                        {safe(details?.phone) ? <a href={`tel:${safe(details.phone)}`} className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:opacity-80"><Phone className="h-4 w-4" /> {safe(details.phone)}</a> : null}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                      <p className="text-xs font-semibold text-blue-700">Quick Actions</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => updateStatus("IN_PROGRESS")} disabled={updating} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-900 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 transition disabled:opacity-60">In Progress</button>
                        <button type="button" onClick={() => updateStatus("RESOLVED")} disabled={updating} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition disabled:opacity-60">Resolve</button>
                        <button type="button" onClick={() => updateStatus("OPEN")} disabled={updating} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-900 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 transition disabled:opacity-60">Re-Open</button>
                        <button type="button" onClick={() => updateStatus("CLOSED")} disabled={updating} className="rounded-xl bg-white px-3 py--2 text-xs font-semibold text-gray-900 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 transition disabled:opacity-60">Close</button>
                      </div>
                      {updating ? <p className="mt-2 text-[11px] text-gray-600">Updating…</p> : null}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
                  <div className="rounded-2xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold text-gray-700">Customer Message</p>
                    <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{safe(details?.message) || "-"}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-200 p-4">
                      <p className="text-xs font-semibold text-gray-700">Admin Notes</p>
                      <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={6} placeholder="Internal notes…" className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-y" />
                      <button type="button" onClick={() => updateStatus(details?.status)} disabled={updating} className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-60">Save Notes</button>
                    </div>

                    <div className="rounded-2xl border border-gray-200 p-4">
                      <p className="text-xs font-semibold text-gray-700">Attachments</p>
                      {Array.isArray(details?.attachments) && details.attachments.length ? (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {details.attachments.slice(0, 8).map((a, idx) => (
                            <a key={`${safe(a?.publicId) || safe(a?.url) || idx}`} href={a?.url || "#"} target="_blank" rel="noreferrer" className="group rounded-xl border border-gray-200 bg-white p-2 hover:bg-gray-50 transition">
                              <div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-gray-500" /><p className="text-xs font-semibold text-gray-900 line-clamp-1">{safe(a?.filename) || `Attachment ${idx + 1}`}</p></div>
                              <p className="mt-1 text-[11px] text-blue-700 group-hover:opacity-80">Open</p>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-gray-600">No attachments.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 text-[11px] text-gray-500">Resolved at: <span className="font-semibold text-gray-700">{fmtDate(details?.resolvedAt)}</span> • Updated at: <span className="font-semibold text-gray-700">{fmtDate(details?.updatedAt)}</span></div>
              </div>
            ) : (
              <div className="p-6 text-sm text-gray-600">No details available.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
