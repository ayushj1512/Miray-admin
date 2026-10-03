"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  FileText,
  ImagePlus,
  ExternalLink,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";

import MediaPickerModal from "@/components/media/MediaPickerModal";

const getExtension = (url = "") => {
  try {
    const clean = String(url).split("?")[0];
    return clean.split(".").pop()?.toLowerCase() || "";
  } catch {
    return "";
  }
};

const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "avif",
];

export default function FabricPrintFile({
  value = "",
  onChange,
  disabled = false,
}) {
  const [mediaOpen, setMediaOpen] = useState(false);

  const extension = useMemo(
    () => getExtension(value),
    [value],
  );

  const isImage = IMAGE_EXTENSIONS.includes(extension);

  const handleSelect = (media) => {
    const selected = Array.isArray(media)
      ? media[0]
      : media;

    const url =
      typeof selected === "string"
        ? selected
        : selected?.url;

    if (!url) {
      toast.error("Invalid media selected");
      return;
    }

    onChange?.(url);
    setMediaOpen(false);
  };

  const removeFile = () => {
    onChange?.("");
  };

  return (
    <>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="mb-4">
          <p className="text-sm font-semibold text-neutral-900">
            Fabric Print / Pattern
          </p>

          <p className="mt-1 text-xs leading-5 text-neutral-400">
            Add the artwork, print or pattern reference
            used for this product.
          </p>
        </div>

        {value ? (
          <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            {/* PREVIEW */}

            <div className="relative flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white">
              {isImage ? (
                <Image
                  src={value}
                  alt="Fabric print reference"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <FileText
                  size={24}
                  className="text-neutral-400"
                />
              )}
            </div>

            {/* INFO */}

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900">
                Print reference
              </p>

              <p className="mt-1 truncate text-xs text-neutral-400">
                {extension
                  ? `${extension.toUpperCase()} file`
                  : "Media Library"}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setMediaOpen(true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-black px-3 text-[11px] font-medium text-white transition hover:bg-neutral-800 disabled:opacity-40"
                >
                  <RefreshCcw size={13} />
                  Change
                </button>

                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-[11px] font-medium text-neutral-600 transition hover:bg-neutral-100"
                >
                  <ExternalLink size={13} />
                  Open
                </a>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={removeFile}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-50 px-3 text-[11px] font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-40"
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setMediaOpen(true)}
            className="group flex w-full items-center gap-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 p-4 text-left transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <ImagePlus
                size={18}
                className="text-neutral-600"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-neutral-900">
                Add print reference
              </p>

              <p className="mt-0.5 text-xs text-neutral-400">
                Select from Media Library
              </p>
            </div>
          </button>
        )}
      </div>

      <MediaPickerModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        multiple={false}
        folder="miray/products/fabric-prints"
        onSelect={handleSelect}
      />
    </>
  );
}