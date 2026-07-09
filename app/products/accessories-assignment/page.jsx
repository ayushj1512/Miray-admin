"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Search } from "lucide-react";
import { useAdminProductStore } from "@/store/adminProductStore";
import ProductProductionDetails from "@/components/product/ProductProductionDetails";

const DEFAULT_AVG = {
  value: 0,
  unit: "meter",
  wastePercentage: 5,
};

const ACCESSORY_SUGGESTIONS = [
  "zip",
  "button",
  "bow",
  "lace",
  "hook",
  "elastic",
  "thread",
  "label",
  "tag",
  "interlining",
  "lining",
  "dori",
  "beads",
  "chain",
  "snap button",
];

const getProductImage = (product) =>
  product?.thumbnail ||
  product?.image ||
  product?.images?.[0] ||
  product?.featuredImage ||
  product?.featuredMedia?.preview?.image?.url ||
  "";

export default function AccessoriesAssignmentPage() {
  const {
    products,
    loading,
    saving,
    fetchProducts,
    updateProductProductionDetails,
  } = useAdminProductStore();

  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    fetchProducts({ limit: 100 });
  }, [fetchProducts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products || [];

    return (products || []).filter((p) => {
      return (
        String(p?.title || "").toLowerCase().includes(q) ||
        String(p?.productCode || "").toLowerCase().includes(q)
      );
    });
  }, [products, search]);

  const getDraft = (product) =>
    drafts[product._id] ?? {
      avgFabricConsumption: product.avgFabricConsumption || DEFAULT_AVG,
      accessories: Array.isArray(product.accessories)
        ? product.accessories
        : [],
    };

  const setDraft = (id, next) => {
    setDrafts((p) => ({ ...p, [id]: next }));
  };

  const addSuggestedAccessory = (product, type) => {
    const draft = getDraft(product);

    setDraft(product._id, {
      ...draft,
      accessories: [
        ...(draft.accessories || []),
        {
          name: type,
          type,
          quantity: 1,
          unit: "piece",
          notes: "",
        },
      ],
    });
  };

  const save = async (product) => {
    const draft = getDraft(product);

    await updateProductProductionDetails(product._id, {
      avgFabricConsumption: draft.avgFabricConsumption,
      accessories: draft.accessories,
    });

    setDrafts((p) => {
      const next = { ...p };
      delete next[product._id];
      return next;
    });
  };

  return (
    <section className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Accessories Assignment</h1>
        <p className="text-sm text-gray-500">
          Assign accessories and average fabric consumption product-wise.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
        <Search size={18} className="text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or product code..."
          className="w-full outline-none text-sm"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading products...</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((product) => {
            const draft = getDraft(product);
            const image = getProductImage(product);

            return (
              <div
                key={product._id}
                className="bg-white rounded-xl shadow p-5 space-y-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
                      {image ? (
                        <img
                          src={image}
                          alt={product.title || "Product"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] text-gray-400 text-center px-1">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="font-semibold text-gray-900 line-clamp-1">
                        {product.title}
                      </h2>
                      <p className="text-xs text-gray-500">
                        Code: {product.productCode || "-"}
                      </p>
                      <p className="text-xs text-gray-400">
                        Accessories:{" "}
                        {Array.isArray(product.accessories)
                          ? product.accessories.length
                          : 0}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => save(product)}
                    className="inline-flex items-center gap-2 bg-black text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50 shrink-0"
                  >
                    <Save size={15} />
                    Save
                  </button>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Quick Add Suggestions
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {ACCESSORY_SUGGESTIONS.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => addSuggestedAccessory(product, type)}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:border-black hover:text-black"
                      >
                        + {type}
                      </button>
                    ))}
                  </div>
                </div>

                <ProductProductionDetails
                  editable
                  value={draft}
                  onChange={(next) => setDraft(product._id, next)}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}