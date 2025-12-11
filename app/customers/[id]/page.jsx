"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Ticket,
  ExternalLink,
  ShoppingCart,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || ""; // e.g. https://your-backend.com
const SUPPORT_API_BASE = `${API}/api/support`;
const ABANDONED_CART_API_BASE = `${API}/api/abandoned-carts`;

const safe = (v) => String(v ?? "").trim();
const fmtDate = (d) => (d ? new Date(d).toLocaleString() : "-");

function InfoItem({ label, value }) {
  return (
    <p className="flex justify-between text-sm text-gray-700 gap-3">
      <span className="font-medium text-gray-900 shrink-0">{label}:</span>
      <span className="text-right break-all">{value}</span>
    </p>
  );
}

function StatusPill({ status }) {
  const s = safe(status).toUpperCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";
  if (s === "OPEN") return <span className={`${base} bg-blue-50 text-blue-700 ring-blue-200`}>OPEN</span>;
  if (s === "IN_PROGRESS") return <span className={`${base} bg-amber-50 text-amber-700 ring-amber-200`}>IN PROGRESS</span>;
  if (s === "RESOLVED") return <span className={`${base} bg-emerald-50 text-emerald-700 ring-emerald-200`}>RESOLVED</span>;
  if (s === "CLOSED") return <span className={`${base} bg-gray-100 text-gray-700 ring-gray-200`}>CLOSED</span>;
  return <span className={`${base} bg-gray-100 text-gray-700 ring-gray-200`}>{s || "—"}</span>;
}

