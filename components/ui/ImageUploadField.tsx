"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowUpTrayIcon,
  LinkIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_IMAGE_TYPES,
  uploadImage,
  validateImageFile,
  type UploadFolder,
} from "@/lib/api/uploads";

type Source = "upload" | "link";

export type ImageUploadFieldProps = {
  /** Hosted image URL, or "" when empty. */
  value: string;
  onChange: (url: string) => void;
  /** Cloudinary folder picked files land in. */
  folder: UploadFolder;
  label?: string;
  hint?: string;
  required?: boolean;
  /** CSS aspect ratio for the preview — match the shape the image renders at. */
  aspect?: string;
  className?: string;
  /** Lets a parent block submit while an upload is still in flight. */
  onUploadingChange?: (uploading: boolean) => void;
};

export function ImageUploadField({
  value,
  onChange,
  folder,
  label,
  hint,
  required,
  aspect = "16 / 10",
  className,
  onUploadingChange,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<Source>("upload");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  /** Local object URL shown while the picked file is still uploading. */
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  // Object URLs leak until revoked, and a modal can cycle through several picks.
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const preview = localPreview ?? (value.trim() ? value.trim() : null);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setErr(null);
    const invalid = validateImageFile(file);
    if (invalid) {
      setErr(invalid);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return objectUrl;
    });
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch {
      setErr("Upload failed. Check your connection and try again.");
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    setErr(null);
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={className}>
      {label && (
        <div className="mb-2 flex items-center justify-between gap-3">
          <label
            htmlFor={inputId}
            className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]"
          >
            {label}
            {required && <span className="text-[var(--color-primary)]"> *</span>}
          </label>
          <div className="flex items-center gap-0.5 rounded-lg bg-[var(--color-bg)] p-0.5 ring-1 ring-inset ring-[var(--color-line)]">
            <TabButton
              active={source === "upload"}
              onClick={() => setSource("upload")}
              icon={<ArrowUpTrayIcon className="h-3.5 w-3.5" />}
              label="Upload"
            />
            <TabButton
              active={source === "link"}
              onClick={() => setSource("link")}
              icon={<LinkIcon className="h-3.5 w-3.5" />}
              label="Link"
            />
          </div>
        </div>
      )}

      {source === "upload" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            "group relative w-full overflow-hidden rounded-2xl border border-dashed transition-colors",
            dragging
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/[0.04]"
              : "border-[var(--color-line)] bg-[var(--color-bg)] hover:border-[var(--color-primary)]/40"
          )}
          style={{ aspectRatio: preview ? aspect : undefined }}
        >
          {preview ? (
            <>
              <Image
                src={preview}
                alt=""
                fill
                unoptimized={
                  preview.startsWith("blob:") || preview.startsWith("data:")
                }
                sizes="480px"
                className="object-cover"
              />
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center gap-2 bg-black/45 backdrop-blur-[1px] transition-opacity",
                  uploading
                    ? "opacity-100"
                    : "opacity-0 focus-within:opacity-100 group-hover:opacity-100"
                )}
              >
                {uploading ? (
                  <span className="flex items-center gap-2 text-[12px] font-bold text-white">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Uploading…
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="rounded-xl bg-white/95 px-3 py-2 text-[12px] font-bold text-[var(--color-ink)] hover:bg-white"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={clear}
                      aria-label="Remove image"
                      className="rounded-xl bg-white/95 p-2 text-red-600 hover:bg-white"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 px-6 py-8 text-center"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <PhotoIcon className="h-5 w-5" />
              </span>
              <span className="text-[13px] font-bold text-[var(--color-ink)]">
                Drag an image here, or{" "}
                <span className="text-[var(--color-primary)] underline underline-offset-2">
                  browse
                </span>
              </span>
              <span className="text-[11.5px] text-[var(--color-ink-muted)]">
                JPG, PNG, WebP or GIF · up to 5MB
              </span>
            </button>
          )}

          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="url"
            value={localPreview ? "" : value}
            onChange={(e) => {
              setErr(null);
              setLocalPreview(null);
              onChange(e.target.value);
            }}
            placeholder="https://images.example.com/photo.jpg"
            className="h-11 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3.5 text-[13px] font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]/35 focus:ring-2 focus:ring-[var(--color-primary)]/18"
          />
          {preview && (
            <div
              className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]"
              style={{ aspectRatio: aspect }}
            >
              <Image
                src={preview}
                alt=""
                fill
                unoptimized
                sizes="480px"
                className="object-cover"
              />
            </div>
          )}
        </div>
      )}

      {(err || hint) && (
        <p
          className={cn(
            "mt-1.5 text-[11.5px] font-medium",
            err ? "text-red-600" : "text-[var(--color-ink-muted)]"
          )}
        >
          {err ?? hint}
        </p>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors",
        active
          ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm"
          : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
