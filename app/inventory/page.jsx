"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || "Request failed");
  return data;
}

function formatINR(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return new Intl.NumberFormat("en-IN").format(num);
}

function daysAgoLabel(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

function Card({ title, right, children }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardTitle}>{title}</div>
        {right ? <div style={styles.cardRight}>{right}</div> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
      {sub ? <div style={styles.statSub}>{sub}</div> : null}
    </div>
  );
}

export default function InventoryDashboardPage() {
  // Dashboard state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Data (from barcode items)
  const [barcodeItems, setBarcodeItems] = useState([]);
  const [search, setSearch] = useState("");

  // Create / Generate
  const [pid, setPid] = useState("");
  const [size, setSize] = useState("M");
  const [price, setPrice] = useState("1299");
  const [saveToDb, setSaveToDb] = useState(true);
  const [createdItem, setCreatedItem] = useState(null);
  const [actionMsg, setActionMsg] = useState("");

  // Scan / Lookup
  const [scanText, setScanText] = useState("MIRAY-12134-M-1299");
  const [createIfMissing, setCreateIfMissing] = useState(true);
  const [scanResult, setScanResult] = useState(null);

  const previewBarcodeUrl = useMemo(() => {
    const p = String(pid || "").trim();
    const s = String(size || "").trim().toUpperCase();
    const pr = String(price || "").trim();
    if (!p || !s || !pr) return "";
    const qs = new URLSearchParams({ productId: p, size: s, price: pr });
    return `${BACKEND_URL}/api/barcodes/generate.png?${qs.toString()}`;
  }, [pid, size, price]);

  async function loadBarcodes(q = "") {
    const url = `${API_URL}/api/barcodes?q=${encodeURIComponent(q)}`;
    const res = await fetchJson(url);
    return res.data || [];
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const items = await loadBarcodes("");
        if (mounted) setBarcodeItems(items);
      } catch (e) {
        if (mounted) setError(e.message || "Failed to load inventory dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Derived analytics
  const stats = useMemo(() => {
    const total = barcodeItems.length;

    const prices = barcodeItems.map((x) => Number(x.price)).filter((n) => Number.isFinite(n));
    const totalValue = prices.reduce((a, b) => a + b, 0);
    const avgPrice = prices.length ? totalValue / prices.length : 0;

    const bySizeMap = new Map();
    for (const it of barcodeItems) {
      const key = it.size || "NA";
      bySizeMap.set(key, (bySizeMap.get(key) || 0) + 1);
    }
    const bySize = Array.from(bySizeMap.entries())
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => b.count - a.count);

    // last 7 days trend (createdAt)
    const dayKey = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const now = new Date();
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      last7.push({ day: dayKey(d), count: 0 });
    }
    const idx = new Map(last7.map((x, i) => [x.day, i]));

    for (const it of barcodeItems) {
      const c = new Date(it.createdAt);
      if (!Number.isNaN(c.getTime())) {
        const key = dayKey(c);
        if (idx.has(key)) last7[idx.get(key)].count += 1;
      }
    }

    const topSize = bySize[0]?.size || "-";

    return {
      total,
      totalValue,
      avgPrice,
      topSize,
      bySize,
      last7,
    };
  }, [barcodeItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return barcodeItems;
    return barcodeItems.filter((it) => {
      const hay = `${it.barcode || ""} ${it.productId || ""} ${it.size || ""} ${it.price || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [barcodeItems, search]);

  // Actions
  async function handleSearch() {
    try {
      setActionMsg("");
      setError("");
      setLoading(true);
      const items = await loadBarcodes(search);
      setBarcodeItems(items);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBarcode() {
    try {
      setActionMsg("");
      setError("");
      setCreatedItem(null);

      const productId = String(pid || "").trim();
      const s = String(size || "").trim().toUpperCase();
      const p = Number(price);

      if (!productId || !s || !String(price).trim()) throw new Error("Fill Product ID, Size, Price");
      if (!Number.isFinite(p)) throw new Error("Price must be a number");

      if (saveToDb) {
        const resp = await fetchJson(`${API_URL}/api/barcodes`, {
          method: "POST",
          body: JSON.stringify({ productId, size: s, price: p }),
        });
        setCreatedItem(resp.data);
        setActionMsg("✅ Barcode created & saved.");
        // refresh list
        const items = await loadBarcodes("");
        setBarcodeItems(items);
      } else {
        setActionMsg("✅ Preview ready (not saved).");
      }
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleScanLookup() {
    try {
      setActionMsg("");
      setError("");
      setScanResult(null);

      const resp = await fetchJson(`${API_URL}/api/barcodes/scan`, {
        method: "POST",
        body: JSON.stringify({ barcodeText: scanText, createIfMissing }),
      });

      setScanResult(resp);
      setActionMsg(resp.created ? "✅ Saved from scan." : "✅ Found in DB.");
      // refresh list (if created)
      if (resp.created) {
        const items = await loadBarcodes("");
        setBarcodeItems(items);
      }
    } catch (e) {
      setError(e.message);
    }
  }

  function printPreview() {
    if (!previewBarcodeUrl) return;
    const text = `MIRAY-${String(pid).trim()}-${String(size).trim().toUpperCase()}-${String(price).trim()}`;
    const w = window.open("", "_blank");
    w.document.write(`
      <html>
        <head><title>Print Barcode</title></head>
        <body style="font-family:Arial;padding:18px">
          <div style="font-weight:700;margin-bottom:8px">${text}</div>
          <img src="${previewBarcodeUrl}" style="max-width:640px" />
          <script>window.onload=()=>window.print()</script>
        </body>
      </html>
    `);
    w.document.close();
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.h1}>Inventory Dashboard</div>
          <div style={styles.sub}>Metrics + analytics + barcode operations (MIRAY-ProductId-Size-Price)</div>
        </div>
        <div style={styles.pills}>
          <span style={styles.pill}>API: {API_URL.replace(/^https?:\/\//, "")}</span>
          <span style={styles.pill}>Backend: {BACKEND_URL.replace(/^https?:\/\//, "")}</span>
        </div>
      </div>

      {error ? <div style={styles.error}>⚠️ {error}</div> : null}
      {actionMsg ? <div style={styles.success}>✨ {actionMsg}</div> : null}

      {/* Top Metrics */}
      <div style={styles.grid12}>
        <div style={{ gridColumn: "span 3" }}>
          <Card title="Total Barcode Items">
            <Stat label="Items" value={loading ? "…" : stats.total} sub="Saved in MongoDB" />
          </Card>
        </div>
        <div style={{ gridColumn: "span 3" }}>
          <Card title="Inventory Value (from barcode price)">
            <Stat label="Sum (₹)" value={loading ? "…" : formatINR(stats.totalValue)} sub="Approx based on encoded price" />
          </Card>
        </div>
        <div style={{ gridColumn: "span 3" }}>
          <Card title="Average Price">
            <Stat label="Avg (₹)" value={loading ? "…" : formatINR(stats.avgPrice.toFixed(0))} sub="From saved barcode items" />
          </Card>
        </div>
        <div style={{ gridColumn: "span 3" }}>
          <Card title="Top Size">
            <Stat label="Most common" value={loading ? "…" : stats.topSize} sub="Based on counts" />
          </Card>
        </div>
      </div>

      {/* Analytics */}
      <div style={styles.grid12}>
        <div style={{ gridColumn: "span 6" }}>
          <Card title="New Barcodes (last 7 days)" right={<span style={styles.miniNote}>Count by createdAt</span>}>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={stats.last7}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" hide={false} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div style={{ gridColumn: "span 6" }}>
          <Card title="Size Distribution" right={<span style={styles.miniNote}>Saved items by size</span>}>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={stats.bySize.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="size" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Operations */}
      <div style={styles.grid12}>
        <div style={{ gridColumn: "span 6" }}>
          <Card title="Generate / Save Barcode" right={<span style={styles.miniNote}>MIRAY-ProductId-Size-Price</span>}>
            <div style={styles.formRow}>
              <label style={styles.label}>
                <span style={styles.labelTxt}>Product ID</span>
                <input value={pid} onChange={(e) => setPid(e.target.value)} placeholder="12134" style={styles.input} />
              </label>

              <label style={styles.label}>
                <span style={styles.labelTxt}>Size</span>
                <select value={size} onChange={(e) => setSize(e.target.value)} style={styles.input}>
                  {["XS","S","M","L","XL","XXL","3XL","4XL","5XL","FREE"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>

              <label style={styles.label}>
                <span style={styles.labelTxt}>Price</span>
                <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1299" style={styles.input} />
              </label>
            </div>

            <div style={styles.actions}>
              <label style={styles.checkboxRow}>
                <input type="checkbox" checked={saveToDb} onChange={(e) => setSaveToDb(e.target.checked)} />
                Save to DB
              </label>
              <button onClick={handleCreateBarcode} style={styles.btnPrimary}>
                {saveToDb ? "Create & Save" : "Preview Only"}
              </button>
              <button onClick={printPreview} style={styles.btn}>
                Print Preview
              </button>
            </div>

            <div style={styles.muted}>
              Preview uses: <code style={styles.code}>/api/barcodes/generate.png</code>
            </div>

            {previewBarcodeUrl ? (
              <div style={{ marginTop: 10 }}>
                <img src={previewBarcodeUrl} alt="preview" style={styles.previewImg} />
              </div>
            ) : (
              <div style={styles.emptyBox}>Fill Product ID + Size + Price to see preview</div>
            )}

            {createdItem ? (
              <div style={styles.savedBox}>
                <div><b>Saved:</b> {createdItem.barcode}</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>ID: {createdItem._id}</div>
                <img
                  src={`${BACKEND_URL}/api/barcodes/${createdItem._id}/barcode.png`}
                  alt="saved"
                  style={styles.previewImg}
                />
              </div>
            ) : null}
          </Card>
        </div>

        <div style={{ gridColumn: "span 6" }}>
          <Card title="Scan / Lookup" right={<span style={styles.miniNote}>Paste scanned text</span>}>
            <label style={styles.label}>
              <span style={styles.labelTxt}>Barcode Text</span>
              <input
                value={scanText}
                onChange={(e) => setScanText(e.target.value)}
                placeholder="MIRAY-12134-M-1299"
                style={styles.input}
              />
            </label>

            <div style={styles.actions}>
              <label style={styles.checkboxRow}>
                <input type="checkbox" checked={createIfMissing} onChange={(e) => setCreateIfMissing(e.target.checked)} />
                Auto-create if missing
              </label>
              <button onClick={handleScanLookup} style={styles.btnPrimary}>Lookup</button>
            </div>

            {scanResult?.data ? (
              <div style={styles.savedBox}>
                <div style={{ fontWeight: 800 }}>{scanResult.data.barcode}</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  PID: {scanResult.data.productId} • Size: {scanResult.data.size} • Price: ₹{formatINR(scanResult.data.price)}
                </div>
                <img
                  src={`${BACKEND_URL}/api/barcodes/${scanResult.data._id}/barcode.png`}
                  alt="scan"
                  style={styles.previewImg}
                />
              </div>
            ) : (
              <div style={styles.emptyBox}>Scan result will appear here</div>
            )}
          </Card>
        </div>
      </div>

      {/* Table */}
      <Card
        title="Barcode Items Table"
        right={
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PID / size / barcode..."
              style={{ ...styles.input, width: 260 }}
            />
            <button onClick={handleSearch} style={styles.btn}>Refresh / Search</button>
          </div>
        }
      >
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Barcode</th>
                <th style={styles.th}>Product ID</th>
                <th style={styles.th}>Size</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th}>PNG</th>
              </tr>
            </thead>
            <tbody>
              {(loading ? [] : filtered).slice(0, 50).map((it) => (
                <tr key={it._id} style={styles.tr}>
                  <td style={styles.tdMono}>{it.barcode}</td>
                  <td style={styles.td}>{it.productId}</td>
                  <td style={styles.td}>{it.size}</td>
                  <td style={styles.td}>₹{formatINR(it.price)}</td>
                  <td style={styles.td}>
                    <div>{new Date(it.createdAt).toLocaleString()}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{daysAgoLabel(it.createdAt)}</div>
                  </td>
                  <td style={styles.td}>
                    <a
                      href={`${BACKEND_URL}/api/barcodes/${it._id}/barcode.png`}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.link}
                    >
                      Open
                    </a>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...styles.td, padding: 16, opacity: 0.75 }}>
                    No barcode items found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div style={styles.muted}>
          Showing first <b>{Math.min(50, filtered.length)}</b> rows. (You can paginate later.)
        </div>
      </Card>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: 16,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    background: "#fafafa",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  h1: { fontSize: 24, fontWeight: 900, marginBottom: 4 },
  sub: { opacity: 0.75, fontSize: 13 },
  pills: { display: "flex", gap: 8, flexWrap: "wrap" },
  pill: {
    fontSize: 12,
    padding: "6px 10px",
    border: "1px solid #eaeaea",
    borderRadius: 999,
    background: "white",
    opacity: 0.9,
  },

  grid12: {
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
    gap: 12,
    marginBottom: 12,
  },
  card: {
    background: "white",
    border: "1px solid #eee",
    borderRadius: 16,
    padding: 14,
    boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
  },
  cardHeader: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 10 },
  cardTitle: { fontWeight: 900 },
  cardRight: { fontSize: 12, opacity: 0.7 },

  stat: { display: "grid", gap: 4 },
  statLabel: { fontSize: 12, opacity: 0.7 },
  statValue: { fontSize: 22, fontWeight: 900 },
  statSub: { fontSize: 12, opacity: 0.7 },

  formRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  label: { display: "grid", gap: 6 },
  labelTxt: { fontSize: 12, opacity: 0.7 },
  input: { padding: 10, borderRadius: 12, border: "1px solid #e5e5e5", outline: "none" },

  actions: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 10 },
  checkboxRow: { display: "flex", gap: 8, alignItems: "center", fontSize: 13, opacity: 0.85 },

  btn: { padding: "10px 14px", borderRadius: 12, border: "1px solid #ddd", background: "white", cursor: "pointer" },
  btnPrimary: { padding: "10px 14px", borderRadius: 12, border: "1px solid #111", background: "#111", color: "white", cursor: "pointer" },

  previewImg: { width: "100%", maxWidth: 640, border: "1px solid #eee", borderRadius: 12, padding: 10, background: "white" },
  emptyBox: { marginTop: 10, padding: 12, borderRadius: 12, border: "1px dashed #ddd", opacity: 0.75 },
  savedBox: { marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid #eee", background: "#fcfcfc" },

  code: { background: "#f3f3f3", padding: "2px 6px", borderRadius: 8 },
  muted: { marginTop: 10, fontSize: 12, opacity: 0.7 },

  tableWrap: { overflowX: "auto", border: "1px solid #eee", borderRadius: 12 },
  table: { width: "100%", borderCollapse: "collapse", background: "white" },
  th: { textAlign: "left", fontSize: 12, opacity: 0.7, padding: 10, borderBottom: "1px solid #eee", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f2f2f2" },
  td: { padding: 10, fontSize: 13, verticalAlign: "top" },
  tdMono: { padding: 10, fontSize: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" },

  link: { color: "#111", textDecoration: "underline" },
  error: { padding: 10, borderRadius: 12, border: "1px solid #ffd6d6", background: "#fff5f5", color: "#9b1c1c", marginBottom: 10 },
  success: { padding: 10, borderRadius: 12, border: "1px solid #d1fae5", background: "#ecfdf5", color: "#065f46", marginBottom: 10 },
  miniNote: { fontSize: 12, opacity: 0.7 },
};
