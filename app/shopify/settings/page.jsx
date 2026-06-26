"use client";

import { useState } from "react";
import adminShopifyStore from "@/store/adminshopifystore";

export default function ShopifySettingsPage() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState("");

  const {
    expireShopifyToken,
    importLatestShopifyOrders,
    loading,
    importingLatestOrders,
  } = adminShopifyStore();

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

  const runImport = async () => {
    setMessage("");

    const res = await importLatestShopifyOrders();

    if (res?.success) {
      const summary = res.summary || {};

      setMessage(
        `Shopify order import completed.\nCreated: ${
          summary.created || 0
        }\nSkipped: ${summary.skipped || 0}\nFailed: ${summary.failed || 0}`
      );
    } else {
      setMessage(res?.message || "Failed to import latest Shopify orders.");
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] p-4 text-black sm:p-6">
        <div className="mx-auto mt-20 max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
            Miray Admin
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Shopify Settings Access
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Enter secure PIN to manage Shopify token and manual cron actions.
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
              Unlock Settings
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
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
            Miray Admin
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Shopify Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Manage Shopify token cache and run manual Shopify order import
            without waiting for Render cron.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold">Shopify Access Token</p>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Clear cached Shopify access token after updating app permissions.
                The next Shopify API request will generate a fresh token.
              </p>

              <button
                onClick={expireToken}
                disabled={loading}
                className="mt-5 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Expiring..." : "Expire Shopify Token"}
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold">Shopify Order Import</p>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Runs the latest Shopify order import immediately using the same
                backend cron logic.
              </p>

              <button
                onClick={runImport}
                disabled={importingLatestOrders}
                className="mt-5 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importingLatestOrders
                  ? "Importing..."
                  : "Run Latest Order Import"}
              </button>
            </div>
          </div>

          {message && (
            <pre className="mt-5 whitespace-pre-wrap rounded-2xl border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700">
              {message}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}