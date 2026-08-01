"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";

import useTailorStore from "@/store/useTailorStore";

/* =========================================================
   DEFAULT FORM
========================================================= */

const EMPTY_FORM = {
  name: "",
  mobile: "",
  alternateMobile: "",
  address: "",
  isActive: true,
  notes: "",
};

/* =========================================================
   HELPERS
========================================================= */

const clean = (value) =>
  String(value ?? "").trim();

const inputClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#800020]/40 focus:bg-white focus:ring-4 focus:ring-[#800020]/5 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClass =
  "min-h-28 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#800020]/40 focus:bg-white focus:ring-4 focus:ring-[#800020]/5";

const mapTailorToForm = (tailor) => ({
  name: clean(tailor?.name),

  mobile: clean(tailor?.mobile),

  alternateMobile: clean(
    tailor?.alternateMobile,
  ),

  address: clean(tailor?.address),

  isActive:
    tailor?.isActive !== false,

  notes: clean(tailor?.notes),
});

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function Field({
  label,
  required = false,
  children,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function Section({
  title,
  description,
  icon: Icon,
  children,
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
        <div className="rounded-xl bg-[#800020]/10 p-2.5 text-[#800020]">
          <Icon size={18} />
        </div>

        <div>
          <h2 className="font-bold text-gray-950">
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
}

/* =========================================================
   PAGE
========================================================= */

export default function EditTailorPage() {
  const params = useParams();
  const router = useRouter();

  const tailorId = params?.id;

  const {
    currentTailor,
    detailLoading,
    updating,
    fetchTailorById,
    updateTailor,
    clearCurrentTailor,
  } = useTailorStore();

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [initialized, setInitialized] =
    useState(false);

  const [error, setError] = useState("");

  /* Load tailor */
  useEffect(() => {
    if (!tailorId) return;

    let active = true;

    const loadTailor = async () => {
      setError("");

      try {
        const tailor =
          await fetchTailorById(tailorId);

        if (!active || !tailor) return;

        setForm(
          mapTailorToForm(tailor),
        );

        setInitialized(true);
      } catch (loadError) {
        if (!active) return;

        setError(
          loadError?.message ||
            "Unable to load tailor.",
        );
      }
    };

    loadTailor();

    return () => {
      active = false;
      clearCurrentTailor();
    };
  }, [
    tailorId,
    fetchTailorById,
    clearCurrentTailor,
  ]);

  /* Sync loaded store value */
  useEffect(() => {
    if (
      initialized ||
      !currentTailor ||
      String(currentTailor._id) !==
        String(tailorId)
    ) {
      return;
    }

    setForm(
      mapTailorToForm(currentTailor),
    );

    setInitialized(true);
  }, [
    currentTailor,
    tailorId,
    initialized,
  ]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const canSubmit = useMemo(
    () =>
      clean(form.name).length >= 2 &&
      clean(form.mobile).length >= 10 &&
      initialized &&
      !updating,
    [
      form.name,
      form.mobile,
      initialized,
      updating,
    ],
  );

  const validateForm = () => {
    if (clean(form.name).length < 2) {
      return "Enter a valid tailor name.";
    }

    if (clean(form.mobile).length < 10) {
      return "Enter a valid mobile number.";
    }

    return "";
  };

  const buildPayload = () => ({
    name: clean(form.name),

    mobile: clean(form.mobile),

    alternateMobile: clean(
      form.alternateMobile,
    ),

    address: clean(form.address),

    isActive: Boolean(form.isActive),

    notes: clean(form.notes),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!tailorId || updating) return;

    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await updateTailor(
        tailorId,
        buildPayload(),
      );

      router.push(
        `/tailors/${tailorId}`,
      );

      router.refresh();
    } catch (updateError) {
      setError(
        updateError?.message ||
          "Unable to update tailor.",
      );
    }
  };

  if (detailLoading && !initialized) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <Loader2
            size={20}
            className="animate-spin"
          />

          Loading tailor...
        </div>
      </main>
    );
  }

  if (error && !initialized) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/tailors")
            }
            className="mt-4 rounded-xl bg-[#800020] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Tailors
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fcfafb] px-3 py-5 sm:px-6 lg:px-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-4xl"
      >
        {/* Header */}

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm transition hover:text-[#800020]"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">
                Edit Tailor
              </h1>

              <p className="text-xs text-gray-500 sm:text-sm">
                {currentTailor?.tailorCode
                  ? `${currentTailor.tailorCode} · `
                  : ""}
                Update basic tailor details.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#800020] px-5 text-sm font-semibold text-white transition hover:bg-[#68001a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updating ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            {updating
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>

        {error && initialized && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-5">
          {/* Basic details */}

          <Section
            title="Basic Details"
            description="Tailor identity and contact information."
            icon={UserRound}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Tailor Name"
                required
              >
                <input
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value,
                    )
                  }
                  placeholder="Enter tailor name"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Mobile Number"
                required
              >
                <input
                  value={form.mobile}
                  onChange={(event) =>
                    updateField(
                      "mobile",
                      event.target.value.replace(
                        /\D/g,
                        "",
                      ),
                    )
                  }
                  maxLength={15}
                  placeholder="Enter mobile number"
                  className={inputClass}
                />
              </Field>

              <Field label="Alternate Mobile">
                <input
                  value={form.alternateMobile}
                  onChange={(event) =>
                    updateField(
                      "alternateMobile",
                      event.target.value.replace(
                        /\D/g,
                        "",
                      ),
                    )
                  }
                  maxLength={15}
                  placeholder="Optional"
                  className={inputClass}
                />
              </Field>

              <Field label="Status">
                <select
                  value={
                    form.isActive
                      ? "active"
                      : "inactive"
                  }
                  onChange={(event) =>
                    updateField(
                      "isActive",
                      event.target.value ===
                        "active",
                    )
                  }
                  className={inputClass}
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>
              </Field>
            </div>
          </Section>

          {/* Address */}

          <Section
            title="Address"
            description="Tailor working location."
            icon={MapPin}
          >
            <Field label="Full Address">
              <textarea
                value={form.address}
                onChange={(event) =>
                  updateField(
                    "address",
                    event.target.value,
                  )
                }
                placeholder="House, shop, street, area, city, state and pincode"
                className={textareaClass}
              />
            </Field>
          </Section>

          {/* Notes */}

          <Section
            title="Notes"
            description="Optional internal notes."
            icon={UserRound}
          >
            <textarea
              value={form.notes}
              onChange={(event) =>
                updateField(
                  "notes",
                  event.target.value,
                )
              }
              placeholder="Experience, quality notes or special instructions..."
              className={textareaClass}
            />
          </Section>
        </div>

        {/* Bottom actions */}

        <div className="sticky bottom-3 z-20 mt-5 flex justify-end gap-2 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          <button
            type="button"
            disabled={updating}
            onClick={() =>
              router.push(
                `/tailors/${tailorId}`,
              )
            }
            className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:text-[#800020] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#800020] px-5 text-sm font-semibold text-white transition hover:bg-[#68001a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updating ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            {updating
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </form>
    </main>
  );
}