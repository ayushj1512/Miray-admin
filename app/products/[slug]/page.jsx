// app/products/[slug]/page.jsx

"use client";

import { use, useEffect, useState } from "react";
import { ArrowLeft, Pencil, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import CategoryMultiSelect from "@/components/product/CategoryMultiSelect";
import AttributeSelector from "@/components/product/AttributeSelector";
import ProductContentEditor from "@/components/product/ProductContentEditor";
import ProductVariantsEditor from "@/components/product/ProductVariantsEditor";
import ProductImagesEditor from "@/components/product/ProductImagesEditor";
import ProductAdvancedFields from "@/components/product/ProductAdvancedFields";
import CrossSellSelector from "@/components/product/CrossSellSelector";
import CollectionMultiSelect from "@/components/product/CollectionMultiSelect";
import FabricAdd from "@/components/product/FabricAdd";
import OriginalProductLinkField from "@/components/product/OriginalProductLinkField";
import ProductProductionDetails from "@/components/product/ProductProductionDetails";
import ProductSamplingPattern from "@/components/product/ProductSamplingPattern";

const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

const s = (v) => (v == null ? "" : String(v));
const n = (v, fb = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : fb;
};
const arr = (v) => (Array.isArray(v) ? v : []);
const uniq = (v) =>
  [...new Set(arr(v).map((x) => s(x).trim().toLowerCase()).filter(Boolean))];

function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-500">{label}</span>
      {children}
    </label>
  );
}

const input =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:bg-white";

