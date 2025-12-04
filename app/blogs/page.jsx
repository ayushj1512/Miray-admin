// app/blogs/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, RefreshCw, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
};

export default function BlogsAdminPage() {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState("");
  const [published, setPublished] = useState(""); // "" | "true" | "false"
  const [category, setCategory] = useState(""); // optional
  const [page, setPage] = useState(1);
  const limit = 20;

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  const load = async (opts = {}) => {
    const p = opts.page ?? page;
    setLoading(true);
    try {
      const url = new URL(`${API}/api/blogs`);
      url.searchParams.set("page", String(p));
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("sort", "newest");
      if (q.trim()) url.searchParams.set("q", q.trim());
      if (published) url.searchParams.set("published", published);
      if (category.trim()) url.searchParams.set("category", category.trim());

      const r = await fetch(url.toString(), { cache: "no-store" });
      const d = await r.json();

      // supports BOTH styles:
      // 1) { items, total, page, pages }
      // 2) [ ...blogs ]
      if (Array.isArray(d)) {
        setItems(d);
        setTotal(d.length);
      } else {
        setItems(d.items || []);
        setTotal(d.total || 0);
      }
    } catch (e) {
      console.error("❌ blogs load:", e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, published]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load({ page: 1 });
  };

  const deleteBlog = async (id) => {
    if (!confirm("Delete this blog permanently?")) return;
    setDeletingId(id);
    try {
      const r = await fetch(`${API}/api/blogs/${id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Delete failed");
      await load({ page: 1 });
      setPage(1);
    } catch (e) {
      console.error("❌ delete blog:", e);
      alert(e.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blogs</h1>
            <p className="text-xs text-gray-500">Create, manage, publish/unpublish, and delete blogs.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => load()}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 hover:bg-gray-100"
            >
              <RefreshCw size={18} />
              Refresh
            </button>

            <button
              onClick={() => router.push("/blogs/create")}
              className="inline-flex items-center gap-2 bg-black text-white px-4 py-2"
            >
              <Plus size={18} />
              New Blog
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <form onSubmit={onSearch} className="flex gap-2 flex-1">
              <div className="flex items-center gap-2 flex-1 bg-gray-100 border border-gray-200 px-3 py-2">
                <Search size={16} className="text-gray-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search title / excerpt / slug / tags..."
                  className="bg-transparent outline-none w-full text-sm"
                />
              </div>
              <button className="px-4 py-2 bg-black text-white">Search</button>
            </form>

            <div className="flex gap-2 items-center">
              <select
                value={published}
                onChange={(e) => {
                  setPage(1);
                  setPublished(e.target.value);
                }}
                className="bg-gray-100 border border-gray-200 px-3 py-2 outline-none text-sm"
                title="Published filter"
              >
                <option value="">All</option>
                <option value="true">Published</option>
                <option value="false">Unpublished</option>
              </select>

              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category (optional)"
                className="bg-gray-100 border border-gray-200 px-3 py-2 outline-none text-sm w-[180px]"
              />

              <div className="text-sm text-gray-600">
                Total: <b>{total}</b>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-gray-600">No blogs found.</div>
        ) : (
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="hidden md:grid grid-cols-[80px_1fr_130px_120px_220px] gap-3 px-4 py-3 border-b text-xs font-semibold text-gray-600 bg-gray-50">
              <div>Image</div>
              <div>Title</div>
              <div>Date</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>

            {items.map((b) => {
              const status = b.isPublished ? "Published" : "Draft";
              return (
                <div
                  key={b._id || b.slug}
                  className="grid grid-cols-1 md:grid-cols-[80px_1fr_130px_120px_220px] gap-3 px-4 py-4 border-b last:border-b-0"
                >
                  {/* Image */}
                  <div className="w-20 h-14 bg-gray-100 border border-gray-200 overflow-hidden">
                    {b.image ? (
                      <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Title + meta */}
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{b.title}</div>
                    <div className="text-xs text-gray-500 truncate">
                      /{b.slug} {b.excerpt ? `• ${b.excerpt}` : ""}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-600">
                      {b.category ? <span className="px-2 py-0.5 bg-gray-100 border">{b.category}</span> : null}
                      {(b.tags || b.hashtags || []).slice(0, 4).map((t, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 border">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-sm text-gray-700">{fmtDate(b.date || b.createdAt)}</div>

                  {/* Status */}
                  <div className="text-sm">
                    <span
                      className={`inline-flex items-center gap-2 px-2 py-1 border text-xs ${
                        b.isPublished ? "bg-green-50 border-green-200 text-green-700" : "bg-yellow-50 border-yellow-200 text-yellow-700"
                      }`}
                    >
                      {b.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
                      {status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex md:justify-end gap-2">
                    <button
                      onClick={() => router.push(`/blogs/${b.slug || b._id}`)}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm"
                      title="View"
                    >
                      <Eye size={16} />
                      View
                    </button>

                    <button
                      onClick={() => router.push(`/blogs/edit/${b._id}`)}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      title="Edit"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      onClick={() => deleteBlog(b._id)}
                      disabled={deletingId === b._id}
                      className={`inline-flex items-center gap-2 px-3 py-2 text-white text-sm ${
                        deletingId === b._id ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
                      }`}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-4 py-2 border ${page <= 1 ? "text-gray-400 bg-gray-100" : "bg-white hover:bg-gray-50"}`}
          >
            Prev
          </button>

          <div className="text-sm text-gray-600">
            Page <b>{page}</b> / <b>{pages}</b>
          </div>

          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className={`px-4 py-2 border ${page >= pages ? "text-gray-400 bg-gray-100" : "bg-white hover:bg-gray-50"}`}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
