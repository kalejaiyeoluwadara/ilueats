"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import type { AdSlide } from "@/types";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

export type BannerModalMode = "add" | "edit";

export type AdminBannerModalProps = {
  open: boolean;
  mode: BannerModalMode;
  initial: AdSlide | null;
  onClose: () => void;
  onSave: (
    slide: Omit<AdSlide, "id" | "image"> & { image?: string },
    file?: File | null
  ) => void;
};

export function AdminBannerModal({
  open,
  mode,
  initial,
  onClose,
  onSave,
}: AdminBannerModalProps) {
  const formId = useId();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [cta, setCta] = useState("");
  const [href, setHref] = useState("");
  const [badge, setBadge] = useState("");
  const [imageSource, setImageSource] = useState<"url" | "file">("url");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [fileHint, setFileHint] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setFileHint(null);
    setFile(null);
    setImageSource("url");
    if (mode === "edit" && initial) {
      setTitle(initial.title);
      setSubtitle(initial.subtitle);
      setCta(initial.cta);
      setHref(initial.href);
      setBadge(initial.badge ?? "");
      setImageUrl(initial.image || "");
      setPreviewSrc(initial.image || null);
      return;
    }
    setTitle("");
    setSubtitle("");
    setCta("Shop now");
    setHref("/");
    setBadge("");
    setImageUrl("");
    setPreviewSrc(null);
  }, [open, mode, initial]);

  const onPickFile = (picked: File | null) => {
    setErr(null);
    setFileHint(null);
    if (!picked) return;
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(picked.type)) {
      setErr("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (picked.size > MAX_BYTES) {
      setErr("Image is too large. Use a file under 5MB.");
      return;
    }
    setFile(picked);
    setFileHint(picked.name);
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") setPreviewSrc(r);
    };
    reader.readAsDataURL(picked);
  };

  const canSubmit =
    title.trim().length > 0 &&
    subtitle.trim().length > 0 &&
    cta.trim().length > 0 &&
    href.trim().length > 0 &&
    (imageSource === "file" ? !!file : imageUrl.trim().length > 0);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setErr(null);
    onSave(
      {
        title: title.trim(),
        subtitle: subtitle.trim(),
        cta: cta.trim(),
        href: href.trim(),
        badge: badge.trim() || undefined,
        image: imageSource === "url" ? imageUrl.trim() : undefined,
      },
      imageSource === "file" ? file : undefined
    );
    onClose();
  };

  const footer = (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onClose}
        className="flex h-11 flex-1 items-center justify-center rounded-2xl border border-[var(--color-line)] text-[13px] font-semibold text-[var(--color-ink-muted)]"
      >
        Cancel
      </button>
      <button
        type="submit"
        form={formId}
        disabled={!canSubmit}
        className={cn(
          "flex h-11 flex-1 items-center justify-center rounded-2xl text-[13px] font-bold text-white",
          canSubmit
            ? "bg-[var(--color-primary)] shadow-[0_6px_16px_-4px_rgba(232,84,26,0.35)]"
            : "cursor-not-allowed bg-zinc-300 text-zinc-500"
        )}
      >
        {mode === "add" ? "Add banner" : "Save"}
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "add" ? "New promo banner" : "Edit banner"}
      description="Upload a file or paste an image URL. Shown as the carousel on the home feed."
      footer={footer}
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-4 pb-2">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Banner image <span className="text-[var(--color-primary)]">*</span>
          </label>
          <div className="mt-2 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
            <div className="relative mx-auto aspect-[16/10] max-h-[200px] w-full bg-[var(--color-bg)]">
              {previewSrc ? (
                <Image
                  src={previewSrc}
                  alt=""
                  fill
                  unoptimized={
                    previewSrc.startsWith("data:") ||
                    previewSrc.startsWith("blob:")
                  }
                  sizes="480px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-[12.5px] text-[var(--color-ink-muted)]">
                  No image yet
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--color-line)] p-2.5">
              <button
                type="button"
                onClick={() => setImageSource("url")}
                className={cn(
                  "h-9 rounded-lg px-3 text-[12px] font-bold transition-colors",
                  imageSource === "url"
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-bg)] text-[var(--color-ink)]"
                )}
              >
                Image URL
              </button>
              <button
                type="button"
                onClick={() => setImageSource("file")}
                className={cn(
                  "h-9 rounded-lg px-3 text-[12px] font-bold transition-colors",
                  imageSource === "file"
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-bg)] text-[var(--color-ink)]"
                )}
              >
                Upload file
              </button>
            </div>
            <div className="border-t border-[var(--color-line)] p-3">
              {imageSource === "url" ? (
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setPreviewSrc(e.target.value || null);
                  }}
                  placeholder="https://images.example.com/banner.jpg"
                  className="h-11 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 text-[13.5px] outline-none ring-[var(--color-primary)] focus:ring-2"
                />
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center rounded-xl bg-[var(--color-primary)] px-4 py-2 text-[12.5px] font-bold text-white">
                    Choose file
                    <input
                      type="file"
                      accept={ACCEPT}
                      className="hidden"
                      onChange={(ev) =>
                        onPickFile(ev.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  {fileHint && (
                    <span className="max-w-[200px] truncate text-[11px] text-[var(--color-ink-soft)]">
                      {fileHint}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 text-[13.5px] outline-none ring-[var(--color-primary)] focus:ring-2"
              placeholder="Headline customers see"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Subtitle
            </label>
            <textarea
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              rows={2}
              className="mt-1.5 w-full resize-none rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[13.5px] outline-none ring-[var(--color-primary)] focus:ring-2"
              placeholder="Supporting line under the headline"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Button label
            </label>
            <input
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 text-[13.5px] outline-none ring-[var(--color-primary)] focus:ring-2"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Links to (path)
            </label>
            <input
              value={href}
              onChange={(e) => setHref(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 text-[13.5px] outline-none ring-[var(--color-primary)] focus:ring-2"
              placeholder="/your-store-slug"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Badge <span className="font-normal">(optional)</span>
            </label>
            <input
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 text-[13.5px] outline-none ring-[var(--color-primary)] focus:ring-2"
              placeholder="e.g. Featured"
            />
          </div>
        </div>

        {err && (
          <p className="text-[12.5px] font-semibold text-red-600">{err}</p>
        )}
      </form>
    </Modal>
  );
}
