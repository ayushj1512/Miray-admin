"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, CheckCircle, AlertTriangle, Download } from "lucide-react";
import * as XLSX from "xlsx";
import useFabricStore from "@/store/fabricStore";

const requiredHeaders = ["name", "category", "unit", "currentStock"];

const sampleRows = [
  {
    name: "Cotton Lycra",
    category: "Cotton",
    unit: "meter",
    currentStock: 100,
    imageLink: "",
    gsm: 180,
    width: '58"',
    associatedProductCodes: "00277,00441",
    notes: "Opening stock",
  },
];

const normalizeRow = (row = {}) => ({
  name: String(row.name || row.Name || "").trim(),
  category: String(row.category || row.Category || "").trim(),
  unit: String(row.unit || row.Unit || "").trim().toLowerCase(),
  currentStock: Number(row.currentStock ?? row.Stock ?? row.stock ?? 0),
  imageLink: String(row.imageLink || row.ImageLink || row.image || "").trim(),
  gsm: row.gsm || row.GSM ? Number(row.gsm || row.GSM) : null,
  width: String(row.width || row.Width || "").trim() || null,
  associatedProductCodes: String(
    row.associatedProductCodes || row.productCodes || row["Product Codes"] || ""
  )
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean),
  notes: String(row.notes || row.Notes || "").trim(),
  status: "active",
  movementStatus: "idle",
  isActive: true,
});

const validateRow = (row) => {
  const errors = [];

  if (!row.name) errors.push("Missing fabric name");
  if (!row.category) errors.push("Missing category");
  if (!["meter", "kg"].includes(row.unit)) errors.push("Unit must be meter or kg");
  if (!Number.isFinite(row.currentStock) || row.currentStock < 0) {
    errors.push("Stock must be non-negative");
  }

  return errors;
};

export default function FabricImportPage() {
  const { createFabric, formLoading } = useFabricStore();

  const [rows, setRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const summary = useMemo(() => {
    const valid = rows.filter((item) => !item.errors.length).length;
    const invalid = rows.length - valid;
    return { total: rows.length, valid, invalid };
  }, [rows]);

  const handleDownloadSample = () => {
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fabric Import Sample");
    XLSX.writeFile(wb, "fabric-import-sample.xlsx");
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResult(null);

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const parsed = json.map((raw, index) => {
      const normalized = normalizeRow(raw);
      return {
        rowNumber: index + 2,
        ...normalized,
        errors: validateRow(normalized),
      };
    });

    setRows(parsed);
  };

  const handleImport = async () => {
    const ok = window.confirm(
      "Are you sure the Excel data is correct? Import will create fabrics now."
    );

    if (!ok) return;

    const validRows = rows.filter((item) => !item.errors.length);

    setImporting(true);

    const report = {
      total: validRows.length,
      success: 0,
      failed: 0,
      failedRows: [],
    };

    for (const row of validRows) {
      const payload = { ...row };
      delete payload.errors;
      delete payload.rowNumber;

      const res = await createFabric(payload);

      if (res.success) {
        report.success += 1;
      } else {
        report.failed += 1;
        report.failedRows.push({
          rowNumber: row.rowNumber,
          name: row.name,
          message: res.message || "Import failed",
        });
      }
    }

    setResult(report);
    setImporting(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-4 text-neutral-950 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div>
          <Link
            href="/fabrics"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-950"
          >
            <ArrowLeft size={16} />
            Back to fabrics
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Import Fabrics
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Upload Excel, preview data, verify errors, then confirm import.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-sm font-semibold">Excel Upload</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Required columns: {requiredHeaders.join(", ")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-100"
              >
                <Download size={16} />
                Sample Excel
              </button>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
                <Upload size={16} />
                Upload Excel
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {rows.length ? (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <Card title="Total Rows" value={summary.total} />
              <Card title="Valid Rows" value={summary.valid} />
              <Card title="Rows With Errors" value={summary.invalid} danger={summary.invalid > 0} />
            </div>

            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-200 p-4">
                <div>
                  <h2 className="text-sm font-semibold">Preview</h2>
                  <p className="text-xs text-neutral-500">
                    Please check carefully before confirming import.
                  </p>
                </div>

                <button
                  disabled={summary.valid === 0 || importing || formLoading}
                  onClick={handleImport}
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  Yes, Data Is Correct
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-4 py-3">Row</th>
                      <th className="px-4 py-3">Fabric</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3">Stock</th>
                      <th className="px-4 py-3">GSM</th>
                      <th className="px-4 py-3">Width</th>
                      <th className="px-4 py-3">Product Codes</th>
                      <th className="px-4 py-3">Validation</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-100">
                    {rows.map((row, index) => (
                      <tr key={`${row.rowNumber}-${index}`} className="hover:bg-neutral-50">
                        <td className="px-4 py-3">{row.rowNumber}</td>
                        <td className="px-4 py-3 font-medium">{row.name || "-"}</td>
                        <td className="px-4 py-3">{row.category || "-"}</td>
                        <td className="px-4 py-3">{row.unit || "-"}</td>
                        <td className="px-4 py-3">{row.currentStock}</td>
                        <td className="px-4 py-3">{row.gsm || "-"}</td>
                        <td className="px-4 py-3">{row.width || "-"}</td>
                        <td className="px-4 py-3">
                          {row.associatedProductCodes?.join(", ") || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {row.errors.length ? (
                            <div className="flex items-start gap-2 text-red-600">
                              <AlertTriangle size={16} className="mt-0.5" />
                              <span className="text-xs">{row.errors.join(", ")}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                              <CheckCircle size={13} />
                              Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}

        {result ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Import Result</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Success: {result.success} / Failed: {result.failed}
            </p>

            {result.failedRows.length ? (
              <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {result.failedRows.map((item) => (
                  <p key={item.rowNumber}>
                    Row {item.rowNumber}: {item.name} — {item.message}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Card({ title, value, danger }) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm ${
        danger ? "border-red-200" : "border-neutral-200"
      }`}
    >
      <p className="text-xs font-medium text-neutral-500">{title}</p>
      <p className={danger ? "mt-2 text-2xl font-semibold text-red-600" : "mt-2 text-2xl font-semibold"}>
        {value}
      </p>
    </div>
  );
}