"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import type { AdSlide } from "@/types";

const MAX_BYTES = 900 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

export type BannerModalMode = "add" | "edit";

export type AdminBannerModalProps = {
  open: boolean;
  mode: BannerModalMode;
  initial: AdSlide | null;
  onClose: () => void;
  onSave: (slide: Omit<AdSlide, "id"> & { id?: string }) => void;
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
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [fileHint, setFileHint] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setFileHint(null);
    if (mode === "edit" && initial) {
      setTitle(initial.title);
      setSubtitle(initial.subtitle);
      setCta(initial.cta);
      setHref(initial.href);
      setBadge(initial.badge ?? "");
      setImageDataUrl(initial.image || null);
      return;
    }
    setTitle("");
    setSubtitle("");
    setCta("Shop now");
    setHref("/");
    setBadge("");
    setImageDataUrl(null);
  }, [open, mode, initial]);

  const previewSrc = imageDataUrl ?? "";

  const onPickFile = (file: File | null) => {
    setErr(null);
    setFileHint(null);
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
      setErr("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErr("Image is too large. Use a file under about 900KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") {
        setImageDataUrl(r);
        setFileHint(file.name);
      }
    };
    reader.onerror = () => setErr("Could not read this file.");
    reader.readAsDataURL(file);
  };

  const canSubmit =
    title.trim().length > 0 &&
    subtitle.trim().length > 0 &&
    cta.trim().length > 0 &&
    href.trim().length > 0 &&
    !!imageDataUrl;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !imageDataUrl) return;
    setErr(null);
    onSave({
      ...(mode === "edit" && initial ? { id: initial.id } : {}),
      title: title.trim(),
      subtitle: subtitle.trim(),
      cta: cta.trim(),
      href: href.trim(),
      badge: badge.trim() || undefined,
      image: imageDataUrl,
    });
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
      description="Upload artwork (JPG, PNG, WebP — max ~900KB). Shown as the carousel on the home feed."
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
                  No image yet — choose a file below
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-line)] p-3">
              <label className="inline-flex cursor-pointer items-center rounded-xl bg-[var(--color-primary)] px-4 py-2 text-[12.5px] font-bold text-white">
                Upload file
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
                <span className="text-[11px] text-[var(--color-ink-soft)] truncate max-w-[200px]">
                  {fileHint}
                </span>
              )}
              {mode === "edit" && initial?.image?.startsWith("http") && (
                <span className="text-[11px] text-[var(--color-ink-muted)]">
                  Built-in demos use URLs; uploading replaces with your file.
                </span>
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
