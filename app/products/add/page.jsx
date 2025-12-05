"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  ListPlus,
  ChevronDown,
  ChevronRight,
  Wand2,
  Images,
} from "lucide-react";
import MediaPickerModal from "@/components/product/Media"; // ✅ C:\Users\croma\miray_admin\components\product\Media.jsx
import TagGenerator from "@/components/product/TagGenerator"; // ✅ components/product/TagGenerator.jsx

const API = process.env.NEXT_PUBLIC_API_URL;

// ✅ SKU helper (short)
const clean = (s = "") =>
  String(s)
    .toUpperCase()
    .trim()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/--+/g, "-");
const short = (s, n) => clean(s).slice(0, n);
const rand = (len = 4) =>
  Math.random().toString(36).slice(2, 2 + len).toUpperCase();

const makeSKU = ({
  brand = "MIR",
  category = "CAT",
  title = "",
  size = "",
  color = "",
}) =>
  [
    short(brand, 6),
    short(category, 10),
    short(title, 14),
    size ? short(size, 6) : null,
    color ? short(color, 6) : null,
    rand(4),
  ]
    .filter(Boolean)
    .join("-");

// ✅ pull size/color from variant attributes array
const pickAttr = (attrs, key) =>
  attrs?.find((a) => String(a.key || "").toLowerCase() === key)?.value || "";

