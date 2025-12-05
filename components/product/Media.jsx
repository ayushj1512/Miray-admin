"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Upload,
  Search,
  Image as ImageIcon,
  Video,
  File,
  Loader2,
  CheckCircle2,
  Trash2,
  FolderOpen,
  RefreshCw,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

/**
 * MediaPickerModal
 * - Browse uploaded media (paginated + search + filter)
 * - Upload new files (multipart/form-data -> POST /api/media/upload)
 * - Select one or multiple items
 * - Optional delete (DELETE /api/media/:id)
 *
 * Props:
 *  open: boolean
 *  onClose: () => void
 *  multiple?: boolean (default false)
 *  value?: string | string[]  (existing selected url(s) OR publicId(s), you decide)
 *  onSelect: (payload) => void
 *      if multiple=false -> { url, publicId, resourceType, ... } | null
 *      if multiple=true  -> [{...}, {...}]
 *  initialType?: "" | "image" | "video" | "raw"
 *  folder?: string (default "miray/media")
 *  allowDelete?: boolean (default false)
 *
 * Notes:
 * - This uses native <img>. If you're using Next <Image>, swap in easily.
 */
export default function MediaPickerModal({
  open,
  onClose,
  multiple = false,
  value,
  onSelect,
  initialType = "",
  folder = "miray/media",
  allowDelete = false,
}) {
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]); // array of media docs

  const [type, setType] = useState(initialType); // "" | image | video | raw
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [toast, setToast] = useState("");

  const valueSet = useMemo(() => {
    if (!value) return new Set();
    if (Array.isArray(value)) return new Set(value.map(String));
    return new Set([String(value)]);
  }, [value]);

  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 1800);
  };

  const iconForType = (t) => {
    if (t === "image") return <ImageIcon size={18} />;
    if (t === "video") return <Video size={18} />;
    return <File size={18} />;
  };

  const fetchMedia = async (opts = {}) => {
    const nextPage = opts.page ?? page;
    const nextQ = opts.q ?? q;
    const nextType = opts.type ?? type;

    setLoading(true);
    try {
      const sp = new URLSearchParams();
      sp.set("page", String(nextPage));
      sp.set("limit", "48");
      if (nextQ) sp.set("q", nextQ);
      if (nextType) sp.set("type", nextType);

      const res = await fetch(`${API}/api/media?${sp.toString()}`, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Failed to load media");

      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total || 0));
      setPage(Number(data.page || nextPage));
      setPages(Number(data.pages || 1));
    } catch (e) {
      console.error(e);
      showToast(e.message || "Failed to load media");
      setItems([]);
      setTotal(0);
      setPages(1);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setQ("");
    setPage(1);
    setItems([]);
    setSelected([]);
    setToast("");
    onClose?.();
  };

  // open/close lifecycle
  useEffect(() => {
    if (!open) return;

    // lock scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // initial load
    fetchMedia({ page: 1 });

    // init selected from `value` (best-effort: match by url or publicId from loaded items later)
    // we also try to "preselect" visible items when fetched (see below)
    setSelected([]);

    // ESC to close + click outside
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // When items load, auto-preselect ones matching `value` (url or publicId)
  useEffect(() => {
    if (!open) return;
    if (!items.length) return;
    if (!valueSet.size) return;

    const matches = items.filter(
      (m) => valueSet.has(String(m.url)) || valueSet.has(String(m.publicId)) || valueSet.has(String(m._id))
    );

    if (!matches.length) return;

    setSelected((prev) => {
      const map = new Map(prev.map((p) => [String(p._id), p]));
      for (const m of matches) map.set(String(m._id), m);
      return Array.from(map.values()).slice(0, multiple ? 999 : 1);
    });
  }, [items, open, valueSet, multiple]);

  const isSelected = (m) => selected.some((s) => String(s._id) === String(m._id));

  const toggleSelect = (m) => {
    setSelected((prev) => {
      const exists = prev.some((s) => String(s._id) === String(m._id));
      if (multiple) {
        if (exists) return prev.filter((s) => String(s._id) !== String(m._id));
        return [...prev, m];
      }
      return exists ? [] : [m];
    });
  };

  const onConfirm = () => {
    if (!selected.length) {
      onSelect?.(multiple ? [] : null);
      close();
      return;
    }
    onSelect?.(multiple ? selected : selected[0]);
    close();
  };

  const onUploadPick = () => fileInputRef.current?.click();

  const uploadFiles = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;

    setUploading(true);
    try {
      const fd = new FormData();
      list.forEach((f) => fd.append("files", f));
      fd.append("folder", folder);

      const res = await fetch(`${API}/api/media/upload`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Upload failed");

      showToast("Uploaded!");
      // Refresh library (first page)
      await fetchMedia({ page: 1 });
      // auto-select the uploaded ones (if desired)
      const uploaded = Array.isArray(data.media) ? data.media : [];
      if (uploaded.length) {
        setSelected((prev) => {
          if (!multiple) return [uploaded[0]];
          const map = new Map(prev.map((p) => [String(p._id), p]));
          for (const u of uploaded) map.set(String(u._id), u);
          return Array.from(map.values());
        });
      }
    } catch (e) {
      console.error(e);
      showToast(e.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteItem = async (m) => {
    if (!allowDelete) return;
    const ok = window.confirm(`Delete "${m.originalName || m.publicId}"?`);
    if (!ok) return;

    setDeletingId(String(m._id));
    try {
      const res = await fetch(`${API}/api/media/${m._id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Delete failed");

      showToast("Deleted");
      setSelected((prev) => prev.filter((s) => String(s._id) !== String(m._id)));
      await fetchMedia({ page: Math.min(page, pages) });
    } catch (e) {
      console.error(e);
      showToast(e.message || "Delete failed");
    } finally {
      setDeletingId("");
    }
  };

  const onSearch = async () => {
    await fetchMedia({ page: 1, q });
  };

  const onChangeType = async (t) => {
    setType(t);
    setPage(1);
    await fetchMedia({ page: 1, type: t });
  };

  const fmtBytes = (b = 0) => {
    const n = Number(b || 0);
    if (n < 1024) return `${n} B`;
    const kb = n / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000]">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onMouseDown={(e) => {
          // close only if clicking backdrop (not inside modal)
          if (e.target === e.currentTarget) close();
        }}
      />

      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* header */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div>
              <h2 className="text-lg font-semibold">Media Library</h2>
              <p className="text-sm text-gray-500">
                Upload or pick from existing media
                {multiple ? " (multiple selection)" : " (single selection)"}
              </p>
            </div>

            <button
              onClick={close}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Close"
            >
              <X />
            </button>
          </div>

          {/* toolbar */}
          <div className="px-5 py-4 border-b bg-gray-50 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              {/* type filter */}
              <div className="flex items-center gap-2">
                <button
                  className={`px-3 py-2 rounded-xl text-sm border ${
                    type === "" ? "bg-black text-white" : "bg-white"
                  }`}
                  onClick={() => onChangeType("")}
                  type="button"
                >
                  All
                </button>
                <button
                  className={`px-3 py-2 rounded-xl text-sm border flex items-center gap-2 ${
                    type === "image" ? "bg-black text-white" : "bg-white"
                  }`}
                  onClick={() => onChangeType("image")}
                  type="button"
                >
                  <ImageIcon size={16} /> Images
                </button>
                <button
                  className={`px-3 py-2 rounded-xl text-sm border flex items-center gap-2 ${
                    type === "video" ? "bg-black text-white" : "bg-white"
                  }`}
                  onClick={() => onChangeType("video")}
                  type="button"
                >
                  <Video size={16} /> Videos
                </button>
                <button
                  className={`px-3 py-2 rounded-xl text-sm border flex items-center gap-2 ${
                    type === "raw" ? "bg-black text-white" : "bg-white"
                  }`}
                  onClick={() => onChangeType("raw")}
                  type="button"
                >
                  <File size={16} /> Files
                </button>
              </div>

              {/* search */}
              <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 w-full md:w-[420px]">
                <Search size={18} className="text-gray-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name, folder, publicId..."
                  className="outline-none w-full text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSearch();
                  }}
                />
                <button
                  type="button"
                  onClick={onSearch}
                  className="text-sm px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
                >
                  Search
                </button>
              </div>
            </div>

            {/* actions */}
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => fetchMedia({ page })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white hover:bg-gray-100"
                title="Refresh"
              >
                <RefreshCw size={16} />
                Refresh
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                className="hidden"
                onChange={(e) => uploadFiles(e.target.files)}
              />

              <button
                type="button"
                onClick={onUploadPick}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                Upload
              </button>
            </div>
          </div>

          {/* content */}
          <div className="p-5">
            {/* folder hint */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FolderOpen size={16} />
                Upload folder: <span className="font-medium text-gray-900">{folder}</span>
              </div>

              <div className="text-sm text-gray-600">
                {loading ? "Loading..." : `${total} item(s)`}
              </div>
            </div>

            {/* grid */}
            {loading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="animate-spin" size={34} />
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                No media found. Try uploading or changing filters.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {items.map((m) => {
                  const selectedNow = isSelected(m);
                  const isImage = m.resourceType === "image";
                  const isVideo = m.resourceType === "video";

                  return (
                    <div
                      key={m._id}
                      className={`group relative border rounded-xl overflow-hidden cursor-pointer bg-white ${
                        selectedNow ? "ring-2 ring-blue-600 border-blue-600" : "hover:border-gray-300"
                      }`}
                      onClick={() => toggleSelect(m)}
                      title={m.originalName || m.publicId}
                    >
                      {/* preview */}
                      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                        {isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.url}
                            alt={m.originalName || "media"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : isVideo ? (
                          <video
                            src={m.url}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-gray-600">
                            {iconForType(m.resourceType)}
                            <span className="text-xs">FILE</span>
                          </div>
                        )}
                      </div>

                      {/* top badges */}
                      <div className="absolute top-2 left-2 flex gap-2">
                        <span className="text-[11px] px-2 py-1 rounded-full bg-white/90 border">
                          {m.resourceType}
                        </span>
                        {!!m.format && (
                          <span className="text-[11px] px-2 py-1 rounded-full bg-white/90 border">
                            {String(m.format).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* selected mark */}
                      {selectedNow && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="text-blue-600" />
                        </div>
                      )}

                      {/* footer meta */}
                      <div className="p-2 text-xs">
                        <p className="font-medium truncate">{m.originalName || "Untitled"}</p>
                        <p className="text-gray-500 truncate">{m.folder || "miray/media"}</p>
                        <p className="text-gray-500">
                          {m.width && m.height ? `${m.width}×${m.height}` : fmtBytes(m.bytes)}
                        </p>
                      </div>

                      {/* delete */}
                      {allowDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem(m);
                          }}
                          className="absolute bottom-2 right-2 p-2 rounded-lg bg-white/90 border opacity-0 group-hover:opacity-100 transition"
                          title="Delete"
                          disabled={deletingId === String(m._id)}
                        >
                          {deletingId === String(m._id) ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Trash2 size={16} className="text-red-600" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* pagination */}
            {pages > 1 && (
              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border bg-white disabled:opacity-50"
                  onClick={() => {
                    const p = Math.max(1, page - 1);
                    setPage(p);
                    fetchMedia({ page: p });
                  }}
                  disabled={page <= 1}
                >
                  Prev
                </button>

                <div className="text-sm text-gray-600">
                  Page <span className="font-medium text-gray-900">{page}</span> of{" "}
                  <span className="font-medium text-gray-900">{pages}</span>
                </div>

                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border bg-white disabled:opacity-50"
                  onClick={() => {
                    const p = Math.min(pages, page + 1);
                    setPage(p);
                    fetchMedia({ page: p });
                  }}
                  disabled={page >= pages}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* footer */}
          <div className="px-5 py-4 border-t bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-gray-700">
              Selected:{" "}
              <span className="font-medium">
                {multiple ? selected.length : selected.length ? 1 : 0}
              </span>
              {selected.length > 0 && (
                <span className="text-gray-500">
                  {" "}
                  • {selected.map((s) => s.originalName || s.publicId).slice(0, 2).join(", ")}
                  {selected.length > 2 ? ` +${selected.length - 2} more` : ""}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-xl border bg-white"
                onClick={() => setSelected([])}
                disabled={!selected.length}
              >
                Clear
              </button>

              <button
                type="button"
                className="px-5 py-2 rounded-xl bg-black text-white hover:bg-black/90"
                onClick={onConfirm}
              >
                {multiple ? "Use Selected" : "Use This"}
              </button>
            </div>
          </div>

          {/* toast */}
          {toast && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full text-sm shadow-lg">
              {toast}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
