"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  Pencil,
  Trash2,
  ArrowLeft,
  ArrowRight,
  X,
  ArrowUpDown,
} from "lucide-react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ProductsPage() {
  const router = useRouter();

  /* ---------------------------------------------
     STATE
  --------------------------------------------- */
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced value used for API calls
  const [categoryFilter, setCategoryFilter] = useState("");

  const [sortKey, setSortKey] = useState("relevance"); // relevance | title | price | newest
  const [sortDir, setSortDir] = useState("asc"); // asc | desc

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* ---------------------------------------------
     DEBOUNCE SEARCH
  --------------------------------------------- */
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ---------------------------------------------
     FETCH PRODUCT LIST
  --------------------------------------------- */
  const loadProducts = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API}/api/products?page=${page}&search=${encodeURIComponent(
          search
        )}&category=${encodeURIComponent(categoryFilter)}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      setProducts(Array.isArray(data.products) ? data.products : []);
      setTotalPages(Number.isFinite(data.pages) ? data.pages : 1);
    } catch (err) {
      console.error("Load Products Error:", err);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------
     FETCH CATEGORIES
  --------------------------------------------- */
  const loadCategories = async () => {
    try {
      const res = await fetch(`${API}/api/categories`, { cache: "no-store" });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Load Categories Error:", e);
      setCategories([]);
    }
  };

  /* ---------------------------------------------
     INITIAL LOAD
  --------------------------------------------- */
  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, categoryFilter]);

  /* ---------------------------------------------
     DELETE PRODUCT
  --------------------------------------------- */
  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;

    const res = await fetch(`${API}/api/products/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) return alert(data.message || "Failed to delete");

    alert("Product deleted");
    loadProducts();
  };

  /* ---------------------------------------------
     SUBSTRING SEARCH (CLIENT-SIDE) + SORTING
  --------------------------------------------- */
  const visibleProducts = useMemo(() => {
    const q = searchInput.trim().toLowerCase();

    let list = products.filter((p) => {
      if (!q) return true;
      const title = String(p?.title ?? "").toLowerCase();
      const cat = String(p?.category?.name ?? "").toLowerCase();
      return title.includes(q) || cat.includes(q);
    });

    const dir = sortDir === "asc" ? 1 : -1;

    const getCreatedAt = (p) => {
      const t = p?.createdAt ? new Date(p.createdAt).getTime() : 0;
      return Number.isFinite(t) ? t : 0;
    };
    const getPrice = (p) => {
      const n = Number(p?.price);
      return Number.isFinite(n) ? n : 0;
    };
    const getTitle = (p) => String(p?.title ?? "").toLowerCase();

    if (sortKey === "title") {
      list = [...list].sort(
        (a, b) => (getTitle(a) > getTitle(b) ? 1 : -1) * dir
      );
    } else if (sortKey === "price") {
      list = [...list].sort((a, b) => (getPrice(a) - getPrice(b)) * dir);
    } else if (sortKey === "newest") {
      list = [...list].sort(
        (a, b) => (getCreatedAt(a) - getCreatedAt(b)) * dir
      );
    }

    return list;
  }, [products, searchInput, sortKey, sortDir]);

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategoryFilter("");
    setSortKey("relevance");
    setSortDir("asc");
    setPage(1);
  };

  return (
    <section className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* tighter vertical rhythm */}
      <div className="w-full flex flex-col gap-6">
        {/* HEADER */}
        <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Products
            </h1>
            <p className="text-sm text-gray-600">
              Search, filter, sort & manage products quickly.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={loadProducts} className="btn btn-dark" title="Refresh list">
              <RefreshCw size={18} />
            </button>

            <button
              onClick={() => router.push("/products/add")}
              className="btn btn-primary"
            >
              + Add Product
            </button>
          </div>
        </div>

        {/* TOP BAR: Search + Clear (proper spacing) */}
        <div className="toolbar">
          <div className="searchbar">
            <Search size={18} className="text-gray-500" />
            <input
              className="searchinput"
              placeholder='Search products (substring)… e.g. "shi"'
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
            />
            {searchInput.trim().length > 0 && (
              <button
                className="iconbtn"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
                aria-label="Clear search"
                title="Clear"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button onClick={clearFilters} className="btn btn-ghost shrink-0">
            Clear
          </button>
        </div>

        {/* CONTROLS + META (wraps cleanly, aligned) */}
        <div className="controlsRow">
          <div className="controlsLeft">
            <select
              className="control"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories
                .filter((c) => !c.parent)
                .map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
            </select>

            <div className="sortWrap">
              <div className="sortSelect">
                <ArrowUpDown size={18} className="text-gray-500" />
                <select
                  className="sortNative"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                >
                  <option value="relevance">Sort: Relevance</option>
                  <option value="title">Sort: Title</option>
                  <option value="price">Sort: Price</option>
                  <option value="newest">Sort: Newest</option>
                </select>
              </div>

              <button
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                className="btn btn-soft"
                title="Toggle asc/desc"
              >
                {sortDir === "asc" ? "Asc" : "Desc"}
              </button>
            </div>
          </div>

          <div className="metaRight">
            <span className="metaChip">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {visibleProducts.length}
              </span>
              {searchInput.trim() ? (
                <>
                  {" "}
                  • for{" "}
                  <span className="font-semibold text-gray-900">
                    “{searchInput.trim()}”
                  </span>
                </>
              ) : null}
            </span>

            {totalPages > 1 && (
              <span className="metaChip">
                Page <span className="font-semibold text-gray-900">{page}</span> /{" "}
                <span className="font-semibold text-gray-900">{totalPages}</span>
              </span>
            )}
          </div>
        </div>

        {/* LIST */}
        <div className="w-full flex flex-col gap-3">
          <div className="w-full flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Product List</h2>
          </div>

          {loading ? (
            <div className="w-full flex flex-col gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="row skeleton">
                  <div className="flex items-center gap-3">
                    <div className="skImg" />
                    <div className="flex flex-col gap-2">
                      <div className="skLine w-56" />
                      <div className="skLine w-36" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="skBtn" />
                    <div className="skBtn" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="empty">
              <p className="text-lg font-semibold text-gray-900">No products found</p>
              <p className="text-sm text-gray-600 mt-1">
                Try a different search or clear filters.
              </p>
              <div className="mt-4 flex gap-2 justify-center flex-wrap">
                <button onClick={clearFilters} className="btn btn-ghost">
                  Clear filters
                </button>
                <button
                  onClick={() => router.push("/products/add")}
                  className="btn btn-primary"
                >
                  + Add Product
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-3">
              {visibleProducts.map((p) => (
                <div key={p._id} className="row">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.images?.[0] || "/no-image.png"}
                      alt={p.title || "Product image"}
                      className="prodImg"
                      loading="lazy"
                    />

                    <div className="min-w-0 flex flex-col">
                      <p className="font-semibold text-gray-900 truncate">{p.title}</p>
                      <p className="text-sm text-gray-600 truncate">
                        ₹{p.price} • {p.category?.name || "Uncategorized"}
                      </p>
                      {p.variants?.length > 0 && (
                        <p className="text-xs text-purple-700 mt-1">
                          {p.variants.length} variants
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => router.push(`/products/${p._id}`)}
                      className="iconAction iconBlue"
                      aria-label="Edit product"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteProduct(p._id)}
                      className="iconAction iconRed"
                      aria-label="Delete product"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="w-full flex items-center justify-center gap-3 mt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="pager"
                title="Previous"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="pagePill">
                <span className="font-semibold text-gray-800">
                  Page {page} / {totalPages}
                </span>
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="pager"
                title="Next"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* Buttons */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 14px;
          font-weight: 600;
          user-select: none;
          transition: transform 0.05s ease, opacity 0.15s ease, background 0.15s ease;
          white-space: nowrap;
        }
        .btn:active {
          transform: translateY(1px);
        }
        .btn-dark {
          background: #111827;
          color: white;
          width: 44px;
          height: 44px;
          padding: 0;
        }
        .btn-dark:hover {
          opacity: 0.92;
        }
        .btn-primary {
          background: #2563eb;
          color: white;
        }
        .btn-primary:hover {
          background: #1d4ed8;
        }
        .btn-ghost {
          background: rgba(17, 24, 39, 0.06);
          color: #111827;
        }
        .btn-ghost:hover {
          background: rgba(17, 24, 39, 0.1);
        }
        .btn-soft {
          background: rgba(17, 24, 39, 0.06);
          color: #111827;
          padding: 12px 14px;
          border-radius: 16px;
        }
        .btn-soft:hover {
          background: rgba(17, 24, 39, 0.1);
        }

        /* Toolbar layout fixes */
        .toolbar {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px; /* fixes spacing issue */
        }

        /* Searchbar */
        .searchbar {
          flex: 1;
          min-width: 220px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 16px;
          background: white;
          box-shadow: 0 6px 18px rgba(17, 24, 39, 0.06);
        }
        .searchinput {
          width: 100%;
          outline: none;
          background: transparent;
          font-size: 14px;
          color: #111827;
        }
        .iconbtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 12px;
          background: rgba(17, 24, 39, 0.06);
          color: #111827;
          flex: 0 0 auto;
        }
        .iconbtn:hover {
          background: rgba(17, 24, 39, 0.1);
        }

        /* Controls row */
        .controlsRow {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap; /* key fix */
        }
        .controlsLeft {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          min-width: 280px;
          flex: 1;
        }
        .metaRight {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
          flex: 0 0 auto;
        }
        .metaChip {
          display: inline-flex;
          align-items: center;
          padding: 10px 12px;
          border-radius: 16px;
          background: white;
          box-shadow: 0 6px 18px rgba(17, 24, 39, 0.06);
          font-size: 14px;
          color: #4b5563;
          white-space: nowrap;
        }

        /* Select controls */
        .control {
          width: 280px;
          max-width: 100%;
          background: white;
          padding: 12px 14px;
          border-radius: 16px;
          outline: none;
          box-shadow: 0 6px 18px rgba(17, 24, 39, 0.06);
        }

        .sortWrap {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .sortSelect {
          width: 280px;
          max-width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 16px;
          background: white;
          box-shadow: 0 6px 18px rgba(17, 24, 39, 0.06);
        }
        .sortNative {
          width: 100%;
          outline: none;
          background: transparent;
        }

        @media (max-width: 640px) {
          .toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .btn-ghost {
            width: 100%;
            justify-content: center;
          }
          .controlsLeft {
            min-width: 0;
          }
          .metaRight {
            justify-content: flex-start;
          }
        }

        /* Rows */
        .row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px 14px;
          border-radius: 18px;
          background: white;
          box-shadow: 0 8px 22px rgba(17, 24, 39, 0.06);
        }
        .row:hover {
          box-shadow: 0 10px 28px rgba(17, 24, 39, 0.08);
        }

        .prodImg {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          object-fit: cover;
          flex: 0 0 auto;
        }

        .iconAction {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          color: white;
          box-shadow: 0 10px 20px rgba(17, 24, 39, 0.1);
          flex: 0 0 auto;
        }
        .iconBlue {
          background: #2563eb;
        }
        .iconBlue:hover {
          background: #1d4ed8;
        }
        .iconRed {
          background: #dc2626;
        }
        .iconRed:hover {
          background: #b91c1c;
        }

        /* Empty */
        .empty {
          width: 100%;
          padding: 42px 18px;
          border-radius: 22px;
          background: white;
          box-shadow: 0 10px 28px rgba(17, 24, 39, 0.06);
          text-align: center;
        }

        /* Skeleton */
        .skeleton {
          background: white;
        }
        .skImg {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: rgba(17, 24, 39, 0.08);
          animation: pulse 1.2s infinite ease-in-out;
        }
        .skLine {
          height: 12px;
          border-radius: 999px;
          background: rgba(17, 24, 39, 0.08);
          animation: pulse 1.2s infinite ease-in-out;
        }
        .skBtn {
          width: 42px;
          height: 42px;
          border-radius: 16px;
          background: rgba(17, 24, 39, 0.08);
          animation: pulse 1.2s infinite ease-in-out;
        }
        @keyframes pulse {
          0% {
            opacity: 0.45;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            opacity: 0.45;
          }
        }

        /* Pagination */
        .pager {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 16px;
          background: white;
          box-shadow: 0 8px 22px rgba(17, 24, 39, 0.06);
          transition: opacity 0.15s ease, transform 0.05s ease;
        }
        .pager:active {
          transform: translateY(1px);
        }
        .pager:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .pagePill {
          padding: 10px 14px;
          border-radius: 16px;
          background: white;
          box-shadow: 0 8px 22px rgba(17, 24, 39, 0.06);
        }
      `}</style>
    </section>
  );
}
