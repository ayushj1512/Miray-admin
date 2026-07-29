"use client";

import { create } from "zustand";

const API = (
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""
).trim();

/* ============================================================
   HELPERS
============================================================ */

const buildUrl = (path, params) => {
  const base = API ? API.replace(/\/+$/, "") : "";
  const route = path.startsWith("/") ? path : `/${path}`;

  const query = params
    ? new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {
            acc[key] = String(value);
          }

          return acc;
        }, {})
      ).toString()
    : "";

  return `${base}${route}${query ? `?${query}` : ""}`;
};

const safeJson = async (res) => {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {
      message: text || "Invalid JSON response",
    };
  }
};

const errMsgFrom = (res, data) =>
  data?.message ||
  data?.error?.message ||
  (typeof data?.error === "string"
    ? data.error
    : null) ||
  data?.details?.message ||
  (res?.status
    ? `Request failed (${res.status})`
    : null) ||
  "Something went wrong";

const normalizeError = (res, data) => {
  const error = new Error(
    errMsgFrom(res, data)
  );

  error.status = res?.status;
  error.code =
    data?.code ||
    data?.error?.code ||
    null;
  error.payload = data || null;

  return error;
};

const toBoolLike = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(
    value || ""
  )
    .trim()
    .toLowerCase();

  return ["1", "true", "yes"].includes(
    normalized
  );
};

const request = async (
  path,
  {
    method = "GET",
    params,
    body,
  } = {}
) => {
  const res = await fetch(
    buildUrl(path, params),
    {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),
      },
      credentials: "include",
      ...(body !== undefined
        ? {
            body: JSON.stringify(body),
          }
        : {}),
    }
  );

  const data = await safeJson(res);

  if (!res.ok) {
    throw normalizeError(res, data);
  }

  return data;
};

/* ============================================================
   SHIPROCKET STORE
============================================================ */

