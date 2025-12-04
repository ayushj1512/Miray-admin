// app/blogs/drafts/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "";
  }
}

export default function BlogDraftsPage() {
  const router = useRouter();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      // drafts = isPublished=false
      const r = await fetch(`${API}/api/blogs?published=false`, { cache: "no-store" });
      const d = await r.json();
      setBlogs(Array.isArray(d) ? d : d.blogs || []);
    } catch (e) {
      console.error("❌ load drafts:", e);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return blogs;
    return blogs.filter((b) => {
      const blob = `${b.title || ""} ${b.slug || ""} ${b.category || ""} ${(b.tags || b.hashtags || []).join(" ")}`.toLowerCase();
      return blob.includes(s);
    });
  }, [blogs, q]);

  const del = async (id) => {
    if (!confirm("Delete this draft?")) return;
    setDeletingId(id);
    try {
      const r = await fetch(`${API}/api/blogs/${id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Delete failed");
      await load();
    } catch (e) {
      console.error("❌ delete:", e);
      alert(e.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blog Drafts</h1>
            <p className="text-xs text-gray-500">All unpublished blogs (isPublished=false).</p>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="bg-white border border-gray-200 p-3 flex items-center gap-2">
          <Search size={16} className="text-gray-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search drafts by title / slug / category / tags..."
            className="w-full outline-none bg-transparent text-sm"
          />
          <div className="text-xs text-gray-500 whitespace-nowrap">
            Total: <b>{filtered.length}</b>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-sm text-gray-600">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-gray-600">No drafts found.</div>
        ) : (
          <div className="divide-y border border-gray-200 bg-white">
            {filtered.map((b) => (
              <div key={b._id} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                {/* thumbnail */}
                <div className="w-full md:w-40 h-24 bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                  {b.image ? (
                    <img
                      src={b.image}
                      alt={b.title || "blog"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      No image
                    </div>
                  )}
                </div>

                {/* info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{b.title}</div>
                  <div className="text-xs text-gray-500 truncate">
                    /{b.slug} • {b.category || "No category"} • {fmtDate(b.date || b.createdAt)}
                  </div>
                  {!!(b.excerpt || "").trim() && (
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {b.excerpt}
                    </div>
                  )}
                  <div className="text-[11px] text-gray-500 mt-2">
                    Tags: {(b.tags || b.hashtags || []).slice(0, 6).join(", ") || "—"}
                  </div>
                </div>

                {/* actions */}
                <div className="flex gap-2 md:flex-col md:w-44">
                  <button
                    onClick={() => router.push(`/blogs/${b._id}`)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm"
                    title="Preview"
                  >
                    <Eye size={16} /> Preview
                  </button>

                  <button
                    onClick={() => router.push(`/blogs/edit/${b._id}`)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    title="Edit"
                  >
                    <Pencil size={16} /> Edit
                  </button>

                  <button
                    onClick={() => del(b._id)}
                    disabled={deletingId === b._id}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-white text-sm ${
                      deletingId === b._id ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
                    }`}
                    title="Delete"
                  >
                    <Trash2 size={16} /> {deletingId === b._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick nav */}
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/blogs/all")}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-sm"
          >
            All Blogs
          </button>
          <button
            onClick={() => router.push("/blogs/create")}
            className="px-4 py-2 bg-black text-white hover:bg-gray-900 text-sm"
          >
            Create Blog
          </button>
        </div>
      </div>
    </section>
  );
}
