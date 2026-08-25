"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CopyPlus,
  Loader2,
  MoreVertical,
  Printer,
} from "lucide-react";

import { useReactToPrint } from "react-to-print";

import InvoiceTemplate from "@/components/invoice/InvoiceTemplate";
import { SELLER } from "@/components/invoice/invoice.constants";
import adminShopifyStore from "@/store/adminshopifystore";

export default function OrderRowActions({
  order,
  courierName = "",
  trackingId = "",
}) {
  const wrapRef = useRef(null);
  const invoiceRef = useRef(null);

  const [open, setOpen] = useState(false);

  /* =========================================================
     SHOPIFY CLONE
  ========================================================= */

  const cloneShopifyOrder = adminShopifyStore(
    (s) => s.cloneShopifyOrder
  );

  const shopifyOrderCloning = adminShopifyStore(
    (s) => s.shopifyOrderCloning
  );

  const isShopifyOrder = useMemo(() => {
    return (
      String(order?.source || "").toLowerCase() === "shopify" ||
      String(order?.attribution?.source || "").toLowerCase() === "shopify" ||
      String(order?.orderNumber || "")
        .toUpperCase()
        .startsWith("SHOP-")
    );
  }, [
    order?.source,
    order?.attribution?.source,
    order?.orderNumber,
  ]);

  const isCancelled = useMemo(() => {
    return (
      String(order?.fulfillmentStatus || "").toLowerCase() === "cancelled" ||
      order?.cancellation?.isCancelled === true
    );
  }, [
    order?.fulfillmentStatus,
    order?.cancellation?.isCancelled,
  ]);
  
const canClone = Boolean(order?._id || order?.id);

  const handleClone = useCallback(async () => {
    const orderId = order?._id || order?.id;

    if (!orderId || shopifyOrderCloning) return;

    const confirmed = window.confirm(
      `Create a fresh Shopify order from ${order?.orderNumber || "this cancelled order"}?`
    );

    if (!confirmed) return;

    setOpen(false);

    const result = await cloneShopifyOrder(orderId, {
      paymentStatus: "pending",
      notifyCustomer: false,
    });

    if (!result?.success) {
      alert(
        result?.message ||
          "Failed to create fresh Shopify clone."
      );
      return;
    }

    const newOrderNumber =
      result?.data?.cloned?.localOrder?.orderNumber ||
      result?.data?.cloned?.shopifyOrder?.name ||
      result?.cloned?.localOrder?.orderNumber ||
      result?.cloned?.shopifyOrder?.name ||
      "";

    alert(
      newOrderNumber
        ? `Fresh Shopify order created: ${newOrderNumber}`
        : "Fresh Shopify order created successfully."
    );
  }, [
    order,
    cloneShopifyOrder,
    shopifyOrderCloning,
  ]);

  /* =========================================================
     INVOICE
  ========================================================= */

  const orderNumber =
    order?.orderNumber ||
    order?._id ||
    "order";

  const normalized = useMemo(() => {
    if (!order) return null;

    const billing = {
      fullName:
        order.billingAddressSnapshot?.fullName ||
        order.customerId?.name ||
        "-",

      line1:
        order.billingAddressSnapshot?.line1 ||
        "-",

      line2:
        order.billingAddressSnapshot?.line2 ||
        "",

      city:
        order.billingAddressSnapshot?.city ||
        "",

      pincode:
        order.billingAddressSnapshot?.pincode ||
        "",

      state:
        order.billingAddressSnapshot?.state ||
        "",

      phone:
        order.customerId?.phone ||
        "",

      email:
        order.customerId?.email ||
        "",
    };

    const shipping = {
      fullName:
        order.shippingAddressSnapshot?.fullName ||
        "-",

      line1:
        order.shippingAddressSnapshot?.line1 ||
        "-",

      line2:
        order.shippingAddressSnapshot?.line2 ||
        "",

      city:
        order.shippingAddressSnapshot?.city ||
        "",

      pincode:
        order.shippingAddressSnapshot?.pincode ||
        "",

      state:
        order.shippingAddressSnapshot?.state ||
        "",
    };

    const items = (
      Array.isArray(order.items)
        ? order.items
        : []
    ).map((it, idx) => {
      const snap =
        it?.productSnapshot || {};

      const size =
        it?.selectedSize ||
        it?.size ||
        it?.variant?.size ||
        "-";

      return {
        sr: idx + 1,

        name:
          snap.title ||
          it?.productId?.title ||
          "Unnamed Product",

        qty: Number(
          it?.quantity || 0
        ),

        priceIncl: Number(
          it?.price || 0
        ),

        gstRate: 5,

        size,
        selectedSize: size,
      };
    });

    const couponCode =
      order?.coupon?.code || "";

    const discount = Number(
      order?.discount ||
      order?.coupon?.discount ||
      0
    );

    return {
      seller: SELLER,

      orderNumber:
        order.orderNumber,

      orderDate:
        order.createdAt,

      invoiceNumber:
        order.orderNumber,

      billing,
      shipping,

      courier: {
        name:
          courierName || "-",

        awb:
          trackingId || "-",
      },

      items,

      totals: {
        taxable: Number(
          order.subtotal || 0
        ),

        tax: Number(
          order.tax || 0
        ),

        grandTotal: Number(
          order.finalPayable || 0
        ),

        discount,
        couponCode,

        finalPayable: Number(
          order.finalPayable || 0
        ),
      },

      payment: {
        title:
          order.paymentMethod ||
          "-",
      },
    };
  }, [
    order,
    courierName,
    trackingId,
  ]);

  /* =========================================================
     PRINT
  ========================================================= */

  const printInvoice =
    useReactToPrint({
      contentRef: invoiceRef,

      documentTitle:
        `Invoice-${orderNumber}`,

      pageStyle: `
        @page {
          size: A4;
          margin: 10mm;
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `,
    });

  const safePrint =
    useCallback(() => {
      setOpen(false);

      if (!invoiceRef.current) {
        return;
      }

      if (
        typeof printInvoice !==
        "function"
      ) {
        return;
      }

      requestAnimationFrame(
        () => printInvoice()
      );
    }, [printInvoice]);

  /* =========================================================
     CLOSE MENU
  ========================================================= */

  useEffect(() => {
    const onDown = (e) => {
      if (!wrapRef.current) return;

      if (
        !wrapRef.current.contains(
          e.target
        )
      ) {
        setOpen(false);
      }
    };

    const onEsc = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      onDown
    );

    document.addEventListener(
      "keydown",
      onEsc
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        onDown
      );

      document.removeEventListener(
        "keydown",
        onEsc
      );
    };
  }, []);

  if (!order || !normalized) {
    return null;
  }

  return (
    <>
      <div
        className="relative"
        ref={wrapRef}
      >
        <button
          onClick={() =>
            setOpen((v) => !v)
          }
          className="p-2 rounded-lg hover:bg-black/[0.05] transition"
          type="button"
          title="Order Actions"
        >
          <MoreVertical size={18} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden text-xs font-semibold">

            {/* PRINT */}
            <button
              onClick={safePrint}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-left"
              type="button"
            >
              <Printer size={14} />

              Print Invoice
            </button>

            {/* CLONE */}
            {canClone && (
              <>
                <div className="border-t border-gray-100" />

                <button
                  type="button"
                  onClick={handleClone}
                  disabled={
                    shopifyOrderCloning
                  }
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {shopifyOrderCloning ? (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <CopyPlus
                      size={14}
                    />
                  )}

                  {shopifyOrderCloning
                    ? "Creating Clone..."
                    : "Create Fresh Clone"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hidden printable invoice */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
        }}
      >
        <div
          ref={invoiceRef}
          style={{
            width: "210mm",
            background: "white",
          }}
        >
          <InvoiceTemplate
            data={normalized}
          />
        </div>
      </div>
    </>
  );
}
