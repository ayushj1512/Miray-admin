"use client";

import { useEffect, useState, use } from "react";
import { Pencil, Trash2, Save, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ProductDetailsPage({ params }) {
  const router = useRouter();

  // ⭐ FIX: unwrap params using React.use()
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  /* ------------------------------------
     STATE
  ------------------------------------ */
  const [product, setProduct] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  /* ------------------------------------
     LOAD PRODUCT
  ------------------------------------ */
  const loadProduct = async () => {
    try {
      const res = await fetch(`${API}/api/products/details/${slug}`, {
        cache: "no-store",
      });

      const data = await res.json();

      console.log("PRODUCT:", data);
      setProduct(data);
      setForm(data);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (slug) loadProduct();
  }, [slug]);

  /* ------------------------------------
     HANDLE CHANGE
  ------------------------------------ */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ------------------------------------
     SAVE PRODUCT
  ------------------------------------ */
  const saveProduct = async () => {
    setSaving(true);

    const res = await fetch(`${API}/api/products/${product._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) return alert(data.message);

    alert("Product updated!");
    setEditing(false);
    loadProduct();
  };

  /* ------------------------------------
     DELETE PRODUCT
  ------------------------------------ */
  const deleteProduct = async () => {
    if (!confirm("Delete this product?")) return;

    const res = await fetch(`${API}/api/products/${product._id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) return alert(data.message);

    alert("Product deleted!");
    router.push("/products");
  };

  /* ------------------------------------
     UI
  ------------------------------------ */
  if (loading) return <p className="p-10">Loading...</p>;
  if (!product) return <p className="p-10">Product not found</p>;

  return (
    <section className="p-10 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Back Button */}
        <button
          onClick={() => router.push("/products")}
          className="flex items-center gap-2 text-gray-600 hover:text-black"
        >
          <ArrowLeft size={20} /> Back to Products
        </button>

        {/* Title + Actions */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">
            {editing ? (
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="input font-semibold"
              />
            ) : (
              product.title
            )}
          </h1>

          <div className="flex gap-3">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="p-2 bg-blue-600 text-white rounded-lg"
              >
                <Pencil size={18} />
              </button>
            ) : (
              <button
                onClick={saveProduct}
                className="p-2 bg-green-600 text-white rounded-lg"
              >
                {saving ? "Saving..." : <Save size={18} />}
              </button>
            )}

            <button
              onClick={deleteProduct}
              className="p-2 bg-red-600 text-white rounded-lg"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* IMAGES */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {product.images?.map((img, i) => (
              <img
                key={i}
                src={img}
                className="w-full h-40 rounded-lg object-cover border"
              />
            ))}
          </div>
        </div>

        {/* PRICING */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold">Pricing</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editing ? (
              <>
                <input
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className="input"
                />
                <input
                  name="compareAtPrice"
                  value={form.compareAtPrice}
                  onChange={handleChange}
                  className="input"
                />
              </>
            ) : (
              <>
                <p className="text-lg"><b>Price:</b> ₹{product.price}</p>
                {product.compareAtPrice && (
                  <p className="text-lg text-gray-600">
                    <b>Original:</b> ₹{product.compareAtPrice}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* CATEGORY */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold">Category</h2>

          {editing ? (
            <>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                className="input"
              />
              <input
                name="subcategory"
                value={form.subcategory}
                onChange={handleChange}
                className="input"
              />
            </>
          ) : (
            <>
              <p><b>Main Category:</b> {product.category?.name}</p>
              {product.subcategory && (
                <p><b>Subcategory:</b> {product.subcategory?.name}</p>
              )}
            </>
          )}
        </div>

        {/* ATTRIBUTES */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold">Attributes</h2>

          {product.attributes?.length === 0 ? (
            <p>No attributes assigned.</p>
          ) : (
            <div className="space-y-2">
              {product.attributes.map((attr, i) => (
                <div key={i} className="bg-gray-100 p-3 rounded-lg">
                  <p className="font-semibold">{attr.key}</p>
                  <div className="flex gap-2 flex-wrap">
                    {attr.values.map((v, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-300 rounded-full text-sm"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* VARIANTS */}
        {product.variants?.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="text-xl font-semibold">Variants</h2>

            {product.variants.map((v, i) => (
              <div key={i} className="p-4 rounded-lg bg-gray-100 space-y-2">
                <p className="font-semibold">
                  {v.attributes.map((a) => `${a.key}: ${a.value}`).join(" • ")}
                </p>

                {editing ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      value={v.sku}
                      onChange={(e) => {
                        const all = [...form.variants];
                        all[i].sku = e.target.value;
                        setForm({ ...form, variants: all });
                      }}
                      className="input"
                      placeholder="SKU"
                    />

                    <input
                      value={v.stock}
                      onChange={(e) => {
                        const all = [...form.variants];
                        all[i].stock = Number(e.target.value);
                        setForm({ ...form, variants: all });
                      }}
                      className="input"
                      placeholder="Stock"
                    />

                    <input
                      value={v.price}
                      onChange={(e) => {
                        const all = [...form.variants];
                        all[i].price = Number(e.target.value);
                        setForm({ ...form, variants: all });
                      }}
                      className="input"
                      placeholder="Price"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-gray-700">
                    SKU: {v.sku || "N/A"} • Stock: {v.stock} • Price: ₹{v.price}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .input {
          background: #f3f4f6;
          padding: 10px 14px;
          border-radius: 10px;
          width: 100%;
          outline: none;
        }
      `}</style>
    </section>
  );
}
