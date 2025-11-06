"use client";

import { useEffect, useState } from "react";
import api from "../../lib/woocommerce";
import Image from "next/image";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        console.log("Fetching products from WooCommerce...");
        let allProducts = [];
        let page = 1;
        const perPage = 100; // Max WooCommerce limit

        while (true) {
          const response = await api.get("products", {
            params: { per_page: perPage, page },
          });

          const fetched = response.data;
          if (fetched.length === 0) break;

          allProducts = [...allProducts, ...fetched];
          if (fetched.length < perPage) break; // Stop when last page
          page++;
        }

        console.log(`Fetched ${allProducts.length} products total.`);
        setProducts(allProducts);
      } catch (err) {
        console.error("Error fetching products:", err.response?.data || err.message);
        setError("Failed to fetch products. Please check API settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 text-lg">
        Loading all products...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen text-red-600 text-lg">
        {error}
      </div>
    );

  if (products.length === 0)
    return (
      <div className="p-10 text-center text-gray-500 text-lg">
        No products found.
      </div>
    );

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Products ({products.length})
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col"
          >
            {product.images?.[0]?.src ? (
              <div className="w-full h-48 relative mb-3">
                <Image
                  src={product.images[0].src}
                  alt={product.name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded-md mb-3">
                No Image
              </div>
            )}

            <h2 className="font-semibold text-gray-800 line-clamp-2">{product.name}</h2>

            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {product.short_description.replace(/<[^>]*>?/gm, "") || "No description"}
            </p>

            <div className="mt-auto pt-3">
              <p className="text-lg font-bold text-blue-600">
                ₹{product.price || "N/A"}
              </p>
              <p className="text-sm text-gray-500">
                Stock: {product.stock_quantity ?? "N/A"}
              </p>
              <button className="mt-3 w-full text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 py-2 rounded-md transition">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
