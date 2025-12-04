"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TicketPercent, CheckCircle } from "lucide-react";

export default function CreateCouponPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    code: "",
    type: "general",
    discountType: "percentage",
    discountValue: "",
    minPurchase: 0,
    maxDiscount: 0,
    validFrom: "",
    validTill: "",
    usageLimit: 0,
    usageLimitPerCustomer: 1,
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    let value = e.target.value;

    // Auto uppercase coupon code
    if (e.target.name === "code") {
      value = value.toUpperCase();
    }

    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to create coupon");

      setMessage("Coupon created successfully!");

      setTimeout(() => {
        router.push("/coupons/manage");
      }, 1200);
    } catch (error) {
      setMessage(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10">
      {/* HEADER */}
      <div className="mb-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-green-500 text-white shadow-md">
            <TicketPercent size={42} />
          </div>
        </div>

      <h1 className="text-3xl font-bold text-gray-800">Create New Coupon</h1>
      <p className="text-gray-500 mt-2">Fill in the details below to add a new coupon.</p>
    </div>

    {/* FORM CARD */}
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* COUPON CODE */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Coupon Code</label>
          <input
            type="text"
            name="code"
            value={form.code}
            onChange={handleChange}
            placeholder="e.g., MIRAY50"
            className="input"
            required
          />
        </div>

        {/* TYPE */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Coupon Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="input"
          >
            <option value="general">General</option>
            <option value="influencer">Influencer</option>
            <option value="system">System</option>
            <option value="company">Company</option>
          </select>
        </div>

        {/* DISCOUNT TYPE */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Discount Type</label>
          <select
            name="discountType"
            value={form.discountType}
            onChange={handleChange}
            className="input"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="flat">Flat Amount (₹)</option>
          </select>
        </div>

        {/* DISCOUNT VALUE */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Discount Value</label>
          <input
            type="number"
            name="discountValue"
            value={form.discountValue}
            onChange={handleChange}
            placeholder="e.g., 10"
            className="input"
            required
          />
        </div>

        {/* MIN PURCHASE */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Minimum Purchase (₹)</label>
          <input
            type="number"
            name="minPurchase"
            value={form.minPurchase}
            onChange={handleChange}
            className="input"
          />
        </div>

        {/* MAX DISCOUNT */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Max Discount (₹)</label>
          <input
            type="number"
            name="maxDiscount"
            value={form.maxDiscount}
            onChange={handleChange}
            className="input"
          />
        </div>

        {/* VALID FROM */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Valid From</label>
          <input
            type="date"
            name="validFrom"
            value={form.validFrom}
            onChange={handleChange}
            className="input"
          />
        </div>

        {/* VALID TILL */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Valid Till</label>
          <input
            type="date"
            name="validTill"
            value={form.validTill}
            onChange={handleChange}
            className="input"
            required
          />
        </div>

        {/* USAGE LIMIT */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Total Usage Limit</label>
          <input
            type="number"
            name="usageLimit"
            value={form.usageLimit}
            onChange={handleChange}
            className="input"
          />
        </div>

        {/* PER CUSTOMER */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Usage Limit Per Customer</label>
          <input
            type="number"
            name="usageLimitPerCustomer"
            value={form.usageLimitPerCustomer}
            onChange={handleChange}
            className="input"
          />
        </div>

        {/* ACTIVE? */}
        <div className="flex items-center gap-2 col-span-2">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          <label className="text-sm font-medium">Coupon Active</label>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="col-span-2 flex justify-center mt-4">
          <button
            type="submit"
            disabled={loading}
            className="
              bg-gradient-to-br from-green-600 to-green-500
              text-white px-10 py-3 rounded-xl shadow hover:shadow-md
              transition-all duration-300 font-medium
            "
          >
            {loading ? "Creating..." : "Create Coupon"}
          </button>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className="col-span-2 text-center text-sm mt-2 text-green-700 flex justify-center gap-2">
            <CheckCircle size={18} /> {message}
          </div>
        )}
      </form>
    </div>
  </div>
  );
}
