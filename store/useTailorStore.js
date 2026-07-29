"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import toast from "react-hot-toast";

const API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tailors`;

/* =========================================================
   HELPERS
========================================================= */

const clean = (value) =>
  value == null ? "" : String(value).trim();

const getErrorMessage = async (
  response,
  fallback = "Something went wrong",
) => {
  try {
    const data = await response.json();

    return (
      data?.message ||
      data?.error ||
      fallback
    );
  } catch {
    return fallback;
  }
};

const toQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (value == null) return;

      if (Array.isArray(value)) {
        const cleanedValues = value
          .map(clean)
          .filter(Boolean);

        if (cleanedValues.length > 0) {
          query.set(
            key,
            cleanedValues.join(","),
          );
        }

        return;
      }

      const cleanedValue = clean(value);

      if (!cleanedValue) return;
      if (cleanedValue === "all") return;

      query.set(key, cleanedValue);
    },
  );

  const queryString = query.toString();

  return queryString
    ? `?${queryString}`
    : "";
};

const request = async (
  url,
  options = {},
  fallbackMessage,
) => {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      ...(options.body
        ? {
            "Content-Type":
              "application/json",
          }
        : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        fallbackMessage,
      ),
    );
  }

  return response.json();
};

const replaceTailorInList = (
  tailors,
  updatedTailor,
) => {
  if (!updatedTailor?._id) return tailors;

  return tailors.map((item) =>
    item._id === updatedTailor._id
      ? updatedTailor
      : item,
  );
};

const DEFAULT_FILTERS = {
  search: "",
  status: "all",
  availability: "all",
  type: "all",
  skill: "all",
  productCode: "",
  productId: "",
  preferred: "",
  minRating: "",
  sort: "newest",
  page: 1,
  limit: 20,
};

const DEFAULT_PAGINATION = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

/* =========================================================
   STORE
========================================================= */

const useTailorStore = create(
  devtools(
    (set, get) => ({
      /* =====================================================
         DATA
      ===================================================== */

      tailors: [],
      activeTailors: [],
      productTailors: [],

      tailor: null,
      summary: null,

      pagination: {
        ...DEFAULT_PAGINATION,
      },

      /* =====================================================
         LOADING STATES
      ===================================================== */

      loading: false,
      listLoading: false,
      detailLoading: false,
      summaryLoading: false,
      activeLoading: false,
      productTailorsLoading: false,

      submitting: false,
      statusUpdating: false,
      availabilityUpdating: false,

      productAssigning: false,
      productUpdating: false,
      productRemoving: false,

      deleting: false,

      /* =====================================================
         FILTERS
      ===================================================== */

      filters: {
        ...DEFAULT_FILTERS,
      },

      setFilters: (next = {}) =>
        set((state) => ({
          filters: {
            ...state.filters,
            ...next,
          },
        })),

      setPage: (page) =>
        set((state) => ({
          filters: {
            ...state.filters,
            page: Math.max(
              1,
              Number(page) || 1,
            ),
          },
        })),

      resetFilters: () =>
        set({
          filters: {
            ...DEFAULT_FILTERS,
          },
        }),

      /* =====================================================
         FETCH ALL TAILORS
      ===================================================== */

      fetchTailors: async (
        customFilters = {},
        options = {},
      ) => {
        try {
          set({
            listLoading: true,
          });

          const filters = {
            ...get().filters,
            ...customFilters,
          };

          const data = await request(
            `${API}${toQueryString(filters)}`,
            {
              method: "GET",
            },
            "Failed to fetch tailors",
          );

          const tailors = Array.isArray(
            data?.tailors,
          )
            ? data.tailors
            : [];

          const pagination = {
            total:
              Number(data?.total) || 0,

            page:
              Number(data?.page) ||
              Number(filters.page) ||
              1,

            limit:
              Number(data?.limit) ||
              Number(filters.limit) ||
              20,

            totalPages:
              Number(data?.totalPages) ||
              0,

            hasNextPage:
              Boolean(data?.hasNextPage),

            hasPreviousPage:
              Boolean(
                data?.hasPreviousPage,
              ),
          };

          set((state) => ({
            tailors: options.append
              ? [
                  ...state.tailors,
                  ...tailors.filter(
                    (newItem) =>
                      !state.tailors.some(
                        (oldItem) =>
                          oldItem._id ===
                          newItem._id,
                      ),
                  ),
                ]
              : tailors,

            filters,

            pagination,

            listLoading: false,
          }));

          return {
            success: true,
            tailors,
            pagination,
          };
        } catch (error) {
          set({
            listLoading: false,
          });

          if (!options.silent) {
            toast.error(
              error.message ||
                "Failed to fetch tailors",
            );
          }

          return {
            success: false,
            message: error.message,
          };
        }
      },

      /* =====================================================
         FETCH TAILOR BY ID
      ===================================================== */

      fetchTailorById: async (id) => {
        try {
          if (!id) {
            throw new Error(
              "Tailor ID is required",
            );
          }

          set({
            detailLoading: true,
            tailor: null,
          });

          const data = await request(
            `${API}/${id}`,
            {
              method: "GET",
            },
            "Failed to fetch tailor",
          );

          const tailor =
            data?.tailor || null;

          set({
            tailor,
            detailLoading: false,
          });

          return {
            success: true,
            tailor,
          };
        } catch (error) {
          set({
            detailLoading: false,
            tailor: null,
          });

          toast.error(
            error.message ||
              "Failed to fetch tailor",
          );

          return {
            success: false,
            message: error.message,
          };
        }
      },

      /* =====================================================
         FETCH SUMMARY
      ===================================================== */

      fetchTailorSummary: async () => {
        try {
          set({
            summaryLoading: true,
          });

          const data = await request(
            `${API}/summary`,
            {
              method: "GET",
            },
            "Failed to fetch tailor summary",
          );

          set({
            summary:
              data?.summary || null,

            summaryLoading: false,
          });

          return {
            success: true,
            summary:
              data?.summary || null,
          };
        } catch (error) {
          set({
            summaryLoading: false,
          });

          toast.error(
            error.message ||
              "Failed to fetch tailor summary",
          );

          return {
            success: false,
            message: error.message,
          };
        }
      },

      /* =====================================================
         FETCH ACTIVE TAILORS

         Used in Production Job tailor dropdown.

         Params:
         {
           productCode,
           productId,
           workType,
           skill,
           availableOnly
         }
      ===================================================== */

      fetchActiveTailors: async (
        params = {},
      ) => {
        try {
          set({
            activeLoading: true,
          });

          const data = await request(
            `${API}/active${toQueryString(
              params,
            )}`,
            {
              method: "GET",
            },
            "Failed to fetch active tailors",
          );

          const activeTailors =
            Array.isArray(data?.tailors)
              ? data.tailors
              : [];

          set({
            activeTailors,
            activeLoading: false,
          });

          return {
            success: true,
            tailors: activeTailors,
          };
        } catch (error) {
          set({
            activeLoading: false,
            activeTailors: [],
          });

          toast.error(
            error.message ||
              "Failed to fetch active tailors",
          );

          return {
            success: false,
            message: error.message,
          };
        }
      },

      /* =====================================================
         FETCH TAILORS BY PRODUCT

         Params:
         {
           productId
         }

         or

         {
           productCode
         }
      ===================================================== */

      fetchTailorsByProduct: async (
        params = {},
      ) => {
        try {
          if (
            !params.productId &&
            !params.productCode
          ) {
            throw new Error(
              "Product ID or product code is required",
            );
          }

          set({
            productTailorsLoading: true,
          });

          const data = await request(
            `${API}/by-product${toQueryString(
              params,
            )}`,
            {
              method: "GET",
            },
            "Failed to fetch product tailors",
          );

          const productTailors =
            Array.isArray(data?.tailors)
              ? data.tailors
              : [];

          set({
            productTailors,
            productTailorsLoading: false,
          });

          return {
            success: true,
            tailors: productTailors,
          };
        } catch (error) {
          set({
            productTailorsLoading: false,
            productTailors: [],
          });

          toast.error(
            error.message ||
              "Failed to fetch product tailors",
          );

          return {
            success: false,
            message: error.message,
          };
        }
      },

      /* =====================================================
         CREATE TAILOR
      ===================================================== */

      createTailor: async (
        payload = {},
      ) => {
        try {
          set({
            submitting: true,
          });

          const data = await request(
            API,
            {
              method: "POST",
              body: JSON.stringify(payload),
            },
            "Failed to create tailor",
          );

          const tailor =
            data?.tailor || null;

          set((state) => ({
            submitting: false,

            tailor,

            tailors: tailor
              ? [
                  tailor,
                  ...state.tailors.filter(
                    (item) =>
                      item._id !==
                      tailor._id,
                  ),
                ]
              : state.tailors,

            pagination: tailor
              ? {
                  ...state.pagination,
                  total:
                    state.pagination
                      .total + 1,
                }
              : state.pagination,
          }));

          toast.success(
            data?.message ||
              "Tailor created successfully",
          );

          return {
            success: true,
            tailor,
          };
        } catch (error) {
          set({
            submitting: false,
          });

          toast.error(
            error.message ||
              "Failed to create tailor",
          );

          return {
            success: false,
            message: error.message,
          };
        }
      },

      /* =====================================================
         UPDATE TAILOR

         Backend supports partial update.
      ===================================================== */

      updateTailor: async (
        id,
        payload = {},
      ) => {
        try {
          if (!id) {
            throw new Error(
              "Tailor ID is required",
            );
          }

          set({
            submitting: true,
          });

          const data = await request(
            `${API}/${id}`,
            {
              method: "PATCH",
              body: JSON.stringify(payload),
            },
            "Failed to update tailor",
          );

          const updatedTailor =
            data?.tailor || null;

          set((state) => ({
            submitting: false,

            tailor:
              state.tailor?._id === id
                ? updatedTailor
                : state.tailor,

            tailors:
              replaceTailorInList(
                state.tailors,
                updatedTailor,
              ),

            activeTailors:
              replaceTailorInList(
                state.activeTailors,
                updatedTailor,
              ),

            productTailors:
              replaceTailorInList(
                state.productTailors,
                updatedTailor,
              ),
          }));

          toast.success(
            data?.message ||
              "Tailor updated successfully",
          );

          return {
            success: true,
            tailor: updatedTailor,
          };
        } catch (error) {
          set({
            submitting: false,
          });

          toast.error(
            error.message ||
              "Failed to update tailor",
          );

          return {
            success: false,
            message: error.message,
          };
        }
      },

      /* =====================================================
         UPDATE STATUS

         active | inactive | blocked
      ===================================================== */

      updateTailorStatus: async (
        id,
        status,
      ) => {
        try {
          if (!id) {
            throw new Error(
              "Tailor ID is required",
            );
          }

          if (!status) {
            throw new Error(
              "Tailor status is required",
            );
          }

          set({
            statusUpdating: true,
          });

          const data = await request(
            `${API}/${id}/status`,
            {
              method: "PATCH",
              body: JSON.stringify({
                status,
              }),
            },
            "Failed to update tailor status",
          );

          const updatedTailor =
            data?.tailor || null;

          set((state) => ({
            statusUpdating: false,

            tailor:
              state.tailor?._id === id
                ? updatedTailor
                : state.tailor,

            tailors:
              replaceTailorInList(
                state.tailors,
                updatedTailor,
              ),

            activeTailors:
              status === "active"
                ? replaceTailorInList(
                    state.activeTailors,
                    updatedTailor,
                  )
                : state.activeTailors.filter(
                    (item) =>
                      item._id !== id,
                  ),

            productTailors:
              replaceTailorInList(
                state.productTailors,
                updatedTailor,
              ),
          }));

          toast.success(
            data?.message ||
              "Tailor status updated",
          );

          return {
            success: true,
            tailor: updatedTailor,
          };
        } catch (error) {
          set({
            statusUpdating: false,
          });

          toast.error(
            error.message ||
              "Failed to update tailor status",
          );

          return {
            success: false,
            message: error.message,
          };
        }
      },

      /* =====================================================
         UPDATE AVAILABILITY

         available | busy | on_leave | unavailable
      ===================================================== */

      updateTailorAvailability:
        async (id, availability) => {
          try {
            if (!id) {
              throw new Error(
                "Tailor ID is required",
              );
            }

            if (!availability) {
              throw new Error(
                "Availability is required",
              );
            }

            set({
              availabilityUpdating: true,
            });

            const data = await request(
              `${API}/${id}/availability`,
              {
                method: "PATCH",
                body: JSON.stringify({
                  availability,
                }),
              },
              "Failed to update tailor availability",
            );

            const updatedTailor =
              data?.tailor || null;

            set((state) => ({
              availabilityUpdating: false,

              tailor:
                state.tailor?._id === id
                  ? updatedTailor
                  : state.tailor,

              tailors:
                replaceTailorInList(
                  state.tailors,
                  updatedTailor,
                ),

              activeTailors:
                replaceTailorInList(
                  state.activeTailors,
                  updatedTailor,
                ),

              productTailors:
                replaceTailorInList(
                  state.productTailors,
                  updatedTailor,
                ),
            }));

            toast.success(
              data?.message ||
                "Tailor availability updated",
            );

            return {
              success: true,
              tailor: updatedTailor,
            };
          } catch (error) {
            set({
              availabilityUpdating: false,
            });

            toast.error(
              error.message ||
                "Failed to update availability",
            );

            return {
              success: false,
              message: error.message,
            };
          }
        },

      /* =====================================================
         ASSIGN ONE PRODUCT
      ===================================================== */

      assignProductToTailor: async (
        tailorId,
        payload = {},
      ) => {
        try {
          if (!tailorId) {
            throw new Error(
              "Tailor ID is required",
            );
          }

          if (!payload.productId) {
            throw new Error(
              "Product ID is required",
            );
          }

          set({
            productAssigning: true,
          });

          const data = await request(
            `${API}/${tailorId}/products`,
            {
              method: "POST",
              body: JSON.stringify(payload),
            },
            "Failed to assign product",
          );

          const updatedTailor =
            data?.tailor || null;

          set((state) => ({
            productAssigning: false,

            tailor:
              state.tailor?._id ===
              tailorId
                ? updatedTailor
                : state.tailor,

            tailors:
              replaceTailorInList(
                state.tailors,
                updatedTailor,
              ),

            activeTailors:
              replaceTailorInList(
                state.activeTailors,
                updatedTailor,
              ),
          }));

          toast.success(
            data?.message ||
              "Product assigned successfully",
          );

          return {
            success: true,
            tailor: updatedTailor,
            association:
              data?.association || null,
          };
        } catch (error) {
          set({
            productAssigning: false,
          });

          toast.error(
            error.message ||
              "Failed to assign product",
          );

          return {
            success: false,
            message: error.message,
          };
        }
      },

      /* =====================================================
         BULK ASSIGN PRODUCTS
      ===================================================== */

      bulkAssignProductsToTailor:
        async (
          tailorId,
          products = [],
        ) => {
          try {
            if (!tailorId) {
              throw new Error(
                "Tailor ID is required",
              );
            }

            if (
              !Array.isArray(products) ||
              products.length === 0
            ) {
              throw new Error(
                "At least one product is required",
              );
            }

            set({
              productAssigning: true,
            });

            const data = await request(
              `${API}/${tailorId}/products/bulk`,
              {
                method: "POST",
                body: JSON.stringify({
                  products,
                }),
              },
              "Failed to assign products",
            );

            const updatedTailor =
              data?.tailor || null;

            set((state) => ({
              productAssigning: false,

              tailor:
                state.tailor?._id ===
                tailorId
                  ? updatedTailor
                  : state.tailor,

              tailors:
                replaceTailorInList(
                  state.tailors,
                  updatedTailor,
                ),

              activeTailors:
                replaceTailorInList(
                  state.activeTailors,
                  updatedTailor,
                ),
            }));

            toast.success(
              data?.message ||
                "Products assigned successfully",
            );

            return {
              success: true,

              tailor: updatedTailor,

              assigned:
                data?.assigned || [],

              skipped:
                data?.skipped || [],

              missing:
                data?.missing || [],
            };
          } catch (error) {
            set({
              productAssigning: false,
            });

            toast.error(
              error.message ||
                "Failed to assign products",
            );

            return {
              success: false,
              message: error.message,
            };
          }
        },

      /* =====================================================
         UPDATE PRODUCT ASSOCIATION
      ===================================================== */

      updateTailorProduct: async (
        tailorId,
        productId,
        payload = {},
      ) => {
        try {
          if (!tailorId) {
            throw new Error(
              "Tailor ID is required",
            );
          }

          if (!productId) {
            throw new Error(
              "Product ID is required",
            );
          }

          set({
            productUpdating: true,
          });

          const data = await request(
            `${API}/${tailorId}/products/${productId}`,
            {
              method: "PATCH",
              body: JSON.stringify(payload),
            },
            "Failed to update product association",
          );

          const updatedTailor =
            data?.tailor || null;

          set((state) => ({
            productUpdating: false,

            tailor:
              state.tailor?._id ===
              tailorId
                ? updatedTailor
                : state.tailor,

            tailors:
              replaceTailorInList(
                state.tailors,
                updatedTailor,
              ),

            activeTailors:
              replaceTailorInList(
                state.activeTailors,
                updatedTailor,
              ),

            productTailors:
              replaceTailorInList(
                state.productTailors,
                updatedTailor,
              ),
          }));

          toast.success(
            data?.message ||
              "Product association updated",
          );

          return {
            success: true,

            tailor: updatedTailor,

            association:
              data?.association || null,
          };
        } catch (error) {
          set({
            productUpdating: false,
          });

          toast.error(
            error.message ||
              "Failed to update product association",
          );

          return {
            success: false,
            message: error.message,
          };
        }
      },

      /* =====================================================
         REMOVE PRODUCT ASSOCIATION

         hard = false:
         association becomes inactive.

         hard = true:
         association is permanently removed.
      ===================================================== */

      removeProductFromTailor: async (
        tailorId,
        productId,
        options = {},
      ) => {
        try {
          if (!tailorId) {
            throw new Error(
              "Tailor ID is required",
            );
          }

          if (!productId) {
            throw new Error(
              "Product ID is required",
            );
          }

          set({
            productRemoving: true,
          });

          const hard =
            options.hard === true;

          const data = await request(
            `${API}/${tailorId}/products/${productId}${toQueryString(
              {
                hard: hard
                  ? "true"
                  : "",
              },
            )}`,
            {
              method: "DELETE",
            },
            "Failed to remove product",
          );

          const updatedTailor =
            data?.tailor || null;

          set((state) => ({
            productRemoving: false,

            tailor:
              state.tailor?._id ===
              tailorId
                ? updatedTailor
                : state.tailor,

            tailors:
              replaceTailorInList(
                state.tailors,
                updatedTailor,
              ),

            activeTailors:
              replaceTailorInList(
                state.activeTailors,
                updatedTailor,
              ),

            productTailors:
              replaceTailorInList(
                state.productTailors,
                updatedTailor,
              ),
          }));

          toast.success(
            data?.message ||
              "Product removed successfully",
          );

          return {
            success: true,
            tailor: updatedTailor,
          };
        } catch (error) {
          set({
            productRemoving: false,
          });

          toast.error(
            error.message ||
              "Failed to remove product",
          );

          return {
            success: false,
            message: error.message,
          };
        }
      },

      /* =====================================================
         DELETE / DEACTIVATE TAILOR

         Default:
         Soft delete.

         hard = true:
         Permanent deletion.
      ===================================================== */

      deleteTailor: async (
        id,
        options = {},
      ) => {
        try {
          if (!id) {
            throw new Error(
              "Tailor ID is required",
            );
          }

          set({
            deleting: true,
          });

          const hard =
            options.hard === true;

          const data = await request(
            `${API}/${id}${toQueryString({
              hard: hard
                ? "true"
                : "",
            })}`,
            {
              method: "DELETE",
            },
            "Failed to delete tailor",
          );

          const returnedTailor =
            data?.tailor || null;

          set((state) => {
            if (hard) {
              return {
                deleting: false,

                tailor:
                  state.tailor?._id === id
                    ? null
                    : state.tailor,

                tailors:
                  state.tailors.filter(
                    (item) =>
                      item._id !== id,
                  ),

                activeTailors:
                  state.activeTailors.filter(
                    (item) =>
                      item._id !== id,
                  ),

                productTailors:
                  state.productTailors.filter(
                    (item) =>
                      item._id !== id,
                  ),

                pagination: {
                  ...state.pagination,

                  total: Math.max(
                    0,
                    state.pagination
                      .total - 1,
                  ),
                },
              };
            }

            return {
              deleting: false,

              tailor:
                state.tailor?._id === id
                  ? returnedTailor
                  : state.tailor,

              tailors:
                replaceTailorInList(
                  state.tailors,
                  returnedTailor,
                ),

              activeTailors:
                state.activeTailors.filter(
                  (item) =>
                    item._id !== id,
                ),

              productTailors:
                replaceTailorInList(
                  state.productTailors,
                  returnedTailor,
                ),
            };
          });

          toast.success(
            data?.message ||
              (hard
                ? "Tailor deleted successfully"
                : "Tailor deactivated successfully"),
          );

          return {
            success: true,
            tailor: returnedTailor,
          };
        } catch (error) {
          set({
            deleting: false,
          });

          toast.error(
            error.message ||
              "Failed to delete tailor",
          );

          return {
            success: false,
            message: error.message,
          };
        }
      },

      /* =====================================================
         LOCAL UTILITIES
      ===================================================== */

      setTailor: (tailor) =>
        set({
          tailor: tailor || null,
        }),

      clearTailor: () =>
        set({
          tailor: null,
        }),

      clearActiveTailors: () =>
        set({
          activeTailors: [],
        }),

      clearProductTailors: () =>
        set({
          productTailors: [],
        }),

      clearTailorStore: () =>
        set({
          tailors: [],
          activeTailors: [],
          productTailors: [],
          tailor: null,
          summary: null,

          filters: {
            ...DEFAULT_FILTERS,
          },

          pagination: {
            ...DEFAULT_PAGINATION,
          },
        }),
    }),
    {
      name: "tailor-store",
    },
  ),
);

export default useTailorStore;