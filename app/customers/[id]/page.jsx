"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [customer, setCustomer] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [wishlist, setWishlist] = useState([]); // ALWAYS ARRAY
  const [loading, setLoading] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [loadingWishlist, setLoadingWishlist] = useState(true);

  const BACKEND = process.env.NEXT_PUBLIC_API_URL;

  /* -------------------------
      1. Fetch Customer
  -------------------------- */
  const fetchCustomer = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/customers/${id}`);
      const data = await res.json();
      setCustomer(data);
    } catch (error) {
      console.error("Failed to fetch customer:", error);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------
      2. Fetch Addresses
  -------------------------- */
  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/addresses/customer/${id}`);
      const data = await res.json();
      if (data.success) setAddresses(data.data);
    } catch (error) {
      console.error("Failed to load addresses:", error);
    } finally {
      setLoadingAddress(false);
    }
  };

  /* -------------------------
      3. Fetch Wishlist
  -------------------------- */
  const fetchWishlist = async (firebaseUID) => {
    if (!firebaseUID) {
      setWishlist([]);
      setLoadingWishlist(false);
      return;
    }

    try {
      const res = await fetch(
        `${BACKEND}/api/wishlist/firebase/${firebaseUID}`
      );
      const data = await res.json();

      if (data.success && data.wishlist) {
        setWishlist(data.wishlist.productIds || []);
      } else {
        setWishlist([]); // always array
      }
    } catch (error) {
      console.error("Failed to load wishlist:", error);
      setWishlist([]);
    } finally {
      setLoadingWishlist(false);
    }
  };

  /* -------------------------
      LOAD ALL DATA IN ORDER
  -------------------------- */
  useEffect(() => {
    (async () => {
      await fetchCustomer();
      await fetchAddresses();
    })();
  }, [id]);

  // Load wishlist *after* customer is fetched
  useEffect(() => {
    if (customer?.firebaseUID) {
      fetchWishlist(customer.firebaseUID);
    }
  }, [customer]);

  /* -------------------------
      LOADING STATES
  -------------------------- */
  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-pulse text-gray-500">Loading customer...</div>
      </div>
    );

  if (!customer)
    return (
      <div className="p-8">
        <p className="text-red-500 font-semibold text-lg">Customer not found.</p>
        <button
          onClick={() => router.push("/customers")}
          className="mt-4 px-4 py-2 bg-black text-white hover:bg-gray-800"
        >
          Back to Customers
        </button>
      </div>
    );

  /* -------------------------
      CARD STYLE
  -------------------------- */
  const card =
    "bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all";

  return (
    <div className="p-8 space-y-10">

      {/* BACK */}
      <button
        onClick={() => router.push("/customers")}
        className="text-gray-600 hover:text-black transition flex items-center gap-2"
      >
        ← Back
      </button>

      {/* HEADER */}
      <div className={`${card} flex items-center gap-6`}>
        <img
          src={customer.profileImage || "/profile/user-avatar.jpg"}
          className="w-24 h-24 rounded-full border object-cover"
          alt="profile"
        />

        <div>
          <h1 className="text-3xl font-bold">
            {customer.name || "Unnamed User"}
          </h1>
          <p className="text-gray-600">{customer.email}</p>
          <p className="text-xs mt-2 px-2 py-1 bg-gray-100 inline-block rounded text-gray-500">
            UID: {customer.firebaseUID}
          </p>
        </div>
      </div>

      {/* ======================
          GRID: INFO SECTIONS
      ======================= */}
      <div className="grid lg:grid-cols-2 gap-8">

        {/* CUSTOMER INFO */}
        <div className={card}>
          <h2 className="text-xl font-semibold mb-4">Customer Information</h2>

          <InfoItem label="Phone" value={customer.phone || "—"} />
          <InfoItem label="Gender" value={customer.gender} />
          <InfoItem label="Age Group" value={customer.ageGroup} />
          <InfoItem
            label="Joined"
            value={new Date(customer.joinedAt).toLocaleDateString()}
          />
        </div>

        {/* LOCATION */}
        <div className={card}>
          <h2 className="text-xl font-semibold mb-4">Location</h2>

          <InfoItem label="Country" value={customer.country} />
          <InfoItem label="State" value={customer.state || "—"} />
          <InfoItem label="City" value={customer.city || "—"} />
        </div>

        {/* ANALYTICS */}
        <div className={card}>
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>

          <InfoItem
            label="Total Orders"
            value={customer.analytics.totalOrders}
          />
          <InfoItem
            label="Total Spend"
            value={`₹${customer.analytics.totalSpend}`}
          />
          <InfoItem
            label="Wishlist Count"
            value={customer.analytics.wishlistCount}
          />
        </div>

        {/* PREFERENCES */}
        <div className={card}>
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>

          <p className="font-medium text-gray-700">Favorite Brands:</p>

          {customer.preferences.favoriteBrands?.length ? (
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

      {/* ======================
          ADDRESSES
      ======================= */}
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

      {/* ======================
          WISHLIST
      ======================= */}
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
                <p className="font-semibold">{pid}</p>
                <p className="text-xs text-gray-500">Product ID</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------
    REUSABLE COMPONENT
-------------------------- */
function InfoItem({ label, value }) {
  return (
    <p className="flex justify-between text-sm text-gray-700">
      <span className="font-medium text-gray-900">{label}:</span>
      <span>{value}</span>
    </p>
  );
}
