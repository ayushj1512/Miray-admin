"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import {
  Check,
  Loader2,
  MapPin,
  Minus,
  Package,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";

const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

const API_BASE_URL = RAW_API_URL.replace(/\/+$/, "");

const PRODUCTS_ENDPOINT =
  API_BASE_URL.endsWith("/api")
    ? `${API_BASE_URL}/products`
    : `${API_BASE_URL}/api/products`;

const EMPTY_FORM = {
  influencerName: "",
  instagramUsername: "",
  phone: "",
  email: "",

  address: {
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  },

  products: [],
  notes: "",
  createdBy: "",
  updatedBy: "",
  updateNote: "",
};

const inputClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black outline-none transition placeholder:text-gray-400 focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10";

const textareaClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-black outline-none transition placeholder:text-gray-400 focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10";

const getProductsFromResponse = (data) => {
  const items =
    data?.products ||
    data?.data?.products ||
    data?.data ||
    data?.results ||
    [];

  if (!Array.isArray(items)) return [];

  return items
    .map((item) => item?.product || item)
    .filter((item) => item?._id);
};

const getAttributeValue = (
  attributes = [],
  key
) => {
  const attribute = attributes.find(
    (item) =>
      String(item?.key || item?.name || "")
        .trim()
        .toLowerCase() === key.toLowerCase()
  );

  return String(
    attribute?.value ||
      attribute?.selectedValue ||
      ""
  ).trim();
};

const getVariantLabel = (variant) => {
  const attributes = Array.isArray(
    variant?.attributes
  )
    ? variant.attributes
    : [];

  const values = attributes
    .map((attribute) => {
      const key =
        attribute?.key ||
        attribute?.name ||
        "Option";

      const value =
        attribute?.value ||
        attribute?.selectedValue ||
        "";

      if (!value) return "";

      return `${key}: ${value}`;
    })
    .filter(Boolean);

  if (values.length) {
    return values.join(" / ");
  }

  return variant?.sku || "Default variant";
};

const normalizeInitialData = (data) => ({
  ...EMPTY_FORM,
  ...data,

  address: {
    ...EMPTY_FORM.address,
    ...(data?.address || {}),
  },

  products: Array.isArray(data?.products)
    ? data.products.map((product) => ({
        productId:
          product.productId?._id ||
          product.productId ||
          "",

        variantId:
          product.variantId?._id ||
          product.variantId ||
          "",

        productCode: product.productCode || "",
        title: product.title || "",
        thumbnail: product.thumbnail || "",
        selectedSize: product.selectedSize || "",
        selectedColor:
          product.selectedColor || "",
        sku: product.sku || "",
        quantity: Number(product.quantity) || 1,
        variants: product.variants || [],
      }))
    : [],
});

