"use client";

import { useEffect, useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { cn } from "@/lib/utils";
import type { AdSlide } from "@/types";

export type BannerModalMode = "add" | "edit";

export type AdminBannerModalProps = {
  open: boolean;
  mode: BannerModalMode;
  initial: AdSlide | null;
  onClose: () => void;
  onSave: (slide: Omit<AdSlide, "id" | "image"> & { image?: string }) => void;
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
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setTitle(initial.title);
      setSubtitle(initial.subtitle);
      setCta(initial.cta);
      setHref(initial.href);
      setBadge(initial.badge ?? "");
      setImageUrl(initial.image || "");
      return;
    }
    setTitle("");
    setSubtitle("");
    setCta("Shop now");
    setHref("/");
    setBadge("");
    setImageUrl("");
  }, [open, mode, initial]);

  const canSubmit =
    title.trim().length > 0 &&
    subtitle.trim().length > 0 &&
    cta.trim().length > 0 &&
    href.trim().length > 0 &&
    imageUrl.trim().length > 0 &&
    !uploading;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSave({
      title: title.trim(),
      subtitle: subtitle.trim(),
      cta: cta.trim(),
      href: href.trim(),
      badge: badge.trim() || undefined,
      image: imageUrl.trim(),
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
        {uploading ? "Uploading…" : mode === "add" ? "Add banner" : "Save"}
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
        <ImageUploadField
          label="Banner image"
          folder="banners"
          aspect="16 / 10"
          required
          value={imageUrl}
          onChange={setImageUrl}
          onUploadingChange={setUploading}
        />

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

      </form>
    </Modal>
  );
}
