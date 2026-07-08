import { apiFetch } from "./client";
import type { BackendPaymentStatus } from "./orders";

export interface InitializePaymentResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  publicKey: string;
}

export function initializePayment(orderId: string) {
  return apiFetch<InitializePaymentResult>("/payments/initialize", {
    method: "POST",
    body: { orderId },
  });
}

export function verifyPayment(reference: string) {
  return apiFetch<{ status: BackendPaymentStatus; order: string }>(
    `/payments/verify/${encodeURIComponent(reference)}`,
  );
}
