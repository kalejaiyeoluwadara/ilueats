import { getSession } from "next-auth/react";
import { apiFetch } from "./client";
import type { PaginatedResult } from "./orders";
import type { RiderJob, RiderJobStatus, RiderOffer } from "@/types";

/* -------------------------------------------------------------------------- */
/* Offers                                                                     */
/* -------------------------------------------------------------------------- */

interface RawOffer {
  _id: string;
  store: string;
  customer: string;
  drop: string;
  pay: number;
  etaMin: number;
  phone: string;
  lineItems: RiderOffer["lineItems"];
}

function mapOffer(raw: RawOffer): RiderOffer {
  return {
    id: raw._id,
    store: raw.store,
    customer: raw.customer,
    drop: raw.drop,
    pay: raw.pay,
    etaMin: raw.etaMin,
    phone: raw.phone,
    lineItems: raw.lineItems,
  };
}

export async function getRiderOffers(): Promise<RiderOffer[]> {
  const res = await apiFetch<{ items: RawOffer[] }>("/rider/offers");
  return res.items.map(mapOffer);
}

export function acceptRiderOffer(offerId: string) {
  return apiFetch<RiderJob>(`/rider/offers/${offerId}/accept`, {
    method: "POST",
  });
}

/* -------------------------------------------------------------------------- */
/* Online status                                                              */
/* -------------------------------------------------------------------------- */

export function setRiderOnline(isOnline: boolean) {
  return apiFetch<{ isOnline: boolean }>("/rider/online", {
    method: "POST",
    body: { isOnline },
  });
}

/* -------------------------------------------------------------------------- */
/* Jobs                                                                       */
/* -------------------------------------------------------------------------- */

export function getRiderJobs(params: {
  status?: RiderJobStatus;
  page?: number;
  pageSize?: number;
} = {}) {
  return apiFetch<PaginatedResult<RiderJob>>("/rider/jobs", {
    query: {
      status: params.status,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 100,
    },
  });
}

export function pickupRiderJob(jobId: string) {
  return apiFetch<RiderJob>(`/rider/jobs/${jobId}/pickup`, {
    method: "POST",
  });
}

export function deliverRiderJob(jobId: string) {
  return apiFetch<{ job: RiderJob; tip: number }>(
    `/rider/jobs/${jobId}/deliver`,
    { method: "POST" }
  );
}

/* -------------------------------------------------------------------------- */
/* Earnings                                                                   */
/* -------------------------------------------------------------------------- */

export interface RiderEarningsSummary {
  basePayouts: number;
  peakBonuses: number;
  tips: number;
  deliveriesToday: number;
  onTimePercent: number;
}

export function getRiderEarningsSummary() {
  return apiFetch<RiderEarningsSummary>("/rider/earnings/summary");
}

export function getRiderEarningsLedger(params: {
  page?: number;
  pageSize?: number;
} = {}) {
  return apiFetch<PaginatedResult<RiderJob>>("/rider/earnings/ledger", {
    query: { page: params.page ?? 1, pageSize: params.pageSize ?? 5 },
  });
}

/** Downloads the CSV statement and triggers a browser save — apiFetch can't be
 * used here since it only parses JSON responses. */
export async function downloadRiderStatement(from?: string, to?: string) {
  const token = (await getSession())?.accessToken;
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const url = new URL("rider/earnings/statement", `${API_BASE_URL}/`);
  if (from) url.searchParams.set("from", from);
  if (to) url.searchParams.set("to", to);

  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error("Failed to download statement");
  const blob = await res.blob();

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `ilueats-rider-statement-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

export type RiderDocumentType = "id" | "vehicle" | "insurance";
export type RiderDocumentStatus = "pending" | "verified" | "rejected";

export interface RiderDocument {
  _id: string;
  type: RiderDocumentType;
  url: string;
  status: RiderDocumentStatus;
}

export interface RiderProfile {
  userId: string;
  isOnline: boolean;
  vehicleType: string;
  plateNumber: string;
  documents: RiderDocument[];
}

export function getRiderProfile() {
  return apiFetch<RiderProfile>("/rider/profile");
}

export function updateRiderProfile(input: {
  vehicleType?: string;
  plateNumber?: string;
}) {
  return apiFetch<RiderProfile>("/rider/profile", {
    method: "PATCH",
    body: input,
  });
}

export function uploadRiderDocument(type: RiderDocumentType, file: File) {
  const formData = new FormData();
  formData.append("type", type);
  formData.append("file", file);
  return apiFetch<RiderProfile>("/rider/documents", {
    method: "POST",
    body: formData,
  });
}
