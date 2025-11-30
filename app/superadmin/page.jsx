"use client";
import { useState } from "react";
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Phone,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

export default function SuperAdminMock() {
  const roles = ["superadmin", "admin", "staff", "influencer", "viewer"];
  const permissionList = [
    "manageOrders",
    "manageCoupons",
    "viewAnalytics",
    "manageUsers",
    "editContent",
  ];

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    role: "admin",
    permissions: [],
  });

  const togglePermission = (perm) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 px-6 py-10 flex justify-center items-start">

      {/* MAIN CARD */}
      <div className="w-full max-w-3xl bg-white/90 backdrop-blur-xl shadow-2xl border border-gray-200 rounded-2xl p-10 animate-fadeIn">

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Admin User</h1>
            <p className="text-gray-500 text-sm mt-1">
              Add a new admin, staff, or user with role-based permissions.
            </p>
          </div>
        </div>

        {/* FORM */}
        <div className="space-y-8">

          {/* SECTION: BASIC INFO */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Basic Information
            </h2>

            <div className="grid md:grid-cols-2 gap-5">

              {/* FULL NAME */}
              <div>
                <label className="font-medium text-gray-700">Full Name</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    className="w-full border px-10 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-700 shadow-sm"
                    placeholder="John Doe"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>
              </div>

              {/* USERNAME */}
              <div>
                <label className="font-medium text-gray-700">Username</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    className="w-full border px-10 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-700 shadow-sm"
                    placeholder="miray_admin01"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* SECTION: CONTACT INFO */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Contact Information
            </h2>

            <div className="grid md:grid-cols-2 gap-5">

              {/* EMAIL */}
              <div>
                <label className="font-medium text-gray-700">Email</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    className="w-full border px-10 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-700 shadow-sm"
                    placeholder="admin@miray.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              {/* PHONE */}
              <div>
                <label className="font-medium text-gray-700">Phone</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    className="w-full border px-10 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-700 shadow-sm"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Security</h2>

            <div>
              <label className="font-medium text-gray-700">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="password"
                  className="w-full border px-10 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-700 shadow-sm"
                  placeholder="********"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* ROLE */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Role</h2>

            <div className="relative">
              <ChevronDown className="absolute right-3 top-3 text-gray-400" size={18} />
              <select
                className="w-full border px-4 py-3 rounded-xl appearance-none focus:ring-2 focus:ring-blue-700 shadow-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PERMISSIONS */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Permissions</h2>

            <div className="grid grid-cols-2 gap-3">
              {permissionList.map((perm) => (
                <label
                  key={perm}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition shadow-sm
                    ${
                      form.permissions.includes(perm)
                        ? "bg-blue-600 text-white border-blue-700"
                        : "bg-gray-100 hover:bg-gray-200 border-gray-300"
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(perm)}
                    onChange={() => togglePermission(perm)}
                  />
                  {perm}
                </label>
              ))}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button className="w-full mt-2 bg-blue-700 text-white py-3 rounded-xl hover:bg-blue-800 flex items-center justify-center gap-2 shadow-md transition">
            <UserPlus size={20} />
            Create Admin User
          </button>
        </div>
      </div>
    </div>
  );
}
