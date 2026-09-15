"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Download,
  RefreshCw,
  Search,
  Smartphone,
  Package2,
  ImageOff,
  ArrowRight,
  CircleAlert,
  ShieldAlert,
} from "lucide-react";
import { useOrderStore } from "@/store/orderStore";

const safe = (v) => String(v ?? "").trim();

const fmtDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatStatus = (value) =>
  safe(value).replaceAll("_", " ") || "-";

/* =========================================================
   PRODUCT HELPERS
========================================================= */

const buildCaseKey = (group) => {
  const phone = String(
    group?.phone || ""
  )
    .replace(/\D/g, "")
    .slice(-10);

  const codes = [
    ...(group?.productCodes || []),
  ]
    .map((code) =>
      String(code || "")
        .trim()
        .toUpperCase()
    )
    .filter(Boolean)
    .sort();

  return `${phone}::${codes.join("|")}`;
};

const getItemCode = (item) =>
  safe(
    item?.productSnapshot?.productCode ||
      item?.productCode ||
      item?.sku
  );

const getItemTitle = (item) =>
  safe(
    item?.productSnapshot?.title ||
      item?.productSnapshot?.name ||
      item?.productTitle ||
      item?.title
  );

const getItemSize = (item) =>
  safe(
    item?.selectedSize ||
      item?.size ||
      item?.variantSnapshot?.size ||
      item?.variant?.size
  );

const getItemQty = (item) =>
  Number(item?.quantity || item?.qty || 1);

const getItemImage = (item) => {
  const snapshot = item?.productSnapshot || {};

  const candidates = [
    snapshot?.image,
    snapshot?.imageUrl,
    snapshot?.thumbnail,
    snapshot?.featuredImage,
    snapshot?.primaryImage,
    snapshot?.images?.[0]?.url,
    snapshot?.images?.[0]?.src,
    snapshot?.images?.[0],
    item?.image,
    item?.imageUrl,
    item?.thumbnail,
  ];

  return safe(
    candidates.find(
      (value) =>
        typeof value === "string" &&
        value.trim()
    )
  );
};

const getProductsText = (order) =>
  (order?.items || [])
    .map((item) => {
      const code = getItemCode(item);
      const title = getItemTitle(item);
      const size = getItemSize(item);
      const qty = getItemQty(item);

      return [
        code,
        title,
        size ? `Size ${size}` : "",
        `Qty ${qty}`,
      ]
        .filter(Boolean)
        .join(" | ");
    })
    .join(" ; ");

/* =========================================================
   STATUS
========================================================= */

const statusStyle = (status) => {
  const value = safe(status).toLowerCase();

  const styles = {
    processing:
      "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",

    packed:
      "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",

    shipped:
      "bg-red-100 text-red-800 ring-1 ring-inset ring-red-300",

    delivered:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",

    cancelled:
      "bg-neutral-100 text-neutral-500 ring-1 ring-inset ring-neutral-200",

    rto:
      "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",

    returned:
      "bg-neutral-100 text-neutral-600 ring-1 ring-inset ring-neutral-200",
  };

  return (
    styles[value] ||
    "bg-neutral-100 text-neutral-600 ring-1 ring-inset ring-neutral-200"
  );
};

