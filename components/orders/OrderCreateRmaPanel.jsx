"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Repeat2, Info, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRmaStore } from "@/store/useRmaStore";

const SIZE_OPTIONS = ["xs", "s", "m", "l", "xl"];

const REFUND_OPTIONS = [
  { value: "source", label: "Original Payment Method" },
  { value: "miray_credit", label: "Miray Credit" },
];

const s = (v) => (v == null ? "" : String(v));
const lower = (v) => s(v).trim().toLowerCase();
const num = (v, d = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
};

const labelize = (v) =>
  s(v || "source")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

const pickSize = (it) => {
  const attrs = Array.isArray(it?.variant?.attributes)
    ? it.variant.attributes
    : [];

  const byAttr =
    attrs.find((a) => lower(a?.key) === "size")?.value ||
    attrs.find((a) => lower(a?.attributeName) === "size")?.value ||
    "";

  return (
    lower(it?.selectedSize) ||
    lower(it?.size) ||
    lower(byAttr) ||
    lower(it?.productSnapshot?.size) ||
    ""
  );
};

const pickTitle = (it) => s(it?.productSnapshot?.title || it?.title || "-");

const pickSku = (it) =>
  s(it?.variant?.sku || it?.sku || it?.productSnapshot?.sku || "-");

const pickThumb = (it) =>
  s(
    it?.productSnapshot?.thumbnail ||
      it?.productSnapshot?.thumb ||
      (Array.isArray(it?.productSnapshot?.images)
        ? it.productSnapshot.images[0]
        : "") ||
      ""
  );

const getProductIdForLine = (order, lineId) => {
  const items = Array.isArray(order?.items) ? order.items : [];
  const it = items.find((x) => s(x?.lineId) === s(lineId));

  return (
    s(it?.productId?._id) ||
    s(it?.productId) ||
    s(it?.productSnapshot?.productId) ||
    ""
  );
};

const getExchangeSize = (rma) =>
  rma?.exchangeRequest?.attributes?.find((a) =>
    ["size", "sizes"].includes(lower(a?.key))
  )?.value || "";

