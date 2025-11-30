"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function AnimatedDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative select-none">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between bg-white border border-gray-300 px-4 py-2 rounded-xl shadow-sm hover:border-blue-400 transition"
      >
        <span>{label}: {value}</span>
        <ChevronDown size={18} className={`${open ? "rotate-180" : ""} transition`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute z-50 mt-2 w-full bg-white border rounded-xl shadow-xl p-2"
          >
            {options.map(opt => (
              <li
                key={opt}
                className="px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                onClick={() => { onChange(opt); setOpen(false); }}
              >
                {opt}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
