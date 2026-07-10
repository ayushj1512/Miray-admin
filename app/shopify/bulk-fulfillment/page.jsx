"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import adminShopifyStore from "@/store/adminshopifystore";

const SAMPLE_ROWS = [
  {
    orderNumber: "#1037",
    trackingNumber: "1234567890",
    courierName: "Shiprocket",
  },
];

const normalizeRow = (row = {}) => ({
  orderNumber: String(
    row.orderNumber ||
      row["orderNumber"] ||
      row["Order Number"] ||
      row["Order No"] ||
      row["Order"] ||
      ""
  ).trim(),
  trackingNumber: String(
    row.trackingNumber ||
      row["trackingNumber"] ||
      row["Tracking Number"] ||
      row["AWB"] ||
      row["awb"] ||
      ""
  ).trim(),
  courierName: String(
    row.courierName ||
      row["courierName"] ||
      row["Courier Name"] ||
      row["Courier"] ||
      row["courier"] ||
      ""
  ).trim(),
});

const normalizeOrderNumber = (value = "") => {
  const v = String(value || "").trim();
  if (!v) return "";
  if (v.startsWith("#")) return v;
  return `#${v.replace(/^SHOP-?/i, "")}`;
};

export default function BulkFulfillmentPage() {
  const {
    bulkFulfillPreview,
    bulkMarkFulfilled,
    bulkFulfillPreviewLoading,
    bulkFulfillMarking,
  } = adminShopifyStore();

  const [rows, setRows] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [resultRows, setResultRows] = useState([]);

  const validRows = useMemo(
    () =>
      rows.filter(
        (r) => r.orderNumber && r.trackingNumber && r.courierName
      ),
    [rows]
  );

  const invalidRows = useMemo(
    () =>
      rows.filter(
        (r) => !r.orderNumber || !r.trackingNumber || !r.courierName
      ),
    [rows]
  );

  const readyRows = useMemo(
    () => previewRows.filter((r) => r.canFulfill),
    [previewRows]
  );

  const downloadSampleCsv = () => {
    const ws = XLSX.utils.json_to_sheet(SAMPLE_ROWS);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "bulk-fulfillment-sample.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  const downloadSampleExcel = () => {
    const ws = XLSX.utils.json_to_sheet(SAMPLE_ROWS);
    ws["!cols"] = [{ wch: 18 }, { wch: 24 }, { wch: 22 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bulk Fulfillment");

    XLSX.writeFile(wb, "bulk-fulfillment-sample.xlsx");
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setPreviewRows([]);
      setResultRows([]);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const cleanRows = json
        .map(normalizeRow)
        .map((row) => ({
          ...row,
          orderNumber: normalizeOrderNumber(row.orderNumber),
        }))
        .filter(
          (row) =>
            row.orderNumber || row.trackingNumber || row.courierName
        );

      setRows(cleanRows);

      if (!cleanRows.length) {
        toast.error("No rows found in file");
        return;
      }

      toast.success(`${cleanRows.length} rows uploaded`);
    } catch (error) {
      toast.error("File read failed");
    } finally {
      event.target.value = "";
    }
  };

  const handlePreview = async () => {
    if (!validRows.length) {
      toast.error("Valid rows nahi mile");
      return;
    }

    const res = await bulkFulfillPreview(validRows);

    if (!res?.success) {
      toast.error(res?.message || "Preview failed");
      return;
    }

    setPreviewRows(res.results || res.data || []);
    toast.success("Orders checked successfully");
  };

  const handleMarkFulfilled = async () => {
    if (!readyRows.length) {
      toast.error("No fulfillable orders found");
      return;
    }

    const confirm = window.confirm(
      `${readyRows.length} orders ko fulfilled mark karna hai?`
    );

    if (!confirm) return;

    const payload = readyRows.map((row) => ({
      orderNumber: row.orderNumber,
      trackingNumber: row.trackingNumber,
      courierName: row.courierName,
    }));

    const res = await bulkMarkFulfilled(payload);

    if (!res?.success) {
      toast.error(res?.message || "Bulk fulfillment failed");
      return;
    }

    setResultRows(res.results || []);
    toast.success(`${res.fulfilled || 0} orders fulfilled`);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-4 text-black sm:p-6">
      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
              Shopify Orders
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Bulk Fulfillment Marker
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              CSV/XLSX upload karo, orders validate karo, preview check karo,
              then bulk fulfilled mark karo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadSampleCsv}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Download CSV
            </button>

            <button
              onClick={downloadSampleExcel}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Download Excel
            </button>

            <label className="cursor-pointer rounded-xl bg-black px-4 py-2 text-sm font-medium text-white">
              Upload CSV/XLSX
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Card label="Uploaded" value={rows.length} />
          <Card label="Valid" value={validRows.length} />
          <Card label="Invalid" value={invalidRows.length} />
          <Card label="Ready" value={readyRows.length} dark />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={handlePreview}
          disabled={!validRows.length || bulkFulfillPreviewLoading}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
        >
          {bulkFulfillPreviewLoading ? "Checking..." : "Check / Validate Orders"}
        </button>

        <button
          onClick={handleMarkFulfilled}
          disabled={!readyRows.length || bulkFulfillMarking}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {bulkFulfillMarking ? "Marking..." : "Bulk Mark Fulfilled"}
        </button>
      </div>

      {resultRows.length ? (
        <ResultTable rows={resultRows} />
      ) : previewRows.length ? (
        <PreviewTable rows={previewRows} />
      ) : (
        <UploadTable rows={rows} />
      )}
    </div>
  );
}

