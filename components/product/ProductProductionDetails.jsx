"use client";

import { Plus, Trash2 } from "lucide-react";

const DEFAULT_AVG = {
  value: 0,
  unit: "meter",
  wastePercentage: 5,
};

const UNITS = ["piece", "pair", "meter", "gram", "roll"];
const FABRIC_UNITS = ["meter", "cm", "gram"];

const cleanNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const emptyAccessory = () => ({
  name: "",
  type: "",
  quantity: 1,
  unit: "piece",
  notes: "",
});

export default function ProductProductionDetails({
  value = {},
  onChange,
  editable = true,
}) {
  const avgFabricConsumption = {
    ...DEFAULT_AVG,
    ...(value?.avgFabricConsumption || {}),
  };

  const accessories = Array.isArray(value?.accessories)
    ? value.accessories
    : [];

  const emit = (patch = {}) => {
    onChange?.({
      avgFabricConsumption,
      accessories,
      ...patch,
    });
  };

  const updateAvg = (key, nextValue) => {
    emit({
      avgFabricConsumption: {
        ...avgFabricConsumption,
        [key]:
          key === "value" || key === "wastePercentage"
            ? cleanNumber(nextValue)
            : nextValue,
      },
    });
  };

  const addAccessory = () => {
    emit({ accessories: [...accessories, emptyAccessory()] });
  };

  const updateAccessory = (index, key, nextValue) => {
    const next = accessories.map((item, i) =>
      i === index
        ? {
            ...item,
            [key]:
              key === "quantity"
                ? cleanNumber(nextValue, 1)
                : String(nextValue ?? ""),
          }
        : item
    );

    emit({ accessories: next });
  };

  const removeAccessory = (index) => {
    emit({ accessories: accessories.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Production Details
        </h2>
        <p className="text-sm text-gray-500">
          Fabric average and accessories required to make this product.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Avg Fabric Consumption
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="field-label">Average Fabric</label>
            <input
              type="number"
              min="0"
              disabled={!editable}
              value={avgFabricConsumption.value}
              onChange={(e) => updateAvg("value", e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="field-label">Fabric Unit</label>
            <select
              disabled={!editable}
              value={avgFabricConsumption.unit}
              onChange={(e) => updateAvg("unit", e.target.value)}
              className="input"
            >
              {FABRIC_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Waste Percentage</label>
            <input
              type="number"
              min="0"
              disabled={!editable}
              value={avgFabricConsumption.wastePercentage}
              onChange={(e) => updateAvg("wastePercentage", e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Accessories
            </h3>
            <p className="text-xs text-gray-500">
              Add zip, button, bow, lace, elastic or any required material.
            </p>
          </div>

          {editable && (
            <button
              type="button"
              onClick={addAccessory}
              className="inline-flex items-center gap-2 rounded-xl bg-black px-3 py-2 text-sm text-white hover:bg-gray-800"
            >
              <Plus size={15} />
              Add
            </button>
          )}
        </div>

        {!accessories.length ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-center text-sm text-gray-500">
            No accessories added.
          </div>
        ) : (
          <div className="space-y-3">
            {accessories.map((item, index) => (
              <div
                key={index}
                className="rounded-xl bg-white border border-gray-100 p-3 space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="md:col-span-2">
                    <label className="field-label">Accessory Name</label>
                    <input
                      disabled={!editable}
                      value={item.name || ""}
                      onChange={(e) =>
                        updateAccessory(index, "name", e.target.value)
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="field-label">Type</label>
                    <input
                      disabled={!editable}
                      value={item.type || ""}
                      onChange={(e) =>
                        updateAccessory(index, "type", e.target.value)
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="field-label">Quantity</label>
                    <input
                      type="number"
                      min="0"
                      disabled={!editable}
                      value={item.quantity ?? 1}
                      onChange={(e) =>
                        updateAccessory(index, "quantity", e.target.value)
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="field-label">Unit</label>
                    <select
                      disabled={!editable}
                      value={item.unit || "piece"}
                      onChange={(e) =>
                        updateAccessory(index, "unit", e.target.value)
                      }
                      className="input"
                    >
                      {UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="field-label">Notes</label>
                    <input
                      disabled={!editable}
                      value={item.notes || ""}
                      onChange={(e) =>
                        updateAccessory(index, "notes", e.target.value)
                      }
                      className="input"
                    />
                  </div>

                  {editable && (
                    <button
                      type="button"
                      onClick={() => removeAccessory(index)}
                      className="mt-6 rounded-xl border border-red-100 px-3 text-red-600 hover:bg-red-50"
                      title="Remove accessory"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {editable && (
          <button
            type="button"
            onClick={addAccessory}
            className="w-full rounded-xl border border-dashed border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 hover:border-black hover:text-black"
          >
            + Add Another Accessory
          </button>
        )}
      </div>

      <style jsx>{`
        .field-label {
          display: block;
          margin-bottom: 0.4rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: #4b5563;
        }

        .input {
          width: 100%;
          border-radius: 0.75rem;
          background: white;
          border: 1px solid #e5e7eb;
          padding: 0.75rem 0.9rem;
          font-size: 0.875rem;
          outline: none;
        }

        .input:focus {
          border-color: #111827;
        }

        .input:disabled {
          background: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}