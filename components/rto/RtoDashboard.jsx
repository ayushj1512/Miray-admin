"use client";

import { useRouter } from "next/navigation";
import {
  PackageCheck,
  History,
  BarChart3,
  RotateCcw,
  ArrowUpRight,
  Search,
  ScanSearch,
  PackageOpen,
  RefreshCcw,
} from "lucide-react";

const modules = [
  {
    title: "Receive RTO",
    description:
      "Search order, verify returned items and restore correct inventory.",
    icon: PackageCheck,
    route: "/rto/receive",
    label: "Warehouse",
  },
  {
    title: "Received RTO",
    description:
      "Review received parcels, products, sizes and item condition.",
    icon: History,
    route: "/rto/received",
    label: "History",
  },
  {
    title: "Reports",
    description:
      "Analyse RTO movement, recovery and damaged or wrong items.",
    icon: BarChart3,
    route: "/rto/reports",
    label: "Analytics",
  },
];

const steps = [
  { icon: Search, title: "Search", text: "Find order" },
  { icon: ScanSearch, title: "Verify", text: "Check items" },
  { icon: PackageOpen, title: "Receive", text: "Record condition" },
  { icon: RefreshCcw, title: "Restore", text: "Correct stock only" },
];

export default function RtoDashboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f7f7f8] p-4 md:p-6">

      {/* HEADER */}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <RotateCcw
              size={16}
              className="text-[#800020]"
            />

            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#800020]">
              Warehouse
            </span>
          </div>

          <h1 className="text-xl font-bold text-gray-950 md:text-2xl">
            RTO Management
          </h1>

          <p className="mt-1 text-xs text-gray-500">
            Receive, verify and track physical return inventory.
          </p>
        </div>

        <button
          onClick={() => router.push("/rto/receive")}
          className="rounded-lg bg-[#800020] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
        >
          + Receive RTO
        </button>
      </div>

      {/* MODULE CARDS */}

      <div className="grid gap-3 md:grid-cols-3">
        {modules.map(
          ({
            title,
            description,
            icon: Icon,
            route,
            label,
          }) => (
            <button
              key={route}
              onClick={() => router.push(route)}
              className="group rounded-xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#800020]/[0.07] text-[#800020]">
                  <Icon size={19} />
                </div>

                <ArrowUpRight
                  size={16}
                  className="text-gray-300 transition group-hover:text-[#800020]"
                />
              </div>

              <div className="mt-5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#800020]/70">
                  {label}
                </p>

                <h2 className="mt-1 text-sm font-bold text-gray-900">
                  {title}
                </h2>

                <p className="mt-1.5 max-w-sm text-[11px] leading-5 text-gray-500">
                  {description}
                </p>
              </div>
            </button>
          )
        )}
      </div>

      {/* WORKFLOW */}

      <div className="mt-5 rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900">
            Warehouse Workflow
          </h2>

          <p className="mt-0.5 text-[10px] text-gray-400">
            Simple physical RTO verification process
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          {steps.map(
            ({ icon: Icon, title, text }, index) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-lg bg-[#fafafa] px-3 py-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#800020]/[0.07] text-[#800020]">
                  <Icon size={15} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-[#800020]/60">
                      0{index + 1}
                    </span>

                    <p className="text-xs font-semibold text-gray-900">
                      {title}
                    </p>
                  </div>

                  <p className="mt-0.5 text-[10px] text-gray-400">
                    {text}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* INFO STRIP */}

      <div className="mt-3 flex flex-col justify-between gap-2 rounded-xl bg-[#800020]/[0.045] px-4 py-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-[11px] font-semibold text-[#800020]">
            Inventory Recovery Rule
          </p>

          <p className="mt-0.5 text-[10px] text-gray-500">
            Only physically verified correct items are restored to sellable inventory.
          </p>
        </div>

        <span className="w-fit rounded-md bg-white px-2.5 py-1 text-[9px] font-bold text-[#800020]">
          CORRECT QTY → STOCK
        </span>
      </div>
    </div>
  );
}