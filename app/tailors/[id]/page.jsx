"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  BadgeIndianRupee,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCcw,
  Scissors,
  ShieldCheck,
  Shirt,
  Star,
  UserRound,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";

import useTailorStore from "@/store/useTailorStore";

const STATUS_STYLES = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive:
    "border-gray-200 bg-gray-50 text-gray-600",
  blocked:
    "border-red-200 bg-red-50 text-red-700",
};

const AVAILABILITY_STYLES = {
  available:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  busy:
    "border-amber-200 bg-amber-50 text-amber-700",
  on_leave:
    "border-blue-200 bg-blue-50 text-blue-700",
  unavailable:
    "border-gray-200 bg-gray-50 text-gray-600",
};

const formatLabel = (value) => {
  if (!value) return "—";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
};

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

const formatMoney = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const getInitials = (name = "") => {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const DetailCard = ({
  title,
  description,
  icon: Icon,
  children,
  action,
}) => {
  return (
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
};

const InfoItem = ({
  label,
  value,
  icon: Icon,
}) => {
  return (
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
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-950">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-[#800020]/8 p-2.5 text-[#800020]">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

const Badge = ({ children }) => {
  return (
    <span className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700">
      {children}
    </span>
  );
};

export default function TailorDetailPage() {
  const params = useParams();
  const router = useRouter();

  const tailorId = params?.id;

  const tailor = useTailorStore(
    (state) => state.tailor,
  );

  const detailLoading = useTailorStore(
    (state) => state.detailLoading,
  );

  const availabilityUpdating = useTailorStore(
    (state) => state.availabilityUpdating,
  );

  const statusUpdating = useTailorStore(
    (state) => state.statusUpdating,
  );

  const fetchTailorById = useTailorStore(
    (state) => state.fetchTailorById,
  );

  const updateTailorAvailability = useTailorStore(
    (state) => state.updateTailorAvailability,
  );

  const updateTailorStatus = useTailorStore(
    (state) => state.updateTailorStatus,
  );

  const clearTailor = useTailorStore(
    (state) => state.clearTailor,
  );

  useEffect(() => {
    if (!tailorId) return;

    fetchTailorById(tailorId);

    return () => {
      clearTailor?.();
    };
  }, [tailorId]);

  const assignedProducts = useMemo(() => {
    return Array.isArray(
      tailor?.assignedProducts,
    )
      ? tailor.assignedProducts
      : [];
  }, [tailor?.assignedProducts]);

  const skills = useMemo(() => {
    return Array.isArray(tailor?.skills)
      ? tailor.skills
      : [];
  }, [tailor?.skills]);

  const supportedSizes = useMemo(() => {
    return Array.isArray(
      tailor?.supportedSizes,
    )
      ? tailor.supportedSizes
      : [];
  }, [tailor?.supportedSizes]);

  const supportedWorkTypes = useMemo(() => {
    return Array.isArray(
      tailor?.supportedWorkTypes,
    )
      ? tailor.supportedWorkTypes
      : [];
  }, [tailor?.supportedWorkTypes]);

  const statistics = useMemo(() => {
    const stats =
      tailor?.statistics ||
      tailor?.stats ||
      {};

    return {
      assignedJobs:
        stats.assignedJobs ??
        tailor?.assignedJobsCount ??
        tailor?.currentJobsCount ??
        0,

      completedJobs:
        stats.completedJobs ??
        tailor?.completedJobsCount ??
        0,

      pendingJobs:
        stats.pendingJobs ??
        tailor?.pendingJobsCount ??
        0,

      rating:
        stats.rating ??
        tailor?.rating ??
        0,
    };
  }, [tailor]);

  const capacity = tailor?.capacity || {};

  const address = tailor?.address || {};

  const defaultRate =
    tailor?.defaultRate || {};

  const fullAddress = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const handleRefresh = () => {
    if (!tailorId) return;

    fetchTailorById(tailorId);
  };

  const handleAvailabilityChange = async (
    event,
  ) => {
    const availability =
      event.target.value;

    if (
      !tailorId ||
      !availability ||
      availability ===
        tailor?.availability
    ) {
      return;
    }

    await updateTailorAvailability(
      tailorId,
      availability,
    );
  };

  const handleStatusChange = async (
    event,
  ) => {
    const status = event.target.value;

    if (
      !tailorId ||
      !status ||
      status === tailor?.status
    ) {
      return;
    }

    await updateTailorStatus(
      tailorId,
      status,
    );
  };

  if (
    detailLoading &&
    !tailor
  ) {
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
            The tailor may have been removed
            or the ID is invalid.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/tailors")
            }
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#800020] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#68001a]"
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
              className="mt-1 rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm transition hover:border-[#800020]/20 hover:text-[#800020]"
            >
              <ArrowLeft size={19} />
            </button>

            <div className="flex items-center gap-3">
              {tailor?.photo ? (
                <img
                  src={tailor.photo}
                  alt={
                    tailor.name ||
                    "Tailor"
                  }
                  className="h-14 w-14 rounded-2xl border border-gray-200 object-cover shadow-sm sm:h-16 sm:w-16"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#800020] text-lg font-bold text-white shadow-sm sm:h-16 sm:w-16">
                  {getInitials(
                    tailor?.name,
                  ) || "T"}
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">
                    {tailor?.name ||
                      "Unnamed Tailor"}
                  </h1>

                  <span
                    className={[
                      "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                      STATUS_STYLES[
                        tailor?.status
                      ] ||
                        STATUS_STYLES.inactive,
                    ].join(" ")}
                  >
                    {formatLabel(
                      tailor?.status,
                    )}
                  </span>

                  <span
                    className={[
                      "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                      AVAILABILITY_STYLES[
                        tailor?.availability
                      ] ||
                        AVAILABILITY_STYLES.unavailable,
                    ].join(" ")}
                  >
                    {formatLabel(
                      tailor?.availability,
                    )}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span>
                    {tailor?.tailorCode ||
                      "No tailor code"}
                  </span>

                  <span>•</span>

                  <span>
                    {formatLabel(
                      tailor?.type,
                    )}
                  </span>

                  <span>•</span>

                  <span>
                    Joined{" "}
                    {formatDate(
                      tailor?.joinedAt ||
                        tailor?.createdAt,
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
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#800020]/20 hover:text-[#800020] disabled:opacity-50"
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
                  `/tailors/${tailorId}/products`,
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#800020]/20 bg-white px-4 text-sm font-semibold text-[#800020] shadow-sm transition hover:bg-[#800020]/5"
            >
              <Shirt size={17} />
              Manage Products
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/tailors/${tailorId}/edit`,
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#800020] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#68001a]"
            >
              <Edit3 size={17} />
              Edit Tailor
            </button>
          </div>
        </div>

        {/* Stats */}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            title="Assigned Products"
            value={
              assignedProducts.length
            }
            subtitle="Eligible product styles"
            icon={Package}
          />

          <StatCard
            title="Active Jobs"
            value={
              statistics.assignedJobs
            }
            subtitle="Currently assigned"
            icon={BriefcaseBusiness}
          />

          <StatCard
            title="Completed Jobs"
            value={
              statistics.completedJobs
            }
            subtitle="Total finished jobs"
            icon={CheckCircle2}
          />

          <StatCard
            title="Rating"
            value={
              Number(
                statistics.rating,
              ).toFixed(1)
            }
            subtitle="Performance rating"
            icon={Star}
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
                  value={tailor?.name}
                  icon={UserRound}
                />

                <InfoItem
                  label="Tailor Code"
                  value={
                    tailor?.tailorCode
                  }
                  icon={ShieldCheck}
                />

                <InfoItem
                  label="Tailor Type"
                  value={formatLabel(
                    tailor?.type,
                  )}
                  icon={
                    BriefcaseBusiness
                  }
                />

                <InfoItem
                  label="Phone"
                  value={
                    tailor?.phone ||
                    tailor?.mobile
                  }
                  icon={Phone}
                />

                <InfoItem
                  label="Alternate Phone"
                  value={
                    tailor?.alternatePhone
                  }
                  icon={Phone}
                />

                <InfoItem
                  label="Email"
                  value={tailor?.email}
                  icon={Mail}
                />

                <InfoItem
                  label="Joined Date"
                  value={formatDate(
                    tailor?.joinedAt,
                  )}
                  icon={CalendarDays}
                />

                <InfoItem
                  label="Created At"
                  value={formatDate(
                    tailor?.createdAt,
                  )}
                  icon={CalendarDays}
                />

                <InfoItem
                  label="Last Updated"
                  value={formatDate(
                    tailor?.updatedAt,
                  )}
                  icon={Clock3}
                />
              </div>

              <div className="mt-3">
                <InfoItem
                  label="Address"
                  value={
                    fullAddress ||
                    "No address added"
                  }
                  icon={MapPin}
                />
              </div>
            </DetailCard>

            {/* Skills */}

            <DetailCard
              title="Skills & Capability"
              description="Operations, sizes and production work supported."
              icon={Scissors}
            >
              <div className="grid gap-6 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Skills
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.length > 0 ? (
                      skills.map((skill) => (
                        <Badge key={skill}>
                          {formatLabel(
                            skill,
                          )}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">
                        No skills added.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Supported Sizes
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {supportedSizes.length >
                    0 ? (
                      supportedSizes.map(
                        (size) => (
                          <Badge key={size}>
                            {size}
                          </Badge>
                        ),
                      )
                    ) : (
                      <p className="text-sm text-gray-400">
                        No sizes added.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Work Types
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {supportedWorkTypes.length >
                    0 ? (
                      supportedWorkTypes.map(
                        (workType) => (
                          <Badge
                            key={workType}
                          >
                            {formatLabel(
                              workType,
                            )}
                          </Badge>
                        ),
                      )
                    ) : (
                      <p className="text-sm text-gray-400">
                        No work types added.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </DetailCard>

            {/* Assigned Products */}

            <DetailCard
              title="Assigned Products"
              description="Products this tailor is eligible to produce."
              icon={Shirt}
              action={
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/tailors/${tailorId}/products`,
                    )
                  }
                  className="text-xs font-semibold text-[#800020] hover:underline"
                >
                  Manage Products
                </button>
              }
            >
              {assignedProducts.length ===
              0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
                  <Shirt
                    size={28}
                    className="mx-auto text-gray-400"
                  />

                  <p className="mt-3 text-sm font-semibold text-gray-800">
                    No products assigned
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Assign eligible products
                    before creating production
                    jobs.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/tailors/${tailorId}/products`,
                      )
                    }
                    className="mt-4 rounded-xl bg-[#800020] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#68001a]"
                  >
                    Assign Products
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {assignedProducts
                    .slice(0, 6)
                    .map(
                      (
                        assignment,
                        index,
                      ) => {
                        const product =
                          assignment.product ||
                          assignment.productId ||
                          assignment;

                        const title =
                          product?.title ||
                          product?.name ||
                          assignment?.productTitle ||
                          "Unnamed Product";

                        const productCode =
                          product?.productCode ||
                          assignment?.productCode ||
                          "No code";

                        const image =
                          product?.thumbnail ||
                          product?.image ||
                          product?.images?.[0];

                        return (
                          <div
                            key={
                              assignment?._id ||
                              product?._id ||
                              index
                            }
                            className="flex items-center gap-3 rounded-xl border border-gray-200 p-3"
                          >
                            {image ? (
                              <img
                                src={image}
                                alt={title}
                                className="h-14 w-14 rounded-xl border border-gray-200 object-cover"
                              />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                                <Shirt
                                  size={22}
                                />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {title}
                              </p>

                              <p className="mt-0.5 text-xs text-gray-500">
                                {productCode}
                              </p>

                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {assignment?.preferred && (
                                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                    Preferred
                                  </span>
                                )}

                                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                                  {formatLabel(
                                    assignment?.status ||
                                      "active",
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )}
                </div>
              )}

              {assignedProducts.length >
                6 && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/tailors/${tailorId}/products`,
                    )
                  }
                  className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-[#800020]/20 hover:text-[#800020]"
                >
                  View all{" "}
                  {assignedProducts.length}{" "}
                  products
                </button>
              )}
            </DetailCard>

            {/* Notes */}

            <DetailCard
              title="Internal Notes"
              description="Production or quality-related notes."
              icon={Activity}
            >
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {tailor?.notes ||
                  "No internal notes added."}
              </p>
            </DetailCard>
          </div>

          {/* Right sidebar */}

          <aside className="grid content-start gap-5">
            {/* Quick Control */}

            <DetailCard
              title="Quick Controls"
              description="Update current status and availability."
              icon={Activity}
            >
              <div className="grid gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Availability
                  </label>

                  <div className="relative">
                    <select
                      value={
                        tailor?.availability ||
                        "unavailable"
                      }
                      onChange={
                        handleAvailabilityChange
                      }
                      disabled={
                        availabilityUpdating
                      }
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 pr-10 text-sm text-gray-800 outline-none transition focus:border-[#800020]/40 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="available">
                        Available
                      </option>

                      <option value="busy">
                        Busy
                      </option>

                      <option value="on_leave">
                        On Leave
                      </option>

                      <option value="unavailable">
                        Unavailable
                      </option>
                    </select>

                    {availabilityUpdating && (
                      <Loader2
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#800020]"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Account Status
                  </label>

                  <div className="relative">
                    <select
                      value={
                        tailor?.status ||
                        "inactive"
                      }
                      onChange={
                        handleStatusChange
                      }
                      disabled={
                        statusUpdating
                      }
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 pr-10 text-sm text-gray-800 outline-none transition focus:border-[#800020]/40 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="active">
                        Active
                      </option>

                      <option value="inactive">
                        Inactive
                      </option>

                      <option value="blocked">
                        Blocked
                      </option>
                    </select>

                    {statusUpdating && (
                      <Loader2
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#800020]"
                      />
                    )}
                  </div>
                </div>
              </div>
            </DetailCard>

            {/* Capacity */}

            <DetailCard
              title="Production Capacity"
              description="Configured workload limits."
              icon={Activity}
            >
              <div className="grid gap-3">
                <InfoItem
                  label="Daily Capacity"
                  value={`${
                    capacity.daily ??
                    tailor?.dailyCapacity ??
                    0
                  } pieces`}
                  icon={Clock3}
                />

                <InfoItem
                  label="Weekly Capacity"
                  value={`${
                    capacity.weekly ??
                    tailor?.weeklyCapacity ??
                    0
                  } pieces`}
                  icon={CalendarDays}
                />

                <InfoItem
                  label="Monthly Capacity"
                  value={`${
                    capacity.monthly ??
                    tailor?.monthlyCapacity ??
                    0
                  } pieces`}
                  icon={CalendarDays}
                />
              </div>
            </DetailCard>

            {/* Rate */}

            <DetailCard
              title="Default Rate"
              description="Used as a fallback during job creation."
              icon={BadgeIndianRupee}
            >
              <div className="rounded-xl border border-[#800020]/10 bg-[#800020]/[0.035] p-4">
                <p className="text-xs font-semibold text-[#800020]/70">
                  {formatLabel(
                    defaultRate.rateType ||
                      tailor?.rateType ||
                      "per_piece",
                  )}
                </p>

                <p className="mt-1 text-2xl font-bold text-[#800020]">
                  {formatMoney(
                    defaultRate.amount ??
                      tailor?.defaultRateAmount ??
                      0,
                  )}
                </p>
              </div>
            </DetailCard>

            {/* Job Summary */}

            <DetailCard
              title="Job Summary"
              description="Live production job overview."
              icon={BriefcaseBusiness}
            >
              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-3">
                  <span className="text-xs font-medium text-gray-600">
                    Active Jobs
                  </span>

                  <span className="text-sm font-bold text-gray-950">
                    {
                      statistics.assignedJobs
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-3">
                  <span className="text-xs font-medium text-gray-600">
                    Pending Jobs
                  </span>

                  <span className="text-sm font-bold text-gray-950">
                    {
                      statistics.pendingJobs
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-3">
                  <span className="text-xs font-medium text-gray-600">
                    Completed Jobs
                  </span>

                  <span className="text-sm font-bold text-gray-950">
                    {
                      statistics.completedJobs
                    }
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/production?tailorId=${tailorId}`,
                    )
                  }
                  className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#800020]/20 bg-white text-sm font-semibold text-[#800020] transition hover:bg-[#800020]/5"
                >
                  <BriefcaseBusiness
                    size={16}
                  />
                  View Production Jobs
                </button>
              </div>
            </DetailCard>
          </aside>
        </div>
      </div>
    </main>
  );
}