"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  IndianRupee,
  FileClock,
  Tags,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import useFabricStore from "@/store/fabricStore";
import useFabricLogStore from "@/store/fabricLogStore";
import useFabricPriceLogStore from "@/store/fabricPriceLogStore";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

export default function FabricDetailPage() {
  const params = useParams();
  const id = params?.id;

  const {
    selectedFabric,
    loading,
    fetchFabricById,
    clearSelectedFabric,
  } = useFabricStore();

  const {
    fabricLogs,
    fetchFabricLogsByCode,
  } = useFabricLogStore();

  const {
    latestPrice,
    priceHistory,
    fetchLatestPriceByFabric,
    fetchPriceHistory,
  } = useFabricPriceLogStore();

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const res = await fetchFabricById(id);
      const fabric = res?.data;

      if (fabric?.code) {
        fetchFabricLogsByCode(fabric.code, { page: 1, limit: 10 });
      }

      fetchLatestPriceByFabric(id);
      fetchPriceHistory(id, { page: 1, limit: 10 });
    };

    load();

    return () => clearSelectedFabric();
  }, [id]);

  const handleExportDetail = () => {
    if (!selectedFabric) return;

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        {
          Code: selectedFabric.code,
          Name: selectedFabric.name,
          Category: selectedFabric.category,
          Unit: selectedFabric.unit,
          Stock: selectedFabric.currentStock,
          Status: selectedFabric.status,
          Movement: selectedFabric.movementStatus,
          GSM: selectedFabric.gsm || "",
          Width: selectedFabric.width || "",
          Notes: selectedFabric.notes || "",
          "Latest Price": latestPrice?.newPrice || "",
          "Product Codes":
            selectedFabric.associatedProductCodes?.join(", ") || "",
          "Created At": formatDate(selectedFabric.createdAt),
        },
      ]),
      "Fabric Detail"
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        fabricLogs.map((item) => ({
          Date: formatDate(item.logDate),
          Action: item.action,
          Type: item.type,
          Quantity: item.quantity,
          Previous: item.previousStock,
          New: item.newStock,
          Note: item.note || item.description || "",
          By: item.createdBy,
        }))
      ),
      "Stock Logs"
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        priceHistory.map((item) => ({
          Date: formatDate(item.effectiveFrom),
          OldPrice: item.oldPrice,
          NewPrice: item.newPrice,
          ChangeAmount: item.changeAmount,
          ChangePercent: item.changePercent,
          Reason: item.reason,
          Note: item.note,
          By: item.createdBy,
        }))
      ),
      "Price Logs"
    );

    XLSX.writeFile(wb, `${selectedFabric.code}-fabric-detail.xlsx`);
  };

  if (loading && !selectedFabric) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6 text-neutral-500">
        Loading fabric...
      </div>
    );
  }

  if (!selectedFabric) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6">
        <Link href="/fabrics" className="text-sm font-medium">
          Back to fabrics
        </Link>
        <p className="mt-4 text-neutral-500">Fabric not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 text-neutral-950 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <Link
              href="/fabrics"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-950"
            >
              <ArrowLeft size={16} />
              Back to fabrics
            </Link>

            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {selectedFabric.name}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {selectedFabric.code} · {selectedFabric.category}
            </p>
          </div>

          <button
            onClick={handleExportDetail}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-100"
          >
            <Download size={16} />
            Export Detail
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Stat
            icon={Package}
            title="Current Stock"
            value={`${selectedFabric.currentStock || 0} ${selectedFabric.unit}`}
          />
          <Stat
            icon={IndianRupee}
            title="Latest Price"
            value={latestPrice ? money(latestPrice.newPrice) : "-"}
          />
          <Stat
            icon={Tags}
            title="Products"
            value={selectedFabric.associatedProductsCount || 0}
          />
          <Stat
            icon={FileClock}
            title="Movement"
            value={selectedFabric.movementStatus}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Fabric Details</h2>

            <div className="mt-4 space-y-3 text-sm">
              <Info label="Code" value={selectedFabric.code} />
              <Info label="Name" value={selectedFabric.name} />
              <Info label="Category" value={selectedFabric.category} />
              <Info label="Unit" value={selectedFabric.unit} />
              <Info label="GSM" value={selectedFabric.gsm || "-"} />
              <Info label="Width" value={selectedFabric.width || "-"} />
              <Info label="Status" value={selectedFabric.status} />
              <Info
                label="Last Stock Update"
                value={formatDate(selectedFabric.lastStockUpdatedAt)}
              />
              <Info label="Created" value={formatDate(selectedFabric.createdAt)} />
            </div>

            {selectedFabric.imageLink ? (
              <div className="mt-5 overflow-hidden rounded-2xl bg-neutral-100">
                <img
                  src={selectedFabric.imageLink}
                  alt={selectedFabric.name}
                  className="h-56 w-full object-cover"
                />
              </div>
            ) : null}

            {selectedFabric.notes ? (
              <div className="mt-5 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
                {selectedFabric.notes}
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold">Associated Product Codes</h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedFabric.associatedProductCodes?.length ? (
                  selectedFabric.associatedProductCodes.map((code) => (
                    <span
                      key={code}
                      className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium"
                    >
                      {code}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-neutral-500">
                    No product codes mapped.
                  </p>
                )}
              </div>
            </div>

            <TableCard title="Recent Stock Logs">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Previous</th>
                    <th className="px-4 py-3">New</th>
                    <th className="px-4 py-3">Note</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100">
                  {fabricLogs.length ? (
                    fabricLogs.map((log) => (
                      <tr key={log._id}>
                        <td className="px-4 py-3 text-neutral-500">
                          {formatDate(log.logDate)}
                        </td>
                        <td className="px-4 py-3">{log.type}</td>
                        <td className="px-4 py-3">{log.quantity}</td>
                        <td className="px-4 py-3">{log.previousStock}</td>
                        <td className="px-4 py-3 font-semibold">{log.newStock}</td>
                        <td className="px-4 py-3 text-neutral-500">
                          {log.note || log.description || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                        No stock logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableCard>

            <TableCard title="Recent Price Logs">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Old</th>
                    <th className="px-4 py-3">New</th>
                    <th className="px-4 py-3">Change</th>
                    <th className="px-4 py-3">Reason</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100">
                  {priceHistory.length ? (
                    priceHistory.map((item) => (
                      <tr key={item._id}>
                        <td className="px-4 py-3 text-neutral-500">
                          {formatDate(item.effectiveFrom)}
                        </td>
                        <td className="px-4 py-3">{money(item.oldPrice)}</td>
                        <td className="px-4 py-3 font-semibold">
                          {money(item.newPrice)}
                        </td>
                        <td className="px-4 py-3">
                          {money(item.changeAmount)} (
                          {Number(item.changePercent || 0).toFixed(2)}%)
                        </td>
                        <td className="px-4 py-3 text-neutral-500">
                          {item.reason || item.note || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                        No price logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, title, value }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-neutral-500">{title}</p>
        <Icon size={17} className="text-neutral-400" />
      </div>
      <p className="mt-3 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-100 pb-2">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function TableCard({ title, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 p-4">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}