const getGroupRisk = (group) => {
  const statuses = (group?.orders || []).map((order) =>
    safe(order?.fulfillmentStatus).toLowerCase()
  );

  if (statuses.includes("shipped")) {
    return {
      label: "Critical",
      className: "bg-red-600 text-white",
    };
  }

  if (statuses.includes("packed")) {
    return {
      label: "Urgent",
      className: "bg-red-50 text-red-700",
    };
  }

  if (statuses.includes("processing")) {
    return {
      label: "Review",
      className: "bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Check",
    className: "bg-neutral-100 text-neutral-600",
  };
};

/* =========================================================
   IMAGE
========================================================= */

function ProductImage({ src, alt }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-14 w-11 shrink-0 items-center justify-center rounded bg-white text-neutral-300">
        <ImageOff className="h-4 w-4" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || "Product"}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-14 w-11 shrink-0 rounded object-cover"
    />
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function DuplicateOrders() {
  const router = useRouter();

  const {
    duplicateAlerts,
    duplicateLoading,
    error,
    fetchDuplicateOrderAlerts,
  } = useOrderStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const loadDuplicates = async () => {
    try {
      await fetchDuplicateOrderAlerts();
    } catch (err) {
      console.error(
        "fetchDuplicateOrderAlerts error:",
        err
      );
    }
  };

  useEffect(() => {
    loadDuplicates();
  }, []);

  /* =========================================================
     FILTER
  ========================================================= */

  const availableStatuses = useMemo(() => {
    return [
      ...new Set(
        (duplicateAlerts || [])
          .flatMap((group) => group?.orders || [])
          .map((order) =>
            safe(
              order?.fulfillmentStatus
            ).toLowerCase()
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [duplicateAlerts]);

  const filteredGroups = useMemo(() => {
    const q = safe(search).toLowerCase();

    return (duplicateAlerts || []).filter(
      (group) => {
        const orders = group?.orders || [];

        if (
          statusFilter !== "all" &&
          !orders.some(
            (order) =>
              safe(
                order?.fulfillmentStatus
              ).toLowerCase() === statusFilter
          )
        ) {
          return false;
        }

        if (!q) return true;

        const text = [
          group?.phone,
          ...(group?.productCodes || []),

          ...orders.flatMap((order) => [
            order?.orderNumber,
            order?.paymentMethod,
            order?.paymentStatus,
            order?.fulfillmentStatus,

            ...(order?.items || []).flatMap(
              (item) => [
                getItemCode(item),
                getItemTitle(item),
                getItemSize(item),
              ]
            ),
          ]),
        ]
          .map((v) => safe(v).toLowerCase())
          .join(" ");

        return text.includes(q);
      }
    );
  }, [
    duplicateAlerts,
    search,
    statusFilter,
  ]);

  const totalOrders = useMemo(
    () =>
      filteredGroups.reduce(
        (sum, group) =>
          sum +
          Number(
            group?.duplicateCount ||
              group?.orders?.length ||
              0
          ),
        0
      ),
    [filteredGroups]
  );

  const urgentGroups = useMemo(
    () =>
      filteredGroups.filter((group) =>
        (group?.orders || []).some((order) =>
          ["packed", "shipped"].includes(
            safe(
              order?.fulfillmentStatus
            ).toLowerCase()
          )
        )
      ).length,
    [filteredGroups]
  );

  /* =========================================================
     CASE NAVIGATION
  ========================================================= */

const openCase = (group) => {
  const caseKey = buildCaseKey(group);

  if (!caseKey) return;

  const url = `/orders/duplicate-orders/${encodeURIComponent(
    caseKey
  )}`;

  window.open(url, "_blank", "noopener,noreferrer");
};
  /* =========================================================
     EXCEL
  ========================================================= */

  const exportExcel = () => {
    if (!filteredGroups.length) return;

    const rows = [];

    filteredGroups.forEach(
      (group, groupIndex) => {
        (group?.orders || []).forEach(
          (order) => {
            rows.push({
              group: groupIndex + 1,
              phone: safe(group?.phone),

              duplicateCodes: (
                group?.productCodes || []
              ).join(", "),

              orderNumber: safe(
                order?.orderNumber
              ),

              products:
                getProductsText(order),

              paymentMethod: safe(
                order?.paymentMethod
              ),

              paymentStatus: safe(
                order?.paymentStatus
              ),

              fulfillmentStatus: safe(
                order?.fulfillmentStatus
              ),

              amount: Number(
                order?.finalPayable || 0
              ),

              createdAt: fmtDate(
                order?.createdAt ||
                  order?.orderDate
              ),
            });
          }
        );
      }
    );

    const escapeHtml = (value) =>
      String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");

    const tableRows = rows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.group)}</td>
            <td>${escapeHtml(row.phone)}</td>
            <td>${escapeHtml(row.duplicateCodes)}</td>
            <td>${escapeHtml(row.orderNumber)}</td>
            <td>${escapeHtml(row.products)}</td>
            <td>${escapeHtml(row.paymentMethod)}</td>
            <td>${escapeHtml(row.paymentStatus)}</td>
            <td>${escapeHtml(row.fulfillmentStatus)}</td>
            <td>${escapeHtml(row.amount)}</td>
            <td>${escapeHtml(row.createdAt)}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
        </head>

        <body>
          <table border="1">
            <thead>
              <tr>
                <th>Group</th>
                <th>Mobile</th>
                <th>Duplicate Product Codes</th>
                <th>Order Number</th>
                <th>Products / Size / Qty</th>
                <th>Payment Method</th>
                <th>Payment Status</th>
                <th>Fulfillment Status</th>
                <th>Amount</th>
                <th>Created At</th>
              </tr>
            </thead>

            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download = `duplicate-orders-${
      new Date()
        .toISOString()
        .split("T")[0]
    }.xls`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-neutral-50 text-black">
      <div className="w-full px-3 py-3 sm:px-4">
        {/* HEADER */}

        <div className="mb-3 flex flex-col gap-2 border-b border-neutral-200 pb-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />

              <h1 className="text-lg font-semibold">
                Duplicate Orders
              </h1>

              <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                {filteredGroups.length} groups
              </span>

              {urgentGroups > 0 && (
                <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {urgentGroups} urgent
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs text-neutral-500">
              Same mobile number + same exact
              product codes. Review each case
              before taking action.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDuplicates}
              disabled={duplicateLoading}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-medium hover:bg-neutral-100 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  duplicateLoading
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>

            <button
              onClick={exportExcel}
              disabled={
                !filteredGroups.length
              }
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-black px-2.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              Excel
            </button>
          </div>
        </div>

        {/* FILTERS */}

        <div className="mb-3 flex flex-col gap-2 md:flex-row">
          <div className="flex h-8 flex-1 items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5">
            <Search className="h-3.5 w-3.5 text-neutral-400" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search order, mobile, product, code, size..."
              className="w-full bg-transparent text-xs outline-none placeholder:text-neutral-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-xs outline-none"
          >
            <option value="all">
              All statuses
            </option>

            {availableStatuses.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {formatStatus(status)}
                </option>
              )
            )}
          </select>

          <div className="flex h-8 items-center gap-3 rounded-md border border-neutral-200 bg-white px-3 text-xs">
            <div className="flex items-center gap-1">
              <Smartphone className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-neutral-500">
                Groups
              </span>
              <b>
                {filteredGroups.length}
              </b>
            </div>

            <div className="h-4 w-px bg-neutral-200" />

            <div className="flex items-center gap-1">
              <Package2 className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-neutral-500">
                Orders
              </span>
              <b>{totalOrders}</b>
            </div>
          </div>
        </div>

        {/* INFO */}

        {urgentGroups > 0 && (
          <div className="mb-3 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            <ShieldAlert className="h-4 w-4 shrink-0" />

            <span>
              <b>{urgentGroups}</b>{" "}
              duplicate case
              {urgentGroups !== 1
                ? "s contain"
                : " contains"}{" "}
              packed or shipped orders and
              should be reviewed first.
            </span>
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* LOADING */}

        {duplicateLoading &&
          !filteredGroups.length && (
            <div className="py-14 text-center text-xs text-neutral-500">
              Checking duplicate orders...
            </div>
          )}

        {/* EMPTY */}

        {!duplicateLoading &&
          !filteredGroups.length && (
            <div className="rounded-md border border-neutral-200 bg-white py-14 text-center">
              <div className="text-sm font-medium">
                No duplicate orders found
              </div>

              <p className="mt-1 text-xs text-neutral-500">
                No matching mobile + product
                code combinations.
              </p>
            </div>
          )}

        {/* GROUPS */}

        <div className="space-y-2">
          {filteredGroups.map(
            (group, groupIndex) => {
              const risk =
                getGroupRisk(group);

              return (
                <div
                  key={`${group?.phone}-${groupIndex}`}
                  className="overflow-hidden rounded-md border border-neutral-200 bg-white"
                >
                  {/* GROUP HEADER */}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-neutral-100 bg-neutral-50 px-3 py-2">
                    <span className="text-[11px] font-semibold text-neutral-500">
                      #{groupIndex + 1}
                    </span>

                    <div className="flex items-center gap-1">
                      <Smartphone className="h-3 w-3 text-neutral-400" />

                      <span className="text-xs font-semibold">
                        {group?.phone ||
                          "-"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(
                        group?.productCodes ||
                        []
                      ).map((code) => (
                        <span
                          key={code}
                          className="rounded bg-neutral-200 px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                        >
                          {code}
                        </span>
                      ))}
                    </div>

                    <div className="ml-auto flex items-center gap-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${risk.className}`}
                      >
                        {risk.label}
                      </span>

                      <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                        {group?.duplicateCount ||
                          group?.orders
                            ?.length ||
                          0}{" "}
                        orders
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          openCase(group)
                        }
                        className="inline-flex h-7 items-center gap-1 rounded-md bg-black px-2.5 text-[10px] font-semibold text-white hover:bg-neutral-800"
                      >
                        Review Case
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* ORDERS */}

                  <div className="divide-y divide-neutral-100">
                    {(group?.orders || []).map(
                      (order) => (
                        <div
                          key={order?._id}
                          className="px-3 py-2 hover:bg-neutral-50"
                        >
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <div className="min-w-[80px] text-xs font-bold">
                              #
                              {order?.orderNumber ||
                                "-"}
                            </div>

                            <div className="text-[11px] text-neutral-500">
                              {fmtDate(
                                order?.createdAt ||
                                  order?.orderDate
                              )}
                            </div>

                            <div className="text-[11px] capitalize text-neutral-600">
                              {order?.paymentMethod ||
                                "-"}
                            </div>

                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize ${statusStyle(
                                order?.fulfillmentStatus
                              )}`}
                            >
                              {formatStatus(
                                order?.fulfillmentStatus
                              )}
                            </span>

                            {[
                              "packed",
                              "shipped",
                            ].includes(
                              safe(
                                order?.fulfillmentStatus
                              ).toLowerCase()
                            ) && (
                              <CircleAlert className="h-3.5 w-3.5 text-red-600" />
                            )}

                            <div className="ml-auto text-xs font-semibold">
                              ₹
                              {Number(
                                order?.finalPayable ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </div>
                          </div>

                          {/* PRODUCTS */}

                          <div className="mt-2 flex flex-wrap gap-2">
                            {(
                              order?.items || []
                            ).map(
                              (
                                item,
                                itemIndex
                              ) => {
                                const code =
                                  getItemCode(
                                    item
                                  );

                                const title =
                                  getItemTitle(
                                    item
                                  );

                                const size =
                                  getItemSize(
                                    item
                                  );

                                const qty =
                                  getItemQty(
                                    item
                                  );

                                const image =
                                  getItemImage(
                                    item
                                  );

                                return (
                                  <div
                                    key={
                                      item?._id ||
                                      `${code}-${itemIndex}`
                                    }
                                    className="flex min-w-[250px] max-w-[380px] flex-1 items-center gap-2 rounded-md bg-neutral-100 p-1.5"
                                  >
                                    <ProductImage
                                      src={
                                        image
                                      }
                                      alt={
                                        title ||
                                        code
                                      }
                                    />

                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {code && (
                                          <span className="font-mono text-[10px] font-bold text-neutral-600">
                                            {
                                              code
                                            }
                                          </span>
                                        )}

                                        {size && (
                                          <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-bold">
                                            {
                                              size
                                            }
                                          </span>
                                        )}

                                        {qty >
                                          1 && (
                                          <span className="text-[9px] font-medium text-neutral-500">
                                            ×
                                            {
                                              qty
                                            }
                                          </span>
                                        )}
                                      </div>

                                      <div
                                        title={
                                          title
                                        }
                                        className="mt-0.5 truncate text-[11px] font-semibold"
                                      >
                                        {title ||
                                          "Product"}
                                      </div>

                                      <div className="mt-0.5 text-[9px] text-neutral-400">
                                        Size:{" "}
                                        <span className="font-semibold text-neutral-600">
                                          {size ||
                                            "-"}
                                        </span>
                                        {" · "}
                                        Qty:{" "}
                                        <span className="font-semibold text-neutral-600">
                                          {
                                            qty
                                          }
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            )}

                            {!order?.items
                              ?.length && (
                              <span className="text-[10px] text-neutral-400">
                                Product details
                                unavailable
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}