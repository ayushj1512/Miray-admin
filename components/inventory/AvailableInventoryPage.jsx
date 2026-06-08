"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useAdminProductStore } from "@/store/adminProductStore";

const SIZE_COLUMNS = ["XS", "S", "M", "L", "XL", "XXL"];

const normalizeSize = (v) =>
  String(v || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

const getSize = (variant) =>
  normalizeSize(
    variant?.size ||
      variant?.attributes?.find(
        (a) => String(a?.key || "").toLowerCase() === "size"
      )?.value ||
      ""
  );

const getAvailable = (item) =>
  Math.max(0, Number(item?.stock || 0) - Number(item?.reservedStock || 0));

function ImageSlider({ images = [], title = "" }) {
  const cleanImages = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  if (!cleanImages.length) {
    return <div className="h-16 w-12 rounded-xl bg-gray-100" />;
  }

  const prev = (e) => {
    e.stopPropagation();
    setIndex((i) => (i === 0 ? cleanImages.length - 1 : i - 1));
  };

  const next = (e) => {
    e.stopPropagation();
    setIndex((i) => (i === cleanImages.length - 1 ? 0 : i + 1));
  };

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="group relative h-16 w-12 cursor-pointer overflow-hidden rounded-xl bg-gray-100"
      >
        <Image
          src={cleanImages[index]}
          alt={title}
          fill
          className="object-cover"
          sizes="48px"
        />

        {cleanImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-0 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-0.5 shadow-sm group-hover:block"
            >
              <ChevronLeft size={13} />
            </button>

            <button
              type="button"
              onClick={next}
              className="absolute right-0 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-0.5 shadow-sm group-hover:block"
            >
              <ChevronRight size={13} />
            </button>
          </>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-5 top-5 rounded-full bg-white p-2"
          >
            <X size={18} />
          </button>

          {cleanImages.length > 1 && (
            <button
              type="button"
              onClick={prev}
              className="absolute left-5 rounded-full bg-white p-2"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          <div className="relative h-[80vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white">
            <Image
              src={cleanImages[index]}
              alt={title}
              fill
              className="object-contain"
              sizes="80vw"
            />
          </div>

          {cleanImages.length > 1 && (
            <button
              type="button"
              onClick={next}
              className="absolute right-5 rounded-full bg-white p-2"
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>
      )}
    </>
  );
}

export default function AvailableInventoryPage() {
  const fetchAvailableInventory = useAdminProductStore(
    (s) => s.fetchAvailableInventory
  );

  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const products = Array.isArray(data?.products) ? data.products : [];

  const rows = useMemo(() => {
    const map = new Map();

    products.forEach((p) => {
      const productCode = String(p.productCode || p._id || "").trim();
      const images = [
        p.thumbnail,
        ...(Array.isArray(p.images) ? p.images : []),
      ].filter(Boolean);

      const row = {
        key: productCode,
        title: p.title || "-",
        productCode: p.productCode || "-",
        images,
        totalAvailable: 0,
        skuList: [],
        sizes: SIZE_COLUMNS.reduce((acc, size) => {
          acc[size] = 0;
          return acc;
        }, {}),
      };

      const variants = Array.isArray(p.variants) ? p.variants : [];

      if (!variants.length) {
        const available =
          p.availableStock !== undefined ? p.availableStock : getAvailable(p);

        row.totalAvailable = available;
        row.skuList = [p.sku || "-"];
      } else {
        variants.forEach((v) => {
          const size = getSize(v);
          const available =
            v.availableStock !== undefined ? v.availableStock : getAvailable(v);

          if (SIZE_COLUMNS.includes(size)) {
            row.sizes[size] += available;
          }

          row.totalAvailable += available;

          if (v.sku) row.skuList.push(v.sku);
        });
      }

      map.set(productCode, row);
    });

    return Array.from(map.values()).filter((row) => row.totalAvailable > 0);
  }, [products]);

  const loadInventory = async (nextSearch = search) => {
    try {
      setLoading(true);

      const res = await fetchAvailableInventory({
        search: nextSearch,
        onlyAvailable: true,
        limit: 500,
      });

      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f7f8] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
            Miray Inventory
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-950">
            Available Inventory
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Product-code grouped view. Physical stock minus reserved stock.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-3 shadow-sm">
          <div>
            <p className="text-xs text-gray-500">Physical</p>
            <p className="font-semibold">{data?.summary?.physicalStock || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Reserved</p>
            <p className="font-semibold">{data?.summary?.reservedStock || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Available</p>
            <p className="font-semibold">{data?.summary?.availableStock || 0}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadInventory(search);
            }}
            placeholder="Search by title, SKU, product code..."
            className="h-10 w-full rounded-xl bg-gray-50 pl-9 pr-3 text-sm outline-none ring-1 ring-gray-200 focus:ring-gray-400"
          />
        </div>

        <button
          type="button"
          onClick={() => loadInventory(search)}
          className="h-10 rounded-xl bg-black px-5 text-sm font-medium text-white"
        >
          Search
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Product Code</th>
                <th className="px-4 py-3">SKU</th>
                {SIZE_COLUMNS.map((size) => (
                  <th key={size} className="px-3 py-3 text-center">
                    {size}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    Loading inventory...
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((row) => (
                  <tr key={row.key} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3">
                      <ImageSlider images={row.images} title={row.title} />
                    </td>

                    <td className="max-w-[320px] px-4 py-3">
                      <p className="line-clamp-2 font-medium text-gray-950">
                        {row.title}
                      </p>
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-700">
                      {row.productCode}
                    </td>

                    <td className="max-w-[180px] px-4 py-3 text-xs text-gray-600">
                      <p className="line-clamp-2">
                        {row.skuList.filter(Boolean).join(", ") || "-"}
                      </p>
                    </td>

                    {SIZE_COLUMNS.map((size) => (
                      <td key={size} className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex min-w-8 justify-center rounded-full px-2 py-1 text-xs font-semibold ${
                            row.sizes[size] > 0
                              ? "bg-black text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {row.sizes[size] || 0}
                        </span>
                      </td>
                    ))}

                    <td className="px-4 py-3 text-right">
                      <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                        {row.totalAvailable}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    No available inventory found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}