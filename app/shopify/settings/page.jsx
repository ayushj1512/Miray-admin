"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  UploadCloud,
} from "lucide-react";

import adminShopifyStore from "@/store/adminshopifystore";

const REQUIRED_SCOPES = [
  {
    key: "writeOrderEdits",
    label: "Write Order Edits",
    scope: "write_order_edits",
  },
  {
    key: "readOrderEdits",
    label: "Read Order Edits",
    scope: "read_order_edits",
  },
  {
    key: "readOrders",
    label: "Read Orders",
    scope: "read_orders",
  },
  {
    key: "readProducts",
    label: "Read Products",
    scope: "read_products",
  },
];

function ShopifyScopesCard({
  loading,
  error,
  scopes,
  required,
  onRefresh,
}) {
  const allGranted = useMemo(
    () =>
      REQUIRED_SCOPES.every(
        ({ key }) => required?.[key] === true
      ),
    [required]
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5 md:col-span-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {allGranted ? (
              <ShieldCheck size={20} className="text-emerald-600" />
            ) : (
              <ShieldX size={20} className="text-red-600" />
            )}

            <p className="text-sm font-semibold">
              Shopify Granted Scopes
            </p>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Verify the permissions granted to the currently installed Shopify
            app and active access token.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />

          {loading ? "Checking..." : "Refresh Scopes"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {REQUIRED_SCOPES.map(({ key, label, scope }) => {
          const granted = required?.[key] === true;

          return (
            <div
              key={key}
              className={`rounded-2xl border p-4 ${
                granted
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="mt-1 break-all text-xs text-gray-500">
                    {scope}
                  </p>
                </div>

                {granted ? (
                  <CheckCircle2
                    size={18}
                    className="shrink-0 text-emerald-600"
                  />
                ) : (
                  <ShieldX
                    size={18}
                    className="shrink-0 text-red-600"
                  />
                )}
              </div>

              <p
                className={`mt-3 text-xs font-semibold ${
                  granted ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {granted ? "Granted" : "Missing"}
              </p>
            </div>
          );
        })}
      </div>

      <div
        className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
          allGranted
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-amber-200 bg-amber-50 text-amber-700"
        }`}
      >
        {allGranted
          ? "All required permissions are granted. Shopify order size changes are ready."
          : "Some required permissions are missing. Update the app permissions, expire the token, and check again."}
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {!!scopes?.length && (
        <details className="mt-4 rounded-2xl border border-gray-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
            View all granted scopes ({scopes.length})
          </summary>

          <div className="flex flex-wrap gap-2 border-t border-gray-200 p-4">
            {scopes.map((scope) => (
              <span
                key={scope}
                className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700"
              >
                {scope}
              </span>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

export default function ShopifySettingsPage() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState("");

  const {
    expireShopifyToken,
    importLatestShopifyOrders,
    fetchGrantedScopes,

    loading,
    importingLatestOrders,

    grantedScopes,
    grantedScopesLoading,
    grantedScopesError,
    requiredScopesStatus,
  } = adminShopifyStore();

  useEffect(() => {
    if (!unlocked) return;

    fetchGrantedScopes();
  }, [unlocked, fetchGrantedScopes]);

  const unlock = (event) => {
    event.preventDefault();

    if (pin === "0001") {
      setUnlocked(true);
      setMessage("");
      return;
    }

    setMessage("Wrong PIN.");
  };

  const expireToken = async () => {
    setMessage("");

    const response = await expireShopifyToken();

    if (!response?.success) {
      setMessage(response?.message || "Failed to expire token.");
      return;
    }

    setMessage(
      "Shopify token expired. The next Shopify API request will use a fresh token."
    );

    await fetchGrantedScopes();
  };

  const runImport = async () => {
    setMessage("");

    const response = await importLatestShopifyOrders();

    if (!response?.success) {
      setMessage(
        response?.message || "Failed to import latest Shopify orders."
      );
      return;
    }

    const summary = response.summary || {};

    setMessage(
      [
        "Shopify order import completed.",
        `Created: ${summary.created || 0}`,
        `Skipped: ${summary.skipped || 0}`,
        `Failed: ${summary.failed || 0}`,
      ].join("\n")
    );
  };

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-[#f7f7f7] p-4 text-black sm:p-6">
        <div className="mx-auto mt-20 max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
            <KeyRound size={20} />
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
            Miray Admin
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Shopify Settings Access
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Enter the secure PIN to manage Shopify permissions, token cache and
            manual order imports.
          </p>

          <form onSubmit={unlock} className="mt-6 space-y-4">
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="Enter PIN"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-black"
            />

            <button
              type="submit"
              className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              Unlock Settings
            </button>
          </form>

          {message && (
            <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-600">
              {message}
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f7] p-4 text-black sm:p-6">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
            Miray Admin
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Shopify Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Manage Shopify permissions, access-token cache and manual order
            imports.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ShopifyScopesCard
              loading={grantedScopesLoading}
              error={grantedScopesError}
              scopes={grantedScopes}
              required={requiredScopesStatus}
              onRefresh={fetchGrantedScopes}
            />

            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                <RefreshCw size={18} />
              </div>

              <p className="mt-4 text-sm font-semibold">
                Shopify Access Token
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Clear the cached token after updating app permissions. The next
                Shopify request will generate a fresh token.
              </p>

              <button
                type="button"
                onClick={expireToken}
                disabled={loading}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}

                {loading ? "Expiring..." : "Expire Shopify Token"}
              </button>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                <UploadCloud size={18} />
              </div>

              <p className="mt-4 text-sm font-semibold">
                Shopify Order Import
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Run the latest Shopify order import immediately using the same
                backend cron logic.
              </p>

              <button
                type="button"
                onClick={runImport}
                disabled={importingLatestOrders}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importingLatestOrders && (
                  <Loader2 size={16} className="animate-spin" />
                )}

                {importingLatestOrders
                  ? "Importing..."
                  : "Run Latest Order Import"}
              </button>
            </section>
          </div>

          {message && (
            <pre className="mt-5 whitespace-pre-wrap rounded-2xl border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700">
              {message}
            </pre>
          )}
        </section>
      </div>
    </main>
  );
}