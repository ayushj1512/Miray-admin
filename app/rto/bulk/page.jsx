"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  PackageCheck,
  RotateCcw,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react";

import { useOrderStore } from "@/store/orderStore";

export default function BulkRTOrecieve() {
  const inputRef = useRef(null);

  const {
    loading,
    downloadBulkRtoSample,
    bulkMarkRtoReceived,
  } = useOrderStore();

  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const validateFile = (selected) => {
    if (!selected) return;

    if (!/\.(xlsx|xls)$/i.test(selected.name)) {
      setError("Only .xlsx and .xls files are supported.");
      return;
    }

    setFile(selected);
    setResult(null);
    setError("");
  };

  const handleSelect = (e) => {
    validateFile(e.target.files?.[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    validateFile(e.dataTransfer.files?.[0]);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError("");
    setDragging(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError("");
      await downloadBulkRtoSample();
    } catch (err) {
      setError(err?.message || "Sample download failed.");
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Select an Excel file first.");
      return;
    }

    try {
      setError("");
      setResult(null);

      const data = await bulkMarkRtoReceived(file);
      setResult(data);
    } catch (err) {
      setError(
        err?.message || "Bulk RTO processing failed."
      );
    }
  };

  const summary = result?.summary || {};
  const results = Array.isArray(result?.results)
    ? result.results
    : [];

  const total = Number(
    summary.total ?? results.length
  );

  const successCount = Number(
    summary.success || 0
  );

  const failedCount = Number(
    summary.failed || 0
  );

  const restoredQty = Number(
    summary.restoredQty || 0
  );

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <section className="rounded-2xl bg-white">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#800020] text-white">
              <PackageCheck size={21} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-950">
                  Bulk Clean RTO
                </h2>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-emerald-700">
                  CLEAN RETURNS ONLY
                </span>
              </div>

              <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500">
                Receive multiple clean RTO orders and
                restore their complete inventory in one go.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
          >
            {downloading ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Download size={16} />
            )}

            Download Sample
          </button>
        </div>

        <div className="mx-5 mb-5 flex gap-3 rounded-xl bg-amber-50 px-4 py-3.5 sm:mx-6 sm:mb-6">
          <Info
            size={16}
            className="mt-0.5 shrink-0 text-amber-700"
          />

          <p className="text-xs leading-5 text-amber-900">
            Upload only completely clean RTO orders.
            Full ordered quantity of every item will be
            restored to inventory.
          </p>
        </div>
      </section>

      {/* HOW TO USE */}
      <section className="rounded-2xl bg-white p-5 sm:p-6">
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#800020]">
            Quick Guide
          </p>

          <h3 className="mt-1 text-base font-semibold text-gray-950">
            3 simple steps
          </h3>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Step
            number="01"
            title="Download sample"
            text="Download the Excel template with the Order Number column."
          />

          <Step
            number="02"
            title="Add orders"
            text="Enter one clean RTO order number on each row."
          />

          <Step
            number="03"
            title="Upload & receive"
            text="Upload Excel and inventory will be restored automatically."
          />
        </div>
      </section>

      {/* UPLOAD */}
      <section className="rounded-2xl bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-950">
              Upload Excel
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              One clean RTO order number per row.
            </p>
          </div>

          <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-[11px] font-medium text-gray-500">
            XLSX / XLS
          </span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleSelect}
          className="hidden"
        />

        {!file ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl px-6 py-12 text-center transition ${
              dragging
                ? "bg-[#800020]/[0.05]"
                : "bg-gray-50 hover:bg-gray-100/70"
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#800020] shadow-sm">
              <UploadCloud size={25} />
            </div>

            <p className="mt-4 text-sm font-semibold text-gray-900">
              Drop Excel file here
            </p>

            <p className="mt-1 text-xs text-gray-500">
              or click to select from your computer
            </p>

            <p className="mt-4 text-[11px] text-gray-400">
              XLSX or XLS · Maximum 5 MB
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-2xl bg-gray-50 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FileSpreadsheet size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {file.name}
                </p>

                <CheckCircle2
                  size={15}
                  className="shrink-0 text-emerald-600"
                />
              </div>

              <p className="mt-1 text-xs text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
                {" · "}
                Ready to process
              </p>
            </div>

            {!loading && (
              <button
                type="button"
                onClick={reset}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white hover:text-gray-900"
              >
                <X size={17} />
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3.5 text-sm text-red-700">
            <XCircle
              size={17}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {file && !loading && (
            <button
              type="button"
              onClick={reset}
              className="h-11 rounded-xl px-5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#800020] px-6 text-sm font-semibold text-white transition hover:bg-[#68001a] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          >
            {loading ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Processing...
              </>
            ) : (
              <>
                Receive RTO Orders
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </section>

      {/* RESULTS */}
      {result && (
        <section className="overflow-hidden rounded-2xl bg-white">
          {/* RESULT HEADER */}
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  failedCount
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {failedCount ? (
                  <Info size={19} />
                ) : (
                  <CheckCircle2 size={19} />
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-950">
                  Processing Complete
                </h3>

                <p className="mt-0.5 text-xs text-gray-500">
                  {failedCount
                    ? `${successCount} received · ${failedCount} failed`
                    : "All orders received successfully."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={reset}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-gray-100 px-3.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
            >
              <RotateCcw size={14} />
              New Upload
            </button>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 sm:grid-cols-4">
            <Stat
              label="Orders"
              value={total}
            />

            <Stat
              label="Received"
              value={successCount}
              type="success"
            />

            <Stat
              label="Failed"
              value={failedCount}
              type={failedCount ? "danger" : ""}
            />

            <Stat
              label="Units Restored"
              value={restoredQty}
            />
          </div>

          {/* TABLE */}
          {results.length > 0 && (
            <div className="p-5 sm:p-6">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    Order Results
                  </h4>

                  <p className="mt-1 text-xs text-gray-500">
                    Status of every uploaded order.
                  </p>
                </div>

                <span className="text-xs text-gray-400">
                  {results.length} orders
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      <th className="rounded-l-lg px-4 py-3">
                        Order Number
                      </th>

                      <th className="px-4 py-3">
                        Status
                      </th>

                      <th className="px-4 py-3">
                        Restored
                      </th>

                      <th className="rounded-r-lg px-4 py-3">
                        Details
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {results.map((item, index) => (
                      <tr
                        key={`${item?.orderNumber}-${index}`}
                        className="hover:bg-gray-50/70"
                      >
                        <td className="px-4 py-4">
                          <span className="font-mono text-sm font-semibold text-gray-900">
                            {item?.orderNumber || "—"}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          {item?.success ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              <Check size={13} />
                              Received
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                              <X size={13} />
                              Failed
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-gray-700">
                          {item?.success
                            ? `${item?.restoredQty ?? 0} units`
                            : "—"}
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-500">
                          {item?.message ||
                            (item?.success
                              ? "RTO received successfully"
                              : "Processing failed")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Step({ number, title, text }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <span className="text-[11px] font-bold text-[#800020]">
        {number}
      </span>

      <p className="mt-3 text-sm font-semibold text-gray-900">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-gray-500">
        {text}
      </p>
    </div>
  );
}

function Stat({ label, value, type = "" }) {
  const valueClass =
    type === "success"
      ? "text-emerald-700"
      : type === "danger"
        ? "text-red-700"
        : "text-gray-950";

  return (
    <div className="rounded-xl bg-white p-4">
      <p className="text-[11px] font-medium text-gray-500">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-semibold tracking-tight ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}