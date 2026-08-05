"use client";

import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  Download,
  Factory,
  Loader2,
  Package2,
  RefreshCcw,
  Search,
  TrendingUp,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { useAdminProductionStore } from "@/store/adminProductionStore";
import useTailorProductionJobStore from "@/store/useTailorProductionJobStore";

import ProductionDemandTable from "@/components/production/ProductionDemandTable";
import CreateProductionJobModal from "@/components/production/CreateProductionJobModal";
import QuantityCard from "@/components/production/QuantityCard";
import ProductionExcelDownload from "@/components/production/ProductionExcelDownload";

import {
  buildProductionExcelRows,
  buildProductionRows,
  getProductionSummary,
} from "./utils";

export default function AllProductionJobPage() {
  const {
    productionJobs = [],
    productionJobSummary = {},
    productionJobFilters = {},
    loadingProductionJobs,
    error,
    setProductionJobSearch,
    fetchProcessingOrderProducts,
  } = useAdminProductionStore();

  const {
    productionCoverage = [],
    coverageLoading,
    fetchProductionCoverage,
  } = useTailorProductionJobStore();

  const [selectedRow, setSelectedRow] =
    useState(null);

  const [refreshing, setRefreshing] =
    useState(false);

  const [exporting, setExporting] =
    useState(false);

  /*
   * Merge demand rows with current production coverage.
   */
  const rows = useMemo(
    () =>
      buildProductionRows(
        productionJobs,
        productionCoverage,
      ),
    [productionJobs, productionCoverage],
  );

  /*
   * Calculate total quantities currently in production
   * and quantities still remaining.
   */
  const coverageSummary = useMemo(
    () => getProductionSummary(rows),
    [rows],
  );

  const dashboardSummary = useMemo(() => {
    const ordered = Math.max(
      0,
      Number(
        productionJobSummary?.totalOrderedQty,
      ) || 0,
    );

    const reserved = Math.max(
      0,
      Number(
        productionJobSummary?.totalReservedQty,
      ) || 0,
    );

    const inProduction = Math.max(
      0,
      Number(
        coverageSummary?.inProduction,
      ) || 0,
    );

    const remaining = Math.max(
      0,
      Number(
        coverageSummary?.remaining,
      ) || 0,
    );

    const totalAssigned = rows.reduce(
      (total, row) =>
        total +
        Math.max(
          0,
          Number(
            row?.inProductionQty ??
            row?.productionQuantity ??
            row?.inProduction ??
            0,
          ) || 0,
        ),
      0,
    );

    const overAssigned = rows.reduce(
      (total, row) => {
        const demand = Math.max(
          0,
          Number(
            row?.demandQty ??
            row?.orderedQty ??
            row?.requiredQuantity ??
            0,
          ) || 0,
        );

        const assigned = Math.max(
          0,
          Number(
            row?.inProductionQty ??
            row?.productionQuantity ??
            row?.inProduction ??
            0,
          ) || 0,
        );

        return total + Math.max(
          0,
          assigned - demand,
        );
      },
      0,
    );

    return {
      ordered,
      reserved,
      inProduction,
      remaining,
      totalAssigned,
      overAssigned,
    };
  }, [
    rows,
    productionJobSummary,
    coverageSummary,
  ]);

  /*
   * Initial page load.
   */
  useEffect(() => {
    Promise.allSettled([
      fetchProcessingOrderProducts({
        page: 1,
        limit: 500,
        all: true,
      }), fetchProductionCoverage(),
    ]);
  }, [
    fetchProcessingOrderProducts,
    fetchProductionCoverage,
  ]);

  /*
   * Search products on Enter or search-button click.
   */
  const handleSearch = async (event) => {
    event?.preventDefault?.();

    try {
      await fetchProcessingOrderProducts({
        ...productionJobFilters,
        q: productionJobFilters?.q || "",
        page: 1,
        limit: 500,
        all: true,
      });
    } catch (searchError) {
      toast.error(
        searchError?.message ||
        "Unable to search production demand.",
      );
    }
  };

  /*
   * Reload both demand and active production coverage.
   */
  const handleRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);

    try {
      await Promise.all([
        fetchProcessingOrderProducts({
          ...productionJobFilters,
          limit: 500,
          all: true,
        }),
        fetchProductionCoverage(),
      ]);

      toast.success(
        "Production demand refreshed.",
      );
    } catch (refreshError) {
      toast.error(
        refreshError?.message ||
        "Unable to refresh production demand.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  /*
   * Refresh data after a production job is created.
   */
  const handleJobCreated = async () => {
    await Promise.allSettled([
      fetchProcessingOrderProducts({
        ...productionJobFilters,
      }),
      fetchProductionCoverage(),
    ]);
  };

  /*
   * Export all currently loaded/searched rows.
   * Pagination does not affect the Excel export.
   */
  const handleExcelDownload = async () => {
    if (!rows.length) {
      toast.error(
        "No production demand available to export.",
      );

      return;
    }

    if (exporting) return;

    setExporting(true);

    try {
      const XLSX = await import("xlsx");

      const excelRows =
        buildProductionExcelRows(rows);

      const worksheet =
        XLSX.utils.json_to_sheet(excelRows);

      const workbook =
        XLSX.utils.book_new();

      /*
       * Set sensible Excel column widths.
       */
      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 32 },
        { wch: 16 },

        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },

        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 20 },

        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },

        { wch: 14 },
        { wch: 14 },
        { wch: 40 },
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Production Demand",
      );

      const today = new Date();

      const dateText = [
        today.getFullYear(),
        String(
          today.getMonth() + 1,
        ).padStart(2, "0"),
        String(today.getDate()).padStart(
          2,
          "0",
        ),
      ].join("-");

      XLSX.writeFile(
        workbook,
        `production-demand-${dateText}.xlsx`,
      );

      toast.success(
        `${rows.length} products exported successfully.`,
      );
    } catch (exportError) {
      console.error(
        "Production Excel export failed:",
        exportError,
      );

      toast.error(
        "Unable to export production demand.",
      );
    } finally {
      setExporting(false);
    }
  };

  const isPageLoading =
    loadingProductionJobs ||
    coverageLoading;

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 text-black sm:p-6 lg:p-8">
      {/* Header */}

      <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
              <Factory className="h-3.5 w-3.5" />

              Production Control
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              Production Planning & Job Tracking
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
              Review product demand, assigned production,
              received inventory and pending quantities.
              Production jobs may be assigned above current
              demand for advance manufacturing and stock
              planning.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}

            <form
              onSubmit={handleSearch}
              className="flex min-w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 sm:min-w-[320px]"
            >
              <Search className="h-4 w-4 shrink-0 text-zinc-400" />

              <input
                value={
                  productionJobFilters?.q || ""
                }
                onChange={(event) =>
                  setProductionJobSearch(
                    event.target.value,
                  )
                }
                placeholder="Search code or title..."
                className="w-full bg-transparent text-sm outline-none"
              />

              <button
                type="submit"
                disabled={loadingProductionJobs}
                className="text-xs font-semibold text-zinc-600 hover:text-black disabled:opacity-40"
              >
                Search
              </button>
            </form>

            {/* Refresh */}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={
                refreshing || isPageLoading
              }
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCcw
                className={[
                  "h-4 w-4",
                  refreshing
                    ? "animate-spin"
                    : "",
                ].join(" ")}
              />

              Refresh
            </button>

            {/* Excel */}

           <ProductionExcelDownload
  rows={rows}
  fileName="all-production-job-report"
