"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Plus, Settings2, Video, Copy } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function shortName(s = "") {
  const t = String(s);
  return t.length > 28 ? t.slice(0, 28) + "…" : t;
}

export default function ReelsDashboardPage() {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const limit = 24; // reels are heavier, keep it lower

  const [loading, setLoading] = useState(true);

  // ✅ Default reels folder. If your backend supports folder filter, it will scope results.
  const folder = "miray/reels";

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  const load = async (targetPage = page) => {
    setLoading(true);
    try {
      const url = new URL(`${API}/api/media`);
      url.searchParams.set("page", String(targetPage));
      url.searchParams.set("limit", String(limit));

      // ✅ reels are videos
      url.searchParams.set("type", "video");

      // ✅ optional: only if backend supports it
      url.searchParams.set("folder", folder);

      const r = await fetch(url.toString(), { cache: "no-store" });
      const d = await r.json();

      setItems(d.items || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error("❌ Reels load:", e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white border border-gray-200">
                <Video size={18} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Reels</h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Dashboard view — latest reels listed here. Use Add/Manage for uploads & admin.
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Folder: <b>{folder}</b> · Filter: <b>video</b>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push("/reels/add")}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
            >
              <Plus size={18} />
              Add Reel
            </button>

            <button
              onClick={() => router.push("/reels/manage")}
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 px-4 py-2"
            >
              <Settings2 size={18} />
              Manage
            </button>

            <button
              onClick={() => load(page)}
              className="inline-flex items-center gap-2 bg-black text-white px-4 py-2"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="bg-white border border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm text-gray-700">
            Total reels: <b>{total}</b>
          </div>
          <div className="text-xs text-gray-500">
            Page <b>{page}</b> / <b>{pages}</b>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-gray-200 p-6 text-gray-700">
            No reels found.
            <button onClick={() => router.push("/reels/add")} className="ml-2 text-blue-600 hover:underline">
              Upload your first reel
            </button>
            .
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((m) => (
              <div key={m._id} className="bg-white border border-gray-200 overflow-hidden">
                <div className="w-full aspect-[9/16] bg-black flex items-center justify-center">
                  <video
                    src={m.url}
                    className="w-full h-full object-contain bg-black"
                    preload="metadata"
                    controls
                    playsInline
                  />
                </div>

                <div className="p-3">
                  <div className="text-sm font-semibold text-gray-900" title={m.originalName || m.publicId}>
                    {shortName(m.originalName || m.publicId)}
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="uppercase">{m.resourceType}</span>
                    <span>{formatBytes(m.bytes)}</span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => copyUrl(m.url)}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-sm py-2"
                      title="Copy URL"
                    >
                      <Copy size={16} />
                      Copy URL
                    </button>

                    <button
                      onClick={() => router.push(`/reels/manage?focus=${encodeURIComponent(m._id)}`)}
                      className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-sm"
                      title="Open in manage"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-4 py-2 border ${
              page <= 1 ? "text-gray-400 bg-gray-100" : "bg-white hover:bg-gray-50"
            }`}
          >
            Prev
          </button>

          <div className="text-sm text-gray-600">
            Page <b>{page}</b> / <b>{pages}</b>
          </div>

          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className={`px-4 py-2 border ${
              page >= pages ? "text-gray-400 bg-gray-100" : "bg-white hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
