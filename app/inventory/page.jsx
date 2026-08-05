"use client";

export default function InventoryPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#800020] text-3xl text-white">
          ⚙
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#800020]">
          Under Maintenance
        </p>

        <h1 className="mt-3 text-3xl font-bold text-black">
          Inventory Module
        </h1>

        <p className="mt-4 text-sm leading-6 text-black/60">
          We're upgrading the inventory system to deliver a faster,
          cleaner, and more reliable experience.
        </p>

        <div className="mt-8 rounded-2xl bg-[#800020]/5 px-4 py-3 text-sm font-medium text-[#800020]">
          Refactor in Progress
        </div>
      </div>
    </div>
  );
}