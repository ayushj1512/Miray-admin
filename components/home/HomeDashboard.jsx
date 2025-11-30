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
  LineChart,
  FileBarChart,
  Scissors,
  Ticket,   // ✅ Added Ticket icon
} from "lucide-react";

export default function HomeDashboard() {
  const router = useRouter();

  const domains = [
    { id: "designing", name: "Designing", icon: Palette, route: "/designing" },
    { id: "production", name: "Production / Tailoring", icon: Scissors, route: "/production" },
    { id: "accounts", name: "Accounts", icon: Calculator, route: "/accounts" },
    { id: "inventory", name: "Inventory", icon: Boxes, route: "/inventory" },
    { id: "operations", name: "Operations", icon: Truck, route: "/operations" },
    { id: "it", name: "IT & Systems", icon: Laptop, route: "/it" },
    { id: "marketing", name: "Marketing", icon: BarChart3, route: "/marketing" },
    { id: "customers", name: "Customers", icon: Users, route: "/customers/dashboard" },
    { id: "sales", name: "Sales", icon: ShoppingCart, route: "/sales" },
    { id: "analytics", name: "Data Analytics", icon: LineChart, route: "/analytics" },
    { id: "reports", name: "Reports", icon: FileBarChart, route: "/reports" },

    // ✅ ADDED TICKETS MODULE
    { id: "tickets", name: "Tickets / Issues", icon: Ticket, route: "/tickets" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-12">
      <div
        className="
          w-full
          flex flex-wrap justify-center gap-8
        "
      >
        {domains.map((domain) => {
          const Icon = domain.icon;

          return (
            <div
              key={domain.id}
              onClick={() => router.push(domain.route)}
              className="
                cursor-pointer w-64 h-48
                bg-white rounded-2xl border border-gray-200 
                shadow-sm hover:shadow-md hover:-translate-y-1 
                transition-all duration-300
                flex flex-col items-center justify-center
                group
              "
            >
              <div
                className="
                  p-4 rounded-xl
                  bg-gradient-to-br from-blue-600 to-blue-500 
                  text-white shadow-md
                  group-hover:scale-110 transition-transform
                "
              >
                <Icon size={32} />
              </div>

              <h2
                className="
                  text-xl font-semibold text-gray-900 mt-4
                  group-hover:text-blue-700 transition
                "
              >
                {domain.name}
              </h2>
            </div>
          );
        })}
      </div>
    </div>
  );
}
