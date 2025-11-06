"use client";

import { useRouter } from "next/navigation";
import {
  Palette,
  Calculator,
  Boxes,
  Truck,
  Laptop,
  BarChart3,
  Users,
  ShoppingCart,
} from "lucide-react";
import useLoginStore from "../../store/useLoginStore";

export default function HomeDashboard() {
  const router = useRouter();
  const logout = useLoginStore((state) => state.logout);

  const domains = [
    {
      id: "designing",
      name: "Designing",
      icon: Palette,
      color: "bg-blue-600",
      route: "/designing",
    },
    {
      id: "accounts",
      name: "Accounts",
      icon: Calculator,
      color: "bg-blue-600",
      route: "/accounts",
    },
    {
      id: "inventory",
      name: "Inventory",
      icon: Boxes,
      color: "bg-blue-600",
      route: "/inventory",
    },
    {
      id: "operations",
      name: "Operations",
      icon: Truck,
      color: "bg-blue-600",
      route: "/operations",
    },
    {
      id: "it",
      name: "IT & Systems",
      icon: Laptop,
      color: "bg-blue-600",
      route: "/it",
    },
    {
      id: "marketing",
      name: "Marketing",
      icon: BarChart3,
      color: "bg-blue-600",
      route: "/marketing",
    },
    {
      id: "customers",
      name: "Customers",
      icon: Users,
      color: "bg-blue-600",
      route: "/customers",
    },
    {
      id: "sales",
      name: "Sales",
      icon: ShoppingCart,
      color: "bg-blue-600",
      route: "/sales",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10 text-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to Miray Fashion Admin Dashboard
        </h1>
        <button
          onClick={logout}
          className="flex items-center gap-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Logout
        </button>
      </div>

      {/* Domains Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {domains.map((domain) => {
          const Icon = domain.icon;
          return (
            <div
              key={domain.id}
              onClick={() => router.push(domain.route)}
              className="cursor-pointer rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-500 transition-all duration-300 p-6 flex flex-col items-center justify-center group"
            >
              <div
                className={`p-4 rounded-full ${domain.color} text-white mb-3 flex items-center justify-center group-hover:scale-105 transition-transform`}
              >
                <Icon size={28} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition">
                {domain.name}
              </h2>
            </div>
          );
        })}
      </div>
    </div>
  );
}
