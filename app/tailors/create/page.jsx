"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleDollarSign,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Save,
  Scissors,
  Trash2,
  UserRound,
} from "lucide-react";

import useTailorStore from "@/store/useTailorStore";

const SKILL_OPTIONS = [
  "sampling",
  "pattern",
  "cutting",
  "stitching",
  "finishing",
  "embroidery",
  "alteration",
];

const SIZE_OPTIONS = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
];

const WORK_TYPE_OPTIONS = [
  "sampling",
  "cutting",
  "stitching",
  "finishing",
  "alteration",
  "complete_garment",
];

const INITIAL_FORM = {
  name: "",
  tailorCode: "",
  phone: "",
  alternatePhone: "",
  email: "",

  address: {
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  },

  type: "individual",

  skills: [],
  supportedSizes: [
    "XS",
    "S",
    "M",
    "L",
    "XL",
  ],

  supportedWorkTypes: [
    "stitching",
  ],

  capacity: {
    daily: "",
    weekly: "",
    monthly: "",
  },

  defaultRate: {
    rateType: "per_piece",
    amount: "",
  },

  availability: "available",
  status: "active",

  joinedAt: "",
  notes: "",
};

const normalizeNumber = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

const formatLabel = (value) => {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
};

const FieldLabel = ({
  children,
  required = false,
}) => {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
      {children}

      {required && (
        <span className="ml-1 text-red-500">
          *
        </span>
      )}
    </label>
  );
};

const SectionCard = ({
  title,
  description,
  icon: Icon,
  children,
}) => {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
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

      <div className="p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
};

const ChoiceButton = ({
  selected,
  label,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition",

        selected
          ? "border-[#800020] bg-[#800020] text-white shadow-sm"
          : "border-gray-200 bg-white text-gray-700 hover:border-[#800020]/30 hover:bg-[#800020]/[0.025] hover:text-[#800020]",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-4 w-4 items-center justify-center rounded-full border",

          selected
            ? "border-white/70 bg-white/10"
            : "border-gray-300",
        ].join(" ")}
      >
        {selected && <Check size={11} />}
      </span>

      {label}
    </button>
  );
};

