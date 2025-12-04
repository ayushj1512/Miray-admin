// app/blogs/categories/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

function uniq(arr = []) {
  return Array.from(new Set(arr.map((x) => String(x || "").trim()).filter(Boolean)));
}

export default function BlogCategoriesPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // new category input
  const [newCat, setNewCat] = useState("");

  // rename UI
  const [selected, setSelected] = useState(""); // existing cat
  const [renameTo, setRenameTo] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/blogs`, { cache: "no-store" });
      const d = await r.json();
      setBlogs(Array.isArray(d) ? d : d.blogs || []);
    } catch (e) {
      console.error("❌ load blogs:", e);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    return uniq(blogs.map((b) => b.category));
  }, [blogs]);

  const counts = useMemo(() => {
    const map = {};
    blogs.forEach((b) => {
      const c = String(b.category || "").trim();
      if (!c) return;
      map[c] = (map[c] || 0) + 1;
    });
    return map;
  }, [blogs]);

  // Bulk update blogs helper
  const bulkUpdateCategory = async (from, to) => {
    // update all blogs of category "from" => "to"
    const targets = blogs.filter((b) => String(b.category || "").trim() === from);

    if (!targets.length) return;

    setSaving(true);
    try {
      // sequential (simple + safe)
      for (const b of targets) {
        const r = await fetch(`${API}/api/blogs/${b._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: to }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.message || `Failed updating ${b.title}`);
      }
      await load();
    } finally {
      setSaving(false);
    }
  };

  const addCategory = async () => {
    const cat = String(newCat || "").trim();
    if (!cat) return alert("Category name required");

    // Creating category without separate table: create a hidden draft blog to “introduce” it is NOT good.
    // Better: just allow add as “suggestion” locally. But admin needs persistent categories.
    // Since you asked for a simple page: we’ll just add it by updating one existing blog (if any),
    // OR warn if there are no blogs.
    if (!blogs.length) return alert("No blogs yet. Create a blog first, then categories will appear here.");

    // pick latest blog and set its category
    const target = blogs[0];
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/blogs/${target._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Failed");
      setNewCat("");
      await load();
      alert("Category added ✅ (applied to latest blog)");
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const renameCategory = async () => {
    const from = String(selected || "").trim();
    const to = String(renameTo || "").trim();
    if (!from) return alert("Select category first");
    if (!to) return alert("New name required");
    if (from === to) return alert("Same name");

    if (!confirm(`Rename category "${from}" → "${to}" for ${counts[from] || 0} blog(s)?`)) return;

    try {
      await bulkUpdateCategory(from, to);
      setSelected("");
      setRenameTo("");
      alert("Renamed ✅");
    } catch (e) {
      console.error(e);
      alert(e.message || "Rename failed");
    }
  };

  const deleteCategory = async (cat) => {
    if (!confirm(`Delete category "${cat}"?\nThis will set category="" for ${counts[cat] || 0} blog(s).`)) return;

    setSaving(true);
    try {
      const targets = blogs.filter((b) => String(b.category || "").trim() === cat);
      for (const b of targets) {
        const r = await fetch(`${API}/api/blogs/${b._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: "" }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.message || `Failed updating ${b.title}`);
      }
      await load();
      alert("Deleted ✅ (category cleared from blogs)");
    } catch (e) {
      console.error(e);
      alert(e.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blog Categories</h1>
            <p className="text-xs text-gray-500">
              Simple logic: categories are just a text field on blogs. Here you can rename / delete in bulk.
            </p>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* Add category */}
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-sm font-semibold text-gray-800 mb-3">Add Category</div>
          <div className="flex gap-2">
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="e.g. Fashion"
              className="flex-1 bg-gray-100 border border-gray-200 px-3 py-2 outline-none"
            />
            <button
              onClick={addCategory}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-4 py-2 text-white ${
                saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <Plus size={18} />
              Add
            </button>
          </div>
          <div className="text-[11px] text-gray-500 mt-2">
            Note: we are not creating a separate “categories table” (simple). Categories appear when at least one blog uses them.
          </div>
        </div>

        {/* Rename category */}
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-sm font-semibold text-gray-800 mb-3">Rename Category (bulk)</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="bg-gray-100 border border-gray-200 px-3 py-2 outline-none"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c} ({counts[c] || 0})
                </option>
              ))}
            </select>

            <input
              value={renameTo}
              onChange={(e) => setRenameTo(e.target.value)}
              placeholder="New name"
              className="bg-gray-100 border border-gray-200 px-3 py-2 outline-none"
            />

            <button
              onClick={renameCategory}
              disabled={saving}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-white ${
                saving ? "bg-gray-400" : "bg-black hover:bg-gray-900"
              }`}
            >
              <Save size={18} />
              Rename
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-800">All Categories</div>
            <div className="text-xs text-gray-500">
              {loading ? "Loading..." : `Total: ${categories.length}`}
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="text-sm text-gray-600">No categories yet. Create a blog with category first.</div>
          ) : (
            <div className="divide-y border border-gray-200">
              {categories.map((c) => (
                <div key={c} className="flex items-center justify-between p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{c}</div>
                    <div className="text-xs text-gray-500">{counts[c] || 0} blog(s)</div>
                  </div>

                  <button
                    onClick={() => deleteCategory(c)}
                    disabled={saving}
                    className={`inline-flex items-center gap-2 px-3 py-2 text-white ${
                      saving ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
                    }`}
                    title="Delete category (clear from blogs)"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="text-[11px] text-gray-500 mt-3">
            Delete here = “remove category name from all blogs” (safe). If you want a real categories system,
            we can create a Category model later.
          </div>
        </div>
      </div>
    </section>
  );
}
