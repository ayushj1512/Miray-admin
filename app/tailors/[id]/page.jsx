"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Edit3,
  Loader2,
  MapPin,
  Package,
  Phone,
  RefreshCcw,
  UserRound,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";

import useTailorStore from "@/store/useTailorStore";

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const getInitials = (name = "") =>
  String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const DetailCard = ({
  title,
  description,
  icon: Icon,
  children,
  action,
}) => (
  <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#800020]/8 p-2.5 text-[#800020]">
          <Icon size={19} />
        </div>

        <div>
          <h2 className="text-sm font-bold text-gray-950 sm:text-base">
            {title}
          </h2>

          {description && (
            <p className="mt-0.5 text-xs text-gray-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>

    <div className="p-4 sm:p-5">
      {children}
    </div>
  </section>
);

const InfoItem = ({
  label,
  value,
  icon: Icon,
}) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
      {Icon && <Icon size={14} />}
      {label}
    </div>

    <p className="mt-1.5 break-words text-sm font-semibold text-gray-900">
      {value || "—"}
    </p>
  </div>
);

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-gray-500">
          {title}
        </p>

        <p className="mt-2 text-2xl font-bold text-gray-950">
          {value}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          {subtitle}
        </p>
      </div>

      <div className="rounded-xl bg-[#800020]/8 p-2.5 text-[#800020]">
        <Icon size={20} />
      </div>
    </div>
  </div>
);

/* =========================================================
   PAGE
========================================================= */

