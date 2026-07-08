const SCRIPT_SRC = "https://js.paystack.co/v2/inline.js";

export interface PaystackResumeOptions {
  /** Access code returned by the backend's /payments/initialize (server-created transaction). */
  accessCode: string;
  onSuccess: (transaction: { reference: string }) => void;
  onCancel: () => void;
  /** Popup failed to open or errored — caller should fall back to the hosted checkout URL. */
  onError: (error: Error) => void;
}

interface PaystackTransactionCallbacks {
  onSuccess?: (transaction: { reference: string }) => void;
  onCancel?: () => void;
  onError?: (error: { message?: string }) => void;
}

interface PaystackPopInstance {
  resumeTransaction: (
    accessCode: string,
    callbacks?: PaystackTransactionCallbacks
  ) => void;
}

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopInstance;
  }
}

let loadPromise: Promise<void> | null = null;

function loadPaystackScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Paystack can only load in the browser"));
  }
  if (window.PaystackPop) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Paystack"));
    };
    document.body.appendChild(script);
  });
  return loadPromise;
}

/**
 * Resume a server-initialized Paystack transaction in the v2 popup.
 * The amount, email and reference are already locked in on the backend, so
 * nothing sensitive is passed from the browser. Never throws — failures are
 * routed to onError so the caller can redirect to the hosted checkout page.
 */
export async function resumePaystackTransaction(options: PaystackResumeOptions) {
  try {
    await loadPaystackScript();
    if (!window.PaystackPop) {
      throw new Error("Paystack failed to initialize");
    }

    const popup = new window.PaystackPop();
    popup.resumeTransaction(options.accessCode, {
      onSuccess: (transaction) => options.onSuccess(transaction),
      onCancel: () => options.onCancel(),
      onError: (error) =>
        options.onError(new Error(error?.message ?? "Paystack popup error")),
    });
  } catch (err) {
    options.onError(
      err instanceof Error ? err : new Error("Paystack popup error")
    );
  }
}
