// app/blogs/create/page.jsx
"use client";

import { useMemo, useState } from "react";
import { Save, Sparkles } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const slugify = (s = "") =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/--+/g, "-");

export default function BlogCreatePage() {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    date: "", // yyyy-mm-dd
    category: "Fashion",
    tags: [], // ["tag1","tag2"]
    image: "", // URL
    content: "",
    isPublished: true,
  });

  const [tagsInput, setTagsInput] = useState("");

  const previewSlug = useMemo(() => (form.slug ? slugify(form.slug) : slugify(form.title)), [form.slug, form.title]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const addTags = () => {
    const parts = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!parts.length) return;

    set("tags", Array.from(new Set([...(form.tags || []), ...parts])));
    setTagsInput("");
  };

  const removeTag = (t) => set("tags", (form.tags || []).filter((x) => x !== t));

  const useAutoSlug = () => set("slug", previewSlug);

  const save = async () => {
    if (!form.title.trim()) return alert("Title required");
    if (!form.excerpt.trim()) return alert("Excerpt required");
    if (!form.category.trim()) return alert("Category required");

    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: previewSlug,
        tags: form.tags || [],
        // keep date optional; backend can fall back to createdAt
      };

      const r = await fetch(`${API}/api/blogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Create failed");

      alert("Blog created ✅");
      // reset (keep category)
      setForm((p) => ({
        title: "",
        slug: "",
        excerpt: "",
        date: "",
        category: p.category || "Fashion",
        tags: [],
        image: "",
        content: "",
        isPublished: true,
      }));
      setTagsInput("");
    } catch (e) {
      console.error("❌ create blog:", e);
      alert(e.message || "Create failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Blog</h1>
            <p className="text-xs text-gray-500">Same structure as your frontend store: title, excerpt, date, category, tags, image, content.</p>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className={`inline-flex items-center gap-2 px-4 py-2 text-white ${
              saving ? "bg-gray-400" : "bg-black hover:bg-gray-900"
            }`}
          >
            <Save size={18} />
            {saving ? "Saving..." : "Publish"}
          </button>
        </div>

        {/* Main */}
        <div className="bg-white border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1">Title *</label>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="w-full bg-gray-100 border border-gray-200 px-3 py-2 outline-none"
                placeholder="Gen-Z Western Outfits Taking Over 2025"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1">Slug *</label>
              <div className="flex gap-2">
                <input
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  className="flex-1 bg-gray-100 border border-gray-200 px-3 py-2 outline-none"
                  placeholder="genz-western-outfits-2025"
                />
                <button
                  type="button"
                  onClick={useAutoSlug}
                  className="px-3 py-2 border bg-white hover:bg-gray-50 inline-flex items-center gap-2"
                  title="Generate from title"
                >
                  <Sparkles size={16} />
                  Auto
                </button>
              </div>
              <div className="text-[11px] text-gray-500 mt-1">Preview: <b>{previewSlug || "-"}</b></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full bg-gray-100 border border-gray-200 px-3 py-2 outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1">Category *</label>
              <input
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full bg-gray-100 border border-gray-200 px-3 py-2 outline-none"
                placeholder="Fashion / Lifestyle / Trends / Guides"
              />
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-800 block mb-1">Published</label>
                <select
                  value={String(form.isPublished)}
                  onChange={(e) => set("isPublished", e.target.value === "true")}
                  className="w-full bg-gray-100 border border-gray-200 px-3 py-2 outline-none"
                >
                  <option value="true">Yes</option>
                  <option value="false">No (Draft)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-800 block mb-1">Excerpt *</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              className="w-full bg-gray-100 border border-gray-200 px-3 py-2 outline-none"
              rows={3}
              placeholder="Short summary shown on listing cards..."
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-800 block mb-1">Cover Image URL</label>
            <input
              value={form.image}
              onChange={(e) => set("image", e.target.value)}
              className="w-full bg-gray-100 border border-gray-200 px-3 py-2 outline-none"
              placeholder="https://...jpg"
            />
            {!!form.image && (
              <div className="mt-3 border bg-gray-50 p-3">
                <div className="text-xs text-gray-600 mb-2">Preview</div>
                <img src={form.image} alt="cover" className="w-full max-h-64 object-contain bg-white" />
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-semibold text-gray-800 block mb-1">Tags (comma separated)</label>
            <div className="flex gap-2">
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="flex-1 bg-gray-100 border border-gray-200 px-3 py-2 outline-none"
                placeholder="Western, GenZ, Streetwear"
              />
              <button type="button" onClick={addTags} className="px-4 bg-blue-600 hover:bg-blue-700 text-white">
                Add
              </button>
            </div>

            {!!(form.tags?.length) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => removeTag(t)}
                    className="text-xs px-3 py-1 bg-gray-100 border hover:bg-gray-200"
                    title="Remove"
                  >
                    {t} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-semibold text-gray-800 block mb-1">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              className="w-full bg-gray-100 border border-gray-200 px-3 py-2 outline-none"
              rows={12}
              placeholder={`Supports markdown-like text (same as your store).\n\nExample:\n✨ **What’s Trending?**\n• Oversized jackets...`}
            />
            <div className="text-[11px] text-gray-500 mt-1">
              Tip: This string can include markdown-style formatting exactly like your existing BLOGS content.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
