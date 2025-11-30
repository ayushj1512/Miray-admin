"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

import { motion } from "framer-motion";
import {
  Search,
  Download,
  Plus,
  Trash2,
  CheckCircle,
  EyeOff,
  Eye,
} from "lucide-react";
import * as XLSX from "xlsx";

// simple email regex
const validEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function NewsletterAdminPage() {
  const API = process.env.NEXT_PUBLIC_API_URL + "/api/newsletters";

  const [data, setData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingTable, setLoadingTable] = useState(true);

  // Fetch subscribers
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(API);
        const json = await res.json();
        setData(json || []);
      } catch (e) {
        console.error("Newsletter fetch error:", e);
      }
      setLoadingTable(false);
    }
    load();
  }, [API]);

  // Add subscriber manually
  const addSubscriber = async () => {
    if (!validEmail(newEmail)) return alert("Invalid email format");

    setLoadingAdd(true);

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });

      const json = await res.json();

      if (res.ok) {
        setData((prev) => [json.subscription, ...prev]);
        setNewEmail("");
      } else {
        alert(json.message);
      }
    } catch (e) {
      alert("Network error");
    }

    setLoadingAdd(false);
  };

  // Delete subscriber
  const deleteSubscriber = (email) => {
    setData((prev) => prev.filter((user) => user.email !== email));
  };

  // Toggle Verification
  const toggleVerify = (email) => {
    setData((prev) =>
      prev.map((user) =>
        user.email === email
          ? { ...user, isVerified: !user.isVerified }
          : user
      )
    );
  };

  // Table Columns
  const columnHelper = createColumnHelper();

  const columns = useMemo(
    () => [
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => (
          <span className="font-medium text-gray-800">
            {info.getValue()}
          </span>
        ),
      }),

      columnHelper.accessor("isVerified", {
        header: "Verified",
        cell: (info) =>
          info.getValue() ? (
            <span className="text-green-600 font-semibold flex items-center gap-1">
              <CheckCircle size={14} /> Yes
            </span>
          ) : (
            <span className="text-red-500 flex items-center gap-1">
              <EyeOff size={14} /> No
            </span>
          ),
      }),

      columnHelper.accessor("isActive", {
        header: "Status",
        cell: (info) =>
          info.getValue() ? (
            <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
              Active
            </span>
          ) : (
            <span className="px-2 py-1 rounded-full bg-gray-200 text-gray-600 text-xs">
              Inactive
            </span>
          ),
      }),

      columnHelper.accessor("subscribedAt", {
        header: "Subscribed On",
        cell: (info) =>
          new Date(info.getValue()).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
      }),

    
    ],
    []
  );

  // Setup TanStack Table
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Export to Excel
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Subscribers");
    XLSX.writeFile(wb, "newsletter_subscribers.xlsx");
  };

  return (
    <div className="p-6 w-full max-w-7xl mx-auto">

      {/* PAGE HEADER */}
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 text-blue-700"
      >
        Newsletter Subscribers
      </motion.h1>

      {/* SEARCH + EXPORT */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex items-center border px-3 py-2 rounded-lg bg-white shadow-sm w-full md:w-1/3">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            placeholder="Search email..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="ml-2 outline-none text-sm w-full"
          />
        </div>

        {/* Export */}
        <button
          onClick={exportExcel}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 text-sm"
        >
          <Download size={16} /> Export
        </button>
      </div>

      {/* MANUAL ADD */}
      <div className="flex gap-3 mb-6">
        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Add new email..."
          className="border rounded-lg px-3 py-2 text-sm bg-white shadow-sm flex-1"
        />

        <button
          onClick={addSubscriber}
          disabled={loadingAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          <Plus size={16} />
          {loadingAdd ? "Adding..." : "Add"}
        </button>
      </div>

      {/* TABLE */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="overflow-x-auto border rounded-xl shadow bg-white"
      >
        {loadingTable ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-sm text-gray-800">
            <thead className="bg-blue-50 sticky top-0 z-10 border-b">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="p-3 cursor-pointer select-none text-left"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: " ↑",
                        desc: " ↓",
                      }[header.column.getIsSorted()] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.map((row) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b hover:bg-gray-50 transition"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </motion.tr>
              ))}

              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    No subscribers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <span>
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>

        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
