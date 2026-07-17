"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
  XCircle,
} from "lucide-react";

const clean = (value) =>
  String(value ?? "")
    .replace(/^["']|["']$/g, "")
    .trim()
    .toUpperCase();

const unique = (values = []) => [...new Set(values.filter(Boolean))];

export const normalizeOrderNumber = (value, source = "website") => {
  const raw = clean(value);
  const digits = raw.replace(/\D/g, "");

  if (!digits) return "";

  if (raw.startsWith("SHOP")) {
    return `SHOP-${digits.padStart(4, "0")}`;
  }

  if (raw.startsWith("MIRAY")) {
    return `MIRAY-${digits.padStart(6, "0")}`;
  }

  return source === "shopify"
    ? `SHOP-${digits.padStart(4, "0")}`
    : `MIRAY-${digits.padStart(6, "0")}`;
};

const parseText = (value = "") =>
  unique(
    String(value)
      .split(/[\n\r\t,;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  );

const getOrder = (item = {}) => item?.order || null;

const getOrderId = (item = {}) =>
  item?.orderId || item?.order?._id || item?.order?.id || "";

const getCustomerName = (order = {}) => {
  const address =
    order?.shippingAddressSnapshot ||
    order?.shippingAddress ||
    order?.shopify?.raw?.shippingAddress ||
    {};

  return (
    address?.fullName ||
    address?.name ||
    `${address?.firstName || ""} ${address?.lastName || ""}`.trim() ||
    order?.customerId?.name ||
    order?.customer?.name ||
    "—"
  );
};

const getAmount = (order = {}) =>
  Number(
    order?.finalPayable ??
      order?.totalAmount ??
      order?.shopify?.raw?.currentTotalPriceSet?.shopMoney?.amount ??
      order?.shopify?.raw?.totalPriceSet?.shopMoney?.amount ??
      0
  );

export default function BulkOrderCancellation({
  source = "website",
  onLookup,
  onConfirm,
  loading = false,
  title = "Bulk Order Cancellation",
  description = "",
  className = "",
}) {
  const fileRef = useRef(null);

  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState([]);
  const [results, setResults] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [reason, setReason] = useState("cancelled_by_admin");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");

  const normalizedSource =
    String(source).toLowerCase() === "shopify" ? "shopify" : "website";

  const isShopify = normalizedSource === "shopify";
  const sourceLabel = isShopify ? "Shopify" : "Website";
  const format = isShopify ? "SHOP-0000" : "MIRAY-000000";
  const busy = loading || lookupLoading;

  const ready = results.filter(
    (item) =>
      item?.found === true &&
      item?.alreadyCancelled !== true &&
      item?.isAlreadyCancelled !== true &&
      Boolean(getOrderId(item))
  );

  const missing = results.filter((item) => item?.found !== true);

  const cancelled = results.filter(
    (item) =>
      item?.found === true &&
      (item?.alreadyCancelled === true ||
        item?.isAlreadyCancelled === true)
  );

  const parseAndLookup = async (values = []) => {
    const orderNumbers = unique(
      values
        .map((value) => normalizeOrderNumber(value, normalizedSource))
        .filter(Boolean)
    );

    setParsed(orderNumbers);
    setResults([]);
    setError("");
    setConfirmOpen(false);

    if (!orderNumbers.length) {
      setError(`No valid ${format} order numbers found.`);
      return;
    }

    if (typeof onLookup !== "function") {
      setError("Order lookup function is not configured.");
      return;
    }

    try {
      setLookupLoading(true);

      const response = await onLookup(orderNumbers, normalizedSource);
      const lookupResults = Array.isArray(response?.results)
        ? response.results
        : [];

      setResults(lookupResults);

      if (!lookupResults.length) {
        setError("No results returned from server.");
      }
    } catch (lookupError) {
      setError(lookupError?.message || "Unable to verify orders.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: "array",
      });

      const sheetName = workbook.SheetNames?.[0];
      if (!sheetName) throw new Error("Excel file is empty.");

      const rows = XLSX.utils.sheet_to_json(
        workbook.Sheets[sheetName],
        {
          header: 1,
          raw: false,
          defval: "",
        }
      );

      const cells = rows
        .flat()
        .map((cell) => String(cell ?? "").trim())
        .filter(Boolean);

      await parseAndLookup(cells);
    } catch (uploadError) {
      setParsed([]);
      setResults([]);
      setError(uploadError?.message || "Unable to read Excel file.");
    } finally {
      event.target.value = "";
    }
  };

  const downloadSample = async () => {
    try {
      const XLSX = await import("xlsx");

      const rows = isShopify
        ? [
            ["Order Number"],
            ["SHOP-1900"],
            ["SHOP-1982"],
            ["SHOP-2513"],
          ]
        : [
            ["Order Number"],
            ["MIRAY-001900"],
            ["MIRAY-001982"],
            ["MIRAY-002513"],
          ];

      const sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet["!cols"] = [{ wch: 22 }];

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        sheet,
        "Bulk Cancellation"
      );

      XLSX.writeFile(
        workbook,
        isShopify
          ? "shopify-bulk-cancellation-sample.xlsx"
          : "miray-bulk-cancellation-sample.xlsx"
      );
    } catch (downloadError) {
      setError(
        downloadError?.message || "Unable to download sample file."
      );
    }
  };

  const clearAll = () => {
    setInput("");
    setParsed([]);
    setResults([]);
    setReason("cancelled_by_admin");
    setConfirmOpen(false);
    setError("");
  };

  const confirmCancellation = async () => {
    if (!ready.length) {
      setConfirmOpen(false);
      setError("No orders are ready for cancellation.");
      return;
    }

    try {
      setError("");

      await onConfirm?.({
        source: normalizedSource,
        reason: reason.trim() || "cancelled_by_admin",
        orderIds: ready.map((item) => String(getOrderId(item))),
        orderNumbers: ready.map(
          (item) => item?.orderNumber || getOrder(item)?.orderNumber || ""
        ),
        orders: ready.map(getOrder).filter(Boolean),
      });

      clearAll();
    } catch (confirmError) {
      setConfirmOpen(false);
      setError(confirmError?.message || "Bulk cancellation failed.");
    }
  };

  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}
    >
      <header className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-950">{title}</h1>

          <p className="mt-1 text-sm text-gray-500">
            {description ||
              "Paste order numbers or upload Excel. Orders are verified from the backend before cancellation."}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Format: <strong className="text-gray-700">{format}</strong>
          </p>
        </div>

        <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          {sourceLabel}
        </span>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-800">
            Paste order numbers
          </label>

          <textarea
            rows={7}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              isShopify
                ? "1900\n#1982\nSHOP-1983"
                : "1900\nMIRAY-1982\nMIRAY-001983"
            }
            className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-3 py-3 font-mono text-sm outline-none focus:border-black"
          />

          <button
            type="button"
            onClick={() => parseAndLookup(parseText(input))}
            disabled={!input.trim() || busy}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {lookupLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}

            {lookupLoading ? "Checking..." : "Parse & Check"}
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-gray-800">
              Upload Excel
            </label>

            <button
              type="button"
              onClick={downloadSample}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-black disabled:opacity-50"
            >
              <Download size={14} />
              Download Sample
            </button>
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="mt-2 flex min-h-[184px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-5 text-center hover:border-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            {lookupLoading ? (
              <Loader2 size={32} className="animate-spin text-gray-500" />
            ) : (
              <FileSpreadsheet size={32} className="text-gray-500" />
            )}

            <span className="mt-3 text-sm font-medium text-gray-900">
              Select Excel file
            </span>

            <span className="mt-1 text-xs text-gray-500">
              First column should contain order numbers
            </span>

            <span className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">
              <Upload size={14} />
              Browse File
            </span>
          </button>

          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <XCircle size={17} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {parsed.length > 0 && (
        <div className="mt-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Summary label="Parsed" value={parsed.length} />
            <Summary label="Ready" value={ready.length} />
            <Summary label="Missing" value={missing.length} />
            <Summary label="Cancelled" value={cancelled.length} />
          </div>

          <div className="mt-4 max-h-80 overflow-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Result</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {results.map((item, index) => {
                  const order = getOrder(item);
                  const isCancelled =
                    item?.alreadyCancelled === true ||
                    item?.isAlreadyCancelled === true;

                  const orderNumber =
                    item?.orderNumber ||
                    order?.orderNumber ||
                    parsed[index] ||
                    "—";

                  return (
                    <tr key={`${orderNumber}-${index}`}>
                      <td className="px-4 py-3 font-medium text-gray-950">
                        {orderNumber}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {item?.found ? getCustomerName(order) : "—"}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {item?.found
                          ? `₹${getAmount(order).toLocaleString("en-IN")}`
                          : "—"}
                      </td>

                      <td className="px-4 py-3">
                        {!item?.found ? (
                          <Badge type="missing">Not found</Badge>
                        ) : isCancelled ? (
                          <Badge type="warning">Already cancelled</Badge>
                        ) : (
                          <Badge type="ready">Ready</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {!lookupLoading && !results.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No lookup results returned.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-gray-800">
              Cancellation reason
            </span>

            <textarea
              rows={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
            />
          </label>

          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={clearAll}
              disabled={busy}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={busy || !ready.length || !reason.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Ban size={16} />
              )}

              Cancel {ready.length} Orders
            </button>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertTriangle size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-gray-950">
                    Confirm cancellation
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Cancel {ready.length} {sourceLabel.toLowerCase()} orders?
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 max-h-44 overflow-auto rounded-xl bg-gray-50 p-3">
              <p className="text-sm text-gray-600">
                Reason: <strong>{reason}</strong>
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {ready.map((item) => (
                  <span
                    key={String(getOrderId(item))}
                    className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700"
                  >
                    {item?.orderNumber || item?.order?.orderNumber}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
              >
                Go Back
              </button>

              <button
                type="button"
                onClick={confirmCancellation}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Ban size={16} />
                )}

                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Summary({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-950">{value}</p>
    </div>
  );
}

function Badge({ type, children }) {
  const styles = {
    ready: "bg-green-50 text-green-700",
    warning: "bg-amber-50 text-amber-700",
    missing: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[type] || styles.missing
      }`}
    >
      {children}
    </span>
  );
}