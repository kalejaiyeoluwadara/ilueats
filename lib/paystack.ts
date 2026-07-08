const SCRIPT_SRC = "https://js.paystack.co/v1/inline.js";

interface PaystackPopupOptions {
  key: string;
  email: string;
  amount: number;
  ref: string;
  accessCode?: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        ref: string;
        access_code?: string;
        onSuccess: (transaction: { reference: string }) => void;
        onCancel: () => void;
      }) => { openIframe: () => void };
    };
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
    script.onerror = () => reject(new Error("Failed to load Paystack"));
    document.body.appendChild(script);
  });
  return loadPromise;
}

/** Opens the Paystack Inline popup and resolves once the user completes or cancels. */
export async function openPaystackPopup(options: PaystackPopupOptions) {
  await loadPaystackScript();
  if (!window.PaystackPop) throw new Error("Paystack failed to initialize");

  window.PaystackPop.setup({
    key: options.key,
    email: options.email,
    amount: options.amount,
    ref: options.ref,
    access_code: options.accessCode,
    onSuccess: (transaction) => options.onSuccess(transaction.reference),
    onCancel: options.onClose,
  }).openIframe();
}
