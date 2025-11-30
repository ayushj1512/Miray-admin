// components/MultiSelect.js
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function MultiSelect({ label, list, values, setValues }) {
  const [open, setOpen] = useState(false);

  const toggle = (item) => {
    if (values.includes(item)) {
      setValues(values.filter(v => v !== item));
    } else {
      setValues([...values, item]);
    }
  };

  return (
    <div className="relative select-none">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between bg-white border border-gray-300 px-4 py-2 rounded-xl shadow-sm hover:border-blue-400 transition"
      >
        <span>{label}: {values.length === 0 ? "All" : values.join(", ")}</span>
        <ChevronDown size={18} className={`${open ? "rotate-180" : ""} transition`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute z-50 w-full bg-white border rounded-xl shadow-lg mt-2 p-2"
          >
            {list.map(item => (
              <div
                key={item}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                onClick={() => toggle(item)}
              >
                <span>{item}</span>
                {values.includes(item) && <Check size={18} className="text-blue-600" />}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
