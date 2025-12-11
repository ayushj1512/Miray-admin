"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  RefreshCw,
  Copy,
  X,
  Video,
  ArrowLeft,
  CheckCircle2,
  Search,
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
  return t.length > 32 ? t.slice(0, 32) + "…" : t;
}

// reels: allow video only (but accept unknown types too)
function isAcceptedReelFile(file) {
  return file?.type?.startsWith("video/") || file?.type === "" || file?.type === undefined;
}

export default function ReelsAddPage() {
  const router = useRouter();
  const inputRef = useRef(null);

  // Upload selection (local files)
  const [files, setFiles] = useState([]); // [{ file, preview, kind, key }]

  // Existing media picker
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  // Search within library (your backend uses q=... to search folder/originalName/publicId)
  const [search, setSearch] = useState("");

  // Selection from existing library
  const [selectedExisting, setSelectedExisting] = useState(new Map()); // id -> media

  // paging for existing media
  const [page, setPage] = useState(1);
  const limit = 24;
  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  // folder preset
  const [folder, setFolder] = useState("miray/reels");
  const [lockFolder, setLockFolder] = useState(true);

  // UI state
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // ✅ This makes your backend return only items in reels folder, because q matches folder too.
  // Also supports search by name/publicId while still scoping to folder.
  const qParam = useMemo(() => {
    const s = search.trim();
    return s ? `${folder} ${s}` : folder;
  }, [folder, search]);

  const loadLibrary = async (targetPage = page) => {
    setLoadingLibrary(true);
    try {
      const url = new URL(`${API}/api/media`);
      url.searchParams.set("page", String(targetPage));
      url.searchParams.set("limit", String(limit));

      // ✅ reels are videos
      url.searchParams.set("type", "video");

      // ✅ your backend doesn't have folder= filter, so we use q= which searches folder too
      url.searchParams.set("q", qParam);

      const r = await fetch(url.toString(), { cache: "no-store" });
      const d = await r.json();

      setItems(d.items || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error("❌ Reels library load:", e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoadingLibrary(false);
    }
  };

  useEffect(() => {
    loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, qParam]);

  // cleanup previews on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- local file picking ----------
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

  // ---------- upload ----------
  const uploadBatch = async () => {
    if (!files.length) return alert("Select reel videos first");
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(({ file }) => fd.append("files", file));

      // ✅ Your upload controller uses req.body.folder
      fd.append("folder", folder);

      const r = await fetch(`${API}/api/media/upload`, { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Upload failed");

      clearPicked();

      setPage(1);
      await loadLibrary(1);

      alert(`Uploaded ${d.media?.length || 0} reel(s)!`);
    } catch (e) {
      console.error("❌ Upload:", e);
      alert(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ---------- copy ----------
  const copyUrl = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  };

  // ---------- choose existing ----------
  const toggleExisting = (m) => {
    setSelectedExisting((prev) => {
      const next = new Map(prev);
      if (next.has(m._id)) next.delete(m._id);
      else next.set(m._id, m);
      return next;
    });
  };

  const clearExisting = () => setSelectedExisting(new Map());

  // ---------- Drag & Drop ----------
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

  const selectedExistingCount = selectedExisting.size;

  return (
    <section className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.push("/reels")}
              className="p-2 bg-white border border-gray-200 hover:bg-gray-50"
              title="Back to Reels"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add Reels</h1>
              <p className="text-xs text-gray-500">
                Upload new reel videos to Cloudinary, or choose from existing reels in library.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push("/reels/manage")}
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 px-4 py-2"
            >
              Manage
            </button>

            <button
              onClick={() => loadLibrary(page)}
              className="inline-flex items-center gap-2 bg-black text-white px-4 py-2"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Folder / Upload */}
        <div className="bg-white border border-gray-200 p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-800 block mb-2">Cloudinary folder (reels)</label>

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
                Default is <b>miray/reels</b>. Keep locked to avoid wrong uploads.
              </p>
            </div>

            <div className="md:w-[360px] flex gap-2">
              <button
                onClick={() => inputRef.current?.click()}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 border border-gray-200"
              >
                <Upload size={18} />
                Choose Videos
              </button>

              <button
                onClick={uploadBatch}
                disabled={uploading || files.length === 0}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-white ${
                  uploading || files.length === 0 ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {uploading ? "Uploading..." : `Upload (${files.length})`}
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

          {/* Local preview meta */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 flex items-center gap-3">
              <span>
                Selected uploads: <b>{files.length}</b>
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Video size={14} /> {files.length}
              </span>
            </div>

            {files.length > 0 && (
              <button onClick={clearPicked} className="text-sm text-red-600 hover:underline">
                Clear all
              </button>
            )}
          </div>

          {files.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {files.map((f, idx) => (
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
                      <div className="text-[12px] text-gray-900 font-semibold truncate" title={f.file.name}>
                        {shortName(f.file.name)}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-[11px] text-gray-500">{formatBytes(f.file.size)}</div>
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
            </div>
          )}
        </div>

        {/* Choose from existing */}
        <div className="bg-white border border-gray-200 p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Choose from existing reels</h2>
              <p className="text-xs text-gray-500">
                This uses your <b>/api/media</b> and shows videos from the reels folder via <b>q</b> search.
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  placeholder="Search reel name / publicId..."
                  className="pl-9 pr-3 py-2 bg-gray-100 border border-gray-200 outline-none w-[280px]"
                />
              </div>

              {selectedExistingCount > 0 && (
                <button
                  onClick={clearExisting}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200"
                >
                  Clear selected ({selectedExistingCount})
                </button>
              )}
            </div>
          </div>

          {/* Selected summary */}
          {selectedExistingCount > 0 && (
            <div className="bg-gray-50 border border-gray-200 p-3 flex items-center justify-between">
              <div className="text-sm text-gray-700 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-600" />
                Selected: <b>{selectedExistingCount}</b>
              </div>

              <button
                onClick={() => {
                  const urls = Array.from(selectedExisting.values()).map((m) => m.url).join("\n");
                  copyUrl(urls);
                  alert("Copied selected reel URLs!");
                }}
                className="inline-flex items-center gap-2 bg-black text-white px-4 py-2"
              >
                <Copy size={16} />
                Copy selected URLs
              </button>
            </div>
          )}

          {loadingLibrary ? (
            <div className="text-gray-600">Loading library...</div>
          ) : items.length === 0 ? (
            <div className="text-gray-600">No reels found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((m) => {
                const checked = selectedExisting.has(m._id);
                return (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => toggleExisting(m)}
                    className={`text-left bg-white border overflow-hidden transition ${
                      checked ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300"
                    }`}
                    title="Click to select"
                  >
                    <div className="w-full aspect-[9/16] bg-black flex items-center justify-center">
                      <video
                        src={m.url}
                        className="w-full h-full object-contain bg-black"
                        preload="metadata"
                        playsInline
                        muted
                      />
                    </div>

                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-semibold text-gray-900" title={m.originalName || m.publicId}>
                          {shortName(m.originalName || m.publicId)}
                        </div>

                        <div
                          className={`text-[10px] px-2 py-1 border ${
                            checked ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {checked ? "Selected" : "Select"}
                        </div>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                        <span className="uppercase">{m.resourceType || "video"}</span>
                        <span>{formatBytes(m.bytes)}</span>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyUrl(m.url);
                            alert("Copied URL!");
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-sm py-2"
                          title="Copy URL"
                        >
                          <Copy size={16} />
                          Copy URL
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExisting(m);
                          }}
                          className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-sm"
                        >
                          {checked ? "Unselect" : "Select"}
                        </button>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-4 py-2 border ${
                page <= 1 ? "text-gray-400 bg-gray-100" : "bg-white hover:bg-gray-50"
              }`}
            >
              Prev
            </button>

            <div className="text-sm text-gray-600">
              Page <b>{page}</b> / <b>{pages}</b>
            </div>

            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className={`px-4 py-2 border ${
                page >= pages ? "text-gray-400 bg-gray-100" : "bg-white hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
