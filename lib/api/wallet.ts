import { apiFetch } from "./client";

export type WalletTransactionType = "topup" | "order_payment" | "refund";
export type WalletTransactionStatus = "pending" | "success" | "failed";

export interface WalletBalance {
  balance: number;
}

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  status: WalletTransactionStatus;
  reference: string;
  orderCode: string | null;
  balanceAfter: number | null;
  createdAt: string;
}

export interface WalletTransactionsPage {
  items: WalletTransaction[];
  page: number;
  pageSize: number;
  pageCount: number;
  totalItems: number;
}

export interface InitializeTopupResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  publicKey: string;
}

export function getWallet() {
  return apiFetch<WalletBalance>("/wallet");
}

export function getWalletTransactions(page = 1, pageSize = 10) {
  return apiFetch<WalletTransactionsPage>("/wallet/transactions", {
    query: { page, pageSize },
  });
}

export function initializeTopup(amount: number) {
  return apiFetch<InitializeTopupResult>("/wallet/topup/initialize", {
    method: "POST",
    body: { amount },
  });
}

export function verifyTopup(reference: string) {
  return apiFetch<{ status: WalletTransactionStatus; balance: number }>(
    `/wallet/topup/verify/${encodeURIComponent(reference)}`,
  );
}