export default function CreateTailorPage() {
  const router = useRouter();

  const createTailor = useTailorStore(
    (state) => state.createTailor,
  );

  const submitting = useTailorStore(
    (state) => state.submitting,
  );

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [error, setError] =
    useState("");

  const inputClassName =
    "h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#800020]/40 focus:bg-white focus:ring-4 focus:ring-[#800020]/5";

  const textareaClassName =
    "min-h-28 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#800020]/40 focus:bg-white focus:ring-4 focus:ring-[#800020]/5";

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length >= 2 &&
      form.phone.trim().length >= 10 &&
      form.skills.length > 0 &&
      !submitting
    );
  }, [
    form.name,
    form.phone,
    form.skills,
    submitting,
  ]);

  const updateField = (
    field,
    value,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateNestedField = (
    parent,
    field,
    value,
  ) => {
    setForm((current) => ({
      ...current,

      [parent]: {
        ...current[parent],
        [field]: value,
      },
    }));
  };

  const toggleArrayValue = (
    field,
    value,
  ) => {
    setForm((current) => {
      const currentValues = Array.isArray(
        current[field],
      )
        ? current[field]
        : [];

      const exists =
        currentValues.includes(value);

      return {
        ...current,

        [field]: exists
          ? currentValues.filter(
              (item) => item !== value,
            )
          : [...currentValues, value],
      };
    });
  };

  const validateForm = () => {
    if (form.name.trim().length < 2) {
      return "Enter a valid tailor name.";
    }

    if (form.phone.trim().length < 10) {
      return "Enter a valid phone number.";
    }

    if (form.skills.length === 0) {
      return "Select at least one skill.";
    }

    if (
      form.supportedWorkTypes.length ===
      0
    ) {
      return "Select at least one work type.";
    }

    if (
      form.supportedSizes.length === 0
    ) {
      return "Select at least one supported size.";
    }

    return "";
  };

  const buildPayload = () => {
    return {
      name: form.name.trim(),

      tailorCode:
        form.tailorCode.trim() ||
        undefined,

      phone: form.phone.trim(),

      alternatePhone:
        form.alternatePhone.trim() ||
        undefined,

      email:
        form.email.trim() ||
        undefined,

      address: {
        line1:
          form.address.line1.trim(),

        line2:
          form.address.line2.trim(),

        city:
          form.address.city.trim(),

        state:
          form.address.state.trim(),

        pincode:
          form.address.pincode.trim(),
      },

      type: form.type,

      skills: form.skills,

      supportedSizes:
        form.supportedSizes,

      supportedWorkTypes:
        form.supportedWorkTypes,

      capacity: {
        daily: normalizeNumber(
          form.capacity.daily,
        ),

        weekly: normalizeNumber(
          form.capacity.weekly,
        ),

        monthly: normalizeNumber(
          form.capacity.monthly,
        ),
      },

      defaultRate: {
        rateType:
          form.defaultRate.rateType,

        amount: normalizeNumber(
          form.defaultRate.amount,
        ),
      },

      availability:
        form.availability,

      status: form.status,

      joinedAt:
        form.joinedAt ||
        undefined,

      notes:
        form.notes.trim() ||
        undefined,
    };
  };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const response =
        await createTailor(
          buildPayload(),
        );

      const createdTailor =
        response?.tailor ||
        response?.data?.tailor ||
        response?.data ||
        response;

      const tailorId =
        createdTailor?._id ||
        createdTailor?.id;

      if (tailorId) {
        router.push(
          `/tailors/${tailorId}`,
        );

        return;
      }

      router.push("/tailors");
    } catch (submitError) {
      setError(
        submitError?.message ||
          "Unable to create tailor.",
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfafb] px-3 py-5 sm:px-6 lg:px-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-6xl"
      >
        {/* Header */}

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() =>
                router.back()
              }
              className="mt-0.5 rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm transition hover:border-[#800020]/20 hover:text-[#800020]"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">
                Create Tailor
              </h1>

              <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                Add profile, skills,
                capacity and default rates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() =>
                router.push("/tailors")
              }
              className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#800020]/20 hover:text-[#800020] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#800020] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#68001a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              {submitting
                ? "Creating..."
                : "Create Tailor"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-5">
          {/* Basic details */}

          <SectionCard
            title="Basic Details"
            description="Primary tailor identity and contact information."
            icon={UserRound}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <FieldLabel required>
                  Tailor Name
                </FieldLabel>

                <input
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value,
                    )
                  }
                  placeholder="Enter tailor name"
                  className={inputClassName}
                />
              </div>

              <div>
                <FieldLabel>
                  Tailor Code
                </FieldLabel>

                <input
                  value={form.tailorCode}
                  onChange={(event) =>
                    updateField(
                      "tailorCode",
                      event.target.value.toUpperCase(),
                    )
                  }
                  placeholder="Auto generated if empty"
                  className={inputClassName}
                />
              </div>

              <div>
                <FieldLabel>
                  Tailor Type
                </FieldLabel>

                <select
                  value={form.type}
                  onChange={(event) =>
                    updateField(
                      "type",
                      event.target.value,
                    )
                  }
                  className={inputClassName}
                >
                  <option value="individual">
                    Individual
                  </option>

                  <option value="in_house">
                    In House
                  </option>

                  <option value="contractor">
                    Contractor
                  </option>

                  <option value="vendor">
                    Vendor
                  </option>
                </select>
              </div>

              <div>
                <FieldLabel required>
                  Phone Number
                </FieldLabel>

                <div className="relative">
                  <Phone
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    value={form.phone}
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value.replace(
                          /\D/g,
                          "",
                        ),
                      )
                    }
                    maxLength={15}
                    placeholder="Enter phone number"
                    className={`${inputClassName} pl-10`}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>
                  Alternate Phone
                </FieldLabel>

                <input
                  value={
                    form.alternatePhone
                  }
                  onChange={(event) =>
                    updateField(
                      "alternatePhone",
                      event.target.value.replace(
                        /\D/g,
                        "",
                      ),
                    )
                  }
                  maxLength={15}
                  placeholder="Optional"
                  className={inputClassName}
                />
              </div>

              <div>
                <FieldLabel>
                  Email
                </FieldLabel>

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value,
                    )
                  }
                  placeholder="Optional email"
                  className={inputClassName}
                />
              </div>

              <div>
                <FieldLabel>
                  Joined Date
                </FieldLabel>

                <div className="relative">
                  <CalendarDays
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="date"
                    value={form.joinedAt}
                    onChange={(event) =>
                      updateField(
                        "joinedAt",
                        event.target.value,
                      )
                    }
                    className={`${inputClassName} pl-10`}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>
                  Status
                </FieldLabel>

                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target.value,
                    )
                  }
                  className={inputClassName}
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
              </div>

              <div>
                <FieldLabel>
                  Availability
                </FieldLabel>

                <select
                  value={
                    form.availability
                  }
                  onChange={(event) =>
                    updateField(
                      "availability",
                      event.target.value,
                    )
                  }
                  className={inputClassName}
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
              </div>
            </div>
          </SectionCard>

          {/* Address */}

          <SectionCard
            title="Address"
            description="Tailor location and contact address."
            icon={MapPin}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel>
                  Address Line 1
                </FieldLabel>

                <input
                  value={
                    form.address.line1
                  }
                  onChange={(event) =>
                    updateNestedField(
                      "address",
                      "line1",
                      event.target.value,
                    )
                  }
                  placeholder="House, shop or street"
                  className={inputClassName}
                />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>
                  Address Line 2
                </FieldLabel>

                <input
                  value={
                    form.address.line2
                  }
                  onChange={(event) =>
                    updateNestedField(
                      "address",
                      "line2",
                      event.target.value,
                    )
                  }
                  placeholder="Area or landmark"
                  className={inputClassName}
                />
              </div>

              <div>
                <FieldLabel>
                  City
                </FieldLabel>

                <input
                  value={form.address.city}
                  onChange={(event) =>
                    updateNestedField(
                      "address",
                      "city",
                      event.target.value,
                    )
                  }
                  placeholder="City"
                  className={inputClassName}
                />
              </div>

              <div>
                <FieldLabel>
                  State
                </FieldLabel>

                <input
                  value={
                    form.address.state
                  }
                  onChange={(event) =>
                    updateNestedField(
                      "address",
                      "state",
                      event.target.value,
                    )
                  }
                  placeholder="State"
                  className={inputClassName}
                />
              </div>

              <div>
                <FieldLabel>
                  Pincode
                </FieldLabel>

                <input
                  value={
                    form.address.pincode
                  }
                  onChange={(event) =>
                    updateNestedField(
                      "address",
                      "pincode",
                      event.target.value.replace(
                        /\D/g,
                        "",
                      ),
                    )
                  }
                  maxLength={6}
                  placeholder="Pincode"
                  className={inputClassName}
                />
              </div>
            </div>
          </SectionCard>

          {/* Skills */}

          <SectionCard
            title="Skills"
            description="Select operations this tailor can perform."
            icon={Scissors}
          >
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map(
                (skill) => (
                  <ChoiceButton
                    key={skill}
                    label={formatLabel(
                      skill,
                    )}
                    selected={form.skills.includes(
                      skill,
                    )}
                    onClick={() =>
                      toggleArrayValue(
                        "skills",
                        skill,
                      )
                    }
                  />
                ),
              )}
            </div>
          </SectionCard>

          {/* Work and sizes */}

          <SectionCard
            title="Production Capability"
            description="Configure supported sizes and job types."
            icon={BriefcaseBusiness}
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <FieldLabel required>
                  Supported Sizes
                </FieldLabel>

                <div className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map(
                    (size) => (
                      <ChoiceButton
                        key={size}
                        label={size}
                        selected={form.supportedSizes.includes(
                          size,
                        )}
                        onClick={() =>
                          toggleArrayValue(
                            "supportedSizes",
                            size,
                          )
                        }
                      />
                    ),
                  )}
                </div>
              </div>

              <div>
                <FieldLabel required>
                  Supported Work Types
                </FieldLabel>

                <div className="flex flex-wrap gap-2">
                  {WORK_TYPE_OPTIONS.map(
                    (workType) => (
                      <ChoiceButton
                        key={workType}
                        label={formatLabel(
                          workType,
                        )}
                        selected={form.supportedWorkTypes.includes(
                          workType,
                        )}
                        onClick={() =>
                          toggleArrayValue(
                            "supportedWorkTypes",
                            workType,
                          )
                        }
                      />
                    ),
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Capacity */}

          <SectionCard
            title="Capacity"
            description="Approximate production capacity for workload planning."
            icon={Plus}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <FieldLabel>
                  Daily Capacity
                </FieldLabel>

                <input
                  type="number"
                  min="0"
                  value={
                    form.capacity.daily
                  }
                  onChange={(event) =>
                    updateNestedField(
                      "capacity",
                      "daily",
                      event.target.value,
                    )
                  }
                  placeholder="Pieces per day"
                  className={inputClassName}
                />
              </div>

              <div>
                <FieldLabel>
                  Weekly Capacity
                </FieldLabel>

                <input
                  type="number"
                  min="0"
                  value={
                    form.capacity.weekly
                  }
                  onChange={(event) =>
                    updateNestedField(
                      "capacity",
                      "weekly",
                      event.target.value,
                    )
                  }
                  placeholder="Pieces per week"
                  className={inputClassName}
                />
              </div>

              <div>
                <FieldLabel>
                  Monthly Capacity
                </FieldLabel>

                <input
                  type="number"
                  min="0"
                  value={
                    form.capacity.monthly
                  }
                  onChange={(event) =>
                    updateNestedField(
                      "capacity",
                      "monthly",
                      event.target.value,
                    )
                  }
                  placeholder="Pieces per month"
                  className={inputClassName}
                />
              </div>
            </div>
          </SectionCard>

          {/* Rate */}

          <SectionCard
            title="Default Payment Rate"
            description="This default may be overridden during product assignment or job creation."
            icon={CircleDollarSign}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>
                  Rate Type
                </FieldLabel>

                <select
                  value={
                    form.defaultRate
                      .rateType
                  }
                  onChange={(event) =>
                    updateNestedField(
                      "defaultRate",
                      "rateType",
                      event.target.value,
                    )
                  }
                  className={inputClassName}
                >
                  <option value="per_piece">
                    Per Piece
                  </option>

                  <option value="per_day">
                    Per Day
                  </option>

                  <option value="fixed">
                    Fixed
                  </option>
                </select>
              </div>

              <div>
                <FieldLabel>
                  Default Amount
                </FieldLabel>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.defaultRate.amount
                  }
                  onChange={(event) =>
                    updateNestedField(
                      "defaultRate",
                      "amount",
                      event.target.value,
                    )
                  }
                  placeholder="Enter rate amount"
                  className={inputClassName}
                />
              </div>
            </div>
          </SectionCard>

          {/* Notes */}

          <SectionCard
            title="Internal Notes"
            description="Additional details for your production team."
            icon={Trash2}
          >
            <FieldLabel>
              Notes
            </FieldLabel>

            <textarea
              value={form.notes}
              onChange={(event) =>
                updateField(
                  "notes",
                  event.target.value,
                )
              }
              placeholder="Add experience, quality notes, special instructions or restrictions..."
              className={textareaClassName}
            />
          </SectionCard>
        </div>

        {/* Bottom action bar */}

        <div className="sticky bottom-3 z-20 mt-5 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <p className="hidden text-xs text-gray-500 sm:block">
            Name, phone and at least one
            skill are required.
          </p>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() =>
                router.push("/tailors")
              }
              className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-[#800020]/20 hover:text-[#800020] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#800020] px-5 text-sm font-semibold text-white transition hover:bg-[#68001a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              {submitting
                ? "Creating..."
                : "Create Tailor"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}