import { apiFetch } from "./client";

export type PlatformClosedReason = "manual" | "schedule" | null;

export interface PlatformStatus {
  isOpen: boolean;
  reason: PlatformClosedReason;
  message: string;
  manualClosed: boolean;
  autoScheduleEnabled: boolean;
  /** 24h HH:mm, Africa/Lagos. */
  openTime: string;
  closeTime: string;
}

/** Public — no auth required. */
export function fetchPlatformStatus(): Promise<PlatformStatus> {
  return apiFetch<PlatformStatus>("/platform/status");
}

/* Admin */

export function getPlatformSettings(): Promise<PlatformStatus> {
  return apiFetch<PlatformStatus>("/admin/settings/platform");
}

export type PlatformSettingsPatch = Partial<{
  manualClosed: boolean;
  autoScheduleEnabled: boolean;
  openTime: string;
  closeTime: string;
  closedMessage: string;
}>;

export function updatePlatformSettings(
  patch: PlatformSettingsPatch
): Promise<PlatformStatus> {
  return apiFetch<PlatformStatus>("/admin/settings/platform", {
    method: "PATCH",
    body: patch,
  });
}
