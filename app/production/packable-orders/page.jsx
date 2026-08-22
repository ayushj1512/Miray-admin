"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { RefreshCw, Search } from "lucide-react";

import useAdminProductionStore from "@/store/adminProductionStore";
import ProcessingTab from "./processingtab";
import PackedTab from "./packedtab";

const BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || ""
).replace(/\/+$/, "");

const API = `${BASE_URL}/api/orders`;

const getLabelUrl = (order = {}) =>
  order?.shipment?.labelUrl ||
  order?.shipment?.shiprocket?.labelUrl ||
  order?.shipment?.xpressbees?.labelUrl ||
  order?.shipment?.eshipz?.labelUrl ||
  "";

export default function PackableOrdersPage() {
  const router = useRouter();

  const {
    packableOrders = [],
    packableSummary = {},
    packablePagination = {},
    loadingPackableOrders,
    fetchPackableOrders,
  } = useAdminProductionStore();

  const [q, setQ] = useState("");
  const [statusTab, setStatusTab] =
    useState("processing");
  const [syncStatus, setSyncStatus] =
    useState("all");
  const [limit, setLimit] = useState(50);

  const page = Number(
    packablePagination?.page || 1
  );

  const pages = Number(
    packablePagination?.pages || 1
  );

  const load = async (overrides = {}) =>
    fetchPackableOrders({
      q,
      syncStatus,
      fulfillmentStatus: statusTab,
      page,
      limit,
      ...overrides,
    });

  useEffect(() => {
    fetchPackableOrders({
      page: 1,
      limit: 50,
      syncStatus: "all",
      fulfillmentStatus: "processing",
    });
  }, []); // eslint-disable-line

  const changeTab = async (tab) => {
    setStatusTab(tab);

    await load({
      fulfillmentStatus: tab,
      page: 1,
    });
  };

  const search = async (e) => {
    e.preventDefault();

    await load({
      q,
      fulfillmentStatus: statusTab,
      page: 1,
    });
  };

  const changeSync = async (value) => {
    setSyncStatus(value);

    await load({
      syncStatus: value,
      fulfillmentStatus: statusTab,
      page: 1,
    });
  };

  const openInvoice = (order) => {
    if (!order?.orderNumber) return;

    window.open(
      `${API}/by-number/${encodeURIComponent(
        order.orderNumber
      )}/invoice`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openLabel = (order) => {
    const url = getLabelUrl(order);

    if (!url) {
      return toast.error("Label not available");
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const PaginationBar = () => (
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm">
    <span className="text-xs text-zinc-500">
      Page {page} of {pages} ·{" "}
      {packablePagination?.total || 0} orders
    </span>

    <div className="flex items-center gap-2">
      <select
        value={limit}
        onChange={async (e) => {
          const nextLimit = Number(e.target.value);

          setLimit(nextLimit);

          await load({
            fulfillmentStatus: statusTab,
            page: 1,
            limit: nextLimit,
          });
        }}
        className="rounded-xl bg-zinc-100 px-3 py-2 text-xs outline-none"
      >
        {[50, 100, 200, 500].map((value) => (
          <option key={value} value={value}>
            {value} / page
          </option>
        ))}
      </select>

      <button
        disabled={
          page <= 1 ||
          loadingPackableOrders
        }
        onClick={() =>
          load({
            fulfillmentStatus: statusTab,
            page: page - 1,
            limit,
          })
        }
        className="rounded-xl bg-zinc-100 px-3 py-2 text-xs disabled:opacity-40"
      >
        Previous
      </button>

      <button
        disabled={
          page >= pages ||
          loadingPackableOrders
        }
        onClick={() =>
          load({
            fulfillmentStatus: statusTab,
            page: page + 1,
            limit,
          })
        }
        className="rounded-xl bg-zinc-950 px-3 py-2 text-xs text-white disabled:opacity-40"
      >
        Next
      </button>
    </div>
  </div>
);

  return (
  <main className="min-h-screen bg-zinc-50 px-3 py-5 md:px-6">
  <div className="mx-auto max-w-[1600px] space-y-4">
    {/* HEADER */}
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950">
          Packable Orders
        </h1>

        <p className="mt-1 text-xs text-zinc-500">
          Verify, pack and sync warehouse orders.
        </p>
      </div>

      <button
        onClick={() =>
          load({
            fulfillmentStatus: statusTab,
            page,
            limit,
          })
        }
        disabled={loadingPackableOrders}
        className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        <RefreshCw
          size={15}
          className={
            loadingPackableOrders
              ? "animate-spin"
              : ""
          }
        />
        Refresh
      </button>
    </div>

    {/* TABS */}
    <div className="inline-flex rounded-xl bg-zinc-200/60 p-1">
      {[
        ["processing", "Processing"],
        ["packed", "Packed"],
      ].map(([value, label]) => (
        <button
          key={value}
          onClick={() => changeTab(value)}
          className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
            statusTab === value
              ? "bg-white text-zinc-950 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          {label}
        </button>
      ))}
    </div>

    {/* METRICS */}
    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
      {[
        [
          statusTab === "processing"
            ? "Packable"
            : "Packed",
          packableSummary?.totalPackable || 0,
        ],
        [
          "Synced",
          packableSummary?.synced || 0,
        ],
        [
          "Mismatch",
          packableSummary?.mismatched || 0,
        ],
        [
          "Booked",
          packableSummary?.booked || 0,
        ],
        [
          "Label Ready",
          packableSummary?.labelReady || 0,
        ],
      ].map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl bg-white p-3 shadow-sm"
        >
          <div className="text-xs text-zinc-500">
            {label}
          </div>

          <div className="mt-1 text-xl font-semibold text-zinc-950">
            {value}
          </div>
        </div>
      ))}
    </div>

    {/* SEARCH */}
    <div className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm md:flex-row">
      <form
        onSubmit={search}
        className="flex flex-1 gap-2"
      >
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />

          <input
            value={q}
            onChange={(e) =>
              setQ(e.target.value)
            }
            placeholder="Order, customer, product code..."
            className="w-full rounded-xl bg-zinc-100 py-2.5 pl-9 pr-3 text-sm outline-none"
          />
        </div>

        <button className="rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white">
          Search
        </button>
      </form>

      {statusTab === "processing" && (
        <select
          value={syncStatus}
          onChange={(e) =>
            changeSync(e.target.value)
          }
          className="rounded-xl bg-zinc-100 px-3 py-2.5 text-sm outline-none"
        >
          <option value="all">
            All Sync Status
          </option>
          <option value="synced">
            Synced
          </option>
          <option value="mismatch">
            Mismatch
          </option>
        </select>
      )}
    </div>

    {/* TAB CONTENT */}
    {loadingPackableOrders ? (
      <div className="rounded-2xl bg-white p-10 text-center text-sm text-zinc-500">
        Loading orders...
      </div>
    ) : statusTab === "processing" ? (
      <ProcessingTab
        orders={packableOrders}
        router={router}
        reload={() =>
          load({
            fulfillmentStatus: "processing",
            page,
            limit,
          })
        }
        openInvoice={openInvoice}
        openLabel={openLabel}
      />
    ) : (
      <PackedTab
        orders={packableOrders}
        router={router}
        reload={() =>
          load({
            fulfillmentStatus: "packed",
            page,
            limit,
          })
        }
        openInvoice={openInvoice}
        openLabel={openLabel}
      />
    )}

    {/* PAGINATION */}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <span className="text-xs text-zinc-500">
        Page {page} of {pages} ·{" "}
        {packablePagination?.total || 0} orders
      </span>

      <div className="flex items-center gap-2">
        <select
          value={limit}
          onChange={async (e) => {
            const nextLimit = Number(
              e.target.value
            );

            setLimit(nextLimit);

            await load({
              fulfillmentStatus: statusTab,
              page: 1,
              limit: nextLimit,
            });
          }}
          className="rounded-xl bg-zinc-100 px-3 py-2 text-xs outline-none"
        >
          {[50, 100, 200, 500].map(
            (value) => (
              <option
                key={value}
                value={value}
              >
                {value} / page
              </option>
            )
          )}
        </select>

        <button
          disabled={
            page <= 1 ||
            loadingPackableOrders
          }
          onClick={() =>
            load({
              fulfillmentStatus: statusTab,
              page: page - 1,
              limit,
            })
          }
          className="rounded-xl bg-zinc-100 px-3 py-2 text-xs disabled:opacity-40"
        >
          Previous
        </button>

        <button
          disabled={
            page >= pages ||
            loadingPackableOrders
          }
          onClick={() =>
            load({
              fulfillmentStatus: statusTab,
              page: page + 1,
              limit,
            })
          }
          className="rounded-xl bg-zinc-950 px-3 py-2 text-xs text-white disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</main>
  );
}