"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { AdminBannerModal } from "@/components/admin/AdminBannerModal";
import { Button } from "@/components/ui/Button";
import { ContentLoader } from "@/components/ui/Loaders";
import { ErrorState } from "@/components/ui/EmptyState";
import { useBanners } from "@/context/BannersContext";
import { useToast } from "@/hooks/useToast";
import type { AdSlide } from "@/types";

export default function AdminBannersPage() {
  const {
    banners,
    loading,
    error,
    refetch,
    addBanner,
    updateBanner,
    removeBanner,
    reorderBanner,
  } = useBanners();
  const { success, info, error: errorToast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [editSlide, setEditSlide] = useState<AdSlide | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4   sm:justify-start">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)] sm:text-[26px]">
            Banners
          </h1>
          <p className="mt-1 w-[500px] text-[13px] text-[var(--color-ink-muted)]">
            Home promo carousel — upload a file or paste an image URL. Text
            and link stay editable.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-5 text-[13px] font-bold text-white shadow-[0_6px_16px_-4px_rgba(232,84,26,0.45)]"
          >
            <PlusIcon className="h-5 w-5" />
            Add banner
          </button>
        </div>
      </div>

      <AdminBannerModal
        open={addOpen}
        mode="add"
        initial={null}
        onClose={() => setAddOpen(false)}
        onSave={(payload) => {
          const created = addBanner(payload);
          success("Banner added", `${created.title} will show on the home feed.`);
        }}
      />

      <AdminBannerModal
        open={!!editSlide}
        mode="edit"
        initial={editSlide}
        onClose={() => setEditSlide(null)}
        onSave={(payload) => {
          if (!editSlide) return;
          updateBanner(editSlide.id, payload);
          success("Banner updated", `${payload.title.trim()} saved.`);
          setEditSlide(null);
        }}
      />

      {banners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] p-10 text-center">
          <p className="text-[14px] font-semibold text-[var(--color-ink)]">
            No banners yet
          </p>
          <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
            Add one to bring the carousel back on the storefront.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {banners.map((slide, index) => (
            <li
              key={slide.id}
              className="overflow-hidden rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-sm"
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:gap-5">
                <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-2xl bg-black/5 sm:aspect-[16/9] sm:h-[120px] sm:w-[200px] md:h-[130px] md:w-[210px]">
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    sizes="220px"
                    className="object-cover"
                    unoptimized={
                      slide.image.startsWith("data:") ||
                      slide.image.startsWith("blob:")
                    }
                  />
                </div>
                <div className="min-w-0 flex-1">
                  {slide.badge && (
                    <span className="inline-flex rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-primary)]">
                      {slide.badge}
                    </span>
                  )}
                  <h2 className="mt-1 text-[16px] font-extrabold tracking-tight text-[var(--color-ink)]">
                    {slide.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-[13px] text-[var(--color-ink-muted)]">
                    {slide.subtitle}
                  </p>
                  <p className="mt-3 text-[12px] font-semibold text-[var(--color-ink-soft)]">
                    <span className="font-bold text-[var(--color-ink)]">
                      {slide.cta}
                    </span>
                    <span className="mx-2 text-[var(--color-line)]">→</span>
                    <code className="rounded-md bg-[var(--color-bg)] px-1.5 py-0.5 text-[11.5px]">
                      {slide.href}
                    </code>
                  </p>
                </div>
                <div className="flex flex-row items-start gap-2 sm:flex-col sm:border-l sm:border-[var(--color-line)] sm:pl-4">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => {
                        reorderBanner(index, index - 1);
                        info("Order updated", "Banner moved up in the carousel.");
                      }}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-line)] text-[var(--color-ink-muted)] transition hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Move up"
                    >
                      <ChevronUpIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      disabled={index >= banners.length - 1}
                      onClick={() => {
                        reorderBanner(index, index + 1);
                        info("Order updated", "Banner moved down in the carousel.");
                      }}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-line)] text-[var(--color-ink-muted)] transition hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Move down"
                    >
                      <ChevronDownIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex flex-1 justify-end gap-2 sm:flex-none sm:flex-col">
                    <button
                      type="button"
                      onClick={() => setEditSlide(slide)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--color-line)] px-3 text-[12.5px] font-bold text-[var(--color-ink)] transition hover:bg-[var(--color-bg)]"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        removeBanner(slide.id);
                        success("Removed", `${slide.title} is no longer shown.`);
                      }}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-3 text-[12.5px] font-bold text-red-700 transition hover:bg-red-100"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
