"use client";

import { useState } from "react";
import {
  Home,
  Boxes,
  ShoppingCart,
  BarChart3,
  Users,
  Palette,
  Truck,
  Settings,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, href: "/" },
  { id: "inventory", label: "Inventory", icon: Boxes, href: "/inventory" },
  { id: "products", label: "Products", icon: Package, href: "/products" }, // ✅ Added
  { id: "orders", label: "Orders", icon: ShoppingCart, href: "/orders" },
  { id: "customers", label: "Customers", icon: Users, href: "/customers" },
  { id: "marketing", label: "Marketing", icon: BarChart3, href: "/marketing" },
  { id: "designing", label: "Designing", icon: Palette, href: "/designing" },
  { id: "operations", label: "Operations", icon: Truck, href: "/operations" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar({ isOpen }) {
  const pathname = usePathname();
  const [active, setActive] = useState(pathname);
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <aside
      className={`bg-white border-r border-gray-200 h-screen fixed lg:static top-0 left-0 z-40 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      } flex flex-col shadow-sm`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between h-16 border-b border-gray-200 px-4 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        {!collapsed && (
          <span className="font-bold text-lg text-blue-600">Miray Admin</span>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-md hover:bg-gray-100 transition"
        >
          {collapsed ? (
            <ChevronRight size={20} className="text-gray-600" />
          ) : (
            <ChevronLeft size={20} className="text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map(({ id, label, icon: Icon, href }) => (
            <li key={id}>
              <Link
                href={href}
                onClick={() => setActive(href)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  pathname === href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
