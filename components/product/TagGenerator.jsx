"use client";

import { useEffect, useMemo, useState } from "react";
import { Wand2, X, RefreshCw } from "lucide-react";

/**
 * SeoTagGenerator
 * - Auto-generates SEO tags from product title + category name
 * - Allows manual add/remove with X icon
 * - Emits tags to parent via onChange(tags)
 *
 * ✅ Update: waits for "category fulfillment"
 * - Auto-generate only when BOTH title AND categoryName are present (and meaningful)
 * - Buttons also disabled until categoryName is available
 *
 * Props:
 *  title: string
 *  categoryName: string
 *  value?: string[]           // controlled tags
 *  onChange?: (tags: string[]) => void
 *  maxTags?: number (default 20)
 *  auto?: boolean (default true)
 */
export default function SeoTagGenerator({
  title = "",
  categoryName = "",
  value,
  onChange,
  maxTags = 20,
  auto = true,
}) {
  const [input, setInput] = useState("");

  // support controlled/uncontrolled
  const [internal, setInternal] = useState([]);
  const tags = value ?? internal;

  const readyTitle = String(title || "").trim();
  const readyCategory = String(categoryName || "").trim();
  const isReady = readyTitle.length >= 2 && readyCategory.length >= 2 && readyCategory.toLowerCase() !== "cat";

  const setTags = (next) => {
    const cleaned = normalizeTags(next).slice(0, maxTags);
    if (value === undefined) setInternal(cleaned);
    onChange?.(cleaned);
  };

  const seedKey = useMemo(() => {
    // when categoryName comes late (async), this key changes and can trigger auto-gen
    return `${readyTitle}__${readyCategory}`;
  }, [readyTitle, readyCategory]);

  useEffect(() => {
    if (!auto) return;
    if (!isReady) return; // ✅ wait for category fulfillment
    const next = generateTags(readyTitle, readyCategory);
    setTags(mergeUnique(tags, next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey, auto, isReady]);

  const onAddManual = () => {
    if (!input.trim()) return;
    const split = input
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setTags(mergeUnique(tags, split.map(slugifyTag)));
    setInput("");
  };

  const removeTag = (idx) => {
    const next = [...(tags || [])];
    next.splice(idx, 1);
    setTags(next);
  };

  const regenerate = () => {
    if (!isReady) return;
    const next = generateTags(readyTitle, readyCategory);
    setTags(mergeUnique([], next));
  };

  const suggest = () => {
    if (!isReady) return;
    const next = generateTags(readyTitle, readyCategory);
    setTags(mergeUnique(tags, next));
  };

  return (
    <section className="bg-white p-6 rounded-xl shadow space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">SEO Tags</h2>
          <p className="text-sm text-gray-500">
            Auto tags from product name + category. You can add/remove manually.
          </p>
          {!isReady && (
            <p className="text-xs text-amber-600 mt-1">
              Waiting for category & product title to generate suggestions…
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={suggest}
            disabled={!isReady}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title={!isReady ? "Select category & enter title first" : "Add missing auto-generated tags"}
          >
            <Wand2 size={16} />
            Suggest
          </button>

          <button
            type="button"
            onClick={regenerate}
            disabled={!isReady}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title={!isReady ? "Select category & enter title first" : "Replace with freshly generated tags"}
          >
            <RefreshCw size={16} />
            Regenerate
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add tags (comma separated) e.g. party wear, winter"
          className="input flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") onAddManual();
          }}
        />
        <button type="button" onClick={onAddManual} className="px-4 rounded-xl bg-blue-600 text-white">
          Add
        </button>
      </div>

      {tags?.length > 0 ? (
        <div className="flex gap-2 flex-wrap">
          {tags.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="px-3 py-1 rounded-full bg-gray-100 border text-gray-800 flex items-center gap-2"
            >
              <span className="text-sm">{t}</span>
              <button
                type="button"
                onClick={() => removeTag(i)}
                className="p-1 rounded-full hover:bg-gray-200"
                aria-label={`Remove ${t}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          No tags yet. Start typing above{isReady ? " or click Suggest." : "."}
        </p>
      )}

      <div className="text-xs text-gray-500">
        Limit: {tags.length}/{maxTags} • Generated from:{" "}
        <span className="font-medium text-gray-700">{readyTitle || "—"}</span> +{" "}
        <span className="font-medium text-gray-700">{readyCategory || "—"}</span>
      </div>

      <style jsx>{`
        .input {
          background: #f3f4f6;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          outline: none;
          width: 100%;
        }
      `}</style>
    </section>
  );
}

/* ---------------------------
   Tag generation logic
---------------------------- */

function generateTags(titleRaw, categoryRaw) {
  const title = String(titleRaw || "").trim();
  const category = String(categoryRaw || "").trim();

  const base = [];

  const words = tokenize(title);
  const catWords = tokenize(category);

  const phrases = bigrams(words).slice(0, 6);
  const inferred = ruleBasedHints(words);

  base.push(...catWords, ...words.slice(0, 10), ...phrases, ...inferred);

  if (category && title) base.push(`${category} ${title}`);
  if (category && words.length) base.push(`${category} ${words[0]}`);

  const out = normalizeTags(base.map(slugifyTag));
  return out.filter((t) => t.length >= 2 && t.length <= 28 && !/^\d+$/.test(t));
}

function ruleBasedHints(words) {
  const wset = new Set(words.map((w) => w.toLowerCase()));
  const hints = [];

  hints.push("new arrival", "latest", "trending");

  if (wset.has("party") || wset.has("evening")) hints.push("party wear");
  if (wset.has("wedding") || wset.has("bridal")) hints.push("wedding wear");
  if (wset.has("casual")) hints.push("casual wear");
  if (wset.has("formal") || wset.has("office")) hints.push("formal wear");

  if (wset.has("winter")) hints.push("winter wear");
  if (wset.has("summer")) hints.push("summer wear");

  if (wset.has("kurta") || wset.has("kurti")) hints.push("ethnic wear");
  if (wset.has("saree") || wset.has("sari")) hints.push("saree");
  if (wset.has("lehenga")) hints.push("lehenga");
  if (wset.has("shirt")) hints.push("shirts");
  if (wset.has("tshirt") || wset.has("t-shirt")) hints.push("tshirts");

  if (wset.has("cotton")) hints.push("cotton");
  if (wset.has("silk")) hints.push("silk");

  return hints;
}

function tokenize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]+/g, " ")
    .split(/\s+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => x.length > 1);
}

function bigrams(words) {
  const out = [];
  for (let i = 0; i < words.length - 1; i++) out.push(`${words[i]} ${words[i + 1]}`);
  return out;
}

function slugifyTag(tag) {
  return String(tag || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTags(arr) {
  const seen = new Set();
  const out = [];
  for (const t of arr || []) {
    const v = slugifyTag(t);
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function mergeUnique(a = [], b = []) {
  return normalizeTags([...(a || []), ...(b || [])]);
}