export default function InfluencerOrderForm({
  initialData = null,
  onSubmit,
  loading = false,
  mode = "create",
  submitLabel,
}) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState(() =>
    normalizeInitialData(initialData)
  );

  const [productSearch, setProductSearch] =
    useState("");

  const [searchResults, setSearchResults] =
    useState([]);

  const [searching, setSearching] =
    useState(false);

  const [searchError, setSearchError] =
    useState("");

  const [formError, setFormError] =
    useState("");

  useEffect(() => {
    setForm(normalizeInitialData(initialData));
  }, [initialData]);

  useEffect(() => {
    const search = productSearch.trim();

    if (search.length < 2) {
      setSearchResults([]);
      setSearching(false);
      setSearchError("");
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setSearching(true);
      setSearchError("");

      try {
        const response = await axios.get(
          PRODUCTS_ENDPOINT,
          {
            params: {
              search,
              page: 1,
              limit: 20,
            },
            withCredentials: true,
            signal: controller.signal,
          }
        );

        setSearchResults(
          getProductsFromResponse(response.data)
        );
      } catch (error) {
        if (
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }

        setSearchResults([]);
        setSearchError(
          error?.response?.data?.message ||
            "Unable to search products"
        );
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }, 450);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [productSearch]);

  const totalQuantity = useMemo(
    () =>
      form.products.reduce(
        (total, product) =>
          total +
          Math.max(
            0,
            Number(product.quantity) || 0
          ),
        0
      ),
    [form.products]
  );

  const updateField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const updateAddress = (name, value) => {
    setForm((current) => ({
      ...current,

      address: {
        ...current.address,
        [name]: value,
      },
    }));
  };

  const addProduct = (product) => {
    const alreadyAdded = form.products.some(
      (item) =>
        String(item.productId) ===
        String(product._id)
    );

    if (alreadyAdded) {
      setFormError(
        "This product is already added. Update its quantity below."
      );
      return;
    }

    const variants = Array.isArray(
      product.variants
    )
      ? product.variants
      : [];

    const firstVariant =
      variants.length === 1
        ? variants[0]
        : null;

    setForm((current) => ({
      ...current,

      products: [
        ...current.products,
        {
          productId: product._id,
          variantId: firstVariant?._id || "",
          productCode:
            product.productCode || "",
          title: product.title || "",
          thumbnail:
            product.thumbnail ||
            product.images?.[0] ||
            "",
          selectedSize: firstVariant
            ? getAttributeValue(
                firstVariant.attributes,
                "size"
              )
            : "",
          selectedColor: firstVariant
            ? getAttributeValue(
                firstVariant.attributes,
                "color"
              )
            : "",
          sku:
            firstVariant?.sku ||
            product.sku ||
            "",
          quantity: 1,
          variants,
        },
      ],
    }));

    setProductSearch("");
    setSearchResults([]);
    setFormError("");
  };

  const removeProduct = (index) => {
    setForm((current) => ({
      ...current,

      products: current.products.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const updateProduct = (
    index,
    updates
  ) => {
    setForm((current) => ({
      ...current,

      products: current.products.map(
        (product, itemIndex) =>
          itemIndex === index
            ? {
                ...product,
                ...updates,
              }
            : product
      ),
    }));
  };

  const selectVariant = (
    productIndex,
    variantId
  ) => {
    const product =
      form.products[productIndex];

    const variant = product.variants?.find(
      (item) =>
        String(item._id) === String(variantId)
    );

    updateProduct(productIndex, {
      variantId,
      selectedSize: variant
        ? getAttributeValue(
            variant.attributes,
            "size"
          )
        : "",
      selectedColor: variant
        ? getAttributeValue(
            variant.attributes,
            "color"
          )
        : "",
      sku: variant?.sku || "",
    });
  };

  const validateForm = () => {
    if (!form.influencerName.trim()) {
      return "Influencer name is required";
    }

    if (!form.phone.trim()) {
      return "Phone number is required";
    }

    if (!form.address.addressLine1.trim()) {
      return "Address line 1 is required";
    }

    if (!form.address.city.trim()) {
      return "City is required";
    }

    if (!form.address.state.trim()) {
      return "State is required";
    }

    if (!form.address.pincode.trim()) {
      return "Pincode is required";
    }

    if (
      !/^\d{6}$/.test(
        form.address.pincode.trim()
      )
    ) {
      return "Enter a valid 6-digit pincode";
    }

    if (!form.products.length) {
      return "Add at least one product";
    }

    const invalidQuantity =
      form.products.some(
        (product) =>
          Number(product.quantity) < 1
      );

    if (invalidQuantity) {
      return "Product quantity must be at least 1";
    }

    const missingVariant =
      form.products.some(
        (product) =>
          product.variants?.length > 0 &&
          !product.variantId
      );

    if (missingVariant) {
      return "Select a variant or size for every variable product";
    }

    if (
      !isEdit &&
      !form.createdBy.trim()
    ) {
      return "Created by name is required";
    }

    if (
      isEdit &&
      !form.updatedBy.trim()
    ) {
      return "Updated by name is required";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setFormError(validationError);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    setFormError("");

    const payload = {
      influencerName:
        form.influencerName.trim(),

      instagramUsername:
        form.instagramUsername
          .trim()
          .replace(/^@/, ""),

      phone: form.phone.trim(),
      email: form.email.trim(),

      address: {
        addressLine1:
          form.address.addressLine1.trim(),

        addressLine2:
          form.address.addressLine2.trim(),

        landmark:
          form.address.landmark.trim(),

        city: form.address.city.trim(),
        state: form.address.state.trim(),

        pincode:
          form.address.pincode.trim(),

        country:
          form.address.country.trim() ||
          "India",
      },

      products: form.products.map(
        (product) => ({
          productId: product.productId,
          variantId:
            product.variantId || null,

          selectedSize:
            product.selectedSize || "",

          selectedColor:
            product.selectedColor || "",

          quantity: Number(
            product.quantity
          ),
        })
      ),

      notes: form.notes.trim(),
    };

    if (isEdit) {
      payload.updatedBy =
        form.updatedBy.trim();

      payload.updateNote =
        form.updateNote.trim();
    } else {
      payload.createdBy =
        form.createdBy.trim();
    }

    await onSubmit?.(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {formError}
        </div>
      )}

      {/* Influencer details */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#800020]/10 text-[#800020]">
            <UserRound size={20} />
          </div>

          <div>
            <h2 className="font-bold">
              Influencer Details
            </h2>

            <p className="text-xs text-gray-500">
              Contact and social profile information
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-semibold">
              Influencer name *
            </span>

            <input
              value={form.influencerName}
              onChange={(event) =>
                updateField(
                  "influencerName",
                  event.target.value
                )
              }
              placeholder="Enter full name"
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-semibold">
              Instagram username
            </span>

            <input
              value={form.instagramUsername}
              onChange={(event) =>
                updateField(
                  "instagramUsername",
                  event.target.value
                )
              }
              placeholder="@username"
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-semibold">
              Phone number *
            </span>

            <input
              type="tel"
              value={form.phone}
              onChange={(event) =>
                updateField(
                  "phone",
                  event.target.value
                )
              }
              placeholder="10-digit phone number"
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-semibold">
              Email
            </span>

            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                updateField(
                  "email",
                  event.target.value
                )
              }
              placeholder="influencer@example.com"
              className={inputClass}
            />
          </label>
        </div>
      </section>

      {/* Address */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#800020]/10 text-[#800020]">
            <MapPin size={20} />
          </div>

          <div>
            <h2 className="font-bold">
              Delivery Address
            </h2>

            <p className="text-xs text-gray-500">
              Address used by the warehouse for dispatch
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-sm font-semibold">
              Address line 1 *
            </span>

            <input
              value={form.address.addressLine1}
              onChange={(event) =>
                updateAddress(
                  "addressLine1",
                  event.target.value
                )
              }
              placeholder="House, building, street"
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-semibold">
              Address line 2
            </span>

            <input
              value={form.address.addressLine2}
              onChange={(event) =>
                updateAddress(
                  "addressLine2",
                  event.target.value
                )
              }
              placeholder="Area or locality"
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-semibold">
              Landmark
            </span>

            <input
              value={form.address.landmark}
              onChange={(event) =>
                updateAddress(
                  "landmark",
                  event.target.value
                )
              }
              placeholder="Nearby landmark"
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-semibold">
              City *
            </span>

            <input
              value={form.address.city}
              onChange={(event) =>
                updateAddress(
                  "city",
                  event.target.value
                )
              }
              placeholder="City"
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-semibold">
              State *
            </span>

            <input
              value={form.address.state}
              onChange={(event) =>
                updateAddress(
                  "state",
                  event.target.value
                )
              }
              placeholder="State"
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-semibold">
              Pincode *
            </span>

            <input
              inputMode="numeric"
              maxLength={6}
              value={form.address.pincode}
              onChange={(event) =>
                updateAddress(
                  "pincode",
                  event.target.value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
              placeholder="6-digit pincode"
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-semibold">
              Country
            </span>

            <input
              value={form.address.country}
              onChange={(event) =>
                updateAddress(
                  "country",
                  event.target.value
                )
              }
              className={inputClass}
            />
          </label>
        </div>
      </section>

      {/* Products */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#800020]/10 text-[#800020]">
              <Package size={20} />
            </div>

            <div>
              <h2 className="font-bold">
                Products
              </h2>

              <p className="text-xs text-gray-500">
                Search products and select their variants
              </p>
            </div>
          </div>

          <span className="rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white">
            {totalQuantity} pieces
          </span>
        </div>

        <div className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-[14px] text-gray-400"
          />

          <input
            value={productSearch}
            onChange={(event) =>
              setProductSearch(
                event.target.value
              )
            }
            placeholder="Search by product name or code"
            className={`${inputClass} pl-10`}
          />

          {searching && (
            <Loader2
              size={17}
              className="absolute right-3 top-[14px] animate-spin text-[#800020]"
            />
          )}

          {(searchResults.length > 0 ||
            searchError) && (
            <div className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
              {searchError ? (
                <p className="p-3 text-sm text-red-600">
                  {searchError}
                </p>
              ) : (
                searchResults.map((product) => (
                  <button
                    key={product._id}
                    type="button"
                    onClick={() =>
                      addProduct(product)
                    }
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-[#800020]/5"
                  >
                    <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {product.thumbnail ||
                      product.images?.[0] ? (
                        <img
                          src={
                            product.thumbnail ||
                            product.images?.[0]
                          }
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="m-auto mt-3 text-gray-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {product.title}
                      </p>

                      <p className="text-xs text-[#800020]">
                        {product.productCode ||
                          "No product code"}
                      </p>
                    </div>

                    <Plus
                      size={18}
                      className="text-[#800020]"
                    />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="mt-5 space-y-3">
          {form.products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center">
              <Package
                size={30}
                className="mx-auto mb-2 text-gray-300"
              />

              <p className="text-sm font-semibold">
                No products added
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Search above using product name or code.
              </p>
            </div>
          ) : (
            form.products.map(
              (product, index) => (
                <article
                  key={`${product.productId}-${index}`}
                  className="rounded-xl border border-gray-200 p-3 sm:p-4"
                >
                  <div className="flex gap-3">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="m-auto mt-6 text-gray-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {product.title}
                          </p>

                          <p className="mt-1 text-xs font-bold text-[#800020]">
                            {product.productCode ||
                              "No product code"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeProduct(index)
                          }
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                          aria-label="Remove product"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(180px,1fr)_140px]">
                        {product.variants?.length >
                        0 ? (
                          <select
                            value={
                              product.variantId
                            }
                            onChange={(event) =>
                              selectVariant(
                                index,
                                event.target.value
                              )
                            }
                            className={inputClass}
                          >
                            <option value="">
                              Select variant / size
                            </option>

                            {product.variants.map(
                              (variant) => (
                                <option
                                  key={variant._id}
                                  value={variant._id}
                                >
                                  {getVariantLabel(
                                    variant
                                  )}
                                </option>
                              )
                            )}
                          </select>
                        ) : (
                          <div className="flex h-11 items-center rounded-xl bg-gray-50 px-3 text-sm text-gray-500">
                            Simple product
                          </div>
                        )}

                        <div className="flex h-11 items-center justify-between rounded-xl border border-gray-200">
                          <button
                            type="button"
                            onClick={() =>
                              updateProduct(
                                index,
                                {
                                  quantity:
                                    Math.max(
                                      1,
                                      Number(
                                        product.quantity
                                      ) - 1
                                    ),
                                }
                              )
                            }
                            className="flex h-full w-11 items-center justify-center text-[#800020]"
                          >
                            <Minus size={16} />
                          </button>

                          <input
                            type="number"
                            min={1}
                            value={
                              product.quantity
                            }
                            onChange={(event) =>
                              updateProduct(
                                index,
                                {
                                  quantity:
                                    Math.max(
                                      1,
                                      Number(
                                        event.target
                                          .value
                                      ) || 1
                                    ),
                                }
                              )
                            }
                            className="w-14 border-0 bg-transparent text-center text-sm font-bold outline-none"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              updateProduct(
                                index,
                                {
                                  quantity:
                                    Number(
                                      product.quantity
                                    ) + 1,
                                }
                              )
                            }
                            className="flex h-full w-11 items-center justify-center text-[#800020]"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      {(product.selectedSize ||
                        product.selectedColor ||
                        product.sku) && (
                        <p className="mt-2 text-xs text-gray-500">
                          {[
                            product.selectedSize &&
                              `Size: ${product.selectedSize}`,
                            product.selectedColor &&
                              `Color: ${product.selectedColor}`,
                            product.sku &&
                              `SKU: ${product.sku}`,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              )
            )
          )}
        </div>
      </section>

      {/* Notes and creator */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-5 font-bold">
          Internal Details
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-semibold">
              {isEdit
                ? "Updated by *"
                : "Created by *"}
            </span>

            <input
              value={
                isEdit
                  ? form.updatedBy
                  : form.createdBy
              }
              onChange={(event) =>
                updateField(
                  isEdit
                    ? "updatedBy"
                    : "createdBy",
                  event.target.value
                )
              }
              placeholder="Enter your name"
              className={inputClass}
            />
          </label>

          {isEdit && (
            <label className="space-y-1.5">
              <span className="text-sm font-semibold">
                Update note
              </span>

              <input
                value={form.updateNote}
                onChange={(event) =>
                  updateField(
                    "updateNote",
                    event.target.value
                  )
                }
                placeholder="What was changed?"
                className={inputClass}
              />
            </label>
          )}

          <label className="space-y-1.5 md:col-span-2">
            <span className="text-sm font-semibold">
              Internal notes
            </span>

            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) =>
                updateField(
                  "notes",
                  event.target.value
                )
              }
              placeholder="Add campaign, gifting or dispatch instructions"
              className={textareaClass}
            />
          </label>
        </div>
      </section>

      {/* Submit */}
      <div className="sticky bottom-3 z-20 flex justify-end rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 min-w-[180px] items-center justify-center gap-2 rounded-xl bg-[#800020] px-5 text-sm font-bold text-white transition hover:bg-[#68001a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2
                size={17}
                className="animate-spin"
              />
              Saving...
            </>
          ) : (
            <>
              <Check size={17} />

              {submitLabel ||
                (isEdit
                  ? "Update Order"
                  : "Create Order")}
            </>
          )}
        </button>
      </div>
    </form>
  );
}