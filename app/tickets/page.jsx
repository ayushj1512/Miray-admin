"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Trash2, Loader2, X, Ticket as TicketIcon } from "lucide-react";

import AnimatedDropdown from "@/components/common/AnimatedDropdown.jsx";
import MultiSelect from "@/components/common/MultiSelect";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [priorityFilter, setPriorityFilter] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const priorities = ["low", "medium", "high", "urgent"];
  const categories = ["technical", "inventory", "production", "accounting", "other"];
  const statuses = ["open", "in-progress", "resolved", "closed"];

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [createLoading, setCreateLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "low",
    category: "other",
    createdBy: "guest",
  });

  /* FETCH TICKETS */
  const fetchTickets = async () => {
    setLoading(true);
    const res = await axios.get(`${API}/api/tickets`);
    setTickets(res.data.tickets);
    setLoading(false);
  };
  useEffect(() => { fetchTickets(); }, []);

  /* FILTER ENGINE */
  useEffect(() => {
    let data = tickets;

    if (search.trim()) data = data.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
    if (priorityFilter.length) data = data.filter((t) => priorityFilter.includes(t.priority));
    if (categoryFilter.length) data = data.filter((t) => categoryFilter.includes(t.category));
    if (statusFilter !== "all") data = data.filter((t) => t.status === statusFilter);

    data = [...data].sort((a, b) =>
      sortBy === "newest" ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt)
    );

    setFiltered(data);
  }, [tickets, search, priorityFilter, categoryFilter, statusFilter, sortBy]);

  /* CREATE TICKET */
  const validateForm = () => {
    let e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    return e;
  };

  const createTicket = async () => {
    const e = validateForm();
    setErrors(e);

    if (Object.keys(e).length > 0) return;

    try {
      setCreateLoading(true);
      await axios.post(`${API}/api/tickets`, form);

      // Reset
      setForm({ title: "", description: "", priority: "low", category: "other", createdBy: "guest" });

      setShowCreateModal(false);
      fetchTickets();
    } catch (err) {
      console.error(err);
    }

    setCreateLoading(false);
  };

  /* UPDATE STATUS */
  const updateStatus = async (id, status) => {
    await axios.patch(`${API}/api/tickets/${id}/status`, { status });
    fetchTickets();
  };

  /* DELETE TICKET */
  const deleteTicket = async (id) => {
    if (!confirm("Delete this ticket?")) return;
    await axios.delete(`${API}/api/tickets/${id}`);
    fetchTickets();
  };

  /* OPEN DETAIL */
  const openDetails = (ticket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <TicketIcon size={32} className="text-blue-700" />
          <h1 className="text-3xl font-semibold text-gray-900">Tickets / Issues</h1>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-700 text-white px-6 py-3 rounded-xl shadow hover:bg-blue-800 transition"
        >
          <Plus size={20} /> New Ticket
        </button>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">
        <input
          placeholder="Search tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="col-span-2 bg-white shadow-sm border px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-600"
        />

        <MultiSelect label="Priority" list={priorities} values={priorityFilter} setValues={setPriorityFilter} />
        <MultiSelect label="Category" list={categories} values={categoryFilter} setValues={setCategoryFilter} />

        <AnimatedDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={["all", ...statuses]} />
        <AnimatedDropdown label="Sort" value={sortBy} onChange={setSortBy} options={["newest", "oldest"]} />
      </div>

      {/* LIST */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={50} className="animate-spin text-blue-700" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-24">
          <p className="text-xl">No tickets found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((t) => (
            <div
              key={t._id}
              className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer"
              onClick={() => openDetails(t)}
            >
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-semibold text-gray-900">{t.title}</h2>

                <Trash2
                  size={18}
                  className="text-red-600 hover:scale-110 transition"
                  onClick={(e) => { e.stopPropagation(); deleteTicket(t._id); }}
                />
              </div>

              <p className="text-gray-700 mt-2 line-clamp-2">{t.description}</p>

              <p className="text-xs text-gray-500 mt-3">
                Created: {new Date(t.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* DETAILS MODAL */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl max-w-lg w-full shadow-2xl relative animate-fadeIn">

            <X
              size={26}
              className="absolute top-4 right-4 cursor-pointer hover:text-red-500 transition"
              onClick={() => setShowDetailModal(false)}
            />

            <h2 className="text-2xl font-semibold mb-3 text-gray-900">{selectedTicket.title}</h2>
            <p className="text-gray-700 mb-5">{selectedTicket.description}</p>

            <AnimatedDropdown
              label="Change Status"
              value={selectedTicket.status}
              options={statuses}
              onChange={(v) => {
                updateStatus(selectedTicket._id, v);
                setSelectedTicket({ ...selectedTicket, status: v });
              }}
            />

            <p className="mt-5 text-sm text-gray-500">
              Created: {new Date(selectedTicket.createdAt).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Ticket ID: {selectedTicket._id}</p>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl max-w-lg w-full shadow-xl animate-fadeIn">

            <h2 className="text-xl font-semibold mb-5">Create Ticket</h2>

            <input
              placeholder="Title"
              className="w-full border rounded-xl px-3 py-2.5 mb-2 focus:ring-2 focus:ring-blue-600"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            {errors.title && <p className="text-red-600 text-sm mb-3">{errors.title}</p>}

            <textarea
              placeholder="Description"
              className="w-full border rounded-xl px-3 py-2.5 mb-2 focus:ring-2 focus:ring-blue-600"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            {errors.description && <p className="text-red-600 text-sm mb-3">{errors.description}</p>}

            <AnimatedDropdown
              label="Priority"
              value={form.priority}
              options={priorities}
              onChange={(v) => setForm({ ...form, priority: v })}
            />

            <AnimatedDropdown
              label="Category"
              value={form.category}
              options={categories}
              onChange={(v) => setForm({ ...form, category: v })}
            />

            <div className="flex justify-end mt-6 gap-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2 border rounded-xl hover:bg-gray-200 transition"
              >
                Cancel
              </button>

              <button
                onClick={createTicket}
                disabled={createLoading}
                className="px-5 py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition flex items-center gap-2"
              >
                {createLoading && <Loader2 size={18} className="animate-spin" />}
                Create
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
