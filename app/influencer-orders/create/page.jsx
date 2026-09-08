"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  PackagePlus,
  X,
} from "lucide-react";

import InfluencerOrderForm from "@/components/influencer-orders/InfluencerOrderForm";
import { useInfluencerOrderStore } from "@/store/influencerorderstore";

export default function CreateInfluencerOrderPage() {
  const router = useRouter();

  const creating = useInfluencerOrderStore(
    (state) => state.creating
  );

  const error = useInfluencerOrderStore(
    (state) => state.error
  );

  const successMessage =
    useInfluencerOrderStore(
      (state) => state.successMessage
    );

  const createOrder = useInfluencerOrderStore(
    (state) => state.createOrder
  );

  const clearError = useInfluencerOrderStore(
    (state) => state.clearError
  );

  const clearSuccessMessage =
    useInfluencerOrderStore(
      (state) =>
        state.clearSuccessMessage
    );

  const handleSubmit = async (payload) => {
    try {
      clearError();
      clearSuccessMessage();

      const response =
        await createOrder(payload);

      const createdOrder =
        response?.order;

      if (createdOrder?._id) {
        router.push(
          `/influencer-orders/${createdOrder._id}`
        );

        return;
      }

      router.push("/influencer-orders");
    } catch {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <main className="min-h-screen bg-[#fafafa] p-3 text-black sm:p-5 lg:p-7">
      <div className="mx-auto max-w-5xl">
        {/* Back navigation */}
        <Link
          href="/influencer-orders"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-[#800020]"
        >
          <ArrowLeft size={17} />
          Back to Influencer Orders
        </Link>

        {/* Page header */}
        <section className="mb-5 overflow-hidden rounded-2xl border border-[#800020]/15 bg-white shadow-sm">
          <div className="h-1.5 bg-[#800020]" />

          <div className="flex items-start gap-4 p-4 sm:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#800020] text-white">
              <PackagePlus size={23} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#800020]">
                Marketing Request
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Create Influencer Order
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Add the influencer’s contact
                information, delivery address and
                products. The request will then appear
                in the warehouse dispatch queue.
              </p>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={clearError}
              className="shrink-0"
              aria-label="Close error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={17} />
              {successMessage}
            </span>

            <button
              type="button"
              onClick={clearSuccessMessage}
              className="shrink-0"
              aria-label="Close message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <InfluencerOrderForm
          mode="create"
          loading={creating}
          onSubmit={handleSubmit}
          submitLabel="Create Influencer Order"
        />
      </div>
    </main>
  );
}