function UploadTable({ rows }) {
  return (
    <Table title="Uploaded File Data">
      <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
        <tr>
          <th className="px-4 py-3">Order Number</th>
          <th className="px-4 py-3">Tracking Number</th>
          <th className="px-4 py-3">Courier Name</th>
          <th className="px-4 py-3">Validation</th>
        </tr>
      </thead>

      <tbody>
        {rows.length ? (
          rows.map((row, index) => {
            const isValid =
              row.orderNumber && row.trackingNumber && row.courierName;

            return (
              <tr key={index} className="border-t border-gray-100">
                <td className="px-4 py-3 font-semibold">{row.orderNumber || "-"}</td>
                <td className="px-4 py-3">{row.trackingNumber || "-"}</td>
                <td className="px-4 py-3">{row.courierName || "-"}</td>
                <td className="px-4 py-3">
                  <Badge ok={isValid}>
                    {isValid ? "Valid" : "Missing Fields"}
                  </Badge>
                </td>
              </tr>
            );
          })
        ) : (
          <Empty text="CSV ya Excel upload karo." colSpan={4} />
        )}
      </tbody>
    </Table>
  );
}

function PreviewTable({ rows }) {
  return (
    <Table title="Double Check Preview">
      <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
        <tr>
          <th className="px-4 py-3">Order</th>
          <th className="px-4 py-3">Customer</th>
          <th className="px-4 py-3">Tracking</th>
          <th className="px-4 py-3">Courier</th>
          <th className="px-4 py-3">Items</th>
          <th className="px-4 py-3">Shopify Status</th>
          <th className="px-4 py-3">Validation</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="border-t border-gray-100 align-top">
            <td className="px-4 py-3 font-semibold">
              {row.order?.name || row.orderNumber}
            </td>

            <td className="px-4 py-3">
              <div className="font-medium">
                {row.order?.customerName || "-"}
              </div>
              <div className="text-xs text-gray-500">
                {row.order?.customerEmail || ""}
              </div>
            </td>

            <td className="px-4 py-3">{row.trackingNumber}</td>
            <td className="px-4 py-3">{row.courierName}</td>

            <td className="px-4 py-3">
              <div className="max-w-[360px] space-y-1">
                {(row.order?.items || []).map((item, i) => (
                  <div key={i} className="text-xs text-gray-600">
                    {item.title} × {item.quantity}
                    {item.sku ? ` · ${item.sku}` : ""}
                  </div>
                ))}
              </div>
            </td>

            <td className="px-4 py-3">
              {row.order?.displayFulfillmentStatus || "-"}
            </td>

            <td className="px-4 py-3">
              <Badge ok={row.canFulfill}>
                {row.canFulfill ? "Ready" : row.reason || "Issue"}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function ResultTable({ rows }) {
  return (
    <Table title="Fulfillment Result">
      <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
        <tr>
          <th className="px-4 py-3">Order</th>
          <th className="px-4 py-3">Tracking</th>
          <th className="px-4 py-3">Courier</th>
          <th className="px-4 py-3">Result</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="border-t border-gray-100">
            <td className="px-4 py-3 font-semibold">
              {row.orderName || row.orderNumber}
            </td>
            <td className="px-4 py-3">{row.trackingNumber}</td>
            <td className="px-4 py-3">{row.courierName}</td>
            <td className="px-4 py-3">
              <Badge ok={row.success}>
                {row.success ? "Fulfilled" : row.message || "Failed"}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function Table({ title, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">{children}</table>
      </div>
    </div>
  );
}

function Card({ label, value, dark = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        dark ? "border-black bg-black text-white" : "border-gray-200 bg-gray-50"
      }`}
    >
      <p
        className={`text-xs uppercase tracking-wide ${
          dark ? "text-gray-300" : "text-gray-500"
        }`}
      >
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Badge({ children, ok }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}
    >
      {children}
    </span>
  );
}

function Empty({ text, colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-gray-500">
        {text}
      </td>
    </tr>
  );
}
