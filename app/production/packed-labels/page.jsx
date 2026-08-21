"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  PackageCheck,
  RefreshCw,
} from "lucide-react";

import LabelsAvailableTab from "@/components/packed-labels/LabelsAvailableTab";
import LabelsMissingTab from "@/components/packed-labels/LabelsMissingTab";

import { useOrderStore } from "@/store/orderStore";
import { useShiprocketStore } from "@/store/ShipRocketStore";

const TABS = {
  AVAILABLE: "available",
  MISSING: "missing",
};

const normalizeSingleResult = (data, orderId) => {
  const result =
    data?.result ||
    data?.shipment ||
    data ||
    {};

  return {
    ...result,
    orderId: String(
      result?.orderId || orderId
    ),
    success: data?.success !== false,
    message:
      result?.message ||
      data?.message ||
      "Shiprocket details repaired successfully",
  };
};

const normalizeErrorResult = (
  error,
  orderId
) => ({
  orderId: String(orderId),
  success: false,
  code:
    error?.code ||
    error?.payload?.code ||
    "SHIPROCKET_REPAIR_FAILED",
  message:
    error?.message ||
    error?.payload?.message ||
    "Unable to repair Shiprocket details",
});

export default function PackedLabelsPage() {
  const [activeTab, setActiveTab] =
    useState(TABS.AVAILABLE);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(200);

  const [message, setMessage] =
    useState("");

  const [repairResults, setRepairResults] =
    useState([]);

  const [
    packageUpdatingOrderId,
    setPackageUpdatingOrderId,
  ] = useState(null);

  const {
    packedOrderLabels,
    packedOrderLabelsSummary,
    loading,
    downloadingMergedLabels,
    error,
    fetchPackedOrderLabels,
    downloadMergedLabels,
  } = useOrderStore();

  const {
    repairLoading,
    repairingOrderId,
    repairError,
    packageUpdateLoading,
    packageUpdateError,
    repairShipment,
    repairMissingShipments,
    updatePackage,
    clearRepairError,
    clearPackageUpdate,
  } = useShiprocketStore();

  const orders = Array.isArray(
    packedOrderLabels
  )
    ? packedOrderLabels
    : [];
  const availableOrders =
    activeTab === TABS.AVAILABLE ? orders : [];

  const missingOrders =
    activeTab === TABS.MISSING ? orders : [];

  const loadOrders = async () => {
    try {
      await fetchPackedOrderLabels({
        labelStatus:
          activeTab === TABS.AVAILABLE
            ? "available"
            : "missing",
        page,
        limit,
      });
    } catch (err) {
      setMessage(err?.message || "Failed to load packed orders");
    }
  };

  useEffect(() => {
    loadOrders();
  }, [
    fetchPackedOrderLabels,
    activeTab,
    page,
    limit,
  ]);

  const setOrderResult = (
    orderId,
    result
  ) => {
    setRepairResults((current) => [
      ...current.filter(
        (item) =>
          String(item?.orderId) !==
          String(orderId)
      ),
      result,
    ]);
  };

  const downloadSelected = async (
    orderIds
  ) => {
    setMessage("");

    try {
      await downloadMergedLabels({
        orderIds,
      });

      setMessage(
        `${orderIds.length} label${orderIds.length === 1 ? "" : "s"
        } downloaded in one PDF.`
      );
    } catch (err) {
      setMessage(
        err?.message ||
        "Failed to download labels"
      );
    }
  };

  const downloadAll = async () => {
    setMessage("");

    try {
      await downloadMergedLabels({
        allPackedWithLabels: true,
      });

      setMessage(
        "All available labels downloaded in one PDF."
      );
    } catch (err) {
      setMessage(
        err?.message ||
        "Failed to download all labels"
      );
    }
  };

  const repairOrder = async (
    orderId,
    { reload = true } = {}
  ) => {
    setMessage("");
    clearRepairError();

    try {
      const data = await repairShipment(
        orderId,
        {
          generateShippingLabel: true,
        }
      );

      const result =
        normalizeSingleResult(
          data,
          orderId
        );

      setOrderResult(orderId, result);
      setMessage(result.message);

      if (reload) {
        await loadOrders();
      }

      return result;
    } catch (err) {
      const result =
        normalizeErrorResult(
          err,
          orderId
        );

      setOrderResult(orderId, result);
      setMessage(result.message);

      return null;
    }
  };

  const updatePackageAndRepair = async (
    orderId,
    packageDetails
  ) => {
    setMessage("");
    setPackageUpdatingOrderId(
      String(orderId)
    );

    clearRepairError();
    clearPackageUpdate?.();

    try {
      await updatePackage(
        orderId,
        packageDetails
      );

      setMessage(
        "Package updated. Assigning AWB and generating label..."
      );

      const result = await repairOrder(
        orderId,
        {
          reload: false,
        }
      );

      if (!result) return false;

      setMessage(
        "Package updated, AWB assigned and label generated."
      );

      await loadOrders();
      return true;
    } catch (err) {
      const result =
        normalizeErrorResult(
          err,
          orderId
        );

      setOrderResult(orderId, result);

      setMessage(
        err?.message ||
        "Unable to update package details"
      );

      return false;
    } finally {
      setPackageUpdatingOrderId(null);
    }
  };

  const repairAll = async (
    orderIds
  ) => {
    if (!orderIds.length) {
      setMessage(
        "No missing orders available for repair."
      );
      return;
    }

    setMessage("");
    clearRepairError();

    try {
      const data =
        await repairMissingShipments({
          orderIds,
          limit: orderIds.length,
          generateShippingLabel: true,
        });

      const results = Array.isArray(
        data?.results
      )
        ? data.results
        : [];

      setRepairResults(results);

      const successful =
        data?.summary?.successful ??
        results.filter(
          (item) => item?.success
        ).length;

      const failed =
        data?.summary?.failed ??
        results.filter(
          (item) => !item?.success
        ).length;

      setMessage(
        `${successful} repaired, ${failed} failed.`
      );

      await loadOrders();
    } catch (err) {
      setMessage(
        err?.message ||
        "Bulk Shiprocket repair failed"
      );
    }
  };

  const displayError =
    error ||
    repairError ||
    packageUpdateError;

  const busy =
    loading ||
    repairLoading ||
    packageUpdateLoading ||
    downloadingMergedLabels;

  return (
    <main className="min-h-screen bg-zinc-50 p-4 text-zinc-950 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <PackageCheck className="h-6 w-6" />

              <h1 className="text-xl font-semibold">
                Packed Order Labels
              </h1>
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              Download labels, update package
              dimensions and repair Shiprocket
              shipments.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            disabled={busy}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium hover:bg-zinc-50 disabled:opacity-40"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""
                }`}
            />

            Refresh
          </button>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Packed Orders"
            value={
              packedOrderLabelsSummary
                ?.totalPacked ??
              orders.length
            }
          />

          <SummaryCard
            label="Labels Available"
            value={
              packedOrderLabelsSummary
                ?.totalWithLabels ??
              availableOrders.length
            }
            success
          />

          <SummaryCard
            label="Labels Missing"
            value={
              packedOrderLabelsSummary
                ?.totalWithoutLabels ??
              missingOrders.length
            }
            warning
          />
        </section>

        <Pagination
  page={page}
  limit={limit}
  totalPages={packedOrderLabelsSummary?.totalPages || 1}
  onPageChange={setPage}
  onLimitChange={(value) => {
    setLimit(value);
    setPage(1);
  }}
/>

        <section className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <TabButton
              active={
                activeTab ===
                TABS.AVAILABLE
              }
              onClick={() => {
                setActiveTab(TABS.AVAILABLE);
                setPage(1);
              }}
              label="Labels Available"
            count={
  packedOrderLabelsSummary?.totalWithLabels ?? 0
}
            />

            <TabButton
              active={
                activeTab ===
                TABS.MISSING
              }
              onClick={() => {
                setActiveTab(TABS.MISSING);
                setPage(1);
              }}
              label="Not Available"
count={
  packedOrderLabelsSummary?.totalWithoutLabels ?? 0
}              warning
            />
          </div>
        </section>

        {(message || displayError) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${displayError
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
          >
            {displayError || message}
          </div>
        )}

        {activeTab ===
          TABS.AVAILABLE ? (
          <LabelsAvailableTab
            orders={availableOrders}
            loading={loading}
            downloading={
              downloadingMergedLabels
            }
            onDownloadSelected={
              downloadSelected
            }
            onDownloadAll={downloadAll}
            onMessage={setMessage}
          />
        ) : (
          <LabelsMissingTab
            orders={missingOrders}
            loading={loading}
            repairingOrderId={
              repairingOrderId
                ? String(
                  repairingOrderId
                )
                : null
            }
            repairLoading={
              repairLoading
            }
            packageUpdatingOrderId={
              packageUpdatingOrderId
            }
            packageUpdateLoading={
              packageUpdateLoading
            }
            repairResults={
              repairResults
            }
            onRepairOrder={
              repairOrder
            }
            onRepairAll={repairAll}
            onUpdatePackage={
              updatePackageAndRepair
            }
            onMessage={setMessage}
          />
        )}
      </div>

      <Pagination
        page={page}
        limit={limit}
        totalPages={
          packedOrderLabelsSummary?.totalPages || 1
        }
        onPageChange={setPage}
        onLimitChange={(value) => {
          setLimit(value);
          setPage(1);
        }}
      />
    </main>
  );
}
function Pagination({
  page,
  limit,
  totalPages,
  onPageChange,
  onLimitChange,
}) {
  const pages = Math.max(totalPages, 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Rows
        </span>

        <select
          value={limit}
          onChange={(e) =>
            onLimitChange(Number(e.target.value))
          }
          className="h-9 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700 outline-none transition hover:bg-zinc-100 focus:border-zinc-400"
        >
          {[100, 200, 500].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-9 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        <div className="flex h-9 min-w-28 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white">
          {page}
          <span className="mx-2 text-zinc-500">/</span>
          {pages}
        </div>

        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="h-9 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
  warning = false,
}) {
  const activeStyle = warning
    ? "bg-amber-900 text-white"
    : "bg-zinc-950 text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition ${active
          ? activeStyle
          : "text-zinc-600 hover:bg-zinc-100"
        }`}
    >
      {warning ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Check className="h-4 w-4" />
      )}

      {label}

      <span
        className={`rounded-full px-2 py-0.5 text-xs ${active
            ? "bg-white/15 text-white"
            : warning
              ? "bg-amber-100 text-amber-800"
              : "bg-zinc-100 text-zinc-600"
          }`}
      >
        {Number(count || 0)}
      </span>
    </button>
  );
}

function SummaryCard({
  label,
  value,
  warning = false,
  success = false,
}) {
  const border = warning
    ? "border-amber-300"
    : success
      ? "border-emerald-200"
      : "border-zinc-200";

  const valueStyle = warning
    ? "text-amber-700"
    : success
      ? "text-emerald-700"
      : "text-zinc-950";

  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm ${border}`}
    >
      <p className="text-sm text-zinc-500">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-semibold ${valueStyle}`}
      >
        {Number(value || 0)}
      </p>
    </div>
  );
}