"use client";

import { Menu, LogOut } from "lucide-react";
import useLoginStore from "../../store/useLoginStore";

export default function Header({ toggleSidebar }) {
  const logout = useLoginStore((state) => state.logout);

  return (
    <header className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition"
        >
          <Menu size={22} />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 tracking-wide">
          Miray Fashion Admin
        </h1>
      </div>
      <button
        onClick={logout}
        className="flex items-center gap-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition"
      >
        <LogOut size={18} />
        Logout
      </button>
    </header>
  );
}
