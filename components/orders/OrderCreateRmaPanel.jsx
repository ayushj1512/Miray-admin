"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Repeat2, Info } from "lucide-react";
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

export default function OrderCreateRmaPanel({ order, onCreated }) {
  const { createRma, loading } = useRmaStore();

  const items = useMemo(
    () => (Array.isArray(order?.items) ? order.items : []),
    [order?.items]
  );

  const [type, setType] = useState("return");
  const [reason, setReason] = useState("other");
  const [refundPreference, setRefundPreference] = useState("source");
  const [note, setNote] = useState("");

  const [qtyByLine, setQtyByLine] = useState({});
  const [exchangeSizeByLine, setExchangeSizeByLine] = useState({});

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
  }, [order?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedLines = useMemo(() => {
    const out = [];

    for (const [lineId, q] of Object.entries(qtyByLine || {})) {
      const qty = num(q);
      if (qty > 0) out.push({ lineId, quantity: qty });
    }

    return out;
  }, [qtyByLine]);

  const canSubmit = selectedLines.length > 0;

  const reset = () => {
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
      onCreated?.();
    } catch (e) {
      toast.error(e?.message || "Failed to create RMA");
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-base font-semibold flex items-center gap-2">
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
            className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-black/10"
          >
            <option value="return">Return</option>
            <option value="exchange">Exchange (Size only)</option>
          </select>

          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-black/10"
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
            className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold hover:bg-gray-50"
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
              className="sm:ml-auto min-w-[230px] px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-black/10"
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
        <div className="mt-3 flex items-start gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-3">
          <Info size={14} className="mt-0.5" />
          <div>
            Exchange rule: <b>same product</b>, only size XS/S/M/L/XL, and only{" "}
            <b>one line item</b> per request.
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-500 border-b border-gray-100">
            <tr>
              <th className="py-3 px-3 text-left font-semibold">Item</th>
              <th className="py-3 px-3 text-left font-semibold">LineId</th>
              <th className="py-3 px-3 text-left font-semibold">Bought</th>
              <th className="py-3 px-3 text-left font-semibold">Req Qty</th>
              {type === "exchange" ? (
                <th className="py-3 px-3 text-left font-semibold">New Size</th>
              ) : null}
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
                <tr key={`${lid}-${idx}`} className="hover:bg-gray-50 transition">
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={thumb || "/placeholder.png"}
                        alt={title}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                      />

                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate max-w-[420px]">
                          {title}
                        </p>
                        <p className="text-xs text-gray-500">
                          SKU: {sku} • Current size:{" "}
                          {(currentSize || "-").toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-3 text-gray-700">{lid || "-"}</td>

                  <td className="py-4 px-3 font-semibold text-gray-900">
                    {bought}
                  </td>

                  <td className="py-4 px-3">
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
                      className="w-24 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    />
                  </td>

                  {type === "exchange" ? (
                    <td className="py-4 px-3">
                      <select
                        value={exchangeSizeByLine?.[lid] || ""}
                        onChange={(e) =>
                          setExchangeSizeByLine((p) => ({
                            ...(p || {}),
                            [lid]: e.target.value,
                          }))
                        }
                        className="w-40 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-black/10"
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
                  ) : null}
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
          className="mt-2 px-3 py-3 rounded-lg bg-gray-50 border border-gray-200 w-full h-24 text-sm outline-none focus:ring-2 focus:ring-black/10"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason details / note..."
        />
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <button
          onClick={submit}
          disabled={!canSubmit || loading}
          className="px-6 py-2.5 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition"
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