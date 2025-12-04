"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X, Upload, ListPlus, ChevronDown, ChevronRight, Wand2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

// ✅ SKU helper (short)
const clean = (s = "") =>
  String(s).toUpperCase().trim().replace(/&/g, " AND ").replace(/[^A-Z0-9]+/g, "-").replace(/(^-|-$)/g, "").replace(/--+/g, "-");
const short = (s, n) => clean(s).slice(0, n);
const rand = (len = 4) => Math.random().toString(36).slice(2, 2 + len).toUpperCase();

const makeSKU = ({ brand = "MIR", category = "CAT", title = "", size = "", color = "" }) =>
  [short(brand, 6), short(category, 10), short(title, 14), size ? short(size, 6) : null, color ? short(color, 6) : null, rand(4)]
    .filter(Boolean)
    .join("-");

// ✅ pull size/color from variant attributes array
const pickAttr = (attrs, key) => attrs?.find((a) => String(a.key || "").toLowerCase() === key)?.value || "";

export default function AddProductPage() {
  const [categories, setCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedAttr, setExpandedAttr] = useState({});
  const [keywordsInput, setKeywordsInput] = useState("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    shortDescription: "",
    price: "",
    compareAtPrice: "",
    category: "",
    subcategory: "",
    tags: [],
    collections: [],
    images: [],
    attributes: [],
    variants: [],
    metaTitle: "",
    metaDescription: "",
    keywords: [],
  });

  const loadInitialData = async () => {
    try {
      const [catsRes, attrsRes] = await Promise.all([
        fetch(`${API}/api/categories`, { cache: "no-store" }),
        fetch(`${API}/api/attributes`, { cache: "no-store" }),
      ]);
      setCategories(await catsRes.json());
      setAttributes(await attrsRes.json());
    } catch (err) {
      console.error("Fetch Error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setForm({ ...form, images: [...form.images, ...previews] });
  };

  const removeImage = (i) => {
    const updated = [...form.images];
    updated.splice(i, 1);
    setForm({ ...form, images: updated });
  };

  const toggleAttribute = (attr) => {
    const exists = form.attributes.find((a) => a.attribute === attr._id);
    setForm({
      ...form,
      attributes: exists
        ? form.attributes.filter((a) => a.attribute !== attr._id)
        : [...form.attributes, { attribute: attr._id, key: attr.name, values: [] }],
    });
  };

  const toggleAttributeValue = (attrId, value) => {
    setForm({
      ...form,
      attributes: form.attributes.map((a) => {
        if (a.attribute === attrId) {
          return { ...a, values: a.values.includes(value) ? a.values.filter((v) => v !== value) : [...a.values, value] };
        }
        return a;
      }),
    });
  };

  const generateCombinations = (groups) => {
    let result = [[]];
    groups.forEach((group) => {
      let temp = [];
      result.forEach((item) => {
        group.values.forEach((value) => temp.push([...item, { attribute: group.attribute, key: group.key, value }]));
      });
      result = temp;
    });
    return result;
  };

  // ✅ Variant generation now also generates SKU
  const generateVariants = () => {
    const groups = form.attributes.filter((a) => a.values.length > 0);
    if (groups.length === 0) return alert("Select attribute values first!");

    const combos = generateCombinations(groups);

    const categoryName = categories.find((c) => c._id === form.category)?.name || "CAT";

    const variants = combos.map((combo) => {
      const size = pickAttr(combo, "size");
      const color = pickAttr(combo, "color");
      return {
        attributes: combo.map((c) => ({ attribute: c.attribute, key: c.key, value: c.value })),
        price: Number(form.price || 0),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
        stock: 0,
        isInStock: true,
        sku: makeSKU({ category: categoryName, title: form.title, size, color }),
        image: "",
      };
    });

    setForm({ ...form, variants });
  };

  // ✅ regenerate all SKUs (quick)
  const regenerateSKUs = () => {
    const categoryName = categories.find((c) => c._id === form.category)?.name || "CAT";
    const variants = (form.variants || []).map((v) => {
      const size = pickAttr(v.attributes, "size");
      const color = pickAttr(v.attributes, "color");
      return { ...v, sku: makeSKU({ category: categoryName, title: form.title, size, color }) };
    });
    setForm({ ...form, variants });
  };

  const addKeywords = () => {
    if (!keywordsInput.trim()) return;
    const split = keywordsInput
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    setForm({ ...form, keywords: [...form.keywords, ...split] });
    setKeywordsInput("");
  };

  const removeKeyword = (index) => {
    const updated = [...form.keywords];
    updated.splice(index, 1);
    setForm({ ...form, keywords: updated });
  };

  const cleanNull = (v) => (v === "" ? null : v);

  const saveProduct = async () => {
    if (!form.title || !form.category || !form.price) return alert("Fill required fields: Title, Category, Price");

    setSaving(true);

    const payload = {
      ...form,
      category: cleanNull(form.category),
      subcategory: cleanNull(form.subcategory),
      tags: form.tags,
      collections: form.collections,
    };

    const res = await fetch(`${API}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) return alert(data.message);
    alert("Product Created!");
  };

  return (
    <section className="min-h-screen p-10 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Add New Product</h1>

          <button onClick={loadInitialData} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg">
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-10">
            <div className="bg-white p-6 rounded-xl shadow space-y-4">
              <h2 className="text-xl font-semibold">Basic Information</h2>

              <input name="title" value={form.title} onChange={handleChange} placeholder="Product Title" className="input" />
              <input name="slug" value={form.slug} onChange={handleChange} placeholder="Slug (auto if empty)" className="input" />

              <textarea
                name="shortDescription"
                value={form.shortDescription}
                onChange={handleChange}
                placeholder="Short Description"
                className="input"
              />

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Full Description"
                className="input"
                rows={5}
              />
            </div>

            <div className="bg-white p-6 rounded-xl shadow space-y-4">
              <h2 className="text-xl font-semibold">SEO Settings</h2>

              <input name="metaTitle" value={form.metaTitle} onChange={handleChange} placeholder="Meta Title" className="input" />

              <textarea
                name="metaDescription"
                value={form.metaDescription}
                onChange={handleChange}
                placeholder="Meta Description"
                className="input"
                rows={3}
              />

              <div className="flex gap-2">
                <input
                  placeholder="Add keywords (comma separated)"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  className="input flex-1"
                />
                <button onClick={addKeywords} className="px-4 bg-blue-600 text-white rounded-xl">
                  Add
                </button>
              </div>

              {form.keywords.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {form.keywords.map((k, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-gray-200 flex items-center gap-2">
                      {k}
                      <X size={14} className="cursor-pointer" onClick={() => removeKeyword(i)} />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow space-y-4">
              <h2 className="text-xl font-semibold">Category</h2>

              <select name="category" value={form.category} onChange={handleChange} className="input">
                <option value="">Select Category</option>
                {categories.filter((c) => !c.parent).map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {form.category && (
                <select name="subcategory" value={form.subcategory} onChange={handleChange} className="input">
                  <option value="">Select Subcategory</option>
                  {categories.filter((c) => c.parent?._id === form.category).map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow space-y-4">
              <h2 className="text-xl font-semibold">Pricing</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="price" value={form.price} onChange={handleChange} placeholder="Price" className="input" />
                <input
                  name="compareAtPrice"
                  value={form.compareAtPrice}
                  onChange={handleChange}
                  placeholder="Original Price"
                  className="input"
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow space-y-4">
              <h2 className="text-xl font-semibold">Images</h2>

              <input type="file" multiple onChange={handleImageUpload} className="hidden" id="fileInput" />
              <label htmlFor="fileInput" className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg cursor-pointer w-fit">
                <Upload size={18} />
                Upload Images
              </label>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {form.images.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} className="w-full h-32 object-cover rounded-lg" />
                    <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow space-y-4">
              <h2 className="text-xl font-semibold">Attributes</h2>

              {attributes.map((attr) => {
                const isSelected = form.attributes.find((a) => a.attribute === attr._id);

                return (
                  <div key={attr._id} className="border rounded-xl p-4 mb-3">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">{attr.name}</p>

                      <div className="flex gap-3 items-center">
                        <button
                          onClick={() => toggleAttribute(attr)}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            isSelected ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {isSelected ? "Remove" : "Add"}
                        </button>

                        {isSelected && (
                          <button
                            onClick={() =>
                              setExpandedAttr((prev) => ({
                                ...prev,
                                [attr._id]: !prev[attr._id],
                              }))
                            }
                          >
                            {expandedAttr[attr._id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </button>
                        )}
                      </div>
                    </div>

                    {isSelected && expandedAttr[attr._id] && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {attr.values.map((v, i) => {
                          const active = form.attributes.find((a) => a.attribute === attr._id)?.values.includes(v.value);

                          return (
                            <button
                              key={i}
                              onClick={() => toggleAttributeValue(attr._id, v.value)}
                              className={`px-3 py-1 rounded-full border ${active ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                            >
                              {v.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-white p-6 rounded-xl shadow space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Variants</h2>

                <div className="flex gap-2">
                  <button
                    onClick={generateVariants}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg"
                  >
                    <ListPlus size={18} />
                    Generate
                  </button>

                  {!!form.variants.length && (
                    <button
                      onClick={regenerateSKUs}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg"
                      title="Regenerate SKUs"
                    >
                      <Wand2 size={18} />
                      SKUs
                    </button>
                  )}
                </div>
              </div>

              {form.variants.length > 0 && (
                <div className="space-y-4">
                  {form.variants.map((v, i) => (
                    <div key={i} className="p-4 bg-gray-100 rounded-xl">
                      <p className="font-semibold">{v.attributes.map((a) => `${a.key}: ${a.value}`).join(", ")}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        <input
                          placeholder="SKU"
                          value={v.sku}
                          onChange={(e) => {
                            const newVar = [...form.variants];
                            newVar[i].sku = e.target.value;
                            setForm({ ...form, variants: newVar });
                          }}
                          className="input"
                        />

                        <input
                          placeholder="Stock"
                          value={v.stock}
                          onChange={(e) => {
                            const newVar = [...form.variants];
                            newVar[i].stock = Number(e.target.value || 0);
                            setForm({ ...form, variants: newVar });
                          }}
                          className="input"
                        />

                        <input
                          placeholder="Variant Price"
                          value={v.price}
                          onChange={(e) => {
                            const newVar = [...form.variants];
                            newVar[i].price = Number(e.target.value || 0);
                            setForm({ ...form, variants: newVar });
                          }}
                          className="input"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={saveProduct} disabled={saving} className="px-6 py-3 bg-green-600 text-white rounded-xl text-lg">
              {saving ? "Saving..." : "Create Product"}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .input {
          background: #f3f4f6;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          outline: none;
          width: 100%;
        }
      `}</style>
    </section>
  );
}
