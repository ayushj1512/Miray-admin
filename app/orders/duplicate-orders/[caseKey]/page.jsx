"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ImageOff,
  Loader2,
  Package2,
  Phone,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useOrderStore } from "@/store/orderStore";

/* =========================================================
   HELPERS
========================================================= */

const safe = (value) =>
  String(value ?? "").trim();

const normalizePhone = (value) =>
  safe(value).replace(/\D/g, "").slice(-10);

const formatStatus = (value) =>
  safe(value).replaceAll("_", " ") || "-";

const fmtDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const money = (value) =>
  Number(value || 0).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  );

/* =========================================================
   PRODUCT HELPERS
========================================================= */

const getItemCode = (item) =>
  safe(
    item?.productSnapshot?.productCode ||
      item?.productCode ||
      item?.sku
  ).toUpperCase();

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
  Number(
    item?.quantity ||
      item?.qty ||
      1
  );

const getItemImage = (item) => {
  const snapshot =
    item?.productSnapshot || {};

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

/* =========================================================
   CASE KEY
========================================================= */

const buildCaseKey = (group) => {
  const phone = normalizePhone(
    group?.phone
  );

  const codes = [
    ...(group?.productCodes || []),
  ]
    .map((code) =>
      safe(code).toUpperCase()
    )
    .filter(Boolean)
    .sort();

  return `${phone}::${codes.join("|")}`;
};

const decodeCaseKey = (value) => {
  try {
    return decodeURIComponent(
      safe(value)
    );
  } catch {
    return safe(value);
  }
};

/* =========================================================
   STATUS STYLE
========================================================= */

const getStatusStyle = (status) => {
  const value = safe(
    status
  ).toLowerCase();

  const map = {
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
    map[value] ||
    "bg-neutral-100 text-neutral-600 ring-1 ring-inset ring-neutral-200"
  );
};

const getRisk = (orders = []) => {
  const statuses = orders.map(
    (order) =>
      safe(
        order?.fulfillmentStatus
      ).toLowerCase()
  );

  if (
    statuses.includes("shipped")
  ) {
    return {
      title: "Critical duplicate case",
      description:
        "At least one matching order has already been shipped.",
      className:
        "bg-red-600 text-white",
    };
  }

  if (
    statuses.includes("packed")
  ) {
    return {
      title: "Urgent duplicate case",
      description:
        "At least one matching order is already packed.",
      className:
        "bg-red-50 text-red-700",
    };
  }

  return {
    title: "Duplicate requires review",
    description:
      "Same mobile number and same exact product-code set detected.",
    className:
      "bg-amber-50 text-amber-700",
  };
};

/* =========================================================
   IMAGE
========================================================= */

function ProductImage({
  src,
  alt,
}) {
  const [failed, setFailed] =
    useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-300">
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || "Product"}
      loading="lazy"
      onError={() =>
        setFailed(true)
      }
      className="h-20 w-16 shrink-0 rounded-md object-cover"
    />
  );
}

/* =========================================================
   ORDER CARD
========================================================= */