// slug helper
const toSlug = (s = "") =>
  String(s)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function AddProductPage() {
  const [categories, setCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedAttr, setExpandedAttr] = useState({});
  const [keywordsInput, setKeywordsInput] = useState("");

  // ✅ Media modal state
  const [mediaOpen, setMediaOpen] = useState(false);
  const [variantMediaOpenIndex, setVariantMediaOpenIndex] = useState(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    shortDescription: "",
    highlights: [],

    // ✅ CATEGORY should come after product name (UI order below)
    category: "",
    subcategory: "",

    price: "",
    compareAtPrice: "",

    tags: [], // string[]  ✅ handled by TagGenerator
    collections: [],

    images: [], // urls
    thumbnail: "", // url
    video: "", // url

    attributes: [],
    variants: [],

    stock: 0,
    isInStock: true,
    weight: 0,

    metaTitle: "",
    metaDescription: "",
    keywords: [],
    isActive: true,
    isFeatured: false,
    isDraft: false,
  });

  const categoryName = useMemo(() => {
    return categories.find((c) => c._id === form.category)?.name || "";
  }, [categories, form.category]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [catsRes, attrsRes] = await Promise.all([
        fetch(`${API}/api/categories`, { cache: "no-store" }),
        fetch(`${API}/api/attributes`, { cache: "no-store" }),
      ]);

      const cats = await catsRes.json();
      const attrs = await attrsRes.json();

      setCategories(Array.isArray(cats) ? cats : []);
      setAttributes(Array.isArray(attrs) ? attrs : []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onTitleChange = (e) => {
    const title = e.target.value;
    setForm((prev) => {
      const next = { ...prev, title };
      if (!prev.slug) next.slug = toSlug(title);
      return next;
    });
  };

  const onCategoryChange = (e) => {
    const category = e.target.value;

    // if user changes main category, reset subcategory (prevents stale selection)
    setForm((prev) => ({
      ...prev,
      category,
      subcategory: "",
    }));
  };

  const toggleAttribute = (attr) => {
    const exists = form.attributes.find((a) => a.attribute === attr._id);
    setForm({
      ...form,
      attributes: exists
        ? form.attributes.filter((a) => a.attribute !== attr._id)
        : [
            ...form.attributes,
            { attribute: attr._id, key: attr.name, values: [] },
          ],
    });
  };

  const toggleAttributeValue = (attrId, value) => {
    setForm({
      ...form,
      attributes: form.attributes.map((a) => {
        if (a.attribute === attrId) {
          return {
            ...a,
            values: a.values.includes(value)
              ? a.values.filter((v) => v !== value)
              : [...a.values, value],
          };
        }
        return a;
      }),
    });
  };

  const generateCombinations = (groups) => {
    let result = [[]];
    groups.forEach((group) => {
      const temp = [];
      result.forEach((item) => {
        group.values.forEach((value) =>
          temp.push([
            ...item,
            { attribute: group.attribute, key: group.key, value },
          ])
        );
      });
      result = temp;
    });
    return result;
  };

  const effectiveCategoryForSku = useMemo(() => {
    // if categoryName not ready, fall back to CAT to avoid empty SKU parts
    return categoryName?.trim() ? categoryName : "CAT";
  }, [categoryName]);

  const generateVariants = () => {
    const groups = form.attributes.filter((a) => a.values.length > 0);
    if (groups.length === 0) return alert("Select attribute values first!");

    const combos = generateCombinations(groups);

    const variants = combos.map((combo) => {
      const size = pickAttr(combo, "size");
      const color = pickAttr(combo, "color");
      return {
        attributes: combo.map((c) => ({
          attribute: c.attribute,
          key: c.key,
          value: c.value,
        })),
        price: Number(form.price || 0),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
        stock: 0,
        isInStock: true,
        sku: makeSKU({
          category: effectiveCategoryForSku,
          title: form.title,
          size,
          color,
        }),
        image: "",
        weight: Number(form.weight || 0),
      };
    });

    setForm({ ...form, variants });
  };

  const regenerateSKUs = () => {
    const variants = (form.variants || []).map((v) => {
      const size = pickAttr(v.attributes, "size");
      const color = pickAttr(v.attributes, "color");
      return {
        ...v,
        sku: makeSKU({
          category: effectiveCategoryForSku,
          title: form.title,
          size,
          color,
        }),
      };
    });
    setForm({ ...form, variants });
  };

  const addKeywords = () => {
    if (!keywordsInput.trim()) return;
    const split = keywordsInput
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    setForm({
      ...form,
      keywords: Array.from(new Set([...(form.keywords || []), ...split])),
    });
    setKeywordsInput("");
  };

  const removeKeyword = (index) => {
    const updated = [...(form.keywords || [])];
    updated.splice(index, 1);
    setForm({ ...form, keywords: updated });
  };

  const cleanNull = (v) => (v === "" ? null : v);

  // ✅ Images helpers (using Media modal)
  const removeImageByUrl = (url) => {
    setForm((prev) => {
      const images = (prev.images || []).filter((u) => u !== url);
      const thumbnail = prev.thumbnail === url ? images[0] || "" : prev.thumbnail;
      return { ...prev, images, thumbnail };
    });
  };

  const onPickProductImages = (selectedMedia) => {
    const list = Array.isArray(selectedMedia)
      ? selectedMedia
      : selectedMedia
      ? [selectedMedia]
      : [];
    const urls = list.map((m) => m.url).filter(Boolean);

    if (!urls.length) return;

    setForm((prev) => {
      const merged = Array.from(new Set([...(prev.images || []), ...urls]));
      const thumbnail = prev.thumbnail || merged[0] || "";
      return { ...prev, images: merged, thumbnail };
    });
  };

  const onPickVariantImage = (index, selectedMedia) => {
    const m = Array.isArray(selectedMedia) ? selectedMedia[0] : selectedMedia;
    if (!m?.url) return;

    setForm((prev) => {
      const next = { ...prev };
      const variants = [...(next.variants || [])];
      if (!variants[index]) return prev;

      variants[index] = { ...variants[index], image: m.url };
      next.variants = variants;
      return next;
    });
  };

  const saveProduct = async () => {
    if (!form.title || !form.category || !form.price)
      return alert("Fill required fields: Title, Category, Price");

    setSaving(true);

    const payload = {
      title: form.title,
      slug: form.slug || toSlug(form.title),

      description: form.description,
      shortDescription: form.shortDescription,
      highlights: form.highlights,

      category: cleanNull(form.category),
      subcategory: cleanNull(form.subcategory),
      collections: form.collections,

      tags: form.tags || [],

      price: Number(form.price || 0),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,

      images: form.images || [],
      thumbnail: form.thumbnail || form.images?.[0] || "",
      video: form.video || "",

      stock: Number(form.stock || 0),
      isInStock: Boolean(form.isInStock),
      weight: Number(form.weight || 0),

      attributes: form.attributes || [],
      variants: form.variants || [],

      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      keywords: form.keywords || [],

      isActive: Boolean(form.isActive),
      isFeatured: Boolean(form.isFeatured),
      isDraft: Boolean(form.isDraft),
    };

    try {
      const res = await fetch(`${API}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      setSaving(false);

      if (!res.ok) return alert(data.message || "Failed to create product");
      alert(
        `Product Created! Code: ${
          data?.productCode || data?.product?.productCode || ""
        }`
      );
    } catch (e) {
      setSaving(false);
      alert("Failed to create product");
    }
  };

  return (
    <section className="min-h-screen p-10 bg-gray-50">
      {/* ✅ Product images modal */}
      <MediaPickerModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        multiple
        initialType="image"
        folder="miray/products"
        value={form.images}
        onSelect={(picked) => {
          onPickProductImages(picked);
          setMediaOpen(false);
        }}
        allowDelete={false}
      />

      {/* ✅ Variant image modal (single) */}
      <MediaPickerModal
        open={variantMediaOpenIndex !== null}
        onClose={() => setVariantMediaOpenIndex(null)}
        multiple={false}
        initialType="image"
        folder="miray/products/variants"
        value={
          variantMediaOpenIndex !== null
            ? form.variants?.[variantMediaOpenIndex]?.image || ""
            : ""
        }
        onSelect={(picked) => {
          if (variantMediaOpenIndex !== null)
            onPickVariantImage(variantMediaOpenIndex, picked);
          setVariantMediaOpenIndex(null);
        }}
        allowDelete={false}
      />

      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Add New Product</h1>

          <button
            onClick={loadInitialData}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-10">
            {/* ✅ BASIC (PRODUCT NAME FIRST) */}
            <div className="bg-white p-6 rounded-xl shadow space-y-4">
              <h2 className="text-xl font-semibold">Basic Information</h2>

              <input
                name="title"
                value={form.title}
                onChange={onTitleChange}
                placeholder="Product Title"
                className="input"
              />
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="Slug (auto if empty)"
                className="input"
              />

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

            {/* ✅ CATEGORY (AFTER PRODUCT NAME) */}
            <div className="bg-white p-6 rounded-xl shadow space-y-4">
              <h2 className="text-xl font-semibold">Category</h2>

              <select
                name="category"
                value={form.category}
                onChange={onCategoryChange}
                className="input"
              >
                <option value="">Select Category</option>
                {categories
                  .filter((c) => !c.parent)
                  .map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
              </select>

              {form.category && (
                <select
                  name="subcategory"
                  value={form.subcategory}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Select Subcategory</option>
                  {categories
                    .filter(
                      (c) => String(c.parent?._id) === String(form.category)
                    )
                    .map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                </select>
              )}
            </div>

            {/* ✅ TAGS (NOW USING TagGenerator COMPONENT) */}
            <TagGenerator
              title={form.title}
              categoryName={categoryName} // TagGenerator waits for category fulfillment
              value={form.tags}
              onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
              auto
              maxTags={25}
            />

            {/* SEO */}
            <div className="bg-white p-6 rounded-xl shadow space-y-4">
              <h2 className="text-xl font-semibold">SEO Settings</h2>

              <input
                name="metaTitle"
                value={form.metaTitle}
                onChange={handleChange}
                placeholder="Meta Title"
                className="input"
              />

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
                <button
                  type="button"
                  onClick={addKeywords}
                  className="px-4 bg-blue-600 text-white rounded-xl"
                >
                  Add
                </button>
              </div>

              {form.keywords?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {form.keywords.map((k, i) => (
                    <span
                      key={`${k}-${i}`}
                      className="px-3 py-1 rounded-full bg-gray-200 flex items-center gap-2"
                    >
                      {k}
                      <button
                        type="button"
                        onClick={() => removeKeyword(i)}
                        className="p-1 rounded-full hover:bg-gray-300"
                        aria-label={`Remove ${k}`}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* PRICING */}
            <div className="bg-white p-6 rounded-xl shadow space-y-4">
              <h2 className="text-xl font-semibold">Pricing</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="Price"
                  className="input"
                />
                <input
                  name="compareAtPrice"
                  value={form.compareAtPrice}
                  onChange={handleChange}
                  placeholder="Original Price"
                  className="input"
                />
              </div>
            </div>

            {/* IMAGES (USING MEDIA MODAL) */}
            <div className="bg-white p-6 rounded-xl shadow space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Images</h2>

                <button
                  type="button"
                  onClick={() => setMediaOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white"
                >
                  <Images size={18} />
                  Choose / Upload
                </button>
              </div>

              {!!form.images.length && (
                <div className="mt-2 text-sm text-gray-600">
                  Thumbnail:{" "}
                  <span className="font-medium">
                    {form.thumbnail ? "Selected" : "First image"}
                  </span>
                </div>
              )}

              {form.images.length === 0 ? (
                <p className="text-gray-500">No images selected yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {form.images.map((img, i) => (
                    <button
                      type="button"
                      key={i}
                      className={`relative text-left rounded-lg overflow-hidden border ${
                        img === form.thumbnail
                          ? "border-blue-600"
                          : "border-transparent"
                      }`}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, thumbnail: img }))
                      }
                      title="Click to set as thumbnail"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        className="w-full h-32 object-cover"
                        alt="preview"
                      />
                      <div className="absolute top-1 right-1 flex gap-2">
                        <span className="bg-white/90 text-xs px-2 py-1 rounded">
                          {img === form.thumbnail ? "Thumbnail" : "Set"}
                        </span>
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeImageByUrl(img);
                          }}
                          className="bg-red-600 text-white p-1 rounded-full"
                          title="Remove"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M18 6L6 18M6 6l12 12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ATTRIBUTES */}
            <div className="bg-white p-6 rounded-xl shadow space-y-4">
              <h2 className="text-xl font-semibold">Attributes</h2>

              {attributes.map((attr) => {
                const isSelected = form.attributes.find(
                  (a) => a.attribute === attr._id
                );

                return (
                  <div key={attr._id} className="border rounded-xl p-4 mb-3">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">{attr.name}</p>

                      <div className="flex gap-3 items-center">
                        <button
                          type="button"
                          onClick={() => toggleAttribute(attr)}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            isSelected
                              ? "bg-red-100 text-red-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {isSelected ? "Remove" : "Add"}
                        </button>

                        {isSelected && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedAttr((prev) => ({
                                ...prev,
                                [attr._id]: !prev[attr._id],
                              }))
                            }
                          >
                            {expandedAttr[attr._id] ? (
                              <ChevronDown size={18} />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {isSelected && expandedAttr[attr._id] && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(attr.values || []).map((v, i) => {
                          const active = form.attributes
                            .find((a) => a.attribute === attr._id)
                            ?.values.includes(v.value);

                          return (
                            <button
                              type="button"
                              key={i}
                              onClick={() =>
                                toggleAttributeValue(attr._id, v.value)
                              }
                              className={`px-3 py-1 rounded-full border ${
                                active
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100"
                              }`}
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

            {/* VARIANTS */}
            <div className="bg-white p-6 rounded-xl shadow space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Variants</h2>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={generateVariants}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg"
                  >
                    <ListPlus size={18} />
                    Generate
                  </button>

                  {!!form.variants.length && (
                    <button
                      type="button"
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
                    <div
                      key={i}
                      className="p-4 bg-gray-100 rounded-xl space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {v.attributes
                              .map((a) => `${a.key}: ${a.value}`)
                              .join(", ")}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Variant image: {v.image ? "Set" : "Not set"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setVariantMediaOpenIndex(i)}
                          className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm"
                        >
                          Choose Image
                        </button>
                      </div>

                      {v.image && (
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={v.image}
                            alt="variant"
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            className="text-sm px-3 py-2 rounded-xl border bg-white"
                            onClick={() => {
                              const newVar = [...form.variants];
                              newVar[i] = { ...newVar[i], image: "" };
                              setForm({ ...form, variants: newVar });
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          placeholder="SKU"
                          value={v.sku || ""}
                          onChange={(e) => {
                            const newVar = [...form.variants];
                            newVar[i].sku = e.target.value;
                            setForm({ ...form, variants: newVar });
                          }}
                          className="input"
                        />

                        <input
                          placeholder="Stock"
                          value={v.stock ?? 0}
                          onChange={(e) => {
                            const newVar = [...form.variants];
                            newVar[i].stock = Number(e.target.value || 0);
                            setForm({ ...form, variants: newVar });
                          }}
                          className="input"
                        />

                        <input
                          placeholder="Variant Price"
                          value={v.price ?? 0}
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

            <button
              type="button"
              onClick={saveProduct}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-xl text-lg disabled:opacity-60"
            >
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
