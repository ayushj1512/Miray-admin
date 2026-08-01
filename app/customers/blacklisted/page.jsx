"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Ban,
    CheckCircle2,
    Loader2,
    Mail,
    Phone,
    RefreshCcw,
    Search,
    ShieldAlert,
    ShieldCheck,
    UserRound,
    Users,
    X,
} from "lucide-react";
import { useCustomerStore } from "@/store/customerStore";

const PAGE_LIMIT = 20;

const clean = (value) => String(value ?? "").trim();

const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export default function BlacklistedCustomersPage() {
    const {
        customers,
        total,
        page,
        pages,
        loadingList,
        saving,
        error,
        fetchCustomers,
        updateCustomerBlacklistStatus,
    } = useCustomerStore();

    const [tab, setTab] = useState("blacklisted");

    const [search, setSearch] = useState("");
    const [activeSearch, setActiveSearch] = useState("");

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [blacklistReason, setBlacklistReason] = useState("");
    const [showBlacklistModal, setShowBlacklistModal] = useState(false);

    const isBlacklistedTab = tab === "blacklisted";

    const loadCustomers = async ({
        selectedPage = 1,
        searchValue = activeSearch,
        selectedTab = tab,
    } = {}) => {
        const params = {
            page: selectedPage,
            limit: PAGE_LIMIT,
            search: clean(searchValue),
            sortBy:
                selectedTab === "blacklisted" ? "blacklistedAt" : "createdAt",
            sortOrder: "desc",
        };

        if (selectedTab === "blacklisted") {
            params.isBlacklisted = true;
        }

        await fetchCustomers(params);
    };

    useEffect(() => {
        loadCustomers({
            selectedPage: 1,
            searchValue: "",
            selectedTab: "blacklisted",
        });
    }, []);

    const handleTabChange = async (nextTab) => {
        setTab(nextTab);
        setSearch("");
        setActiveSearch("");

        await loadCustomers({
            selectedPage: 1,
            searchValue: "",
            selectedTab: nextTab,
        });
    };

    const handleSearch = async (event) => {
        event.preventDefault();

        const value = clean(search);
        setActiveSearch(value);

        await loadCustomers({
            selectedPage: 1,
            searchValue: value,
            selectedTab: tab,
        });
    };

    const handleClearSearch = async () => {
        setSearch("");
        setActiveSearch("");

        await loadCustomers({
            selectedPage: 1,
            searchValue: "",
            selectedTab: tab,
        });
    };

    const openBlacklistModal = (customer) => {
        setSelectedCustomer(customer);
        setBlacklistReason("");
        setShowBlacklistModal(true);
    };

    const closeBlacklistModal = () => {
        if (saving) return;

        setSelectedCustomer(null);
        setBlacklistReason("");
        setShowBlacklistModal(false);
    };

    const handleBlacklistCustomer = async () => {
        if (!selectedCustomer?._id || saving) return;

        const result = await updateCustomerBlacklistStatus(
            selectedCustomer._id,
            true,
            blacklistReason
        );

        if (result?.success) {
            closeBlacklistModal();

            await loadCustomers({
                selectedPage: page,
                searchValue: activeSearch,
                selectedTab: tab,
            });
        }
    };

    const handleRemoveBlacklist = async (customer) => {
        if (!customer?._id || saving) return;

        const confirmed = window.confirm(
            `Remove ${customer?.name || "this customer"} from blacklist?`
        );

        if (!confirmed) return;

        const result = await updateCustomerBlacklistStatus(
            customer._id,
            false,
            ""
        );

        if (result?.success) {
            const nextPage =
                customers.length === 1 && page > 1 ? page - 1 : page;

            await loadCustomers({
                selectedPage: nextPage,
                searchValue: activeSearch,
                selectedTab: tab,
            });
        }
    };

    const visibleCustomers = useMemo(
        () => (Array.isArray(customers) ? customers : []),
        [customers]
    );

    return (
        <main className="min-h-screen bg-zinc-50 p-4 text-zinc-950 md:p-6">
            <div className="mx-auto max-w-7xl space-y-5">
                {/* Header */}
                <section className="rounded-2xl border border-zinc-200 bg-white p-5">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-600">
                                <ShieldAlert size={16} />
                                Customer Risk Control
                            </div>

                            <h1 className="text-2xl font-semibold tracking-tight">
                                Customer Blacklist
                            </h1>

                            <p className="mt-1 text-sm text-zinc-500">
                                Search customers and manage their blacklist status.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                loadCustomers({
                                    selectedPage: page,
                                    searchValue: activeSearch,
                                    selectedTab: tab,
                                })
                            }
                            disabled={loadingList}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCcw
                                size={16}
                                className={loadingList ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>
                    </div>
                </section>

                {/* Tabs */}
                <section className="rounded-2xl border border-zinc-200 bg-white p-2">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => handleTabChange("all")}
                            disabled={loadingList}
                            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium transition ${tab === "all"
                                    ? "bg-zinc-950 text-white"
                                    : "text-zinc-600 hover:bg-zinc-100"
                                }`}
                        >
                            <Users size={17} />
                            All Customers
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange("blacklisted")}
                            disabled={loadingList}
                            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium transition ${tab === "blacklisted"
                                    ? "bg-red-600 text-white"
                                    : "text-zinc-600 hover:bg-red-50 hover:text-red-600"
                                }`}
                        >
                            <Ban size={17} />
                            Blacklisted Customers
                        </button>
                    </div>
                </section>

                {/* Summary */}
                <section className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            {isBlacklistedTab
                                ? "Blacklisted Customers"
                                : "Available Customers"}
                        </p>

                        <p className="mt-2 text-3xl font-semibold">{total || 0}</p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            Current Page
                        </p>

                        <p className="mt-2 text-3xl font-semibold">
                            {page || 1} / {pages || 1}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            Visible Records
                        </p>

                        <p className="mt-2 text-3xl font-semibold">
                            {visibleCustomers.length}
                        </p>
                    </div>
                </section>

                {/* Search */}
                <section className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <form
                        onSubmit={handleSearch}
                        className="flex flex-col gap-3 md:flex-row"
                    >
                        <div className="relative flex-1">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                            />

                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search name, mobile, email or customer ID"
                                className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-zinc-900"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loadingList}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
                        >
                            {loadingList ? (
                                <Loader2 size={17} className="animate-spin" />
                            ) : (
                                <Search size={17} />
                            )}

                            Search
                        </button>

                        {(search || activeSearch) && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                disabled={loadingList}
                                className="h-11 rounded-xl border border-zinc-200 px-5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60"
                            >
                                Clear
                            </button>
                        )}
                    </form>
                </section>

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Customer List */}
                <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                    {loadingList ? (
                        <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-zinc-500">
                            <Loader2 size={20} className="animate-spin" />
                            Loading customers...
                        </div>
                    ) : visibleCustomers.length === 0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                            {isBlacklistedTab ? (
                                <ShieldCheck size={38} className="text-zinc-300" />
                            ) : (
                                <Users size={38} className="text-zinc-300" />
                            )}

                            <h2 className="mt-3 font-semibold">
                                {isBlacklistedTab
                                    ? "No blacklisted customers found"
                                    : "No customers found"}
                            </h2>

                            <p className="mt-1 text-sm text-zinc-500">
                                Try changing your search query.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop */}
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full min-w-[1050px] text-left">
                                    <thead className="border-b border-zinc-200 bg-zinc-50">
                                        <tr className="text-xs uppercase tracking-wide text-zinc-500">
                                            <th className="px-5 py-4 font-medium">Customer</th>
                                            <th className="px-5 py-4 font-medium">Contact</th>
                                            <th className="px-5 py-4 font-medium">Orders</th>

                                            {isBlacklistedTab && (
                                                <>
                                                    <th className="px-5 py-4 font-medium">Reason</th>
                                                    <th className="px-5 py-4 font-medium">
                                                        Blacklisted On
                                                    </th>
                                                </>
                                            )}

                                            <th className="px-5 py-4 text-right font-medium">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-zinc-100">
                                        {visibleCustomers.map((customer) => (
                                            <tr key={customer._id} className="hover:bg-zinc-50/70">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                                                            <UserRound size={18} />
                                                        </div>

                                                        <div>
                                                            <p className="font-medium">
                                                                {customer?.name || "Unnamed Customer"}
                                                            </p>

                                                            <p className="mt-0.5 text-xs text-zinc-500">
                                                                ID: {customer?.customerId || customer?._id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="space-y-1.5 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Phone size={14} className="text-zinc-400" />
                                                            <span>{customer?.phone || "—"}</span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <Mail size={14} className="text-zinc-400" />
                                                            <span>{customer?.email || "—"}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 text-sm">
                                                    <p className="font-medium">
                                                        {customer?.analytics?.totalOrders || 0}
                                                    </p>

                                                    <p className="text-xs text-zinc-500">
                                                        RTO: {customer?.analytics?.rtoRate || 0}%
                                                    </p>
                                                </td>

                                                {isBlacklistedTab && (
                                                    <>
                                                        <td className="max-w-xs px-5 py-4 text-sm text-zinc-600">
                                                            {customer?.blacklistReason ||
                                                                "No reason added"}
                                                        </td>

                                                        <td className="px-5 py-4 text-sm text-zinc-600">
                                                            {formatDate(customer?.blacklistedAt)}
                                                        </td>
                                                    </>
                                                )}

                                                <td className="px-5 py-4 text-right">
                                                    {customer?.isBlacklisted ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveBlacklist(customer)
                                                            }
                                                            disabled={saving}
                                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 text-sm font-medium text-green-700 transition hover:bg-green-100 disabled:opacity-60"
                                                        >
                                                            <CheckCircle2 size={15} />
                                                            Remove Blacklist
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openBlacklistModal(customer)
                                                            }
                                                            disabled={saving}
                                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                                                        >
                                                            <Ban size={15} />
                                                            Blacklist
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile */}
                            <div className="divide-y divide-zinc-100 md:hidden">
                                {visibleCustomers.map((customer) => (
                                    <article key={customer._id} className="space-y-4 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                                                <UserRound size={18} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium">
                                                    {customer?.name || "Unnamed Customer"}
                                                </p>

                                                <p className="mt-0.5 truncate text-xs text-zinc-500">
                                                    ID: {customer?.customerId || customer?._id}
                                                </p>
                                            </div>

                                            {customer?.isBlacklisted && (
                                                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                                                    Blacklisted
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-2 rounded-xl bg-zinc-50 p-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} className="text-zinc-400" />
                                                <span>{customer?.phone || "—"}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Mail size={14} className="text-zinc-400" />
                                                <span className="break-all">
                                                    {customer?.email || "—"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-xl border border-zinc-200 p-3">
                                                <p className="text-xs text-zinc-500">
                                                    Total Orders
                                                </p>

                                                <p className="mt-1 font-semibold">
                                                    {customer?.analytics?.totalOrders || 0}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border border-zinc-200 p-3">
                                                <p className="text-xs text-zinc-500">RTO Rate</p>

                                                <p className="mt-1 font-semibold">
                                                    {customer?.analytics?.rtoRate || 0}%
                                                </p>
                                            </div>
                                        </div>

                                        {customer?.isBlacklisted && (
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                                    Reason
                                                </p>

                                                <p className="mt-1 text-sm text-zinc-600">
                                                    {customer?.blacklistReason ||
                                                        "No reason added"}
                                                </p>

                                                <p className="mt-1 text-xs text-zinc-400">
                                                    {formatDate(customer?.blacklistedAt)}
                                                </p>
                                            </div>
                                        )}

                                        {customer?.isBlacklisted ? (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveBlacklist(customer)}
                                                disabled={saving}
                                                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 text-sm font-medium text-green-700 disabled:opacity-60"
                                            >
                                                <CheckCircle2 size={16} />
                                                Remove From Blacklist
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => openBlacklistModal(customer)}
                                                disabled={saving}
                                                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-medium text-red-700 disabled:opacity-60"
                                            >
                                                <Ban size={16} />
                                                Blacklist Customer
                                            </button>
                                        )}
                                    </article>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Pagination */}
                    {!loadingList && visibleCustomers.length > 0 && (
                        <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-200 px-4 py-4 sm:flex-row">
                            <p className="text-sm text-zinc-500">
                                Page {page || 1} of {pages || 1} · {total || 0} customers
                            </p>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={page <= 1 || loadingList}
                                    onClick={() =>
                                        loadCustomers({
                                            selectedPage: page - 1,
                                            searchValue: activeSearch,
                                            selectedTab: tab,
                                        })
                                    }
                                    className="h-9 rounded-lg border border-zinc-200 px-4 text-sm font-medium disabled:opacity-40"
                                >
                                    Previous
                                </button>

                                <button
                                    type="button"
                                    disabled={page >= pages || loadingList}
                                    onClick={() =>
                                        loadCustomers({
                                            selectedPage: page + 1,
                                            searchValue: activeSearch,
                                            selectedTab: tab,
                                        })
                                    }
                                    className="h-9 rounded-lg border border-zinc-200 px-4 text-sm font-medium disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* Blacklist Modal */}
            {showBlacklistModal && selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-zinc-200 p-5">
                            <div>
                                <h2 className="font-semibold">Blacklist Customer</h2>

                                <p className="mt-1 text-sm text-zinc-500">
                                    {selectedCustomer?.name || "Unnamed Customer"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeBlacklistModal}
                                disabled={saving}
                                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4 p-5">
                            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                This customer will remain visible in the blacklisted customers
                                tab.
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Blacklist Reason
                                </label>

                                <textarea
                                    value={blacklistReason}
                                    onChange={(event) =>
                                        setBlacklistReason(event.target.value)
                                    }
                                    rows={4}
                                    placeholder="Example: Repeated fake orders, high RTO or abusive behaviour"
                                    className="w-full resize-none rounded-xl border border-zinc-200 p-3 text-sm outline-none focus:border-zinc-900"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 border-t border-zinc-200 p-5">
                            <button
                                type="button"
                                onClick={closeBlacklistModal}
                                disabled={saving}
                                className="h-11 flex-1 rounded-xl border border-zinc-200 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleBlacklistCustomer}
                                disabled={saving}
                                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                {saving ? (
                                    <Loader2 size={17} className="animate-spin" />
                                ) : (
                                    <Ban size={17} />
                                )}

                                Blacklist
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}