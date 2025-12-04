"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function CategoryManagerPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expanded, setExpanded] = useState({});

  const [form, setForm] = useState({
    name: "",
    description: "",
    parent: "",
    number: "",
    sortOrder: 0,
    isActive: true,
    isFeatured: false,
    image: "",
    icon: "",
  });

  /* ---------------------------------------------------------
     FETCH ALL CATEGORIES (safe array check)
  --------------------------------------------------------- */
  const fetchCategories = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/api/categories`, { cache: "no-store" });
      const data = await res.json();

      console.log("🔥 CATEGORY API RESPONSE:", data);

      if (Array.isArray(data)) setCategories(data);
      else {
        console.error("❌ Expected array but got:", data);
        setCategories([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setCategories([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  /* ---------------------------------------------------------
     BUILD CATEGORY TREE (safe for non-array)
  --------------------------------------------------------- */
  const buildTree = (list) => {
    if (!Array.isArray(list)) return [];

    const map = {};
    const roots = [];

    // Prepare nodes
    list.forEach((c) => {
      map[c._id] = { ...c, children: [] };
    });

    // Populate children
    list.forEach((c) => {
      const parentId = c.parent?._id ?? null;

      if (parentId && map[parentId]) {
        map[parentId].children.push(map[c._id]);
      } else {
        roots.push(map[c._id]);
      }
    });

    return roots;
  };

  const categoryTree = Array.isArray(categories)
    ? buildTree(categories)
    : [];

  /* ---------------------------------------------------------
     FORM HANDLER
  --------------------------------------------------------- */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ---------------------------------------------------------
     CREATE / UPDATE CATEGORY
  --------------------------------------------------------- */
  const handleSave = async () => {
    setSaving(true);

    const payload = {
      ...form,
      parent: form.parent === "" ? null : form.parent,
    };

    console.log("📦 SAVE PAYLOAD:", payload);

    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${API}/api/categories/${editingId}`
      : `${API}/api/categories`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("🟢 SAVE RESPONSE:", data);

      if (!res.ok) return alert(data.message);

      alert(editingId ? "Category Updated!" : "Category Created!");

      resetForm();
      fetchCategories();
    } catch (err) {
      console.error("Save error:", err);
    }

    setSaving(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      parent: "",
      number: "",
      sortOrder: 0,
      isActive: true,
      isFeatured: false,
      image: "",
      icon: "",
    });
  };

  /* ---------------------------------------------------------
     LOAD CATEGORY INTO FORM
  --------------------------------------------------------- */
  const handleEdit = (cat) => {
    setEditingId(cat._id);

    setForm({
      name: cat.name,
      description: cat.description || "",
      parent: cat.parent?._id || "",
      number: cat.number || "",
      sortOrder: cat.sortOrder || 0,
      isActive: cat.isActive,
      isFeatured: cat.isFeatured,
      image: cat.image || "",
      icon: cat.icon || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------------------------------------------------------
     DELETE CATEGORY
  --------------------------------------------------------- */
  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;

    try {
      const res = await fetch(`${API}/api/categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message);

      alert("Category deleted");
      fetchCategories();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  /* ---------------------------------------------------------
     TREE NODE (Recursive)
  --------------------------------------------------------- */
  const TreeNode = ({ node, level = 0 }) => {
    const hasChildren = node.children.length > 0;

    return (
      <div className="mb-1">
        <div
          className="flex items-center justify-between bg-gray-100 p-3 rounded-xl"
          style={{ marginLeft: `${level * 20}px` }}
        >
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                onClick={() =>
                  setExpanded((p) => ({ ...p, [node._id]: !p[node._id] }))
                }
                className="text-gray-600"
              >
                {expanded[node._id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
            ) : (
              <span className="w-[18px]" />
            )}

            <div>
              <p className="font-semibold text-gray-900">{node.name}</p>
              <p className="text-xs text-gray-600">
                {node.parent ? "Subcategory" : "Main Category"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(node)}
              className="p-2 bg-blue-600 text-white rounded-lg"
            >
              <Pencil size={16} />
            </button>

            <button
              onClick={() => handleDelete(node._id)}
              className="p-2 bg-red-600 text-white rounded-lg"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {expanded[node._id] &&
          node.children.map((child) => (
            <TreeNode key={child._id} node={child} level={level + 1} />
          ))}
      </div>
    );
  };

  /* ---------------------------------------------------------
     UI
  --------------------------------------------------------- */
  return (
    <section className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">Manage Categories</h1>

          <button
            onClick={fetchCategories}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow space-y-4">
          <h2 className="text-xl font-semibold">
            {editingId ? "Edit Category" : "Add New Category"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="input" />

            <select name="parent" value={form.parent} onChange={handleChange} className="input">
              <option value="">No Parent (Main Category)</option>
              {categories
                .filter((cat) => cat._id !== editingId)
                .map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
            </select>

            <input name="description" value={form.description} onChange={handleChange} placeholder="Description" className="input" />
            <input name="number" value={form.number} onChange={handleChange} placeholder="Category Number" className="input" />
            <input name="sortOrder" value={form.sortOrder} onChange={handleChange} placeholder="Sort Order" className="input" />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl"
          >
            <Plus size={18} />
            {saving ? "Saving..." : editingId ? "Save Changes" : "Add Category"}
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4">Category Tree</h2>

          {loading ? <p>Loading...</p> : categoryTree.map((node) => <TreeNode key={node._id} node={node} />)}
        </div>
      </div>

      <style jsx>{`
        .input {
          background: #f3f4f6;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          outline: none;
        }
      `}</style>
    </section>
  );
}