export default function ProductDetailsPage({ params }) {
  const router = useRouter();
  const { slug } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [product, setProduct] = useState(null);
  const [collections, setCollections] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [variantsDirty, setVariantsDirty] = useState(false);

  const [form, setForm] = useState({
    title: "",
    price: 0,
    compareAtPrice: "",
    hsnCode: "",
    categories: [],
    isActive: true,

    shortDescription: "",
    howToStyle: "",
    fabricDetails: "",
    keyFeaturesText: "",
    specifications: [],
    tagsText: "",
    colorsText: "",

    attributes: [],
    variants: [],

    images: [],
    thumbnail: "",

    fabrics: [],
    avgFabricConsumption: {
      value: 0,
      unit: "meter",
      wastePercentage: 5,
    },
    accessories: [],

    collections: [],
    crossSellProducts: [],
    originalProductLink: "",

    highlights: [],
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
      unit: "cm",
    },

    metaTitle: "",
    metaDescription: "",
    keywords: [],

    isFeatured: false,
    isDraft: false,
    isSamplingDone: false,
    isPatternReady: false,
  });

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      try {
        setLoading(true);

        const [pRes, cRes, aRes] = await Promise.all([
          fetch(`${BACKEND}/api/products/details/${encodeURIComponent(slug)}`, {
            cache: "no-store",
          }),
          fetch(`${BACKEND}/api/collections`, { cache: "no-store" }),
          fetch(`${BACKEND}/api/attributes`, { cache: "no-store" }),
        ]);

        const p = await pRes.json();
        if (!pRes.ok) throw new Error(p?.message || "Product load failed");

        setProduct(p);
        setCollections((await cRes.json().catch(() => [])) || []);
        setAttributes((await aRes.json().catch(() => [])) || []);

        const images = arr(p.images).filter(Boolean);

        setForm({
          title: s(p.title),
          price: n(p.price),
          compareAtPrice: p.compareAtPrice ?? "",
          hsnCode: s(p.hsnCode),
          categories: arr(p.categories),
          isActive: !!p.isActive,

          shortDescription: s(p.shortDescription),
          howToStyle: s(p.howToStyle),
          fabricDetails: s(p.fabricDetails),
          keyFeaturesText: arr(p.keyFeatures).join(", "),
          specifications: arr(p.specifications),
          tagsText: arr(p.tags).join(", "),
          colorsText: arr(p.colors).join(", "),

          attributes: arr(p.attributes),
          variants: arr(p.variants),

          images,
          thumbnail: p.thumbnail || images[0] || "",

          fabrics: arr(p.fabrics),
          avgFabricConsumption:
            p.avgFabricConsumption || {
              value: 0,
              unit: "meter",
              wastePercentage: 5,
            },
          accessories: arr(p.accessories),

          collections: arr(p.collections),
          crossSellProducts: arr(p.crossSellProducts).map((x) =>
            typeof x === "string" ? x : x?._id
          ),
          originalProductLink: s(p.originalProductLink),

          highlights: arr(p.highlights),
          weight: n(p.weight),
          dimensions:
            p.dimensions || {
              length: 0,
              width: 0,
              height: 0,
              unit: "cm",
            },

          metaTitle: s(p.metaTitle),
          metaDescription: s(p.metaDescription),
          keywords: arr(p.keywords),

          isFeatured: !!p.isFeatured,
          isDraft: !!p.isDraft,
          isSamplingDone: !!p.isSamplingDone,
          isPatternReady: !!p.isPatternReady,
        });
      } catch (e) {
        alert(e.message);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const save = async () => {
    if (!product?._id || saving) return;

    try {
      setSaving(true);

      const payload = {
        title: s(form.title).trim(),
        price: n(form.price),

        compareAtPrice:
          form.compareAtPrice === "" ? null : n(form.compareAtPrice),

        hsnCode: s(form.hsnCode).replace(/\D/g, ""),

        categories: arr(form.categories),
        isActive: !!form.isActive,

        shortDescription: s(form.shortDescription).trim(),
        howToStyle: s(form.howToStyle).trim(),
        fabricDetails: s(form.fabricDetails).trim(),

        keyFeatures: s(form.keyFeaturesText)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),

        specifications: arr(form.specifications),

        tags: uniq(s(form.tagsText).split(",")),
        colors: uniq(s(form.colorsText).split(",")),

        images: arr(form.images).filter(Boolean),
        thumbnail: arr(form.images)[0] || "",

        fabrics: arr(form.fabrics),
        avgFabricConsumption: form.avgFabricConsumption,
        accessories: arr(form.accessories),

        attributes: arr(form.attributes),
        ...(variantsDirty ? { variants: arr(form.variants) } : {}),

        collections: arr(form.collections),
        crossSellProducts: arr(form.crossSellProducts),
        originalProductLink: s(form.originalProductLink).trim(),

        highlights: arr(form.highlights),
        weight: n(form.weight),
        dimensions: form.dimensions,

        metaTitle: s(form.metaTitle),
        metaDescription: s(form.metaDescription),
        keywords: arr(form.keywords),

        isFeatured: !!form.isFeatured,
        isDraft: !!form.isDraft,
        isSamplingDone: !!form.isSamplingDone,
      };

      const res = await fetch(`${BACKEND}/api/products/${product._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Update failed");
      }

      setProduct(data?.product || data);
      setVariantsDirty(false);
      setEditing(false);

      alert("Product updated ✅");
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete "${product?.title}"?`)) return;

    const res = await fetch(`${BACKEND}/api/products/${product._id}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return alert(data?.message || "Delete failed");
    }

    router.push("/products");
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!product) return <div className="p-8">Product not found</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1400px] space-y-4">

        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
          <div>
            <button
              onClick={() => router.push("/products")}
              className="mb-2 flex items-center gap-1 text-xs font-semibold text-gray-500"
            >
              <ArrowLeft size={14} />
              Products
            </button>

            {editing ? (
              <Field label="Product Title">
                <input
                  name="title"
                  value={form.title}
                  onChange={change}
                  className={`${input} min-w-[320px] font-semibold`}
                />
              </Field>
            ) : (
              <>
                <h1 className="text-xl font-bold">{product.title}</h1>

                <p className="mt-1 text-xs text-gray-500">
                  Code: <b>{product.productCode}</b>
                  {" • "}
                  Shopify: <b>{product?.shopify?.syncStatus || "not_synced"}</b>
                </p>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-lg border px-3 py-2 text-sm font-semibold"
                >
                  Cancel
                </button>

                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  <Save size={15} />
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white"
              >
                <Pencil size={15} />
                Edit
              </button>
            )}

            <button
              onClick={remove}
              className="rounded-lg border border-red-200 p-2 text-red-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* CORE */}
        <Card title="Basic Details">
          {editing ? (
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Selling Price">
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={change}
                  className={input}
                />
              </Field>

              <Field label="Compare At Price">
                <input
                  type="number"
                  name="compareAtPrice"
                  value={form.compareAtPrice}
                  onChange={change}
                  className={input}
                />
              </Field>

              <Field label="HSN Code">
                <input
                  name="hsnCode"
                  value={form.hsnCode}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      hsnCode: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  className={input}
                />
              </Field>

              <Field label="Status">
                <label className={`${input} flex items-center gap-2`}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={change}
                  />
                  Active
                </label>
              </Field>
            </div>
          ) : (
            <div className="grid gap-3 text-sm md:grid-cols-4">
              <div><b>Price</b><br />₹{product.price}</div>
              <div><b>Compare</b><br />₹{product.compareAtPrice || "-"}</div>
              <div><b>HSN</b><br />{product.hsnCode || "-"}</div>
              <div><b>Status</b><br />{product.isActive ? "Active" : "Inactive"}</div>
            </div>
          )}
        </Card>

        {/* IMAGES */}
        <Card title="Product Images">
          {editing ? (
            <ProductImagesEditor
              value={form.images}
              folder="miray/products"
              onChange={(images) =>
                setForm((p) => ({
                  ...p,
                  images,
                  thumbnail: images?.[0] || "",
                }))
              }
            />
          ) : (
            <div className="flex gap-2 overflow-x-auto">
              {arr(product.images).map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="h-28 w-24 rounded-lg border object-cover"
                />
              ))}
            </div>
          )}
        </Card>

        {/* CATEGORY */}
        <Card title="Categories">
          {editing ? (
            <CategoryMultiSelect
              value={form.categories}
              onChange={(categories) =>
                setForm((p) => ({ ...p, categories }))
              }
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {arr(product.categories).map((x) => (
                <span
                  key={x}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs"
                >
                  {x}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* CONTENT */}
        <ProductContentEditor
          editable={editing}
          value={{
            shortDescription: form.shortDescription,
            howToStyle: form.howToStyle,
            fabricDetails: form.fabricDetails,
            keyFeaturesText: form.keyFeaturesText,
            specifications: form.specifications,
            tagsText: form.tagsText,
          }}
          onChange={(next) =>
            setForm((p) => ({ ...p, ...next }))
          }
        />

        {/* COLORS */}
        <Card title="Colors">
          {editing ? (
            <Field label="Product Colors">
              <input
                name="colorsText"
                value={form.colorsText}
                onChange={change}
                className={input}
              />
            </Field>
          ) : (
            <div className="flex flex-wrap gap-2">
              {arr(product.colors).map((x) => (
                <span key={x} className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                  {x}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* ORIGINAL */}
        <Card title="Original Product Link">
          {editing ? (
            <OriginalProductLinkField
              value={form.originalProductLink}
              onChange={(originalProductLink) =>
                setForm((p) => ({ ...p, originalProductLink }))
              }
            />
          ) : (
            <p className="break-all text-sm text-gray-600">
              {product.originalProductLink || "-"}
            </p>
          )}
        </Card>

        {/* FABRICS */}
        <Card title="Fabrics">
          <FabricAdd
            value={editing ? form.fabrics : arr(product.fabrics)}
            editable={editing}
            onChange={(fabrics) =>
              setForm((p) => ({ ...p, fabrics }))
            }
          />
        </Card>

        {/* PRODUCTION */}
        <Card title="Production">
          <ProductProductionDetails
            editable={editing}
            value={{
              avgFabricConsumption: editing
                ? form.avgFabricConsumption
                : product.avgFabricConsumption,
              accessories: editing
                ? form.accessories
                : product.accessories,
            }}
            onChange={(next) =>
              setForm((p) => ({ ...p, ...next }))
            }
          />
        </Card>

        {/* ATTRIBUTES */}
        <AttributeSelector
          value={editing ? form.attributes : product.attributes}
          allAttributes={attributes}
          editable={editing}
          onChange={(attributes) =>
            setForm((p) => ({ ...p, attributes }))
          }
        />

        {/* COLLECTIONS */}
        <Card title="Collections">
          {editing ? (
            <CollectionMultiSelect
              collections={collections}
              value={form.collections}
              onChange={(collections) =>
                setForm((p) => ({ ...p, collections }))
              }
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {arr(product.collections).map((x) => (
                <span
                  key={typeof x === "string" ? x : x?._id}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs"
                >
                  {typeof x === "string" ? x : x?.name}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* ADVANCED */}
        <ProductAdvancedFields
          editable={editing}
          value={form}
          onChange={(next) =>
            setForm((p) => ({ ...p, ...next }))
          }
        />

        {/* VARIANTS */}
        <ProductVariantsEditor
          value={editing ? form.variants : product.variants}
          editable={editing}
          onChange={(variants) => {
            setVariantsDirty(true);
            setForm((p) => ({ ...p, variants }));
          }}
        />

        {/* SAMPLING */}
        <ProductSamplingPattern
          productId={product._id}
          variants={editing ? form.variants : arr(product.variants)}
          isSamplingDone={
            editing ? form.isSamplingDone : !!product.isSamplingDone
          }
          editable={editing}
          onVariantsChange={(variants) => {
            setVariantsDirty(true);
            setForm((p) => ({ ...p, variants }));
          }}
          onSamplingChange={(isSamplingDone) =>
            setForm((p) => ({ ...p, isSamplingDone }))
          }
        />

        {/* CROSS SELL */}
        <Card title="Cross-sell Products">
          {editing ? (
            <CrossSellSelector
              value={form.crossSellProducts}
              onChange={(crossSellProducts) =>
                setForm((p) => ({ ...p, crossSellProducts }))
              }
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {arr(product.crossSellProducts).map((x) => (
                <span
                  key={x?._id}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs"
                >
                  {x?.title}
                </span>
              ))}
            </div>
          )}
        </Card>

      </div>
    </main>
  );
}