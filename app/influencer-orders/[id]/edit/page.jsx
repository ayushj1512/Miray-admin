"use client";

import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { useEffect } from "react";
import {
  ArrowLeft,
  Ban,
  Edit3,
  Loader2,
  Package,
  X,
} from "lucide-react";

import InfluencerOrderForm from "@/components/influencer-orders/InfluencerOrderForm";
import { useInfluencerOrderStore } from "@/store/influencerorderstore";

export default function EditInfluencerOrderPage() {
  const params = useParams();
  const router = useRouter();

  const orderId = params?.id;

  const selectedOrder =
    useInfluencerOrderStore(
      (state) => state.selectedOrder
    );

  const selectedOrderLoading =
    useInfluencerOrderStore(
      (state) =>
        state.selectedOrderLoading
    );

  const updating = useInfluencerOrderStore(
    (state) => state.updating
  );

  const error = useInfluencerOrderStore(
    (state) => state.error
  );

  const fetchOrderById =
    useInfluencerOrderStore(
      (state) => state.fetchOrderById
    );

  const updateOrder =
    useInfluencerOrderStore(
      (state) => state.updateOrder
    );

  const clearError =
    useInfluencerOrderStore(
      (state) => state.clearError
    );

  const clearSuccessMessage =
    useInfluencerOrderStore(
      (state) =>
        state.clearSuccessMessage
    );

  useEffect(() => {
    if (!orderId) return;

    clearError();
    clearSuccessMessage();

    fetchOrderById(orderId).catch(() => {});
  }, [
    orderId,
    fetchOrderById,
    clearError,
    clearSuccessMessage,
  ]);

  const order =
    selectedOrder?._id === orderId
      ? selectedOrder
      : null;

  const handleSubmit = async (payload) => {
    try {
      await updateOrder(orderId, payload);

      router.push(
        `/influencer-orders/${orderId}`
      );
    } catch {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  if (selectedOrderLoading && !order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 animate-spin text-[#800020]" />

          <p className="text-sm text-gray-500">
            Loading influencer order...
          </p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fafafa] p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <Package
            size={36}
            className="mx-auto mb-3 text-gray-300"
          />

          <h1 className="text-xl font-bold">
            Influencer order not found
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {error ||
              "The requested influencer order could not be loaded."}
          </p>

          <Link
            href="/influencer-orders"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#800020] px-4 text-sm font-semibold text-white"
          >
            <ArrowLeft size={17} />
            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  if (order.isDispatched) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fafafa] p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#800020]/10 text-[#800020]">
            <Ban size={24} />
          </div>

          <h1 className="text-xl font-bold">
            Editing is locked
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            This influencer order has already been
            dispatched. Dispatched orders cannot be
            modified.
          </p>

          <Link
            href={`/influencer-orders/${orderId}`}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#800020] px-4 text-sm font-semibold text-white"
          >
            <ArrowLeft size={17} />
            View Order
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafafa] p-3 text-black sm:p-5 lg:p-7">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/influencer-orders/${orderId}`}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-[#800020]"
        >
          <ArrowLeft size={17} />
          Back to Order Details
        </Link>

        <section className="mb-5 overflow-hidden rounded-2xl border border-[#800020]/15 bg-white shadow-sm">
          <div className="h-1.5 bg-[#800020]" />

          <div className="flex items-start gap-4 p-4 sm:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#800020] text-white">
              <Edit3 size={22} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#800020]">
                Pending Request
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Edit Influencer Order
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Update the details for{" "}
                <span className="font-semibold text-black">
                  {order.influencerName}
                </span>
                . Every update will be recorded in
                the activity logs.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={clearError}
              aria-label="Close error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <InfluencerOrderForm
          mode="edit"
          initialData={order}
          loading={updating}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
        />
      </div>
    </main>
  );
}