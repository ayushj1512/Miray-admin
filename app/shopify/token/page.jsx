"use client";

import { useState } from "react";
import adminShopifyStore from "@/store/adminshopifystore";

export default function ShopifyTokenPage() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState("");

  const { expireShopifyToken, loading } = adminShopifyStore();

  const unlock = (e) => {
    e.preventDefault();

    if (pin === "0001") {
      setUnlocked(true);
      setMessage("");
    } else {
      setMessage("Wrong PIN.");
    }
  };

  const expireToken = async () => {
    setMessage("");

    const res = await expireShopifyToken();

    setMessage(
      res?.success
        ? "Shopify token expired. Next API call will use fresh token."
        : res?.message || "Failed to expire token."
    );
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] p-4 text-black sm:p-6">
        <div className="mx-auto mt-20 max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
            Miray Admin
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Shopify Token Access
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Enter secure PIN to manage Shopify token cache.
          </p>

          <form onSubmit={unlock} className="mt-6 space-y-4">
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-black"
            />

            <button className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-900">
              Unlock
            </button>
          </form>

          {message && (
            <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-600">
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-4 text-black sm:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
            Miray Admin
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Shopify Token Manager
          </h1>

          <p className="mt-2 max-w-xl text-sm text-gray-500">
            Clear cached Shopify access token after updating app permissions.
            The next Shopify request will automatically generate a fresh token.
          </p>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium">Current Action</p>
            <p className="mt-1 text-sm text-gray-500">
              Expire backend token cache safely without restarting server.
            </p>
          </div>

          <button
            onClick={expireToken}
            disabled={loading}
            className="mt-6 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-50"
          >
            {loading ? "Expiring..." : "Expire Shopify Token"}
          </button>

          {message && (
            <p className="mt-4 rounded-2xl border border-gray-200 bg-white p-3 text-sm text-gray-700">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}