export default function OrderCreateRmaPanel({ order, onCreated }) {
  const { createRma, fetchAllRmas, rmas, loading } = useRmaStore();

  const items = useMemo(
    () => (Array.isArray(order?.items) ? order.items : []),
    [order?.items]
  );

  const existingRma = useMemo(() => {
    if (!order?._id || !Array.isArray(rmas)) return null;

    return (
      rmas
        .filter((r) => String(r?.orderId) === String(order._id))
        .sort(
          (a, b) =>
            new Date(b?.createdAt || 0).getTime() -
            new Date(a?.createdAt || 0).getTime()
        )[0] || null
    );
  }, [rmas, order?._id]);

  const isRmaAlreadyCreated = Boolean(existingRma);

  const [type, setType] = useState("return");
  const [reason, setReason] = useState("other");
  const [refundPreference, setRefundPreference] = useState("source");
  const [note, setNote] = useState("");

  const [qtyByLine, setQtyByLine] = useState({});
  const [exchangeSizeByLine, setExchangeSizeByLine] = useState({});

  useEffect(() => {
    if (!Array.isArray(rmas) || rmas.length === 0) {
      fetchAllRmas?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = {};
    const ex = {};

    for (const it of items) {
      const lid = s(it?.lineId);
      if (!lid) continue;
      q[lid] = 0;
      ex[lid] = "";
    }

    setQtyByLine(q);
    setExchangeSizeByLine(ex);
    setType("return");
    setReason("other");
    setRefundPreference("source");
    setNote("");
  }, [order?._id, items]);

  const selectedLines = useMemo(() => {
    const out = [];

    for (const [lineId, q] of Object.entries(qtyByLine || {})) {
      const qty = num(q);
      if (qty > 0) out.push({ lineId, quantity: qty });
    }

    return out;
  }, [qtyByLine]);

  const canSubmit = selectedLines.length > 0 && !isRmaAlreadyCreated;

  const reset = () => {
    if (isRmaAlreadyCreated) return;

    const q = {};
    const ex = {};

    for (const it of items) {
      const lid = s(it?.lineId);
      if (!lid) continue;
      q[lid] = 0;
      ex[lid] = "";
    }

    setQtyByLine(q);
    setExchangeSizeByLine(ex);
    setReason("other");
    setRefundPreference("source");
    setNote("");
    setType("return");
  };

  const submit = async () => {
    if (isRmaAlreadyCreated) {
      return toast.error("RMA already created for this order");
    }

    if (!order?._id) return toast.error("Order missing");
    if (!canSubmit) return toast.error("Select quantity first");

    const payload = {
      type,
      reason,
      customerNote: note,
      items: selectedLines.map((x) => ({
        orderLineId: x.lineId,
        quantity: x.quantity,
      })),
    };

    if (type === "return") {
      payload.refundPreference = refundPreference || "source";
    }

    if (type === "exchange") {
      if (selectedLines.length !== 1) {
        return toast.error("Exchange: select only 1 line item");
      }

      const lineId = selectedLines[0].lineId;
      const productId = getProductIdForLine(order, lineId);

      if (!productId) return toast.error("productId missing for selected line");

      const newSize = lower(exchangeSizeByLine?.[lineId]);

      if (!newSize) return toast.error("Select new size");
      if (!SIZE_OPTIONS.includes(newSize)) {
        return toast.error("Only XS/S/M/L/XL allowed");
      }

      payload.exchangeTo = {
        productId,
        variantId: "",
        variantSku: "",
        note: `Size change to ${newSize.toUpperCase()}`,
        attributes: [{ key: "size", value: newSize }],
      };
    }

    try {
      await createRma(order._id, payload);
      toast.success("RMA created ✅");
      reset();
      await fetchAllRmas?.();
      onCreated?.();
    } catch (e) {
      toast.error(e?.message || "Failed to create RMA");
    }
  };

  if (isRmaAlreadyCreated) {
    const exchangeSize = getExchangeSize(existingRma);

    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-800">
            <Lock size={18} />
          </div>

          <div className="flex-1">
            <p className="text-base font-semibold text-amber-950">
              RMA already created
            </p>
            <p className="mt-1 text-sm text-amber-800">
              New return/exchange request is disabled for this order.
            </p>

            <div className="mt-4 grid gap-3 text-xs text-amber-950 sm:grid-cols-2 lg:grid-cols-4">
              <p>
                <b>RMA #:</b> {existingRma?.rmaNumber || "-"}
              </p>
              <p>
                <b>Type:</b> {labelize(existingRma?.type)}
              </p>
              <p>
                <b>Status:</b> {labelize(existingRma?.status)}
              </p>
              <p>
                <b>Reason:</b> {labelize(existingRma?.reason)}
              </p>

              {existingRma?.type === "exchange" && (
                <>
                  <p>
                    <b>Exchange SKU:</b>{" "}
                    {existingRma?.exchangeRequest?.variantSku || "-"}
                  </p>
                  <p>
                    <b>Requested Size:</b>{" "}
                    {exchangeSize ? s(exchangeSize).toUpperCase() : "-"}
                  </p>
                </>
              )}
            </div>

            {existingRma?.customerNote && (
              <p className="mt-3 text-xs text-amber-900">
                <b>Customer Note:</b> {existingRma.customerNote}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-base font-semibold">
          {type === "exchange" ? <Repeat2 size={18} /> : <RotateCcw size={18} />}
          Create RMA
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={type}
            onChange={(e) => {
              const next = e.target.value;
              setType(next);
              if (next === "exchange") setRefundPreference("source");
            }}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
          >
            <option value="return">Return</option>
            <option value="exchange">Exchange (Size only)</option>
          </select>

          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
          >
            <option value="other">Other</option>
            <option value="wrong_size">Size issue</option>
            <option value="damaged">Damaged</option>
            <option value="wrong_item">Wrong item</option>
            <option value="defective">Defective</option>
            <option value="quality_issue">Quality issue</option>
            <option value="changed_mind">Changed mind</option>
          </select>

          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {type === "return" ? (
        <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Refund Method
              </p>
              <p className="text-xs text-gray-500">
                Select how customer wants refund after approval.
              </p>
            </div>

            <select
              value={refundPreference}
              onChange={(e) => setRefundPreference(e.target.value)}
              className="min-w-[230px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 sm:ml-auto"
            >
              {REFUND_OPTIONS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Selected:{" "}
            <b className="text-gray-800">{labelize(refundPreference)}</b>
          </p>
        </div>
      ) : (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
          <Info size={14} className="mt-0.5" />
          <div>
            Exchange rule: <b>same product</b>, only size XS/S/M/L/XL, and only{" "}
            <b>one line item</b> per request.
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 text-gray-500">
            <tr>
              <th className="px-3 py-3 text-left font-semibold">Item</th>
              <th className="px-3 py-3 text-left font-semibold">Bought</th>
              <th className="px-3 py-3 text-left font-semibold">Req Qty</th>
              {type === "exchange" && (
                <th className="px-3 py-3 text-left font-semibold">New Size</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {items.map((it, idx) => {
              const lid = s(it?.lineId);
              const bought = num(it?.quantity, 0);
              const title = pickTitle(it);
              const sku = pickSku(it);
              const thumb = pickThumb(it);
              const currentSize = pickSize(it);

              return (
                <tr key={`${lid}-${idx}`} className="transition hover:bg-gray-50">
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={thumb || "/placeholder.png"}
                        alt={title}
                        className="h-12 w-12 rounded-xl border border-gray-100 object-cover"
                      />

                      <div className="min-w-0">
                        <p className="max-w-[420px] truncate font-semibold text-gray-900">
                          {title}
                        </p>
                        <p className="text-xs text-gray-500">
                          SKU: {sku} • Current size:{" "}
                          {(currentSize || "-").toUpperCase()}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Line: {lid || "-"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-4 font-semibold text-gray-900">
                    {bought}
                  </td>

                  <td className="px-3 py-4">
                    <input
                      type="number"
                      min={0}
                      max={bought}
                      value={qtyByLine?.[lid] ?? 0}
                      onChange={(e) => {
                        const v = num(e.target.value, 0);
                        setQtyByLine((p) => ({
                          ...(p || {}),
                          [lid]: Math.max(0, Math.min(bought, v)),
                        }));
                      }}
                      className="w-24 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    />
                  </td>

                  {type === "exchange" && (
                    <td className="px-3 py-4">
                      <select
                        value={exchangeSizeByLine?.[lid] || ""}
                        onChange={(e) =>
                          setExchangeSizeByLine((p) => ({
                            ...(p || {}),
                            [lid]: e.target.value,
                          }))
                        }
                        className="w-40 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                      >
                        <option value="">Select size</option>
                        {SIZE_OPTIONS.map((sz) => (
                          <option
                            key={sz}
                            value={sz}
                            disabled={lower(currentSize) === sz}
                          >
                            {sz.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <label className="text-xs font-semibold text-gray-600">
          Customer Note (optional)
        </label>
        <textarea
          className="mt-2 h-24 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason details / note..."
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          onClick={submit}
          disabled={!canSubmit || loading}
          className="rounded-lg bg-black px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              Creating...
            </span>
          ) : type === "exchange" ? (
            "Create Exchange RMA"
          ) : (
            "Create Return RMA"
          )}
        </button>

        <div className="text-xs text-gray-500">
          Selected lines: <b>{selectedLines.length}</b>
          {type === "exchange" ? (
            <span className="ml-2">(must be 1)</span>
          ) : (
            <span className="ml-2">
              Refund: <b>{labelize(refundPreference)}</b>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