function OrderCard({
  order,
  index,
  onOpen,
  onCancel,
  cancelling,
}) {
  const status = safe(
    order?.fulfillmentStatus
  ).toLowerCase();

  const cancelled =
    status === "cancelled" ||
    order?.cancellation
      ?.isCancelled === true;

  return (
    <div
      className={`rounded-lg bg-white ${
        ["packed", "shipped"].includes(
          status
        )
          ? "ring-2 ring-red-200"
          : "ring-1 ring-neutral-200"
      }`}
    >
      {/* HEADER */}

      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 px-3 py-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">
              #
              {order?.orderNumber ||
                "-"}
            </span>

            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-neutral-500">
              Order {index + 1}
            </span>
          </div>

          <div className="mt-0.5 text-[10px] text-neutral-400">
            {fmtDate(
              order?.createdAt ||
                order?.orderDate
            )}
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded px-2 py-1 text-[10px] font-semibold capitalize ${getStatusStyle(
              order?.fulfillmentStatus
            )}`}
          >
            {formatStatus(
              order?.fulfillmentStatus
            )}
          </span>

          <button
            type="button"
            onClick={() =>
              onOpen?.(order)
            }
            className="inline-flex h-7 items-center gap-1 rounded-md bg-neutral-100 px-2 text-[10px] font-semibold hover:bg-neutral-200"
          >
            Open
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* INFO */}

      <div className="grid grid-cols-2 gap-2 border-b border-neutral-100 px-3 py-2.5 sm:grid-cols-4">
        <Info
          label="Amount"
          value={`₹${money(
            order?.finalPayable
          )}`}
        />

        <Info
          label="Payment"
          value={
            order?.paymentMethod ||
            "-"
          }
        />

        <Info
          label="Payment Status"
          value={
            order?.paymentStatus ||
            "-"
          }
        />

        <Info
          label="Confirmed"
          value={
            order?.isConfirmed
              ? "Yes"
              : "No"
          }
        />
      </div>

      {/* PRODUCTS */}

      <div className="space-y-2 p-3">
        {(order?.items || []).map(
          (item, itemIndex) => {
            const code =
              getItemCode(item);

            const title =
              getItemTitle(item);

            const size =
              getItemSize(item);

            const qty =
              getItemQty(item);

            const image =
              getItemImage(item);

            return (
              <div
                key={
                  item?._id ||
                  `${code}-${itemIndex}`
                }
                className="flex gap-3 rounded-md bg-neutral-50 p-2"
              >
                <ProductImage
                  src={image}
                  alt={title || code}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {code && (
                      <span className="rounded bg-black px-1.5 py-0.5 font-mono text-[9px] font-semibold text-white">
                        {code}
                      </span>
                    )}

                    {size && (
                      <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-bold ring-1 ring-neutral-200">
                        Size {size}
                      </span>
                    )}

                    <span className="text-[10px] text-neutral-500">
                      Qty {qty}
                    </span>
                  </div>

                  <div className="mt-1 text-xs font-semibold">
                    {title ||
                      "Product"}
                  </div>

                  <div className="mt-1 text-[10px] text-neutral-400">
                    Size is displayed for
                    review only. Duplicate
                    matching uses product
                    codes.
                  </div>
                </div>
              </div>
            );
          }
        )}

        {!order?.items?.length && (
          <div className="text-xs text-neutral-400">
            Product details
            unavailable.
          </div>
        )}
      </div>

      {/* ACTION */}

      {!cancelled && (
        <div className="flex justify-end border-t border-neutral-100 px-3 py-2">
          <button
            type="button"
            disabled={cancelling}
            onClick={() =>
              onCancel?.(order)
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {cancelling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}

            Cancel Duplicate
          </button>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-[9px] font-medium uppercase tracking-wide text-neutral-400">
        {label}
      </div>

      <div className="mt-0.5 truncate text-xs font-semibold capitalize">
        {value || "-"}
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function DuplicateCasePage() {
  const router = useRouter();
  const params = useParams();

  const rawCaseKey =
    params?.caseKey;

  const caseKey =
    decodeCaseKey(rawCaseKey);

  const duplicateAlerts =
    useOrderStore(
      (state) =>
        state.duplicateAlerts
    );

  const duplicateLoading =
    useOrderStore(
      (state) =>
        state.duplicateLoading
    );

  const fetchDuplicateOrderAlerts =
    useOrderStore(
      (state) =>
        state.fetchDuplicateOrderAlerts
    );

  const cancelOrder =
    useOrderStore(
      (state) =>
        state.cancelOrder
    );

  const [cancellingId, setCancellingId] =
    useState("");

  /* =========================================================
     LOAD
  ========================================================= */

  const load = async () => {
    try {
      await fetchDuplicateOrderAlerts();
    } catch (error) {
      console.error(
        "Duplicate case fetch error:",
        error
      );

      toast.error(
        error?.message ||
          "Failed to load duplicate case"
      );
    }
  };

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseKey]);

  /* =========================================================
     FIND CASE
  ========================================================= */

  const group = useMemo(() => {
    if (!caseKey) return null;

    return (
      (duplicateAlerts || []).find(
        (item) =>
          buildCaseKey(item) ===
          caseKey
      ) || null
    );
  }, [
    duplicateAlerts,
    caseKey,
  ]);

  const orders = useMemo(() => {
    if (!group) return [];

    return [
      ...(group?.orders || []),
    ].sort((a, b) => {
      const aDate = new Date(
        a?.createdAt ||
          a?.orderDate ||
          0
      ).getTime();

      const bDate = new Date(
        b?.createdAt ||
          b?.orderDate ||
          0
      ).getTime();

      return aDate - bDate;
    });
  }, [group]);

  const risk = useMemo(
    () => getRisk(orders),
    [orders]
  );

  /* =========================================================
     CANCEL
  ========================================================= */

  const handleCancel = async (
    order
  ) => {
    if (!order?._id) return;

    const orderNumber =
      order?.orderNumber ||
      order?._id;

    const confirmed =
      window.confirm(
        `Cancel duplicate order #${orderNumber}?\n\nThis will use the normal order cancellation flow.`
      );

    if (!confirmed) return;

    const reason =
      window.prompt(
        "Cancellation reason:",
        "Duplicate order"
      );

    if (reason === null) return;

    try {
      setCancellingId(
        String(order._id)
      );

      await cancelOrder(
        order._id,
        safe(reason) ||
          "Duplicate order",
        {
          cancelledBy: "admin",
          notifyCustomer: true,
        }
      );

      toast.success(
        `Order #${orderNumber} cancelled`
      );

      await load();
    } catch (error) {
      toast.error(
        error?.message ||
          "Failed to cancel order"
      );
    } finally {
      setCancellingId("");
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (
    duplicateLoading &&
    !group
  ) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-neutral-50">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading duplicate case...
        </div>
      </div>
    );
  }

  /* =========================================================
     NOT FOUND
  ========================================================= */

  if (!group) {
    return (
      <div className="min-h-screen bg-neutral-50 p-4">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/orders/duplicate-orders"
            )
          }
          className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-neutral-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Duplicate Orders
        </button>

        <div className="rounded-lg bg-white p-8 text-center ring-1 ring-neutral-200">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />

          <h1 className="mt-3 text-base font-semibold">
            Case not found
          </h1>

          <p className="mt-1 text-xs text-neutral-500">
            This duplicate may have
            already been handled or one
            of the matching orders may
            have been cancelled.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/orders/duplicate-orders"
              )
            }
            className="mt-4 rounded-md bg-black px-3 py-2 text-xs font-semibold text-white"
          >
            Back to Duplicate Orders
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-neutral-50 text-black">
      <div className="w-full space-y-3 px-3 py-3 sm:px-4">
        {/* TOP */}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/orders/duplicate-orders"
              )
            }
            className="inline-flex h-8 items-center gap-1 rounded-md bg-white px-2.5 text-xs font-semibold ring-1 ring-neutral-200 hover:bg-neutral-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <div>
            <h1 className="text-lg font-semibold">
              Duplicate Case
            </h1>

            <p className="text-[11px] text-neutral-500">
              Review matching orders and
              take the required action.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={
              duplicateLoading
            }
            className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md bg-white px-2.5 text-xs font-semibold ring-1 ring-neutral-200 hover:bg-neutral-100 disabled:opacity-50"
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
        </div>

        {/* RISK */}

        <div
          className={`flex items-start gap-2 rounded-lg px-3 py-2.5 ${risk.className}`}
        >
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />

          <div>
            <div className="text-xs font-bold">
              {risk.title}
            </div>

            <div className="mt-0.5 text-[11px] opacity-80">
              {risk.description}
            </div>
          </div>
        </div>

        {/* MATCH REASON */}

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-3 ring-1 ring-neutral-200">
            <div className="flex items-center gap-1 text-[10px] font-medium uppercase text-neutral-400">
              <Phone className="h-3 w-3" />
              Mobile
            </div>

            <div className="mt-1 text-sm font-bold">
              {group?.phone || "-"}
            </div>
          </div>

          <div className="rounded-lg bg-white p-3 ring-1 ring-neutral-200">
            <div className="flex items-center gap-1 text-[10px] font-medium uppercase text-neutral-400">
              <Package2 className="h-3 w-3" />
              Matching Products
            </div>

            <div className="mt-1 flex flex-wrap gap-1">
              {(group?.productCodes || []).map(
                (code) => (
                  <span
                    key={code}
                    className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] font-bold"
                  >
                    {code}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="rounded-lg bg-white p-3 ring-1 ring-neutral-200">
            <div className="text-[10px] font-medium uppercase text-neutral-400">
              Orders in Case
            </div>

            <div className="mt-1 text-sm font-bold">
              {orders.length}
            </div>
          </div>
        </div>

        {/* IMPORTANT */}

        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

          <span>
            Duplicate detection is based
            on the same mobile number +
            same exact product-code set.
            Size and quantity are shown
            below only for manual review.
          </span>
        </div>

        {/* ORDERS */}

        <div className="grid items-start gap-3 lg:grid-cols-2">
          {orders.map(
            (order, index) => (
              <OrderCard
                key={order?._id}
                order={order}
                index={index}
                cancelling={
                  cancellingId ===
                  String(order?._id)
                }
                onOpen={(item) =>
                  router.push(
                    `/orders/${item._id}`
                  )
                }
                onCancel={
                  handleCancel
                }
              />
            )
          )}
        </div>

        {/* DECISION PLACEHOLDER */}

        <div className="rounded-lg bg-white p-3 ring-1 ring-neutral-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-neutral-500" />

            <div>
              <div className="text-xs font-semibold">
                Case Decision
              </div>

              <div className="text-[10px] text-neutral-500">
                Persistent review actions
                will be stored here.
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled
              title="Backend review state required"
              className="h-8 rounded-md bg-emerald-100 px-3 text-xs font-semibold text-emerald-700 opacity-60"
            >
              Mark Valid Order
            </button>

            <button
              type="button"
              disabled
              title="Backend review state required"
              className="h-8 rounded-md bg-neutral-100 px-3 text-xs font-semibold text-neutral-500 opacity-60"
            >
              Resolve / No Action
            </button>
          </div>

          <p className="mt-2 text-[10px] text-neutral-400">
            Cancel Duplicate is already
            functional. Valid/Resolved
            requires persistent backend
            review state so the case does
            not appear again after
            refresh.
          </p>
        </div>
      </div>
    </div>
  );
}