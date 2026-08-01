"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";

import useTailorStore from "@/store/useTailorStore";

const INITIAL_FORM = {
  name: "",
  mobile: "",
  alternateMobile: "",
  address: "",
  isActive: true,
  notes: "",
};

const inputClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none transition focus:border-[#800020]/40 focus:bg-white focus:ring-4 focus:ring-[#800020]/5";

const textareaClass =
  "min-h-28 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none transition focus:border-[#800020]/40 focus:bg-white focus:ring-4 focus:ring-[#800020]/5";

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

export default function CreateTailorPage() {
  const router = useRouter();

  const createTailor = useTailorStore(
    (state) => state.createTailor,
  );

  const creating = useTailorStore(
    (state) => state.creating,
  );

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const canSubmit = useMemo(() => {
    const name = form.name.trim();
    const mobile = form.mobile.trim();

    return (
      name.length >= 2 &&
      mobile.length >= 10 &&
      !creating
    );
  }, [
    form.name,
    form.mobile,
    creating,
  ]);

  const validateForm = () => {
    if (form.name.trim().length < 2) {
      return "Enter a valid tailor name.";
    }

    if (form.mobile.trim().length < 10) {
      return "Enter a valid mobile number.";
    }

    return "";
  };

  const buildPayload = () => ({
    name: form.name.trim(),

    mobile: form.mobile.trim(),

    alternateMobile:
      form.alternateMobile.trim(),

    address: form.address.trim(),

    isActive: form.isActive,

    notes: form.notes.trim(),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (creating) return;

    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const tailor = await createTailor(
        buildPayload(),
      );

      router.push(
        tailor?._id
          ? `/tailors/${tailor._id}`
          : "/tailors",
      );
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
        className="mx-auto max-w-4xl"
      >
        {/* Header */}

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm hover:text-[#800020]"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">
                Create Tailor
              </h1>

              <p className="text-xs text-gray-500 sm:text-sm">
                Add basic tailor details.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#800020] px-5 text-sm font-semibold text-white hover:bg-[#68001a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            {creating
              ? "Creating..."
              : "Create Tailor"}
          </button>
        </div>

        {/* Error */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-5">
          {/* Basic Details */}

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

        {/* Bottom Actions */}

        <div className="sticky bottom-3 z-20 mt-5 flex justify-end gap-2 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          <button
            type="button"
            disabled={creating}
            onClick={() =>
              router.push("/tailors")
            }
            className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:text-[#800020] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#800020] px-5 text-sm font-semibold text-white hover:bg-[#68001a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            {creating
              ? "Creating..."
              : "Create Tailor"}
          </button>
        </div>
      </form>
    </main>
  );
}