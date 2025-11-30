"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { sidebarMenus, routeSidebarMap } from "../common/sidebarConfig";

export default function Sidebar({ isOpen }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => setCollapsed(!collapsed);

  // Hide sidebar on homepage
  if (pathname === "/") return null;

  // Prefix-based route match
  const matchedEntry = routeSidebarMap.find((entry) =>
    pathname.startsWith(entry.prefix)
  );

  const activeKey = matchedEntry?.key || "dashboard";
  const currentMenu = sidebarMenus[activeKey] || [];

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
          <Link href="/" className="font-bold text-lg text-blue-600 hover:opacity-80 transition">
            Miray Admin
          </Link>
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

      {/* Dynamic Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {currentMenu.map(({ label, href }, i) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");

            return (
              <li key={i}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {!collapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