/>
          </div>
        </div>
      </div>

      {/* Summary */}

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <QuantityCard
          label="Products"
          value={rows.length}
          icon={Package2}
        />

        <QuantityCard
          label="Ordered"
          value={dashboardSummary.ordered}
          icon={TrendingUp}
        />

        <QuantityCard
          label="Reserved"
          value={dashboardSummary.reserved}
          icon={CheckCircle2}
        />

        <QuantityCard
          label="Assigned"
          value={dashboardSummary.totalAssigned}
          icon={Factory}
        />

        <QuantityCard
          label="Remaining Demand"
          value={dashboardSummary.remaining}
          icon={Boxes}
          emphasis
        />

        <QuantityCard
          label="Advance Production"
          value={dashboardSummary.overAssigned}
          icon={Package2}
        />
      </div>

      {/* Error */}

      {error && (
        <div className="mt-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <span>{error}</span>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Product Production Matrix
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Click any product row to view
              size-wise demand, assigned production,
              received inventory and linked production
              jobs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-zinc-600">
              Demand is informational
            </span>

            <span className="rounded-full border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-white">
              Over-assignment allowed
            </span>
          </div>
        </div>
      </div>

      {/* Table + client-side pagination */}
      <ProductionDemandTable
        rows={rows}
        loading={isPageLoading} coverageLoading={coverageLoading}
        expandable
        showProductionDetails
        allowOverAssignment
        onCreateJob={(row) =>
          setSelectedRow(row)
        }
      />


      {/* Create production job modal */}

      {selectedRow && (
        <CreateProductionJobModal
          row={selectedRow}
          allowOverAssignment
          onClose={() =>
            setSelectedRow(null)
          }
          onCreated={handleJobCreated}
        />
      )}
    </div>
  );
}