export default function TailorDetailPage() {
  const params = useParams();
  const router = useRouter();

  const tailorId = params?.id;

  const {
    currentTailor: tailor,
    detailLoading,
    updating,
    fetchTailorById,
    updateTailorStatus,
    clearCurrentTailor,
  } = useTailorStore();

  useEffect(() => {
    if (!tailorId) return;

    fetchTailorById(tailorId).catch(
      console.error,
    );

    return () => {
      clearCurrentTailor();
    };
  }, [
    tailorId,
    fetchTailorById,
    clearCurrentTailor,
  ]);

  const productionJobs = useMemo(
    () =>
      Array.isArray(tailor?.productionJobs)
        ? tailor.productionJobs
        : [],
    [tailor?.productionJobs],
  );

  const stats = useMemo(() => {
    const completedJobs =
      productionJobs.filter(
        (item) =>
          item.productionJob?.status ===
          "completed",
      );

    const activeJobs =
      productionJobs.filter((item) =>
        ["assigned", "in_progress"].includes(
          item.productionJob?.status,
        ),
      );

    const totalQuantity =
      productionJobs.reduce(
        (total, item) =>
          total +
          Number(
            item.assignedQuantity || 0,
          ),
        0,
      );

    const totalAmount =
      productionJobs.reduce(
        (total, item) =>
          total +
          Number(item.workRate || 0) *
            Number(
              item.assignedQuantity || 0,
            ),
        0,
      );

    return {
      totalJobs: productionJobs.length,
      activeJobs: activeJobs.length,
      completedJobs: completedJobs.length,
      totalQuantity,
      totalAmount,
    };
  }, [productionJobs]);

  const handleRefresh = () => {
    if (!tailorId) return;

    fetchTailorById(tailorId).catch(
      console.error,
    );
  };

  const handleStatusChange = async () => {
    if (!tailorId || updating) return;

    try {
      await updateTailorStatus(
        tailorId,
        !tailor.isActive,
      );
    } catch (error) {
      console.error(
        "Failed to update tailor status:",
        error,
      );
    }
  };

  if (detailLoading && !tailor) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fcfafb]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2
            size={30}
            className="animate-spin text-[#800020]"
          />

          <p className="text-sm font-medium">
            Loading tailor details...
          </p>
        </div>
      </main>
    );
  }

  if (!detailLoading && !tailor) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fcfafb] px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <UserRoundX size={28} />
          </div>

          <h1 className="mt-4 text-xl font-bold text-gray-950">
            Tailor not found
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            The tailor may have been removed.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/tailors")
            }
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#800020] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#68001a]"
          >
            <ArrowLeft size={17} />
            Back to Tailors
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fcfafb] px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() =>
                router.push("/tailors")
              }
              className="mt-1 rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm hover:text-[#800020]"
            >
              <ArrowLeft size={19} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#800020] text-lg font-bold text-white shadow-sm sm:h-16 sm:w-16">
                {getInitials(tailor.name) || "T"}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">
                    {tailor.name}
                  </h1>

                  <span
                    className={[
                      "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",

                      tailor.isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-gray-50 text-gray-600",
                    ].join(" ")}
                  >
                    {tailor.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span>
                    {tailor.tailorCode ||
                      "No tailor code"}
                  </span>

                  <span>•</span>

                  <span>
                    Created{" "}
                    {formatDate(
                      tailor.createdAt,
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={detailLoading}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm hover:text-[#800020] disabled:opacity-50"
            >
              <RefreshCcw
                size={16}
                className={
                  detailLoading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/tailor-production-jobs/create?tailorId=${tailorId}`,
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#800020]/20 bg-white px-4 text-sm font-semibold text-[#800020] hover:bg-[#800020]/5"
            >
              <BriefcaseBusiness size={17} />
              Create Job
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/tailors/${tailorId}/edit`,
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#800020] px-4 text-sm font-semibold text-white hover:bg-[#68001a]"
            >
              <Edit3 size={17} />
              Edit Tailor
            </button>
          </div>
        </div>

        {/* Stats */}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard
            title="Total Jobs"
            value={stats.totalJobs}
            subtitle="Complete history"
            icon={BriefcaseBusiness}
          />

          <StatCard
            title="Active Jobs"
            value={stats.activeJobs}
            subtitle="Assigned or in progress"
            icon={Package}
          />

          <StatCard
            title="Completed"
            value={stats.completedJobs}
            subtitle="Finished jobs"
            icon={UserRoundCheck}
          />

          <StatCard
            title="Total Quantity"
            value={stats.totalQuantity}
            subtitle="Pieces allocated"
            icon={Package}
          />

          <StatCard
            title="Total Value"
            value={formatMoney(
              stats.totalAmount,
            )}
            subtitle="Calculated work value"
            icon={BriefcaseBusiness}
          />
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-5">
            {/* Profile */}

            <DetailCard
              title="Profile Information"
              description="Contact and identity details."
              icon={UserRound}
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem
                  label="Full Name"
                  value={tailor.name}
                  icon={UserRound}
                />

                <InfoItem
                  label="Tailor Code"
                  value={tailor.tailorCode}
                  icon={UserRoundCheck}
                />

                <InfoItem
                  label="Mobile"
                  value={tailor.mobile}
                  icon={Phone}
                />

                <InfoItem
                  label="Alternate Mobile"
                  value={
                    tailor.alternateMobile
                  }
                  icon={Phone}
                />

                <InfoItem
                  label="Created At"
                  value={formatDate(
                    tailor.createdAt,
                  )}
                  icon={CalendarDays}
                />

                <InfoItem
                  label="Last Updated"
                  value={formatDate(
                    tailor.updatedAt,
                  )}
                  icon={CalendarDays}
                />
              </div>

              <div className="mt-3">
                <InfoItem
                  label="Address"
                  value={
                    tailor.address ||
                    "No address added"
                  }
                  icon={MapPin}
                />
              </div>
            </DetailCard>

            {/* Production Jobs */}

            <DetailCard
              title="Production Jobs"
              description="Jobs allocated to this tailor."
              icon={BriefcaseBusiness}
              action={
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/tailor-production-jobs?tailorId=${tailorId}`,
                    )
                  }
                  className="text-xs font-semibold text-[#800020] hover:underline"
                >
                  View All
                </button>
              }
            >
              {productionJobs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
                  <BriefcaseBusiness
                    size={28}
                    className="mx-auto text-gray-400"
                  />

                  <p className="mt-3 text-sm font-semibold text-gray-800">
                    No production jobs
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Create a job and allocate products to this tailor.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/tailor-production-jobs/create?tailorId=${tailorId}`,
                      )
                    }
                    className="mt-4 rounded-xl bg-[#800020] px-4 py-2 text-xs font-semibold text-white hover:bg-[#68001a]"
                  >
                    Create Production Job
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {productionJobs
                    .slice(0, 8)
                    .map((item, index) => {
                      const job =
                        item.productionJob;

                      return (
                        <button
                          key={
                            item._id ||
                            job?._id ||
                            index
                          }
                          type="button"
                          onClick={() =>
                            job?._id &&
                            router.push(
                              `/tailor-production-jobs/${job._id}`,
                            )
                          }
                          className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-3 text-left transition hover:border-[#800020]/20 hover:bg-[#800020]/[0.02]"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">
                                {item.productTitle ||
                                  "Production Product"}
                              </p>

                              <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                                {item.productCode}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-gray-500">
                              {job?.jobNumber ||
                                "Job"}{" "}
                              •{" "}
                              {
                                item.assignedQuantity
                              }{" "}
                              pieces
                            </p>
                          </div>

                          <span
                            className={[
                              "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold",

                              job?.status ===
                              "completed"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : job?.status ===
                                  "cancelled"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-amber-200 bg-amber-50 text-amber-700",
                            ].join(" ")}
                          >
                            {job?.status ||
                              "assigned"}
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}
            </DetailCard>

            {/* Notes */}

            <DetailCard
              title="Notes"
              description="Internal tailor notes."
              icon={UserRound}
            >
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {tailor.notes ||
                  "No notes added."}
              </p>
            </DetailCard>
          </div>

          {/* Sidebar */}

          <aside className="grid content-start gap-5">
            <DetailCard
              title="Status"
              description="Enable or disable job allocation."
              icon={UserRoundCheck}
            >
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {tailor.isActive
                        ? "Active Tailor"
                        : "Inactive Tailor"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {tailor.isActive
                        ? "Can receive new production jobs."
                        : "Cannot receive new production jobs."}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={updating}
                    onClick={
                      handleStatusChange
                    }
                    className={[
                      "rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50",

                      tailor.isActive
                        ? "bg-gray-200 text-gray-700"
                        : "bg-[#800020] text-white",
                    ].join(" ")}
                  >
                    {updating
                      ? "Updating..."
                      : tailor.isActive
                      ? "Deactivate"
                      : "Activate"}
                  </button>
                </div>
              </div>
            </DetailCard>

            <DetailCard
              title="Quick Actions"
              description="Common production actions."
              icon={BriefcaseBusiness}
            >
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/tailor-production-jobs/create?tailorId=${tailorId}`,
                    )
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#800020] text-sm font-semibold text-white hover:bg-[#68001a]"
                >
                  <BriefcaseBusiness
                    size={16}
                  />
                  Create Production Job
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/tailor-production-jobs?tailorId=${tailorId}`,
                    )
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:text-[#800020]"
                >
                  <Package size={16} />
                  View All Jobs
                </button>
              </div>
            </DetailCard>
          </aside>
        </div>
      </div>
    </main>
  );
}