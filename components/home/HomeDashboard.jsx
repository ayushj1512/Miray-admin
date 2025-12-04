"use client";

import { useRouter } from "next/navigation";
import { Palette, Calculator, Boxes, Truck, Laptop, BarChart3, Users, ShoppingCart, LineChart, FileBarChart, Ticket, TicketPercent, Package, ClipboardList, Images, FileText, Headset } from "lucide-react";

export default function HomeDashboard() {
  const router = useRouter();

  const domains = [
    { id: "designing", name: "Designing", icon: Palette, route: "/designing" },
    { id: "production", name: "Production / Tailoring", icon: Ticket, route: "/production" },
    { id: "accounts", name: "Accounts", icon: Calculator, route: "/accounts" },
    { id: "products", name: "Products", icon: Package, route: "/products" },
    { id: "orders", name: "Orders", icon: ClipboardList, route: "/orders" },
    { id: "media", name: "Media", icon: Images, route: "/media" },
    { id: "blogs", name: "Blogs", icon: FileText, route: "/blogs" },
    { id: "inventory", name: "Inventory", icon: Boxes, route: "/inventory" },
    { id: "operations", name: "Operations", icon: Truck, route: "/operations" },
    { id: "it", name: "IT & Systems", icon: Laptop, route: "/it" },
    { id: "marketing", name: "Marketing", icon: BarChart3, route: "/marketing" },
    { id: "customers", name: "Customers", icon: Users, route: "/customers/dashboard" },
    { id: "support", name: "Customer Support", icon: Headset, route: "/support-tickets" },
    { id: "sales", name: "Sales", icon: ShoppingCart, route: "/sales" },
    { id: "analytics", name: "Data Analytics", icon: LineChart, route: "/analytics" },
    { id: "reports", name: "Reports", icon: FileBarChart, route: "/reports" },
    { id: "tickets", name: "Tickets / Issues", icon: Ticket, route: "/tickets" },
    { id: "coupons", name: "Coupons", icon: TicketPercent, route: "/coupons" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-6 md:px-8 py-10 md:py-12">
      <div className="w-full flex flex-wrap justify-center gap-6 md:gap-8">
        {domains.map((domain) => {
          const Icon = domain.icon;
          return (
            <button key={domain.id} type="button" onClick={() => router.push(domain.route)} className="cursor-pointer w-64 h-48 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center group">
              <div className="p-4 rounded-xl text-white shadow-md group-hover:scale-110 transition-transform bg-gradient-to-br from-blue-600 to-blue-500">
                <Icon size={32} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mt-4 transition group-hover:text-blue-700">{domain.name}</h2>
            </button>
          );
        })}
      </div>
    </div>
  );
}
