"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Search,
  Pencil,
  Trash2,
  ArrowLeft,
  ArrowRight,
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

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* ---------------------------------------------
     FETCH PRODUCT LIST (REALTIME)
     no-store → always fetch latest
  --------------------------------------------- */
  const loadProducts = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API}/api/products?page=${page}&search=${search}&category=${categoryFilter}`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      setProducts(data.products);
      setTotalPages(data.pages);
    } catch (err) {
      console.error("Load Products Error:", err);
    }
    setLoading(false);
  };

  /* ---------------------------------------------
     FETCH CATEGORIES
  --------------------------------------------- */
  const loadCategories = async () => {
    const res = await fetch(`${API}/api/categories`, {
      cache: "no-store",
    });
    setCategories(await res.json());
  };

  /* ---------------------------------------------
     INITIAL LOAD + REALTIME REFRESH
  --------------------------------------------- */
  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, search, categoryFilter]);

  /* ---------------------------------------------
     DELETE PRODUCT
  --------------------------------------------- */
  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;

    const res = await fetch(`${API}/api/products/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) return alert(data.message);

    alert("Product deleted");
    loadProducts();
  };

  /* ---------------------------------------------
     UI
  --------------------------------------------- */
  return (
    <section className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Products</h1>

          <div className="flex gap-2">
            <button
              onClick={loadProducts}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg"
            >
              <RefreshCw size={18} />
              Refresh
            </button>

            <button
              onClick={() => router.push("/products/add")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              + Add Product
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white p-4 rounded-xl shadow flex flex-col md:flex-row gap-4">
          <div className="flex items-center bg-gray-100 px-3 rounded-lg flex-1">
            <Search size={18} className="text-gray-500" />
            <input
              placeholder="Search products..."
              className="bg-transparent px-2 py-2 w-full outline-none"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="input w-full md:w-64"
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
        </div>

        {/* PRODUCT LIST */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Product List</h2>

          {loading ? (
            <p>Loading...</p>
          ) : products.length === 0 ? (
            <p>No products found.</p>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between bg-gray-100 p-4 rounded-lg"
                >
                  {/* Image */}
                  <div className="flex items-center gap-3">
                    <img
                      src={p.images?.[0] || "/no-image.png"}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover"
                    />

                    <div>
                      <p className="font-semibold">{p.title}</p>
                      <p className="text-sm text-gray-600">
                        ₹{p.price} • {p.category?.name}
                      </p>
                      {p.variants?.length > 0 && (
                        <p className="text-xs text-purple-600">
                          {p.variants.length} variants
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/products/${p._id}`)}
                      className="p-2 bg-blue-600 rounded-lg text-white"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => deleteProduct(p._id)}
                      className="p-2 bg-red-600 rounded-lg text-white"
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
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-2 bg-gray-200 rounded-lg disabled:opacity-40"
              >
                <ArrowLeft size={18} />
              </button>

              <p className="font-semibold">
                Page {page} / {totalPages}
              </p>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-2 bg-gray-200 rounded-lg disabled:opacity-40"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .input {
          background: #f3f4f6;
          padding: 10px;
          border-radius: 10px;
          outline: none;
        }
      `}</style>
    </section>
  );
}