function CartStatusPill({ cart }) {
  const abandonedAt = cart?.abandonedAt ? new Date(cart.abandonedAt) : null;
  const recoveredAt = cart?.recoveredAt ? new Date(cart.recoveredAt) : null;

  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";

  // If both exist, treat as recovered
  if (recoveredAt) {
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700 ring-emerald-200 inline-flex items-center gap-1`}>
        <CheckCircle2 size={14} /> Recovered
      </span>
    );
  }

  if (abandonedAt) {
    return (
      <span className={`${base} bg-amber-50 text-amber-800 ring-amber-200 inline-flex items-center gap-1`}>
        <ShoppingCart size={14} /> Abandoned
      </span>
    );
  }

  return (
    <span className={`${base} bg-gray-100 text-gray-700 ring-gray-200 inline-flex items-center gap-1`}>
      <XCircle size={14} /> Active
    </span>
  );
}

const money = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return `₹${n.toFixed(0)}`;
};

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [customer, setCustomer] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const [tickets, setTickets] = useState([]);
  const [ticketsTotal, setTicketsTotal] = useState(0);

  // ✅ Abandoned carts
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [abandonedTotal, setAbandonedTotal] = useState(0);
  const [loadingAbandoned, setLoadingAbandoned] = useState(true);
  const [abandonedError, setAbandonedError] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState("");

  const customerEmail = useMemo(() => safe(customer?.email).toLowerCase(), [customer]);
  const customerUID = useMemo(() => safe(customer?.firebaseUID), [customer]);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`${API}/api/customers/${id}`, { cache: "no-store" });
      const data = await res.json();
      setCustomer(data);
    } catch (error) {
      console.error("Failed to fetch customer:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${API}/api/addresses/customer/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (data?.success) setAddresses(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setLoadingAddress(false);
    }
  };

  const fetchWishlist = async (firebaseUID) => {
    if (!firebaseUID) {
      setLoadingWishlist(false);
      return;
    }
    try {
      const res = await fetch(`${API}/api/wishlist/firebase/${firebaseUID}`, { cache: "no-store" });
      const data = await res.json();
      if (data?.success && data?.wishlist) setWishlist(data.wishlist.productIds || []);
    } catch (err) {
      console.error("Wishlist fetch error:", err);
    } finally {
      setLoadingWishlist(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API}/api/orders?customerId=${id}`, { cache: "no-store" });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load orders:", error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  // ✅ Fetch Support Tickets by Email
  const fetchTicketsByEmail = async (email) => {
    const em = safe(email).toLowerCase();
    if (!em) {
      setLoadingTickets(false);
      return;
    }

    setLoadingTickets(true);
    setTicketsError("");

    try {
      const res = await fetch(
        `${SUPPORT_API_BASE}/tickets/by-email?email=${encodeURIComponent(em)}&page=1&limit=50`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `Failed (${res.status})`);
      }

      const list = Array.isArray(data?.tickets) ? data.tickets : [];
      setTickets(list);
      setTicketsTotal(Number(data?.total ?? list.length ?? 0));
    } catch (e) {
      console.error("Tickets fetch error:", e);
      setTickets([]);
      setTicketsTotal(0);
      setTicketsError(e?.message || "Failed to load support tickets");
    } finally {
      setLoadingTickets(false);
    }
  };

  // ✅ Fetch Abandoned carts (by firebaseUID/email)
  // Expects your backend list endpoint supports query params like:
  // GET /api/abandoned-carts?customerId=... OR firebaseUID=... OR email=...
  // If your controller uses different param names, adjust here.
  const fetchAbandonedCarts = async ({ firebaseUID, email }) => {
    const uid = safe(firebaseUID);
    const em = safe(email).toLowerCase();

    if (!API) return;

    // no keys -> nothing
    if (!uid && !em) {
      setLoadingAbandoned(false);
      return;
    }

    setLoadingAbandoned(true);
    setAbandonedError("");

    try {
      const url = new URL(`${ABANDONED_CART_API_BASE}`);
      url.searchParams.set("page", "1");
      url.searchParams.set("limit", "50");

      // Prefer UID, but send both if present
      if (uid) url.searchParams.set("firebaseUID", uid);
      if (em) url.searchParams.set("email", em);

      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `Failed (${res.status})`);
      }

      // Support either {items,total} OR {carts,total}
      const list = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.carts)
        ? data.carts
        : Array.isArray(data)
        ? data
        : [];

      setAbandonedCarts(list);
      setAbandonedTotal(Number(data?.total ?? list.length ?? 0));
    } catch (e) {
      console.error("Abandoned carts fetch error:", e);
      setAbandonedCarts([]);
      setAbandonedTotal(0);
      setAbandonedError(e?.message || "Failed to load abandoned carts");
    } finally {
      setLoadingAbandoned(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchCustomer();
      await fetchAddresses();
      await fetchOrders();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (customer?.firebaseUID) fetchWishlist(customer.firebaseUID);
    else setLoadingWishlist(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.firebaseUID]);

  useEffect(() => {
    if (!customerEmail) return;
    fetchTicketsByEmail(customerEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerEmail]);

  useEffect(() => {
    // load abandoned carts once we have at least one key
    if (!customerUID && !customerEmail) return;
    fetchAbandonedCarts({ firebaseUID: customerUID, email: customerEmail });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerUID, customerEmail]);

  const markRetargeted = async (cart) => {
    if (!API) return alert("Missing NEXT_PUBLIC_API_URL");
    const cid = cart?._id || cart?.cartId;
    if (!cid) return alert("Missing cart id");

    try {
      const res = await fetch(`${ABANDONED_CART_API_BASE}/${encodeURIComponent(cid)}/retargeted`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) throw new Error(data?.message || "Failed");
      await fetchAbandonedCarts({ firebaseUID: customerUID, email: customerEmail });
    } catch (e) {
      console.error("mark retargeted error:", e);
      alert(e?.message || "Failed to mark retargeted");
    }
  };

  const card = "bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all";

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 size={32} className="animate-spin text-gray-600" />
      </div>
    );

  if (!customer)
    return (
      <div className="p-8">
        <p className="text-red-500 font-semibold text-lg">Customer not found.</p>
        <button onClick={() => router.push("/customers")} className="mt-4 px-4 py-2 bg-black text-white rounded">
          Back to Customers
        </button>
      </div>
    );

  return (
    <div className="p-8 space-y-10">
      {/* BACK */}
      <button onClick={() => router.push("/customers")} className="text-gray-600 hover:text-black transition flex items-center gap-2">
        <ArrowLeft size={18} /> Back
      </button>

      {/* HEADER CARD */}
      <div className={`${card} flex items-center gap-6`}>
        <img
          src={customer.profileImage || "/profile/user-avatar.jpg"}
          className="w-24 h-24 rounded-full border object-cover"
          alt="Customer"
        />
        <div className="min-w-0">
          <h1 className="text-3xl font-bold truncate">{customer.name || "Unnamed User"}</h1>
          <p className="text-gray-600 break-all">{customer.email}</p>
          <p className="text-xs mt-2 px-2 py-1 bg-gray-100 inline-block rounded text-gray-500 break-all">
            UID: {customer.firebaseUID}
          </p>
        </div>
      </div>

      {/* GRID SECTIONS */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className={card}>
          <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
          <InfoItem label="Phone" value={customer.phone || "—"} />
          <InfoItem label="Gender" value={customer.gender || "—"} />
          <InfoItem label="Age Group" value={customer.ageGroup || "—"} />
          <InfoItem label="Joined" value={customer.joinedAt ? new Date(customer.joinedAt).toLocaleDateString() : "—"} />
        </div>

        <div className={card}>
          <h2 className="text-xl font-semibold mb-4">Location</h2>
          <InfoItem label="Country" value={customer.country || "—"} />
          <InfoItem label="State" value={customer.state || "—"} />
          <InfoItem label="City" value={customer.city || "—"} />
        </div>

        <div className={card}>
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>
          <InfoItem label="Total Orders" value={customer?.analytics?.totalOrders ?? "—"} />
          <InfoItem
            label="Total Spend"
            value={customer?.analytics?.totalSpend != null ? `₹${customer.analytics.totalSpend}` : "—"}
          />
          <InfoItem label="Wishlist Count" value={customer?.analytics?.wishlistCount ?? "—"} />
        </div>

        <div className={card}>
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>
          <p className="font-medium text-gray-700">Favorite Brands:</p>
          {customer?.preferences?.favoriteBrands?.length ? (
            <ul className="list-disc ml-6 text-gray-700">
              {customer.preferences.favoriteBrands.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No favorite brands.</p>
          )}
        </div>
      </div>

      {/* ✅ ABANDONED CARTS */}
      <div className={card}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-5">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Abandoned Carts
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Matched by:{" "}
              <span className="font-semibold">{customerUID ? `UID ${customerUID}` : "—"}</span>
              {" · "}
              <span className="font-semibold">{customerEmail || "—"}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => fetchAbandonedCarts({ firebaseUID: customerUID, email: customerEmail })}
              className="inline-flex items-center gap-2 rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {abandonedError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5" /> {abandonedError}
          </div>
        ) : null}

        {loadingAbandoned ? (
          <p className="text-gray-500 animate-pulse">Loading abandoned carts...</p>
        ) : abandonedCarts.length === 0 ? (
          <p className="text-gray-600">No abandoned carts found for this customer.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>
                Showing <span className="font-semibold">{abandonedCarts.length}</span> carts
              </span>
              <span>
                Total: <span className="font-semibold">{abandonedTotal}</span>
              </span>
            </div>

            {abandonedCarts.map((c) => (
              <div key={c._id || c.cartId} className="border p-4 rounded-md hover:bg-gray-50 transition">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-blue-700 break-all">{safe(c.cartId || c._id)}</p>
                      <CartStatusPill cart={c} />
                      {c?.retargeted?.status ? (
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset bg-sky-50 text-sky-700 ring-sky-200">
                          Retargeted
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1">
                        Updated: {fmtDate(c.updatedAt)}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1">
                        Abandoned: {c.abandonedAt ? fmtDate(c.abandonedAt) : "—"}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1">
                        Recovered: {c.recoveredAt ? fmtDate(c.recoveredAt) : "—"}
                      </span>
                    </div>

                    <div className="mt-3 text-sm text-gray-700">
                      <span className="font-medium">Items:</span>{" "}
                      <span className="font-semibold">{Array.isArray(c.items) ? c.items.length : 0}</span>
                      {" · "}
                      <span className="font-medium">Subtotal:</span> <span className="font-semibold">{money(c.subtotal)}</span>
                      {" · "}
                      <span className="font-medium">Total:</span> <span className="font-semibold">{money(c.total)}</span>
                    </div>

                    {Array.isArray(c.items) && c.items.length ? (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {c.items.slice(0, 6).map((it, idx) => (
                          <div key={idx} className="rounded-md border border-gray-200 bg-white p-3">
                            <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                              {safe(it?.title) || safe(it?.productTitle) || "Item"}
                            </div>
                            <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-2">
                              {it?.productCode ? (
                                <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5">
                                  Code: {safe(it.productCode)}
                                </span>
                              ) : null}
                              {it?.sku ? (
                                <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5">
                                  SKU: {safe(it.sku)}
                                </span>
                              ) : null}
                              {it?.qty != null ? (
                                <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5">
                                  Qty: {it.qty}
                                </span>
                              ) : null}
                              {it?.price != null ? (
                                <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5">
                                  Price: {money(it.price)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {Array.isArray(c.items) && c.items.length > 6 ? (
                      <div className="mt-2 text-xs text-gray-500">Showing first 6 items…</div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
                    <button
                      onClick={() => markRetargeted(c)}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ring-1 ring-inset bg-white text-sky-700 ring-sky-200 hover:bg-sky-50 transition"
                      title="Mark as retargeted"
                    >
                      Mark Retargeted
                    </button>

                    {/* If you later add a cart detail page, link it here */}
                    {c?._id ? (
                      <Link
                        href={`/abandoned-carts/${encodeURIComponent(String(c._id))}`}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ring-1 ring-inset bg-white text-blue-700 ring-blue-200 hover:bg-blue-50 transition"
                      >
                        View <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADDRESSES */}
      <div className={card}>
        <h2 className="text-xl font-semibold mb-5">Addresses</h2>
        {loadingAddress ? (
          <p className="text-gray-500 animate-pulse">Loading addresses...</p>
        ) : addresses.length === 0 ? (
          <p className="text-gray-600">No addresses available.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((addr) => (
              <div key={addr._id} className="border p-4 rounded-md">
                <p className="font-semibold">{addr.fullName}</p>
                <p className="text-sm">{addr.phone}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {addr.addressLine1}, {addr.city}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CUSTOMER ORDERS */}
      <div className={card}>
        <h2 className="text-xl font-semibold mb-5">Customer Orders</h2>
        {loadingOrders ? (
          <p className="text-gray-500 animate-pulse">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-600">This customer has not placed any orders.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                onClick={() => router.push(`/orders/${order._id}`)}
                className="border p-4 rounded-md hover:bg-gray-50 transition cursor-pointer"
              >
                <p className="font-semibold">Order #{order.orderNumber}</p>
                <p className="text-sm text-gray-600">
                  Status: {String(order.fulfillmentStatus || "").replace(/_/g, " ")}
                </p>
                <p className="text-sm text-gray-600">Total: ₹{order.finalPayable}</p>
                <p className="text-xs text-gray-400">{fmtDate(order.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ SUPPORT TICKETS (by customer email) */}
      <div className={card}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-5">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Ticket className="h-5 w-5" /> Support Tickets
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Loaded by email: <span className="font-semibold">{customerEmail || "—"}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/support-tickets/search`}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50 transition"
            >
              Open Search <ExternalLink className="h-4 w-4" />
            </Link>
            <button
              onClick={() => fetchTicketsByEmail(customerEmail)}
              className="inline-flex items-center gap-2 rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {ticketsError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5" /> {ticketsError}
          </div>
        ) : null}

        {loadingTickets ? (
          <p className="text-gray-500 animate-pulse">Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <p className="text-gray-600">No support tickets found for this customer.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>
                Showing <span className="font-semibold">{tickets.length}</span> tickets
              </span>
              <span>
                Total: <span className="font-semibold">{ticketsTotal}</span>
              </span>
            </div>

            {tickets.map((t) => (
              <div key={t.ticketId} className="border p-4 rounded-md hover:bg-gray-50 transition">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-blue-700">{t.ticketId}</p>
                    <p className="font-semibold text-gray-900 line-clamp-1">{safe(t.subject) || "(No subject)"}</p>
                    <p className="text-sm text-gray-600 line-clamp-1">{safe(t.issueType) || "-"}</p>

                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-600">
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1">
                        Created: {fmtDate(t.createdAt)}
                      </span>
                      {safe(t.orderId) ? (
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1">
                          Order: {safe(t.orderId)}
                        </span>
                      ) : null}
                      {Array.isArray(t.attachments) && t.attachments.length ? (
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1">
                          Attachments: {t.attachments.length}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
                    <StatusPill status={t.status} />
                    <Link
                      href={`/support-tickets/${encodeURIComponent(safe(t.ticketId))}`}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ring-1 ring-inset bg-white text-blue-700 ring-blue-200 hover:bg-blue-50 transition"
                    >
                      View <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WISHLIST */}
      <div className={card}>
        <h2 className="text-xl font-semibold mb-5">Wishlist Products</h2>
        {loadingWishlist ? (
          <p className="text-gray-500 animate-pulse">Loading wishlist...</p>
        ) : wishlist.length === 0 ? (
          <p className="text-gray-600">No wishlist items.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {wishlist.map((pid, i) => (
              <div key={i} className="border p-4 rounded-md text-center">
                <p className="font-semibold break-all">{pid}</p>
                <p className="text-xs text-gray-500">Product ID</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
