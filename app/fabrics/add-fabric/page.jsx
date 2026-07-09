"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import useFabricStore from "@/store/fabricStore";

const initialForm = {
  name: "",
  category: "",
  unit: "meter",
  imageLink: "",
  gsm: "",
  width: "",
  currentStock: 0,
  associatedProductCodes: "",
  status: "active",
  movementStatus: "idle",
  notes: "",
};

export default function AddFabricPage() {
  const router = useRouter();
  const { createFabric, formLoading, error } = useFabricStore();

  const [form, setForm] = useState(initialForm);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      unit: form.unit,
      imageLink: form.imageLink.trim(),
      gsm: form.gsm ? Number(form.gsm) : null,
      width: form.width.trim() || null,
      currentStock: Number(form.currentStock || 0),
      associatedProductCodes: form.associatedProductCodes
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      status: form.status,
      movementStatus: form.movementStatus,
      notes: form.notes.trim(),
      isActive: true,
    };

    const res = await createFabric(payload);

    if (res.success) {
      router.push("/fabrics");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-4 text-neutral-950 md:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link
              href="/fabrics"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-950"
            >
              <ArrowLeft size={16} />
              Back to fabrics
            </Link>

            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Add Fabric
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Create a new fabric master with opening stock and product mapping.
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm md:p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Fabric Name" required>
              <input
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Cotton Lycra"
                className="input"
              />
            </Field>

            <Field label="Category" required>
              <input
                required
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                placeholder="Cotton / Rayon / Denim"
                className="input"
              />
            </Field>

            <Field label="Unit" required>
              <select
                value={form.unit}
                onChange={(e) => updateField("unit", e.target.value)}
                className="input"
              >
                <option value="meter">meter</option>
                <option value="kg">kg</option>
              </select>
            </Field>

            <Field label="Opening Stock">
              <input
                type="number"
                min="0"
                value={form.currentStock}
                onChange={(e) => updateField("currentStock", e.target.value)}
                className="input"
              />
            </Field>

            <Field label="GSM">
              <input
                type="number"
                min="1"
                value={form.gsm}
                onChange={(e) => updateField("gsm", e.target.value)}
                placeholder="180"
                className="input"
              />
            </Field>

            <Field label="Width">
              <input
                value={form.width}
                onChange={(e) => updateField("width", e.target.value)}
                placeholder='58" / 44"'
                className="input"
              />
            </Field>

            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="input"
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="discontinued">discontinued</option>
              </select>
            </Field>

            <Field label="Movement Status">
              <select
                value={form.movementStatus}
                onChange={(e) => updateField("movementStatus", e.target.value)}
                className="input"
              >
                <option value="idle">idle</option>
                <option value="incoming">incoming</option>
                <option value="in_use">in_use</option>
                <option value="outgoing">outgoing</option>
              </select>
            </Field>

            <Field label="Image Link" className="md:col-span-2">
              <input
                value={form.imageLink}
                onChange={(e) => updateField("imageLink", e.target.value)}
                placeholder="https://..."
                className="input"
              />
            </Field>

            <Field label="Associated Product Codes" className="md:col-span-2">
              <textarea
                value={form.associatedProductCodes}
                onChange={(e) =>
                  updateField("associatedProductCodes", e.target.value)
                }
                placeholder="00277, 00441, 00561"
                rows={3}
                className="input resize-none py-3"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Add comma separated product codes.
              </p>
            </Field>

            <Field label="Notes" className="md:col-span-2">
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Internal notes..."
                rows={4}
                className="input resize-none py-3"
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-neutral-100 pt-5 md:flex-row md:justify-end">
            <Link
              href="/fabrics"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 text-sm font-medium hover:bg-neutral-100"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={formLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {formLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save Fabric
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .input {
          height: 44px;
          width: 100%;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          padding: 0 12px;
          font-size: 14px;
          outline: none;
        }

        .input:focus {
          border-color: #171717;
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-neutral-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}
