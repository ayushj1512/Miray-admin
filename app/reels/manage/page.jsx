"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Trash2,
  Copy,
  RefreshCw,
  X,
  Video,
  FolderLock,
  FolderOpen,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function shortName(s = "") {
  const t = String(s);
  return t.length > 26 ? t.slice(0, 26) + "…" : t;
}

// reels: allow video only (but accept unknown types too)
function isAcceptedReelFile(file) {
  return file?.type?.startsWith("video/") || file?.type === "" || file?.type === undefined;
}

export default function ReelsManagePage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [files, setFiles] = useState([]); // [{ file, preview, kind, key }]
  const [folder, setFolder] = useState("miray/reels");
  const [lockFolder, setLockFolder] = useState(true);

  const [page, setPage] = useState(1);
  const limit = 24; // reels are heavier

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  const load = async (targetPage = page) => {
    setLoading(true);
    try {
      const url = new URL(`${API}/api/media`);
      url.searchParams.set("page", String(targetPage));
      url.searchParams.set("limit", String(limit));

      // ✅ reels are videos
      url.searchParams.set("type", "video");

      // ✅ optional: filter by folder (works if backend supports it)
      url.searchParams.set("folder", folder);

      const r = await fetch(url.toString(), { cache: "no-store" });
      const d = await r.json();

      setItems(d.items || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error("❌ Reels load:", e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, folder]);

  // cleanup previews on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (incoming = []) => {
    const list = Array.from(incoming || []).filter(isAcceptedReelFile);
    if (!list.length) return;

    setFiles((prev) => {
      const map = new Map();
      prev.forEach((x) => map.set(x.key, x));

      list.forEach((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (map.has(key)) return;

        const kind = "video";
        const preview = URL.createObjectURL(file);
        map.set(key, { file, preview, kind, key });
      });

      return Array.from(map.values());
    });
  };

  const onPickFiles = (e) => addFiles(e.target.files);

  const removePicked = (idx) => {
    setFiles((prev) => {
      const target = prev[idx];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const clearPicked = () => {
    setFiles((prev) => {
      prev.forEach((x) => x.preview && URL.revokeObjectURL(x.preview));
      return [];
    });
  };

  const uploadBatch = async () => {
    if (!files.length) return alert("Select reel videos first");
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(({ file }) => fd.append("files", file));
      fd.append("folder", folder);

      const r = await fetch(`${API}/api/media/upload`, { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Upload failed");

      clearPicked();

      setPage(1);
      await load(1);

      alert(`Uploaded ${d.media?.length || 0} reel(s)!`);
    } catch (e) {
      console.error("❌ Upload:", e);
      alert(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  };

  const deleteOne = async (id) => {
    if (!confirm("Delete this reel permanently?")) return;
    setDeletingId(id);
    try {
      const r = await fetch(`${API}/api/media/${id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Delete failed");
      await load();
    } catch (e) {
      console.error("❌ Delete:", e);
      alert(e.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  // Drag & Drop
  const onDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };
  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const dtFiles = e.dataTransfer?.files;
    if (dtFiles?.length) addFiles(dtFiles);
  };

  const selectedCount = files.length;

  return (
    <section className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Reels</h1>
            <p className="text-xs text-gray-500">Upload, copy URLs, and delete reels (videos).</p>
          </div>

          <button onClick={() => load()} className="inline-flex items-center gap-2 bg-black text-white px-4 py-2">
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* Upload / Dropzone */}
        <div className="bg-white border border-gray-200 p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-800 block mb-2">Cloudinary folder</label>

              <div className="flex gap-2">
                <input
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  disabled={lockFolder}
                  className={`w-full bg-gray-100 px-3 py-2 outline-none border border-gray-200 ${
                    lockFolder ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                  placeholder="miray/reels"
                />

                <button
                  type="button"
                  onClick={() => setLockFolder((v) => !v)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200"
                  title={lockFolder ? "Unlock folder" : "Lock folder"}
                >
                  {lockFolder ? <FolderLock size={18} /> : <FolderOpen size={18} />}
                </button>
              </div>

              <p className="text-[11px] text-gray-500 mt-1">
                Default: <b>miray/reels</b>. Keep locked to avoid wrong uploads.
              </p>
            </div>

            <div className="md:w-[300px] flex gap-2">
              <button
                onClick={() => inputRef.current?.click()}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 border border-gray-200"
              >
                <Upload size={18} />
                Choose
              </button>

              <button
                onClick={uploadBatch}
                disabled={uploading || !selectedCount}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-white ${
                  uploading || !selectedCount ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {uploading ? "Uploading..." : `Upload (${selectedCount})`}
              </button>

              <input
                ref={inputRef}
                type="file"
                multiple
                accept="video/*"
                onChange={onPickFiles}
                className="hidden"
              />
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`w-full border border-dashed p-6 cursor-pointer select-none ${
              dragOver ? "bg-blue-50 border-blue-400" : "bg-gray-50 border-gray-300"
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-white border border-gray-200">
                <Upload size={18} />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-800">Drag & drop reel videos here</div>
                <div className="text-xs text-gray-500">or click to choose</div>
              </div>
            </div>
          </div>

          {/* Preview meta */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 flex items-center gap-3">
              <span>
                Selected: <b>{selectedCount}</b>
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Video size={14} /> {selectedCount}
              </span>
            </div>

            {selectedCount > 0 && (
              <button onClick={clearPicked} className="text-sm text-red-600 hover:underline">
                Clear all
              </button>
            )}
          </div>

          {/* Preview grid */}
          {selectedCount > 0 && (
            <div className="bg-gray-50 border border-gray-200 p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {files.slice(0, 12).map((f, idx) => (
                  <div key={f.key} className="bg-white border border-gray-200 overflow-hidden">
                    <div className="w-full aspect-[9/16] bg-black flex items-center justify-center">
                      <video
                        src={f.preview}
                        className="w-full h-full object-contain bg-black"
                        muted
                        playsInline
                        preload="metadata"
                        controls
                      />
                    </div>

                    <div className="p-2">
                      <div className="text-[11px] text-gray-800 truncate" title={f.file.name}>
                        {shortName(f.file.name)}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-[10px] text-gray-500">{formatBytes(f.file.size)}</div>
                        <button
                          onClick={() => removePicked(idx)}
                          className="p-1 bg-gray-100 hover:bg-gray-200"
                          title="Remove"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {files.length > 12 && (
                <div className="text-xs text-gray-500 mt-2">
                  Showing preview of first <b>12</b>. Total selected: <b>{files.length}</b>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info row */}
        <div className="text-sm text-gray-600 flex items-center justify-between">
          <span>
            Total reels: <b>{total}</b>
          </span>
          <span className="text-xs text-gray-500">
            Page {page} / {pages}
          </span>
        </div>

        {/* Library grid */}
        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-gray-600">No reels found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((m) => (
              <div key={m._id} className="bg-white border border-gray-200 overflow-hidden">
                <div className="w-full aspect-[9/16] bg-black flex items-center justify-center">
                  <video
                    src={m.url}
                    className="w-full h-full object-contain bg-black"
                    muted
                    preload="metadata"
                    controls
                    playsInline
                  />
                </div>

                <div className="p-3">
                  <div className="text-sm font-semibold text-gray-900" title={m.originalName || m.publicId}>
                    {shortName(m.originalName || m.publicId)}
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="uppercase">{m.resourceType || "video"}</span>
                    <span>{formatBytes(m.bytes)}</span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => copyUrl(m.url)}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-sm py-2"
                      title="Copy URL"
                    >
                      <Copy size={16} />
                      Copy URL
                    </button>

                    <button
                      onClick={() => deleteOne(m._id)}
                      disabled={deletingId === m._id}
                      className={`inline-flex items-center justify-center px-4 py-2 text-white ${
                        deletingId === m._id ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
                      }`}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-4 py-2 border ${page <= 1 ? "text-gray-400 bg-gray-100" : "bg-white hover:bg-gray-50"}`}
          >
            Prev
          </button>

          <div className="text-sm text-gray-600">
            Page <b>{page}</b> / <b>{pages}</b>
          </div>

          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className={`px-4 py-2 border ${page >= pages ? "text-gray-400 bg-gray-100" : "bg-white hover:bg-gray-50"}`}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
