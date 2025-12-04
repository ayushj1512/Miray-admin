"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Droplet,
  Type,
  List,
  Sparkles,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

// ⭐ COMMON PRESETS
const PRESET_ATTRIBUTES = {
  sizes: {
    name: "Size",
    type: "select",
    values: [
      { label: "XS", value: "XS" },
      { label: "S", value: "S" },
      { label: "M", value: "M" },
      { label: "L", value: "L" },
      { label: "XL", value: "XL" },
      { label: "XXL", value: "XXL" },
    ],
  },

  colors: {
    name: "Color",
    type: "color",
    values: [
      { label: "Black", value: "#000000" },
      { label: "White", value: "#ffffff" },
      { label: "Red", value: "#ff0000" },
      { label: "Blue", value: "#0000ff" },
      { label: "Green", value: "#00ff00" },
    ],
  },

  sleeve: {
    name: "Sleeve",
    type: "select",
    values: [
      { label: "Half Sleeve", value: "half" },
      { label: "Full Sleeve", value: "full" },
      { label: "Sleeveless", value: "none" },
    ],
  },
};

export default function AttributeManagerPage() {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    type: "select",
    values: [],
    isActive: true,
  });

  const [valueInput, setValueInput] = useState({
    label: "",
    value: "",
  });

  /* ---------------------------------------------------------
     FETCH ATTRIBUTES
  --------------------------------------------------------- */
  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/attributes`, { cache: "no-store" });
      const data = await res.json();

      if (Array.isArray(data)) setAttributes(data);
      else setAttributes([]);
    } catch (err) {
      console.error("Fetch error:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  /* ---------------------------------------------------------
     HANDLE FORM INPUT
  --------------------------------------------------------- */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ---------------------------------------------------------
     PRESET GENERATOR
  --------------------------------------------------------- */
  const applyPreset = (presetName) => {
    const p = PRESET_ATTRIBUTES[presetName];
    setForm({
      name: p.name,
      slug: p.name.toLowerCase(),
      type: p.type,
      values: p.values,
      isActive: true,
    });
  };

  /* ---------------------------------------------------------
     ADD SINGLE VALUE
  --------------------------------------------------------- */
  const addValue = () => {
    if (!valueInput.label || !valueInput.value)
      return alert("Both Label & Value required!");

    setForm({
      ...form,
      values: [...form.values, { ...valueInput }],
    });

    setValueInput({ label: "", value: "" });
  };

  const removeValue = (i) => {
    const updated = [...form.values];
    updated.splice(i, 1);
    setForm({ ...form, values: updated });
  };

  /* ---------------------------------------------------------
     SAVE ATTRIBUTE
  --------------------------------------------------------- */
  const handleSave = async () => {
    setSaving(true);

    const payload = { ...form };

    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${API}/api/attributes/${editingId}`
      : `${API}/api/attributes`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message);

      alert(editingId ? "Updated!" : "Created!");

      resetForm();
      fetchAttributes();
    } catch (err) {
      console.error("Save error:", err);
    }

    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this attribute?")) return;

    try {
      const res = await fetch(`${API}/api/attributes/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message);

      alert("Deleted!");
      fetchAttributes();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleEdit = (attr) => {
    setEditingId(attr._id);
    setForm({
      name: attr.name,
      slug: attr.slug,
      type: attr.type,
      values: attr.values,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      slug: "",
      type: "select",
      values: [],
      isActive: true,
    });
  };

  /* ---------------------------------------------------------
     UI
  --------------------------------------------------------- */
  return (
    <section className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">Product Attributes</h1>

          <button
            onClick={fetchAttributes}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* ⭐ QUICK PRESET BUTTONS */}
        <div className="bg-white p-5 rounded-xl shadow grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            className="preset"
            onClick={() => applyPreset("sizes")}
          >
            <Type size={18} /> Quick: Sizes
          </button>

          <button
            className="preset"
            onClick={() => applyPreset("colors")}
          >
            <Droplet size={18} /> Quick: Colors
          </button>

          <button
            className="preset"
            onClick={() => applyPreset("sleeve")}
          >
            <List size={18} /> Quick: Sleeve
          </button>

          <button
            className="preset"
            onClick={() => setForm({ name: "", slug: "", values: [], type: "select" })}
          >
            <Sparkles size={18} /> New Blank Attribute
          </button>
        </div>

        {/* FORM */}
        <div className="bg-white p-6 rounded-2xl shadow space-y-4">

          <h2 className="text-xl font-semibold">
            {editingId ? "Edit Attribute" : "Create Attribute"}
          </h2>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Attribute Name"
            className="input"
          />

          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="input"
          >
            <option value="text">Text</option>
            <option value="select">Select</option>
            <option value="multiselect">Multi Select</option>
            <option value="color">Color (with picker)</option>
          </select>

          {/* COLOR PICKER UI */}
          {form.type === "color" && (
            <div className="flex items-center gap-3 mb-3">
              <p className="text-sm font-semibold">Pick Color:</p>

              <input
                type="color"
                value={valueInput.value}
                onChange={(e) =>
                  setValueInput({ ...valueInput, value: e.target.value })
                }
              />
            </div>
          )}

          {/* ADD VALUE */}
          {(form.type === "select" ||
            form.type === "multiselect" ||
            form.type === "color") && (
            <>
              <div className="flex gap-2 mb-4">
                <input
                  placeholder="Label"
                  value={valueInput.label}
                  onChange={(e) =>
                    setValueInput({ ...valueInput, label: e.target.value })
                  }
                  className="input flex-1"
                />

                <input
                  placeholder="Value"
                  value={valueInput.value}
                  onChange={(e) =>
                    setValueInput({ ...valueInput, value: e.target.value })
                  }
                  className="input flex-1"
                />

                <button
                  onClick={addValue}
                  className="px-4 bg-blue-600 rounded-xl text-white"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* VALUE CHIPS */}
              <div className="flex flex-wrap gap-2">
                {form.values.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center bg-gray-200 px-3 py-1 rounded-xl gap-2"
                  >
                    {form.type === "color" && (
                      <span
                        className="w-4 h-4 rounded-full border"
                        style={{ background: v.value }}
                      ></span>
                    )}

                    <span>{v.label}</span>

                    <X
                      onClick={() => removeValue(i)}
                      className="cursor-pointer"
                      size={16}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl mt-4"
          >
            <Plus size={18} />
            {saving ? "Saving..." : editingId ? "Save Changes" : "Create Attribute"}
          </button>
        </div>

        {/* ALL ATTRIBUTES LIST */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4">All Attributes</h2>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-3">
              {attributes.map((attr) => (
                <div
                  key={attr._id}
                  className="flex items-center justify-between bg-gray-100 p-4 rounded-xl"
                >
                  <div>
                    <p className="font-semibold">{attr.name}</p>
                    <p className="text-xs text-gray-600">
                      {attr.type === "color" ? "Color Picker" : attr.type}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(attr)}
                      className="p-2 bg-blue-600 text-white rounded-lg"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(attr._id)}
                      className="p-2 bg-red-600 text-white rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .input {
          background: #f3f4f6;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          outline: none;
        }
        .preset {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 12px;
          display: flex;
          gap: 8px;
          align-items: center;
          font-weight: 500;
          cursor: pointer;
          transition: 0.2s;
        }
        .preset:hover {
          background: #e2e3f0;
        }
      `}</style>
    </section>
  );
}
