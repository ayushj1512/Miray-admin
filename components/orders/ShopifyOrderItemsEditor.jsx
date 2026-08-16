"use client";

import {
  Loader2,
  Minus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ShopifyOrderItemsEditor({
  order,
  onRefresh,
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [product, setProduct] = useState(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const items = useMemo(
    () => (Array.isArray(order?.items) ? order.items : []),
    [order?.items]
  );

  if (order?.source !== "shopify") return null;

  const editOrder = async (operations) => {
    if (!order?._id || !operations?.length) return;

    setSaving(true);

    try {
      const res = await fetch(
        `${API}/api/shopify/orders/${order._id}/items`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            operations,
            notifyCustomer: false,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.message || "Unable to update Shopify order"
        );
      }

      toast.success("Order updated on Shopify ✅");

      setOpen(false);
      setCode("");
      setProduct(null);

      await onRefresh?.();

      // webhook sync may arrive slightly after API response
      setTimeout(() => {
        onRefresh?.();
      }, 1000);
    } catch (error) {
      toast.error(
        error?.message || "Unable to update Shopify order"
      );
    } finally {
      setSaving(false);
    }
  };

  const searchProduct = async () => {
    const value = code.trim();

    if (!value) {
      toast.error("Enter product code");
      return;
    }

    setSearching(true);
    setProduct(null);

    try {
      const res = await fetch(
        `${API}/api/shopify/products/code/${encodeURIComponent(
          value
        )}`
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.message || "Product not found"
        );
      }

      setProduct(data?.data || null);
    } catch (error) {
      toast.error(error?.message || "Product not found");
    } finally {
      setSearching(false);
    }
  };

  const handleQuantityChange = (
    item,
    nextQuantity
  ) => {
    const sku =
      item?.variant?.sku ||
      item?.productSnapshot?.sku ||
      "";

    if (!sku) {
      toast.error("SKU missing for this item");
      return;
    }

    editOrder([
      {
        type: "set_quantity",
        sku,
        quantity: nextQuantity,
      },
    ]);
  };

  const handleRemove = (item) => {
    const sku =
      item?.variant?.sku ||
      item?.productSnapshot?.sku ||
      "";

    if (!sku) {
      toast.error("SKU missing for this item");
      return;
    }

    const confirmed = window.confirm(
      `Remove ${item?.productSnapshot?.title || "this product"} from order?`
    );

    if (!confirmed) return;

    editOrder([
      {
        type: "remove",
        sku,
      },
    ]);
  };

  const handleAdd = (variant) => {
    if (!variant?.shopifyVariantId) {
      toast.error(
        "This variant is not mapped with Shopify"
      );
      return;
    }

    editOrder([
      {
        type: "add",
        variantId: variant.shopifyVariantId,
        quantity: 1,
      },
    ]);
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Edit Order Items
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Add, remove or update quantities. Changes sync with Shopify.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={saving}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>

        <div className="mt-4 divide-y divide-gray-100">
          {items.length === 0 ? (
            <p className="py-4 text-sm text-gray-500">
              No items found.
            </p>
          ) : (
            items.map((item, index) => {
              const sku =
                item?.variant?.sku ||
                item?.productSnapshot?.sku ||
                "";

              const quantity = Number(
                item?.quantity || 1
              );

              const image =
                item?.productSnapshot?.thumbnail ||
                item?.productSnapshot?.images?.[0] ||
                "";

              return (
                <div
                  key={item?.lineId || `${sku}-${index}`}
                  className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {image ? (
                      <img
                        src={image}
                        alt={
                          item?.productSnapshot?.title ||
                          "Product"
                        }
                        className="h-12 w-12 shrink-0 rounded-xl border border-gray-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-xs text-gray-400">
                        N/A
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {item?.productSnapshot?.title ||
                          "Product"}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Size:{" "}
                        {item?.selectedSize || "-"}
                      </p>

                      <p className="text-xs text-gray-400">
                        {sku || "SKU unavailable"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={
                        saving ||
                        quantity <= 1
                      }
                      onClick={() =>
                        handleQuantityChange(
                          item,
                          quantity - 1
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 transition hover:bg-gray-50 disabled:opacity-30"
                    >
                      <Minus size={15} />
                    </button>

                    <div className="min-w-8 text-center text-sm font-semibold">
                      {quantity}
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        handleQuantityChange(
                          item,
                          quantity + 1
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 transition hover:bg-gray-50 disabled:opacity-30"
                    >
                      <Plus size={15} />
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        handleRemove(item)
                      }
                      className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 transition hover:bg-red-50 disabled:opacity-30"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {saving && (
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-gray-500">
            <Loader2
              size={14}
              className="animate-spin"
            />
            Updating Shopify order...
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Add Product
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Search by product code and select a size.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setProduct(null);
                  setCode("");
                }}
                className="rounded-lg p-2 transition hover:bg-gray-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-5 flex gap-2">
              <input
                value={code}
                onChange={(e) =>
                  setCode(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchProduct();
                  }
                }}
                placeholder="Product code e.g. 00568"
                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
              />

              <button
                type="button"
                onClick={searchProduct}
                disabled={searching}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-black text-white disabled:opacity-50"
              >
                {searching ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Search size={17} />
                )}
              </button>
            </div>

            {product && (
              <div className="mt-5">
                <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                  {product?.image ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-xs text-gray-400">
                      N/A
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {product.title}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Code: {product.productCode}
                    </p>
                  </div>
                </div>

                <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Select Size
                </p>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(
                    product?.sizes || {}
                  ).map(
                    ([size, variant]) => {
                      const mapped = Boolean(
                        variant?.shopifyVariantId
                      );

                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={
                            saving || !mapped
                          }
                          onClick={() =>
                            handleAdd(variant)
                          }
                          className="rounded-xl border border-gray-200 p-3 text-left transition hover:border-black hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold">
                              {size}
                            </span>

                            {mapped && (
                              <Plus size={14} />
                            )}
                          </div>

                          <p className="mt-2 text-xs text-gray-500">
                            Available:{" "}
                            {Number(
                              variant?.available || 0
                            )}
                          </p>

                          {!mapped && (
                            <p className="mt-1 text-[10px] font-medium text-red-500">
                              Not mapped
                            </p>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}