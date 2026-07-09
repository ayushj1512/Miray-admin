"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Search } from "lucide-react";
import { useAdminProductStore } from "@/store/adminProductStore";
import FabricAdd from "@/components/product/FabricAdd";

const DEFAULT_AVG = {
  value: 0,
  unit: "meter",
  wastePercentage: 5,
};

const getProductImage = (product) =>
  product?.thumbnail || product?.images?.[0] || "";

const normalizeAvg = (avg) => ({
  value: Number(avg?.value ?? 0) || 0,
  unit: avg?.unit || "meter",
  wastePercentage: Number(avg?.wastePercentage ?? 5) || 0,
});

export default function FabricAssignmentPage() {
  const {
    products,
    loading,
    saving,
    fetchProducts,
    updateProduct,
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
      fabrics: Array.isArray(product.fabrics) ? product.fabrics : [],
      avgFabricConsumption: normalizeAvg(
        product.avgFabricConsumption || DEFAULT_AVG
      ),
    };

  const setDraft = (id, patch) => {
    setDrafts((p) => ({
      ...p,
      [id]: {
        ...(p[id] || {}),
        ...patch,
      },
    }));
  };

  const updateAvg = (product, key, value) => {
    const draft = getDraft(product);

    setDraft(product._id, {
      avgFabricConsumption: {
        ...draft.avgFabricConsumption,
        [key]:
          key === "value" || key === "wastePercentage"
            ? Number(value) || 0
            : value,
      },
    });
  };

  const save = async (product) => {
    const draft = getDraft(product);

    await updateProduct(product._id, {
      fabrics: draft.fabrics,
      avgFabricConsumption: draft.avgFabricConsumption,
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
        <h1 className="text-xl font-semibold">Fabric Assignment</h1>
        <p className="text-sm text-gray-500">
          Assign required fabrics and average consumption product-wise.
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
            const image = getProductImage(product);
            const draft = getDraft(product);
            const avg = draft.avgFabricConsumption;

            return (
              <div
                key={product._id}
                className="bg-white rounded-xl shadow p-5 space-y-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100 border">
                      {image ? (
                        <img
                          src={image}
                          alt={product.title || "Product"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] text-gray-400">
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
                        Current fabrics:{" "}
                        {Array.isArray(product.fabrics)
                          ? product.fabrics.length
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
                    Avg Fabric Consumption
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div>
    <label className="mb-1.5 block text-xs font-medium text-gray-600">
      Average Fabric
    </label>

    <input
      type="number"
      min="0"
      value={avg.value}
      onChange={(e) => updateAvg(product, "value", e.target.value)}
      className="input"
    />
  </div>

  <div>
    <label className="mb-1.5 block text-xs font-medium text-gray-600">
      Unit
    </label>

    <select
      value={avg.unit}
      onChange={(e) => updateAvg(product, "unit", e.target.value)}
      className="input"
    >
      <option value="meter">Meter</option>
      <option value="cm">Centimeter</option>
      <option value="gram">Gram</option>
    </select>
  </div>

  <div>
    <label className="mb-1.5 block text-xs font-medium text-gray-600">
      Fabric Waste (%)
    </label>

    <input
      type="number"
      min="0"
      value={avg.wastePercentage}
      onChange={(e) =>
        updateAvg(product, "wastePercentage", e.target.value)
      }
      className="input"
    />
  </div>
</div>
                </div>

                <FabricAdd
                  editable
                  value={draft.fabrics}
                  onChange={(next) =>
                    setDraft(product._id, { fabrics: next })
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          background: white;
          border: 1px solid #e5e7eb;
          padding: 0.7rem 0.9rem;
          font-size: 0.875rem;
          outline: none;
        }

        .input:focus {
          border-color: #111827;
        }
      `}</style>
    </section>
  );
}