export const useShiprocketStore = create(
  (set, get) => ({
    /* ========================================================
       STATE
    ======================================================== */

    loading: false,
    error: null,

    tokenLoading: false,
    tokenError: null,
    token: null,
    tokenFetchedAt: null,

    serviceabilityLoading: false,
    serviceabilityError: null,
    serviceabilityResult: null,

    result: null,
    bulkResult: null,
    reverseResult: null,

    syncLoading: false,
    syncError: null,
    syncErrorCode: null,
    syncResult: null,

    repairLoading: false,
    repairingOrderId: null,
    repairError: null,
    repairResult: null,
    bulkRepairResult: null,

    orderUpdateLoading: false,
    updatingOrderId: null,
    orderUpdateError: null,
    orderUpdateResult: null,

    packageUpdateLoading: false,
    packageUpdateError: null,
    packageUpdateResult: null,

    /* ========================================================
       INTERNAL SETTERS
    ======================================================== */

    _start: () =>
      set({
        loading: true,
        error: null,
      }),

    _success: () =>
      set({
        loading: false,
      }),

    _error: (error) =>
      set({
        loading: false,
        error:
          error?.message ||
          "Something went wrong",
      }),

    _startToken: () =>
      set({
        tokenLoading: true,
        tokenError: null,
      }),

    _successToken: () =>
      set({
        tokenLoading: false,
      }),

    _errorToken: (error) =>
      set({
        tokenLoading: false,
        tokenError:
          error?.message ||
          "Token fetch failed",
      }),

    _startServiceability: () =>
      set({
        serviceabilityLoading: true,
        serviceabilityError: null,
      }),

    _successServiceability: () =>
      set({
        serviceabilityLoading: false,
      }),

    _errorServiceability: (error) =>
      set({
        serviceabilityLoading: false,
        serviceabilityError:
          error?.message ||
          "Serviceability check failed",
      }),

    _startSync: () =>
      set({
        syncLoading: true,
        syncError: null,
        syncErrorCode: null,
      }),

    _successSync: () =>
      set({
        syncLoading: false,
      }),

    _errorSync: (error) =>
      set({
        syncLoading: false,
        syncError:
          error?.code ===
          "SHIPROCKET_UPSTREAM_DOWN"
            ? "Shiprocket temporary down. Try again in 2 minutes."
            : error?.message ||
              "Tracking sync failed",
        syncErrorCode:
          error?.code || null,
      }),

    _startRepair: (
      orderId = null
    ) =>
      set({
        repairLoading: true,
        repairingOrderId: orderId,
        repairError: null,
      }),

    _successRepair: () =>
      set({
        repairLoading: false,
        repairingOrderId: null,
      }),

    _errorRepair: (error) =>
      set({
        repairLoading: false,
        repairingOrderId: null,
        repairError:
          error?.message ||
          "Unable to repair Shiprocket details",
      }),

    _startOrderUpdate: (
      orderId
    ) =>
      set({
        orderUpdateLoading: true,
        updatingOrderId: orderId,
        orderUpdateError: null,
        orderUpdateResult: null,
      }),

    _successOrderUpdate: (
      data
    ) =>
      set({
        orderUpdateLoading: false,
        updatingOrderId: null,
        orderUpdateError: null,
        orderUpdateResult: data,
      }),

    _errorOrderUpdate: (
      error
    ) =>
      set({
        orderUpdateLoading: false,
        updatingOrderId: null,
        orderUpdateError:
          error?.message ||
          "Unable to update Shiprocket order",
      }),

    /* ========================================================
       GET TOKEN
       GET /api/shiprocket/token
    ======================================================== */

    fetchToken: async () => {
      get()._startToken();

      try {
        const data = await request(
          "/api/shiprocket/token"
        );

        const token =
          data?.token || null;

        set({
          token,
          tokenFetchedAt:
            Date.now(),
        });

        get()._successToken();

        return token;
      } catch (error) {
        get()._errorToken(error);
        throw error;
      }
    },

    /* ========================================================
       CHECK SERVICEABILITY
       GET /api/shiprocket/serviceability
    ======================================================== */

    checkServiceability: async ({
      pickupPincode,
      deliveryPincode,
      weight = 0.5,
      cod = false,
    }) => {
      if (!pickupPincode) {
        throw new Error(
          "pickupPincode is required"
        );
      }

      if (!deliveryPincode) {
        throw new Error(
          "deliveryPincode is required"
        );
      }

      get()._startServiceability();

      try {
        const data = await request(
          "/api/shiprocket/serviceability",
          {
            params: {
              pickupPincode:
                String(
                  pickupPincode
                ).trim(),

              deliveryPincode:
                String(
                  deliveryPincode
                ).trim(),

              weight: Number(
                weight || 0.5
              ),

              cod: toBoolLike(cod)
                ? 1
                : 0,
            },
          }
        );

        set({
          serviceabilityResult:
            data,
        });

        get()._successServiceability();

        return data;
      } catch (error) {
        get()._errorServiceability(
          error
        );

        throw error;
      }
    },

    /* ========================================================
       BOOK SHIPMENT
       POST /api/orders/:id/book
    ======================================================== */

    bookShipment: async (
      orderId,
      options = {}
    ) => {
      if (!orderId) {
        throw new Error(
          "orderId is required"
        );
      }

      get()._start();

      try {
        const data = await request(
          `/api/orders/${orderId}/book`,
          {
            method: "POST",
            body: {
              schedulePickup:
                options
                  ?.schedulePickup !==
                false,

              generateShippingLabel:
                options
                  ?.generateShippingLabel !==
                false,

              courierCompanyId:
                options
                  ?.courierCompanyId ||
                null,
            },
          }
        );

        set({
          result: data,
        });

        get()._success();

        return data;
      } catch (error) {
        get()._error(error);
        throw error;
      }
    },

    /* ========================================================
       UPDATE COMPLETE SHIPROCKET ORDER
       PATCH /api/orders/:id/update
    ======================================================== */

    updateShiprocketOrder: async (
      orderId,
      payload = {}
    ) => {
      if (!orderId) {
        throw new Error(
          "orderId is required"
        );
      }

      get()._startOrderUpdate(
        orderId
      );

      try {
        const data = await request(
          `/api/orders/${orderId}/update`,
          {
            method: "PATCH",
            body: payload || {},
          }
        );

        get()._successOrderUpdate(
          data
        );

        return data;
      } catch (error) {
        get()._errorOrderUpdate(
          error
        );

        throw error;
      }
    },

    /* ========================================================
       UPDATE PACKAGE DETAILS
       PATCH /api/orders/:id/package
    ======================================================== */

    updatePackage: async (
      orderId,
      {
        length = 10,
        breadth = 10,
        height = 5,
        weight = 0.5,
      } = {}
    ) => {
      if (!orderId) {
        throw new Error(
          "orderId is required"
        );
      }

      set({
        packageUpdateLoading:
          true,
        packageUpdateError: null,
        packageUpdateResult:
          null,
      });

      try {
        const data = await request(
          `/api/orders/${orderId}/package`,
          {
            method: "PATCH",
            body: {
              length: Number(
                length || 10
              ),

              breadth: Number(
                breadth || 10
              ),

              height: Number(
                height || 5
              ),

              weight: Number(
                weight || 0.5
              ),
            },
          }
        );

        set({
          packageUpdateLoading:
            false,
          packageUpdateError:
            null,
          packageUpdateResult:
            data,
        });

        return data;
      } catch (error) {
        set({
          packageUpdateLoading:
            false,

          packageUpdateError:
            error?.message ||
            "Unable to update package",
        });

        throw error;
      }
    },

    /* ========================================================
       SYNC TRACKING
    ======================================================== */

    syncTracking: async (
      input
    ) => {
      let orderId = "";
      let orderNumber = "";

      if (
        typeof input ===
        "string"
      ) {
        orderId = String(
          input
        ).trim();
      } else {
        orderId = String(
          input?.orderId || ""
        ).trim();

        orderNumber = String(
          input?.orderNumber ||
            ""
        ).trim();
      }

      if (
        !orderId &&
        !orderNumber
      ) {
        throw new Error(
          "orderId or orderNumber is required"
        );
      }

      get()._startSync();

      try {
        const data = orderId
          ? await request(
              `/api/orders/${orderId}/tracking/sync`
            )
          : await request(
              "/api/orders/tracking/sync",
              {
                params: {
                  orderNumber,
                },
              }
            );

        set({
          syncResult: data,
        });

        get()._successSync();

        return data;
      } catch (error) {
        get()._errorSync(error);
        throw error;
      }
    },

    /* ========================================================
       REVERSE PICKUP
    ======================================================== */

    createReversePickup:
      async (
        orderId,
        rmaNumber
      ) => {
        if (!orderId) {
          throw new Error(
            "orderId is required"
          );
        }

        if (!rmaNumber) {
          throw new Error(
            "rmaNumber is required"
          );
        }

        get()._start();

        try {
          const data =
            await request(
              `/api/shiprocket/reverse/${orderId}/${rmaNumber}`,
              {
                method: "POST",
              }
            );

          set({
            reverseResult: data,
          });

          get()._success();

          return data;
        } catch (error) {
          get()._error(error);
          throw error;
        }
      },

    /* ========================================================
       REPAIR SINGLE ORDER
    ======================================================== */

    repairShipment: async (
      orderId,
      {
        courierCompanyId =
          null,
        generateShippingLabel =
          true,
      } = {}
    ) => {
      if (!orderId) {
        throw new Error(
          "orderId is required"
        );
      }

      get()._startRepair(
        orderId
      );

      try {
        const data = await request(
          `/api/orders/${orderId}/repair`,
          {
            method: "POST",
            body: {
              courierCompanyId,
              generateShippingLabel,
            },
          }
        );

        set({
          repairResult: data,
        });

        get()._successRepair();

        return data;
      } catch (error) {
        get()._errorRepair(
          error
        );

        throw error;
      }
    },

    /* ========================================================
       REPAIR ALL MISSING ORDERS
    ======================================================== */

    repairMissingShipments:
      async ({
        orderIds = [],
        limit = 100,
        courierCompanyId =
          null,
        generateShippingLabel =
          true,
      } = {}) => {
        get()._startRepair();

        try {
          const data =
            await request(
              "/api/orders/repair/bulk",
              {
                method: "POST",
                body: {
                  orderIds:
                    Array.isArray(
                      orderIds
                    )
                      ? orderIds
                      : [],

                  limit:
                    Math.min(
                      Math.max(
                        Number(
                          limit || 100
                        ),
                        1
                      ),
                      100
                    ),

                  courierCompanyId,
                  generateShippingLabel,
                },
              }
            );

          set({
            bulkRepairResult:
              data,
          });

          get()._successRepair();

          return data;
        } catch (error) {
          get()._errorRepair(
            error
          );

          throw error;
        }
      },

    /* ========================================================
       BULK BOOK PACKED ORDERS
       POST /api/orders/packed/book
    ======================================================== */

    bookAllPackedOrders:
      async ({
        limit = 50,
        source = "",
        schedulePickup = true,
        generateShippingLabel =
          true,
      } = {}) => {
        get()._start();

        try {
          const data =
            await request(
              "/api/orders/packed/book",
              {
                method: "POST",
                body: {
                  limit,
                  source,
                  schedulePickup,
                  generateShippingLabel,
                },
              }
            );

          set({
            bulkResult: data,
          });

          get()._success();

          return data;
        } catch (error) {
          get()._error(error);
          throw error;
        }
      },

    /* ========================================================
       LEGACY BULK BOOKING
    ======================================================== */

    bulkBookShiprocketMissing:
      async (
        filters = {}
      ) => {
        get()._start();

        try {
          const data =
            await request(
              "/api/orders/shiprocket/book-missing",
              {
                method: "POST",
                params: filters,
              }
            );

          set({
            bulkResult: data,
          });

          get()._success();

          return data;
        } catch (error) {
          get()._error(error);
          throw error;
        }
      },

    /* ========================================================
       CLEAR
    ======================================================== */

    clearError: () =>
      set({
        error: null,
      }),

    clearTokenError: () =>
      set({
        tokenError: null,
      }),

    clearServiceabilityError:
      () =>
        set({
          serviceabilityError:
            null,
        }),

    clearSyncError: () =>
      set({
        syncError: null,
        syncErrorCode: null,
      }),

    clearResult: () =>
      set({
        result: null,
      }),

    clearBulkResult: () =>
      set({
        bulkResult: null,
      }),

    clearReverseResult: () =>
      set({
        reverseResult: null,
      }),

    clearServiceabilityResult:
      () =>
        set({
          serviceabilityResult:
            null,
        }),

    clearSyncResult: () =>
      set({
        syncResult: null,
      }),

    clearRepairError: () =>
      set({
        repairError: null,
      }),

    clearRepairResult: () =>
      set({
        repairResult: null,
      }),

    clearBulkRepairResult:
      () =>
        set({
          bulkRepairResult:
            null,
        }),

    clearOrderUpdate: () =>
      set({
        orderUpdateLoading:
          false,
        updatingOrderId: null,
        orderUpdateError: null,
        orderUpdateResult: null,
      }),

    clearPackageUpdate: () =>
      set({
        packageUpdateLoading:
          false,
        packageUpdateError: null,
        packageUpdateResult:
          null,
      }),

    /* ========================================================
       RESET
    ======================================================== */

    resetStore: () =>
      set({
        loading: false,
        error: null,

        tokenLoading: false,
        tokenError: null,
        token: null,
        tokenFetchedAt: null,

        serviceabilityLoading:
          false,
        serviceabilityError:
          null,
        serviceabilityResult:
          null,

        result: null,
        bulkResult: null,
        reverseResult: null,

        syncLoading: false,
        syncError: null,
        syncErrorCode: null,
        syncResult: null,

        repairLoading: false,
        repairingOrderId: null,
        repairError: null,
        repairResult: null,
        bulkRepairResult: null,

        orderUpdateLoading:
          false,
        updatingOrderId: null,
        orderUpdateError: null,
        orderUpdateResult: null,

        packageUpdateLoading:
          false,
        packageUpdateError: null,
        packageUpdateResult:
          null,
      }),
  })
);