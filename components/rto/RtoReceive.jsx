"use client";

import { useState } from "react";
import {
  Search,
  PackageCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CircleHelp,
  X,
} from "lucide-react";

import { useOrderStore } from "@/store/orderStore";

const normalizeOrderNumber = (value = "") => {
  const raw = String(value).trim().toUpperCase();
  if (!raw) return "";

  const digits = raw.replace(/\D/g, "");
  return digits ? `SHOP-${digits}` : raw;
};

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "";

export default function RtoReceive() {
  const fetchOrderByNumber = useOrderStore(
    (s) => s.fetchOrderByNumber
  );

  const markRtoReceived = useOrderStore(
    (s) => s.markRtoReceived
  );

  const loading = useOrderStore((s) => s.loading);

  const [search, setSearch] = useState("");
  const [order, setOrder] = useState(null);
  const [rows, setRows] = useState([]);
  const [remark, setRemark] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const alreadyReceived =
    order?.rtoReceived?.isReceived === true;

  /* ================= SEARCH ================= */

  const findOrder = async () => {
    const orderNumber = normalizeOrderNumber(search);
    if (!orderNumber) return;

    setSearch(orderNumber);

    try {
      const data = await fetchOrderByNumber(orderNumber);

      const savedItems =
        data?.rtoReceived?.items || [];

      setOrder(data);

      setRows(
        (data?.items || []).map((item) => {
          const saved = savedItems.find(
            (x) =>
              String(x.lineId) ===
              String(item.lineId)
          );

          return {
            lineId: item.lineId,
            correctQty: Number(
              saved?.correctQty || 0
            ),
            wrongQty: Number(
              saved?.wrongQty || 0
            ),
            damagedQty: Number(
              saved?.damagedQty || 0
            ),
            remark: saved?.remark || "",
          };
        })
      );

      setRemark(
        data?.rtoReceived?.remark || ""
      );
    } catch (error) {
      setOrder(null);
      setRows([]);
      setRemark("");

      alert(error.message || "Order not found");
    }
  };

  /* ================= CHECKBOX ================= */

  const toggleStatus = (index, key) => {
    if (alreadyReceived) return;

    setRows((current) =>
      current.map((row, i) => {
        if (i !== index) return row;

        const qty = Number(
          order?.items?.[index]?.quantity || 1
        );

        const checked =
          Number(row[key] || 0) > 0;

        return {
          ...row,
          correctQty: 0,
          wrongQty: 0,
          damagedQty: 0,
          [key]: checked ? 0 : qty,
        };
      })
    );
  };

  const updateItemRemark = (
    index,
    value
  ) => {
    if (alreadyReceived) return;

    setRows((current) =>
      current.map((row, i) =>
        i === index
          ? { ...row, remark: value }
          : row
      )
    );
  };

  /* ================= SUBMIT ================= */

  const submit = async () => {
    if (!order || alreadyReceived) return;

    try {
      await markRtoReceived({
        orderNumber: order.orderNumber,
        remark,
        items: rows,
      });

      alert("RTO received successfully");

      // refresh same order so saved data shows
      const refreshed =
        await fetchOrderByNumber(
          order.orderNumber
        );

      const savedItems =
        refreshed?.rtoReceived?.items || [];

      setOrder(refreshed);

      setRows(
        (refreshed?.items || []).map(
          (item) => {
            const saved =
              savedItems.find(
                (x) =>
                  String(x.lineId) ===
                  String(item.lineId)
              );

            return {
              lineId: item.lineId,
              correctQty: Number(
                saved?.correctQty || 0
              ),
              wrongQty: Number(
                saved?.wrongQty || 0
              ),
              damagedQty: Number(
                saved?.damagedQty || 0
              ),
              remark:
                saved?.remark || "",
            };
          }
        )
      );

      setRemark(
        refreshed?.rtoReceived?.remark ||
        ""
      );
    } catch (error) {
      alert(
        error.message ||
        "Failed to receive RTO"
      );
    }
  };

  const address =
    order?.shippingAddressSnapshot || {};

  const customerName =
    address.fullName ||
    order?.customerId?.name ||
    "-";

  const customerPhone =
    address.phone ||
    order?.customerId?.phone ||
    "-";

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4">

      {/* HEADER */}

      <div className="mb-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">
              Receive RTO
            </h1>

            <p className="text-xs text-gray-500">
              Verify parcel and restore correct inventory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {alreadyReceived && (
              <div className="text-right">
                <p className="text-xs font-semibold text-green-700">
                  ✓ RTO Received
                </p>

                <p className="text-[10px] text-gray-400">
                  {formatDate(order?.rtoReceived?.receivedAt)}
                </p>
              </div>
            )}

            <button
              onClick={() => setShowHelp(!showHelp)}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-[10px] font-semibold ${showHelp
                  ? "bg-[#800020] text-white"
                  : "bg-white text-[#800020] shadow-sm"
                }`}
            >
              <CircleHelp size={13} />
              How to Use
            </button>
          </div>
        </div>

        {showHelp && (
          <div className="mt-3 rounded-xl bg-[#800020]/[0.04] p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-[#800020]">
                  How to Receive an RTO
                </p>

                <p className="mt-0.5 text-[10px] text-gray-500">
                  Physically check the parcel before confirming.
                </p>
              </div>

              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-[#800020]"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-4">
              <Help
                n="01"
                title="Search Order"
                text="Enter SHOP order number and search."
              />

              <Help
                n="02"
                title="Check Product"
                text="Match product, size and quantity physically."
              />

              <Help
                n="03"
                title="Select Condition"
                text="Choose Correct, Wrong or Damaged."
              />

              <Help
                n="04"
                title="Receive RTO"
                text="Add remark if needed and confirm receipt."
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <Rule text="Correct → Inventory restored" />
              <Rule text="Wrong → No inventory" />
              <Rule text="Damaged → No inventory" />
              <Rule text="Unchecked → Missing" />
            </div>
          </div>
        )}
      </div>



      {/* SEARCH */}

      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value.toUpperCase()
            )
          }
          onKeyDown={(e) =>
            e.key === "Enter" &&
            findOrder()
          }
          placeholder="SHOP-4276"
          className="h-10 flex-1 rounded-lg bg-white px-3 text-sm font-medium outline-none shadow-sm"
        />

        <button
          onClick={findOrder}
          className="flex h-10 items-center gap-2 rounded-lg bg-[#800020] px-4 text-sm font-medium text-white"
        >
          <Search size={15} />
          Search
        </button>
      </div>

      {order && (
        <div className="mt-4 space-y-3">

          {/* ORDER INFO */}

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-white p-3 shadow-sm sm:grid-cols-4 lg:grid-cols-6">
            <Info
              label="Order"
              value={order.orderNumber}
            />

            <Info
              label="Customer"
              value={customerName}
            />

            <Info
              label="Phone"
              value={customerPhone}
            />

            <Info
              label="City"
              value={address.city}
            />

            <Info
              label="Payment"
              value={order.paymentMethod}
            />

            <Info
              label="Status"
              value={order.fulfillmentStatus}
            />
          </div>

          {/* ADDRESS */}

          <div className="rounded-xl bg-white px-3 py-2 text-xs shadow-sm">
            <span className="text-gray-400">
              Address:
            </span>{" "}
            <span className="font-medium">
              {[
                address.line1,
                address.line2,
                address.city,
                address.state,
                address.pincode,
              ]
                .filter(Boolean)
                .join(", ") || "-"}
            </span>
          </div>

          {/* ITEMS */}

          <div className="space-y-2">
            {(order.items || []).map(
              (item, index) => {
                const product =
                  item.productSnapshot || {};

                const row =
                  rows[index] || {};

                const received =
                  Number(
                    row.correctQty || 0
                  ) +
                  Number(
                    row.wrongQty || 0
                  ) +
                  Number(
                    row.damagedQty || 0
                  );

                const missing = Math.max(
                  0,
                  Number(
                    item.quantity || 0
                  ) - received
                );

                return (
                  <div
                    key={item.lineId}
                    className="rounded-xl bg-white p-3 shadow-sm"
                  >
                    <div className="flex gap-3">

                      {/* IMAGE */}

                      <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {product.thumbnail && (
                          <img
                            src={
                              product.thumbnail
                            }
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>

                      {/* DETAILS */}

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {product.title ||
                                "Product"}
                            </p>

                            <p className="mt-1 text-[11px] text-gray-500">
                              {product.productCode ||
                                "-"}{" "}
                              •{" "}
                              {item.variant?.sku ||
                                "-"}{" "}
                              • Size{" "}
                              {item.selectedSize ||
                                "-"}{" "}
                              • Qty{" "}
                              {item.quantity} •{" "}
                              {money(item.price)}
                            </p>
                          </div>

                          <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-semibold">
                            {received}/
                            {item.quantity}
                          </span>
                        </div>

                        {/* CONDITIONS */}

                        <div className="mt-3 grid grid-cols-4 gap-2">
                          <Condition
                            icon={CheckCircle2}
                            label="Correct"
                            checked={
                              Number(
                                row.correctQty ||
                                0
                              ) > 0
                            }
                            disabled={
                              alreadyReceived
                            }
                            onChange={() =>
                              toggleStatus(
                                index,
                                "correctQty"
                              )
                            }
                          />

                          <Condition
                            icon={XCircle}
                            label="Wrong"
                            checked={
                              Number(
                                row.wrongQty ||
                                0
                              ) > 0
                            }
                            disabled={
                              alreadyReceived
                            }
                            onChange={() =>
                              toggleStatus(
                                index,
                                "wrongQty"
                              )
                            }
                          />

                          <Condition
                            icon={
                              AlertTriangle
                            }
                            label="Damaged"
                            checked={
                              Number(
                                row.damagedQty ||
                                0
                              ) > 0
                            }
                            disabled={
                              alreadyReceived
                            }
                            onChange={() =>
                              toggleStatus(
                                index,
                                "damagedQty"
                              )
                            }
                          />

                          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                            <span className="text-[10px] text-gray-400">
                              Missing
                            </span>

                            <b className="text-sm">
                              {missing}
                            </b>
                          </div>
                        </div>

                        {/* ITEM REMARK */}

                        <input
                          value={
                            row.remark || ""
                          }
                          disabled={
                            alreadyReceived
                          }
                          onChange={(e) =>
                            updateItemRemark(
                              index,
                              e.target.value
                            )
                          }
                          placeholder="Item remark..."
                          className="mt-2 h-9 w-full rounded-lg bg-gray-50 px-3 text-xs outline-none disabled:text-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* BOTTOM */}

          <div className="flex gap-2 rounded-xl bg-white p-2 shadow-sm">
            <input
              value={remark}
              disabled={alreadyReceived}
              onChange={(e) =>
                setRemark(e.target.value)
              }
              placeholder="Warehouse remark..."
              className="h-10 flex-1 rounded-lg bg-gray-50 px-3 text-sm outline-none disabled:text-gray-600"
            />

            {alreadyReceived ? (
              <div className="flex h-10 items-center gap-2 rounded-lg bg-green-50 px-5 text-sm font-semibold text-green-700">
                <CheckCircle2 size={15} />
                Already Received
              </div>
            ) : (
              <button
                onClick={submit}
                disabled={loading}
                className="flex h-10 items-center gap-2 rounded-lg bg-[#800020] px-5 text-sm font-semibold text-white disabled:opacity-40"
              >
                <PackageCheck
                  size={15}
                />

                {loading
                  ? "Saving..."
                  : "Receive RTO"}
              </button>
            )}
          </div>
        </div>
      )}

      {!order && (
        <div className="py-20 text-center text-sm text-gray-400">
          Search an order to start.
        </div>
      )}
    </div>
  );
}

/* ================= UI ================= */

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-gray-400">
        {label}
      </p>

      <p className="truncate text-xs font-semibold capitalize">
        {value || "-"}
      </p>
    </div>
  );
}

function Condition({
  icon: Icon,
  label,
  checked,
  disabled,
  onChange,
}) {
  return (
    <label
      className={`flex items-center gap-2 rounded-lg px-3 py-2 ${checked
          ? "bg-[#800020]/10 text-[#800020]"
          : "bg-gray-50 text-gray-500"
        } ${disabled
          ? "cursor-default opacity-80"
          : "cursor-pointer"
        }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="h-4 w-4 accent-[#800020]"
      />

      <Icon size={12} />

      <span className="text-xs font-medium">
        {label}
      </span>
    </label>
  );
}

function Help({ n, title, text }) {
  return (
    <div className="flex gap-2 rounded-lg bg-white p-2.5">
      <span className="text-[9px] font-bold text-[#800020]">
        {n}
      </span>

      <div>
        <p className="text-[10px] font-semibold">
          {title}
        </p>

        <p className="mt-0.5 text-[9px] leading-4 text-gray-500">
          {text}
        </p>
      </div>
    </div>
  );
}

function Rule({ text }) {
  return (
    <span className="rounded-md bg-white px-2 py-1 text-[9px] font-medium text-gray-600">
      {text}
    </span>
  );
}