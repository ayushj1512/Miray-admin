"use client";

import { useEffect, useMemo, useState, use } from "react";
import { Pencil, Trash2, Save, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

/* ---------------- helpers (safe) ---------------- */
const toStr = (v) => (v == null ? "" : String(v));
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const safeImages = (p) => (Array.isArray(p?.images) ? p.images.filter(Boolean) : []);
const getCatId = (c) => (c && typeof c === "object" ? toStr(c?._id) : toStr(c));
const getCatName = (c) => (c && typeof c === "object" ? toStr(c?.name) : toStr(c));

export default function ProductDetailsPage({ params }) {
  const router = useRouter();

  // ✅ Next 15/16: params is a Promise in client components
  const { slug } = use(params);

  const [product, setProduct] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // form state (keep only editable fields cleanly)
  const [form, setForm] = useState({
    title: "",
    price: 0,
    compareAtPrice: "",
    categoryId: "",
    subcategoryId: "",
    stock: 0,
    isInStock: true,
    isActive: true,
    shortDescription: "",
    description: "",
    tagsText: "", // comma separated
    variants: [],
    images: [],
    thumbnail: "",
  });

  /* ---------------- LOAD PRODUCT ---------------- */
  const loadProduct = async () => {
    if (!slug) return;
    try {
      setLoading(true);

      const res = await fetch(`${BACKEND}/api/products/details/${encodeURIComponent(slug)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to load product");

      setProduct(data);

      const imgs = safeImages(data);
      const thumb = toStr(data?.thumbnail) || imgs[0] || "";

      setForm({
        title: toStr(data?.title),
        price: toNum(data?.price),
        compareAtPrice: data?.compareAtPrice ?? "",
        categoryId: getCatId(data?.category),
        subcategoryId: getCatId(data?.subcategory),
        stock: toNum(data?.stock),
        isInStock: Boolean(data?.isInStock ?? true),
        isActive: Boolean(data?.isActive ?? true),
        shortDescription: toStr(data?.shortDescription),
        description: toStr(data?.description),
        tagsText: Array.isArray(data?.tags) ? data.tags.join(", ") : "",
        variants: Array.isArray(data?.variants) ? data.variants : [],
        images: imgs,
        thumbnail: thumb,
      });
    } catch (err) {
      console.error("Fetch Error:", err);
      setProduct(null);
      alert(err?.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  /* ---------------- HANDLERS ---------------- */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const updateVariantField = (idx, key, value) => {
    setForm((p) => {
      const variants = Array.isArray(p.variants) ? [...p.variants] : [];
      const v = { ...(variants[idx] || {}) };
      v[key] = key === "stock" || key === "price" ? toNum(value) : value;
      variants[idx] = v;
      return { ...p, variants };
    });
  };

  /* ---------------- SAVE PRODUCT ---------------- */
  const saveProduct = async () => {
    if (!product?._id) return;
    try {
      setSaving(true);

      // ✅ backend expects ObjectIds for category/subcategory
      // ✅ tags in new schema are string array
      const payload = {
        title: form.title,
        price: toNum(form.price),
        compareAtPrice: form.compareAtPrice === "" ? null : toNum(form.compareAtPrice),
        category: form.categoryId || null,
        subcategory: form.subcategoryId || null,
        stock: toNum(form.stock),
        isInStock: Boolean(form.isInStock),
        isActive: Boolean(form.isActive),
        shortDescription: form.shortDescription || "",
        description: form.description || "",
        thumbnail: form.thumbnail || "",
        images: Array.isArray(form.images) ? form.images : [],
        tags: toStr(form.tagsText)
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        variants: Array.isArray(form.variants)
          ? form.variants.map((v) => ({
              _id: v?._id, // keep variant id
              sku: v?.sku || "",
              price: toNum(v?.price),
              stock: toNum(v?.stock),
              isInStock: Boolean(v?.isInStock ?? true),
              image: v?.image || "",
              weight: toNum(v?.weight),
              barcode: v?.barcode || "",
              attributes: Array.isArray(v?.attributes) ? v.attributes : [],
            }))
          : [],
      };

      const res = await fetch(`${BACKEND}/api/products/${product._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Update failed");

      alert("Product updated!");
      setEditing(false);
      await loadProduct();
    } catch (e) {
      alert(e?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- DELETE PRODUCT ---------------- */
  const deleteProduct = async () => {
    if (!product?._id) return;
    if (!confirm("Delete this product?")) return;

    try {
      const res = await fetch(`${BACKEND}/api/products/${product._id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Delete failed");

      alert("Product deleted!");
      router.push("/products");
    } catch (e) {
      alert(e?.message || "Failed to delete product");
    }
  };

  const titleNode = useMemo(() => {
    if (!editing) return <span>{product?.title}</span>;
    return (
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        className="w-full rounded-xl bg-gray-100 px-3 py-2 outline-none"
      />
    );
  }, [editing, form.title, product?.title]);

  /* ---------------- UI ---------------- */
  if (loading) return <p className="p-10">Loading...</p>;
  if (!product) return <p className="p-10">Product not found</p>;

  return (
    <section className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8 md:space-y-10">
        <button onClick={() => router.push("/products")} className="flex items-center gap-2 text-gray-600 hover:text-black">
          <ArrowLeft size={20} /> Back to Products
        </button>

        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold w-full">{titleNode}</h1>

          <div className="flex gap-3 shrink-0">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="p-2 bg-blue-600 text-white rounded-lg">
                <Pencil size={18} />
              </button>
            ) : (
              <button onClick={saveProduct} disabled={saving} className="p-2 bg-green-600 text-white rounded-lg disabled:opacity-60">
                {saving ? "Saving..." : <Save size={18} />}
              </button>
            )}

            <button onClick={deleteProduct} className="p-2 bg-red-600 text-white rounded-lg">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* IMAGES */}
        <div className="bg-white p-5 md:p-6 rounded-xl shadow space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg md:text-xl font-semibold">Images</h2>
            {editing ? (
              <input
                name="thumbnail"
                value={form.thumbnail}
                onChange={handleChange}
                placeholder="Thumbnail URL (optional)"
                className="w-full md:w-[420px] rounded-xl bg-gray-100 px-3 py-2 outline-none"
              />
            ) : null}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {(form.images?.length ? form.images : safeImages(product)).map((img, i) => (
              <img key={i} src={img} alt={`product-${i}`} className="w-full h-32 md:h-40 rounded-lg object-cover border" />
            ))}
          </div>

          {editing ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Edit images (comma-separated URLs)</p>
              <textarea
                value={(form.images || []).join(", ")}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    images: toStr(e.target.value)
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  }))
                }
                className="w-full rounded-xl bg-gray-100 px-3 py-2 outline-none min-h-[90px]"
                placeholder="https://... , https://..."
              />
            </div>
          ) : null}
        </div>

        {/* PRICING */}
        <div className="bg-white p-5 md:p-6 rounded-xl shadow space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-lg md:text-xl font-semibold">Pricing</h2>

            {!editing ? (
              <div className="text-xs text-gray-500">
                productCode: <span className="font-mono">{product?.productCode || "-"}</span>
              </div>
            ) : null}
          </div>

          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input name="price" value={form.price} onChange={handleChange} className="w-full rounded-xl bg-gray-100 px-3 py-2 outline-none" placeholder="Price" />
              <input name="compareAtPrice" value={form.compareAtPrice} onChange={handleChange} className="w-full rounded-xl bg-gray-100 px-3 py-2 outline-none" placeholder="Compare at price" />
              <input name="stock" value={form.stock} onChange={handleChange} className="w-full rounded-xl bg-gray-100 px-3 py-2 outline-none" placeholder="Stock (simple products)" />
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-base"><b>Price:</b> ₹{product.price}</p>
              {product.compareAtPrice != null ? <p className="text-sm text-gray-600"><b>Original:</b> ₹{product.compareAtPrice}</p> : null}
              <p className="text-sm text-gray-700"><b>Stock:</b> {product.stock ?? 0} • <b>In stock:</b> {String(!!product.isInStock)}</p>
            </div>
          )}

          {editing ? (
            <div className="flex items-center gap-6 flex-wrap text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="isInStock" checked={!!form.isInStock} onChange={handleChange} />
                In Stock
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="isActive" checked={!!form.isActive} onChange={handleChange} />
                Active (visible)
              </label>
            </div>
          ) : null}
        </div>

        {/* CATEGORY */}
        <div className="bg-white p-5 md:p-6 rounded-xl shadow space-y-4">
          <h2 className="text-lg md:text-xl font-semibold">Category</h2>

          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="categoryId" value={form.categoryId} onChange={handleChange} className="w-full rounded-xl bg-gray-100 px-3 py-2 outline-none" placeholder="Category ObjectId" />
              <input name="subcategoryId" value={form.subcategoryId} onChange={handleChange} className="w-full rounded-xl bg-gray-100 px-3 py-2 outline-none" placeholder="Subcategory ObjectId (optional)" />
            </div>
          ) : (
            <div className="space-y-1 text-sm">
              <p><b>Main Category:</b> {getCatName(product.category) || "-"}</p>
              {product.subcategory ? <p><b>Subcategory:</b> {getCatName(product.subcategory)}</p> : null}
            </div>
          )}
        </div>

        {/* CONTENT + TAGS */}
        <div className="bg-white p-5 md:p-6 rounded-xl shadow space-y-4">
          <h2 className="text-lg md:text-xl font-semibold">Content</h2>

          {editing ? (
            <div className="space-y-3">
              <textarea name="shortDescription" value={form.shortDescription} onChange={handleChange} className="w-full rounded-xl bg-gray-100 px-3 py-2 outline-none min-h-[90px]" placeholder="Short description" />
              <textarea name="description" value={form.description} onChange={handleChange} className="w-full rounded-xl bg-gray-100 px-3 py-2 outline-none min-h-[120px]" placeholder="Full description" />
              <input name="tagsText" value={form.tagsText} onChange={handleChange} className="w-full rounded-xl bg-gray-100 px-3 py-2 outline-none" placeholder="Tags (comma separated)" />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-700"><b>Short:</b> {product.shortDescription || "-"}</p>
              <p className="text-sm text-gray-700"><b>Description:</b> {product.description ? "✅" : "-"}</p>
              <div className="flex gap-2 flex-wrap">
                {(Array.isArray(product.tags) ? product.tags : []).map((t) => (
                  <span key={t} className="px-3 py-1 bg-gray-200 rounded-full text-xs">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ATTRIBUTES (read-only) */}
        <div className="bg-white p-5 md:p-6 rounded-xl shadow space-y-4">
          <h2 className="text-lg md:text-xl font-semibold">Attributes</h2>

          {!product.attributes?.length ? (
            <p className="text-sm text-gray-600">No attributes assigned.</p>
          ) : (
            <div className="space-y-2">
              {product.attributes.map((attr, i) => (
                <div key={i} className="bg-gray-100 p-3 rounded-lg">
                  <p className="font-semibold text-sm">{attr.key}</p>
                  <div className="flex gap-2 flex-wrap">
                    {(attr.values || []).map((v, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-300 rounded-full text-xs">{v}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* VARIANTS */}
        {Array.isArray(product.variants) && product.variants.length > 0 ? (
          <div className="bg-white p-5 md:p-6 rounded-xl shadow space-y-4">
            <h2 className="text-lg md:text-xl font-semibold">Variants</h2>

            {(editing ? form.variants : product.variants).map((v, i) => (
              <div key={toStr(v?._id) || i} className="p-4 rounded-lg bg-gray-100 space-y-2">
                <p className="font-semibold text-sm">
                  {(v.attributes || []).map((a) => `${a.key}: ${a.value}`).join(" • ") || "Variant"}
                </p>

                {editing ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input value={toStr(v?.sku)} onChange={(e) => updateVariantField(i, "sku", e.target.value)} className="w-full rounded-xl bg-white px-3 py-2 outline-none" placeholder="SKU" />
                    <input value={toStr(v?.stock)} onChange={(e) => updateVariantField(i, "stock", e.target.value)} className="w-full rounded-xl bg-white px-3 py-2 outline-none" placeholder="Stock" />
                    <input value={toStr(v?.price)} onChange={(e) => updateVariantField(i, "price", e.target.value)} className="w-full rounded-xl bg-white px-3 py-2 outline-none" placeholder="Price" />
                    <input value={toStr(v?.image)} onChange={(e) => updateVariantField(i, "image", e.target.value)} className="w-full rounded-xl bg-white px-3 py-2 outline-none" placeholder="Image URL" />
                  </div>
                ) : (
                  <div className="text-xs text-gray-700">
                    SKU: {v.sku || "N/A"} • Stock: {v.stock ?? 0} • Price: ₹{v.price ?? 0}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
