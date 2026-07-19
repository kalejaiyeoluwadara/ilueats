"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  FlagIcon,
  HomeIcon,
  MapPinIcon,
  PencilSquareIcon,
  LockClosedIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useAddresses } from "@/hooks/useAddresses";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/useToast";
import { useCatalog } from "@/context/CatalogContext";
import { useOrders } from "@/context/OrdersContext";
import { usePlatformStatus } from "@/context/PlatformStatusContext";
import { fetchLandmarks, type Landmark } from "@/lib/api/landmarks";
import { useGeolocation, PRICING_ACCURACY_M } from "@/hooks/useGeolocation";
import { rankByDistance, formatDistance, type Ranked } from "@/lib/geo";
import {
  createOrder as createBackendOrder,
  quoteOrder,
  type OrderQuote,
  type QuoteOrderInput,
} from "@/lib/api/orders";
import { initializePayment, verifyPayment } from "@/lib/api/payments";
import { ApiError, LOAD_FAILED_FALLBACK } from "@/lib/api/client";
import { resumePaystackTransaction } from "@/lib/paystack";
import {
  cn,
  formatCartOption,
  formatCartOptionWithPrice,
  formatPrice,
} from "@/lib/utils";

type PayMethod = "card" | "transfer" | "cash" | "wallet";
type DeliveryMode = "door" | "landmark";

type OrderReceipt = {
  storeName: string;
  deliverySummary: string;
  items: { name: string; qty: number; lineTotal: number; options: string[] }[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, count, storeSlug, storeName, clearCart } = useCart();
  const { user, ready: authReady } = useAuth();
  const { data: session } = useSession();
  const { addresses, defaultAddress, ready: addrReady } = useAddresses();
  const {
    balance: walletBalance,
    ready: walletReady,
    refresh: refreshWallet,
  } = useWallet();
  const { success, error: toastError } = useToast();
  const { stores } = useCatalog();
  const { placeOrder } = useOrders();
  const { isOpen: platformOpen, status: platformStatus } = usePlatformStatus();

  const store = useMemo(
    () => (storeSlug ? stores.find((s) => s.slug === storeSlug) : undefined),
    [storeSlug, stores]
  );

  const [step, setStep] = useState<"form" | "paying" | "done">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("door");
  const [landmarkId, setLandmarkId] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  // Device location — a graded hint, never trusted blindly. See useGeolocation.
  const { status: geoStatus, reading: geo, request: requestGeo } =
    useGeolocation();
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<PayMethod>("transfer");
  const [orderId, setOrderId] = useState<string>("");
  // Snapshot the order (items, fees, delivery) before clearCart() empties it,
  // so the success page can render the full order details.
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);

  // Fees and total come from the backend, never from arithmetic here. It is the
  // side that charges the card, so it is the only side allowed to decide the
  // number we show — computing it locally is how "shown ₦300, charged ₦850"
  // happens on landmark orders, where delivery is priced by distance.
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Only feed the pin into pricing on a door order when it's tight enough to
  // trust — a fuzzy fix would misprice the delivery, so we let the landmark
  // anchor those instead. Poor fixes still travel with the order as a rider
  // hint (below), just not as the basis for the fee.
  const pinForPricing = useMemo(
    () =>
      deliveryMode === "door" && geo && geo.accuracy <= PRICING_ACCURACY_M
        ? { lat: geo.lat, lng: geo.lng }
        : null,
    [deliveryMode, geo]
  );

  const quoteBody = useMemo<QuoteOrderInput | null>(() => {
    if (!store || items.length === 0) return null;
    if (deliveryMode === "landmark" && !landmarkId) return null;
    return {
      storeId: store.id,
      items: items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        selectedOptions: it.selectedOptions?.map((o) => ({
          groupId: o.groupId,
          choiceId: o.choiceId,
        })),
        notes: it.notes,
      })),
      deliveryMode,
      landmarkId:
        deliveryMode === "landmark" ? (landmarkId ?? undefined) : undefined,
      deliveryLat: pinForPricing?.lat,
      deliveryLng: pinForPricing?.lng,
    };
  }, [store, items, deliveryMode, landmarkId, pinForPricing]);

  // Curated landmarks sorted by how close they are to the device reading. This
  // is the accuracy fix for a contained town: even a rough fix reliably floats
  // the right gate/hall to the top for the customer to confirm.
  const rankedLandmarks = useMemo<Ranked<Landmark>[]>(() => {
    if (!geo) return landmarks.map((item) => ({ item, distanceKm: null }));
    return rankByDistance(landmarks, geo);
  }, [landmarks, geo]);

  // Serialized so this re-runs when the basket's *contents* change rather than
  // on every render's fresh array identity.
  const quoteKey = quoteBody ? JSON.stringify(quoteBody) : null;

  useEffect(() => {
    if (!quoteKey || !session?.accessToken) {
      setQuote(null);
      return;
    }
    const controller = new AbortController();
    setQuoteError(null);
    quoteOrder(JSON.parse(quoteKey) as QuoteOrderInput, controller.signal)
      .then(setQuote)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setQuote(null);
        setQuoteError(
          err instanceof ApiError ? err.message : LOAD_FAILED_FALLBACK
        );
      });
    return () => controller.abort();
  }, [quoteKey, session?.accessToken]);

  const deliveryFee = quote?.deliveryFee ?? null;
  const serviceFee = quote?.serviceFee ?? null;
  const discount = quote?.discount ?? 0;
  const total = quote?.total ?? null;
  const belowMin = quote != null && !quote.meetsMinimum;

  // Redirect to cart if there's nothing to checkout
  useEffect(() => {
    if (count === 0 && step === "form") {
      router.replace("/cart");
    }
  }, [count, step, router]);

  // Load the admin-managed delivery landmarks for the pickup picker.
  useEffect(() => {
    fetchLandmarks()
      .then(setLandmarks)
      .catch(() => setLandmarks([]));
  }, []);

  // Once we have a reading, pre-select the nearest landmark so the common case
  // is a single tap of confirmation. Never overrides a choice the user made.
  useEffect(() => {
    if (deliveryMode !== "landmark" || landmarkId || !geo) return;
    const nearest = rankedLandmarks[0];
    if (nearest && nearest.distanceKm !== null) setLandmarkId(nearest.item.id);
  }, [deliveryMode, landmarkId, geo, rankedLandmarks]);

  useEffect(() => {
    if (!authReady || !user) return;
    setName((n) => (n.trim() === "" ? user.name : n));
    setPhone((p) => (p.trim() === "" && user.phone ? user.phone : p));
  }, [authReady, user]);

  useEffect(() => {
    if (!addrReady || !defaultAddress) return;
    setPhone((p) =>
      p.trim() === "" && defaultAddress.phone ? defaultAddress.phone : p
    );
  }, [addrReady, defaultAddress]);

  useEffect(() => {
    if (!addrReady || !defaultAddress || deliveryMode !== "door") return;
    setAddress((a) => (a.trim() === "" ? defaultAddress.addressLine : a));
  }, [addrReady, defaultAddress, deliveryMode]);

  const canSubmit = useMemo(() => {
    if (!platformOpen) return false;
    // No confirmed price means no confirmed order — never let the customer
    // authorise a charge whose amount we haven't shown them yet.
    if (!store || !quote || !quote.meetsMinimum) return false;
    const contactOk =
      name.trim().length > 1 && phone.trim().length >= 7;
    if (!contactOk) return false;
    if (deliveryMode === "door") {
      return address.trim().length > 4;
    }
    return landmarkId !== null;
  }, [
    platformOpen,
    store,
    quote,
    name,
    phone,
    address,
    deliveryMode,
    landmarkId,
  ]);

  const paymentLabels: Record<PayMethod, string> = {
    card: "Card (demo)",
    transfer: "Bank transfer (verified)",
    cash: "Pay on delivery",
    wallet: "Wallet",
  };

  const payLabel =
    step === "paying"
      ? "Placing order…"
      : !quote
        ? "Getting price…"
        : method === "cash"
          ? "Place order"
          : method === "wallet"
            ? "Pay from wallet"
            : "Pay & place order";

  const walletCoversTotal = total !== null && (walletBalance ?? 0) >= total;

  // Don't leave wallet selected if the basket grows past the balance.
  useEffect(() => {
    if (method === "wallet" && walletReady && quote && !walletCoversTotal) {
      setMethod("transfer");
    }
  }, [method, walletReady, quote, walletCoversTotal]);

  /** The priced order as the backend settled it — the only numbers we display. */
  type SettledTotals = {
    subtotal: number;
    discount: number;
    deliveryFee: number;
    serviceFee: number;
    total: number;
  };

  const recordLocalOrder = (
    finalPaymentLabel: string,
    totals: SettledTotals
  ) => {
    const landmark = landmarks.find((l) => l.id === landmarkId);
    return placeOrder({
      customer: name.trim(),
      customerPhone: phone.trim(),
      deliveryMode,
      deliveryAddress:
        deliveryMode === "door"
          ? address.trim()
          : `Landmark — ${landmark?.name ?? "meet-up point"}`,
      deliveryNote: notes.trim() || undefined,
      storeId: store?.id,
      store: storeName ?? store?.name ?? "Store",
      storeAddress: store?.location ?? "Ilisan-Remo",
      paymentLabel: finalPaymentLabel,
      deliveryFee: totals.deliveryFee,
      serviceFee: totals.serviceFee,
      total: totals.total,
      lineItems: items.map((it) => ({
        name: it.name,
        qty: it.quantity,
        unitPrice: it.price,
        modifiers: it.selectedOptions?.length
          ? it.selectedOptions.map(formatCartOptionWithPrice)
          : undefined,
        notes: it.notes,
      })),
    });
  };

  // Freeze the order contents at success time — the cart is cleared right after,
  // so the success page reads from this instead of live cart state. Every money
  // figure comes from `totals` (the backend's), so the rows always sum to the
  // total the customer was actually charged.
  const buildReceipt = (totals: SettledTotals): OrderReceipt => {
    const landmark = landmarks.find((l) => l.id === landmarkId);
    return {
      storeName: storeName ?? store?.name ?? "Store",
      deliverySummary:
        deliveryMode === "door"
          ? address.trim()
          : `Landmark — ${landmark?.name ?? "meet-up point"}`,
      items: items.map((it) => ({
        name: it.name,
        qty: it.quantity,
        lineTotal: it.price * it.quantity,
        options: it.selectedOptions?.length
          ? it.selectedOptions.map(formatCartOption)
          : [],
      })),
      subtotal: totals.subtotal,
      discount: totals.discount,
      deliveryFee: totals.deliveryFee,
      serviceFee: totals.serviceFee,
      total: totals.total,
    };
  };

  const submitViaBackend = async () => {
    if (!store || !session?.accessToken) {
      toastError(
        "Not ready yet",
        "We're still loading this store. Give it a second and try again."
      );
      return;
    }
    setStep("paying");

    try {
      const backendOrder = await createBackendOrder({
        storeId: store.id,
        storeSlug: store.slug,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          selectedOptions: it.selectedOptions?.map((o) => ({
            groupId: o.groupId,
            choiceId: o.choiceId,
          })),
          notes: it.notes,
        })),
        deliveryMode,
        address: deliveryMode === "door" ? address.trim() : undefined,
        landmarkId: deliveryMode === "landmark" ? landmarkId ?? undefined : undefined,
        deliveryLat: pinForPricing?.lat,
        deliveryLng: pinForPricing?.lng,
        contactName: name.trim(),
        contactPhone: phone.trim(),
        notes: notes.trim() || undefined,
        paymentMethod: method,
      });

      const settled: SettledTotals = {
        subtotal: backendOrder.subtotal,
        discount: backendOrder.discount,
        deliveryFee: backendOrder.deliveryFee,
        serviceFee: backendOrder.serviceFee,
        total: backendOrder.total,
      };

      if (backendOrder.paymentRequired) {
        const payment = await initializePayment(backendOrder.orderId);

        // Verify against our stored reference (payment.reference). Bank
        // transfers can take a few seconds to settle on Paystack's side after
        // the popup reports success, so retry while the backend still says
        // "pending" instead of failing the whole checkout on the first poll.
        const finalizeAfterPayment = async () => {
          try {
            let status: string = "pending";
            for (let attempt = 0; attempt < 5; attempt++) {
              const res = await verifyPayment(payment.reference);
              status = res.status;
              if (status === "paid" || status === "failed") break;
              await new Promise((r) => setTimeout(r, 2500));
            }
            if (status !== "paid") {
              throw new Error(
                `Payment is not confirmed yet (status: ${status}). If you were debited, keep your reference ${payment.reference} and check your orders shortly.`,
              );
            }
            recordLocalOrder(paymentLabels[method], settled);
            setOrderId(backendOrder.orderId);
            setReceipt(buildReceipt(settled));
            setStep("done");
            clearCart();
            success("Payment received!", `Order ${backendOrder.orderId} is on its way.`);
          } catch (err) {
            toastError(
              "Payment could not be verified",
              err instanceof Error ? err.message : "Please contact support with your reference.",
            );
            setStep("form");
          }
        };

        await resumePaystackTransaction({
          accessCode: payment.accessCode,
          onSuccess: finalizeAfterPayment,
          onCancel: () => setStep("form"),
          // Popup unavailable (script blocked, in-app browser, etc.) — fall
          // back to Paystack's hosted checkout; the /checkout/payment/callback
          // page verifies the payment when the user is redirected back.
          onError: () => {
            window.location.href = payment.authorizationUrl;
          },
        });
      } else {
        recordLocalOrder(paymentLabels[method], settled);
        setOrderId(backendOrder.orderId);
        setReceipt(buildReceipt(settled));
        setStep("done");
        clearCart();
        if (method === "wallet") {
          void refreshWallet();
          success(
            "Paid from wallet!",
            `Order ${backendOrder.orderId} is on its way.`,
          );
        } else {
          success("Order placed!", `Order ${backendOrder.orderId} is on its way.`);
        }
      }
    } catch (err) {
      toastError(
        "Could not place order",
        err instanceof ApiError ? err.message : "Something went wrong. Try again.",
      );
      setStep("form");
    }
  };

  const submit = async () => {
    if (!canSubmit) return;
    await submitViaBackend();
  };

  if (!authReady) {
    return (
      <div className="min-h-screen pb-24">
        <Navbar variant="page" title="Checkout" showSearch={false} />
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pb-24">
        <Navbar variant="page" title="Checkout" showSearch={false} />
        <main className="mx-auto flex max-w-md flex-col items-center px-6 pt-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/10 animate-pulse">
            <LockClosedIcon className="h-9 w-9" />
          </div>
          <h1 className="font-display mt-6 text-[22px] font-extrabold tracking-tight text-[var(--color-ink)]">
            Sign in to check out
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-ink-muted)]">
            Please log in or create an account to complete your order. Your items are saved.
          </p>
          <Link href="/account?redirect=/checkout" className="mt-6 w-full">
            <Button size="lg" fullWidth>
              Sign in / Register
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  if (step === "done" && receipt) {
    return <SuccessView orderId={orderId} receipt={receipt} />;
  }

  return (
    <div className="min-h-screen pb-36 lg:pb-16">
      <Navbar variant="page" title="Checkout" showSearch={false} />

      <main className="mx-auto max-w-2xl space-y-5 px-4 pt-4 lg:grid lg:max-w-5xl lg:grid-cols-[1fr_400px] lg:items-start lg:gap-8 lg:space-y-0 lg:px-6">
        <div className="min-w-0 space-y-5">
        {/* Delivery details */}
        <section className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
          <SectionHeader
            icon={<MapPinIcon className="h-4 w-4" />}
            title="Delivery details"
          />
          <div className="mt-3 space-y-3">
            <div className="grid gap-2">
              <PaymentOption
                active={deliveryMode === "door"}
                icon={<HomeIcon className="h-5 w-5" />}
                title="Door delivery"
                subtitle="We bring it to your full street address"
                onClick={() => setDeliveryMode("door")}
              />
              <PaymentOption
                active={deliveryMode === "landmark"}
                icon={<FlagIcon className="h-5 w-5" />}
                title="Meet at landmark"
                subtitle="Pick a public spot nearby — rider meets you there"
                onClick={() => setDeliveryMode("landmark")}
              />
            </div>

            {/* Precise-location capture. GPS is a hint we grade, not the truth:
                a tight fix prices the door exactly; a fuzzy one just sorts the
                landmarks so the customer confirms an accurate anchor. */}
            <div className="rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-bg)] p-3">
              {!geo ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[var(--color-ink)]">
                      Pinpoint your spot
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">
                      Share your location so the rider heads to the right place.
                    </p>
                    {(geoStatus === "denied" ||
                      geoStatus === "unavailable" ||
                      geoStatus === "timeout") && (
                      <p className="mt-1.5 text-[12px] font-medium text-[var(--color-ink-soft)]">
                        {geoStatus === "denied"
                          ? "Location is off — type your address or pick a landmark below."
                          : geoStatus === "timeout"
                            ? "Couldn't get a fix in time. Try again, or pick a landmark below."
                            : "Location isn't available here. Pick a landmark below."}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => requestGeo()}
                    disabled={geoStatus === "locating"}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-3.5 py-2 text-[12.5px] font-bold text-white transition disabled:opacity-60"
                  >
                    <MapPinIcon className="h-4 w-4" />
                    {geoStatus === "locating" ? "Locating…" : "Use my location"}
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full",
                      geo.quality === "precise"
                        ? "bg-emerald-500"
                        : geo.quality === "approx"
                          ? "bg-amber-500"
                          : "bg-red-500"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-[var(--color-ink)]">
                      {geo.quality === "precise"
                        ? "Location pinpointed"
                        : geo.quality === "approx"
                          ? "Got your location"
                          : "Location is fuzzy"}
                      <span className="ml-1.5 font-medium text-[var(--color-ink-muted)]">
                        ±{Math.round(geo.accuracy)}m
                      </span>
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">
                      {geo.quality === "poor"
                        ? "Your device gave a rough fix — pick the nearest landmark below for an accurate drop-off."
                        : deliveryMode === "door"
                          ? "We'll price delivery to this exact point."
                          : "Landmarks below are sorted by distance from you."}
                    </p>
                    <div className="mt-1.5 flex gap-4">
                      <button
                        type="button"
                        onClick={() => requestGeo()}
                        className="text-[12px] font-bold text-[var(--color-primary)]"
                      >
                        Retry
                      </button>
                      {geo.quality === "poor" && deliveryMode === "door" && (
                        <button
                          type="button"
                          onClick={() => setDeliveryMode("landmark")}
                          className="text-[12px] font-bold text-[var(--color-primary)]"
                        >
                          Use a landmark
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {addrReady && addresses.length > 0 && deliveryMode === "door" && (
              <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {addresses.map((a) => {
                  const matches = address.trim() === a.addressLine.trim();
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setAddress(a.addressLine);
                        if (a.phone) setPhone(a.phone);
                      }}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 transition-colors",
                        matches
                          ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-[var(--color-primary)]/35"
                          : "bg-[var(--color-bg)] text-[var(--color-ink)] ring-[var(--color-line)] hover:bg-black/[0.03]"
                      )}
                    >
                      {a.label}
                      {a.isDefault ? " · Default" : ""}
                    </button>
                  );
                })}
                <Link
                  href="/addresses"
                  className="shrink-0 self-center whitespace-nowrap py-1.5 text-[12px] font-bold text-[var(--color-primary)]"
                >
                  Manage
                </Link>
              </div>
            )}
            <Field
              label="Full name"
              value={name}
              onChange={setName}
              placeholder="e.g. Tope Adebayo"
            />
            <Field
              label="Phone number"
              value={phone}
              onChange={setPhone}
              placeholder="e.g. 0803 123 4567"
              type="tel"
              inputMode="tel"
            />

            {deliveryMode === "door" ? (
              <Field
                label="Delivery address"
                value={address}
                onChange={setAddress}
                placeholder="House no, street, landmark, Ilisan"
                multiline
              />
            ) : (
              <div>
                <span className="flex items-center gap-1 text-[12px] font-semibold text-[var(--color-ink-muted)]">
                  Pickup landmark
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {rankedLandmarks.map(({ item: lm, distanceKm }, idx) => {
                    const selected = landmarkId === lm.id;
                    const isNearest = geo != null && idx === 0 && distanceKm != null;
                    return (
                      <button
                        key={lm.id}
                        type="button"
                        onClick={() => setLandmarkId(lm.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-left text-[12px] font-semibold leading-snug ring-1 transition-colors",
                          selected
                            ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-[var(--color-primary)]/35"
                            : "bg-[var(--color-bg)] text-[var(--color-ink)] ring-[var(--color-line)] hover:bg-black/[0.03]"
                        )}
                      >
                        {lm.name}
                        {distanceKm != null && (
                          <span className="font-medium opacity-70">
                            · {formatDistance(distanceKm)}
                          </span>
                        )}
                        {isNearest && (
                          <span className="rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                            Nearest
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {landmarkId && (
                  <p className="mt-2 text-[12px] text-[var(--color-ink-muted)]">
                    {
                      landmarks.find((l) => l.id === landmarkId)
                        ?.description
                    }
                  </p>
                )}
              </div>
            )}
            <Field
              label="Notes for the rider (optional)"
              value={notes}
              onChange={setNotes}
              placeholder="Apartment number, gate code, etc."
              multiline
              icon={<PencilSquareIcon className="h-3.5 w-3.5" />}
            />
          </div>
        </section>

        {/* Payment method */}
        <section className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
          <SectionHeader
            icon={<CreditCardIcon className="h-4 w-4" />}
            title="Payment method"
            subtitle="Pay by bank transfer or straight from your wallet."
          />
          <div className="mt-3 grid gap-2">
            <PaymentOption
              active={method === "transfer"}
              icon={<DevicePhoneMobileIcon className="h-5 w-5" />}
              title="Bank transfer"
              subtitle="Get a one-time account number via Paystack"
              onClick={() => setMethod("transfer")}
            />
            <PaymentOption
              active={method === "wallet"}
              icon={<WalletIcon className="h-5 w-5" />}
              title="Wallet"
              subtitle={
                !walletReady
                  ? "Checking balance…"
                  : walletCoversTotal
                    ? `Balance: ${formatPrice(walletBalance ?? 0)} — paid instantly`
                    : `Balance: ${formatPrice(walletBalance ?? 0)} — not enough for this order`
              }
              disabled={!walletReady || !walletCoversTotal}
              onClick={() => setMethod("wallet")}
            />
            {walletReady && !walletCoversTotal && (
              <Link
                href="/wallet"
                className="px-1 text-[12px] font-bold text-[var(--color-primary)]"
              >
                Top up your wallet →
              </Link>
            )}
          </div>
        </section>
        </div>

        <div className="space-y-5 lg:sticky lg:top-24">
        {/* Items review */}
        <section className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
          <SectionHeader title="Your order" />
          <ul className="mt-3 space-y-2.5">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-start justify-between gap-3 text-[13.5px]"
              >
                <div className="min-w-0">
                  <p className="line-clamp-1 font-semibold text-[var(--color-ink)]">
                    {it.quantity} × {it.name}
                  </p>
                  {it.selectedOptions && it.selectedOptions.length > 0 && (
                    <p className="line-clamp-2 text-[12px] text-[var(--color-ink-muted)]">
                      {it.selectedOptions.map(formatCartOption).join(" · ")}
                    </p>
                  )}
                </div>
                <span className="font-bold text-[var(--color-ink)]">
                  {formatPrice(it.price * it.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <CartSummary
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          serviceFee={serviceFee}
          discount={discount}
          total={total}
        />

        {quote?.deliveryDistanceKm != null && (
          <p className="px-1 text-[12px] text-[var(--color-ink-muted)]">
            Delivery is about {quote.deliveryDistanceKm}km from{" "}
            {storeName ?? store?.name ?? "the store"}.
          </p>
        )}

        {belowMin && quote && (
          <p className="rounded-2xl bg-[var(--color-accent-soft)] px-4 py-3 text-[13px] font-semibold text-[#8a4f00]">
            Add {formatPrice(quote.minOrder - quote.subtotal)} more to meet{" "}
            {storeName ?? store?.name ?? "this store"}&apos;s minimum order.
          </p>
        )}

        {quoteError && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">
            We couldn&apos;t price this order. {quoteError}
          </p>
        )}

        {!platformOpen ? (
          <p className="rounded-2xl bg-zinc-900 px-4 py-3 text-[13px] font-semibold text-zinc-100">
            {platformStatus?.message ??
              "We're currently closed — ordering will resume shortly."}
          </p>
        ) : null}

        {/* Desktop inline pay */}
        <div className="hidden lg:flex lg:items-center lg:gap-3 lg:rounded-2xl lg:bg-white lg:p-4 lg:ring-1 lg:ring-[var(--color-line)]">
          <div className="leading-tight">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
              You pay
            </p>
            <p className="font-display text-[18px] font-extrabold tracking-tight text-[var(--color-ink)]">
              {total !== null ? formatPrice(total) : "—"}
            </p>
          </div>
          <Button
            size="lg"
            fullWidth
            onClick={submit}
            disabled={!canSubmit || step === "paying"}
            loading={step === "paying"}
            className="flex-1"
          >
            {payLabel}
          </Button>
        </div>
        </div>
      </main>

      {/* Sticky pay footer */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-line)] bg-white px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3 lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="leading-tight">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
              You pay
            </p>
            <p className="font-display text-[18px] font-extrabold tracking-tight text-[var(--color-ink)]">
              {total !== null ? formatPrice(total) : "—"}
            </p>
          </div>
          <Button
            size="lg"
            fullWidth
            onClick={submit}
            disabled={!canSubmit || step === "paying"}
            loading={step === "paying"}
            className="flex-1"
          >
            {payLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-1.5 text-[13.5px] font-extrabold tracking-tight text-[var(--color-ink)]">
        {icon}
        {title}
      </h3>
      {subtitle && (
        <p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline,
  inputMode,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-[12px] font-semibold text-[var(--color-ink-muted)]">
        {icon}
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="mt-1 w-full resize-none rounded-xl bg-[var(--color-bg)] px-3.5 py-2.5 text-[14px] font-medium text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] placeholder:text-[var(--color-ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          className="mt-1 h-11 w-full rounded-xl bg-[var(--color-bg)] px-3.5 text-[14px] font-medium text-[var(--color-ink)] ring-1 ring-inset ring-[var(--color-line)] placeholder:text-[var(--color-ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
        />
      )}
    </label>
  );
}

function PaymentOption({
  active,
  icon,
  title,
  subtitle,
  onClick,
  disabled,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 transition-colors",
        active
          ? "ring-2 ring-[var(--color-primary)] bg-[var(--color-primary-soft)]"
          : "ring-[var(--color-line)] hover:bg-black/[0.02]",
        disabled && "cursor-not-allowed opacity-60 hover:bg-white"
      )}
      aria-pressed={active}
    >
      <span
        className={cn(
          "flex h-10 w-10 flex-none items-center justify-center rounded-xl",
          active
            ? "bg-[var(--color-primary)] text-white"
            : "bg-[var(--color-bg)] text-[var(--color-ink)]"
        )}
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-[14px] font-bold text-[var(--color-ink)]">
          {title}
        </span>
        <span className="block text-[12px] text-[var(--color-ink-muted)]">
          {subtitle}
        </span>
      </span>
      <span
        className={cn(
          "flex h-5 w-5 flex-none items-center justify-center rounded-full ring-1",
          active
            ? "bg-[var(--color-primary)] ring-[var(--color-primary)] text-white"
            : "ring-[var(--color-line)] bg-white"
        )}
      >
        {active && <CheckCircleIcon className="h-4 w-4" />}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Success view                                                               */
/* -------------------------------------------------------------------------- */

function SuccessView({
  orderId,
  receipt,
}: {
  orderId: string;
  receipt: OrderReceipt;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-16">
      <main className="mx-auto flex max-w-2xl flex-col items-center px-6 pt-20 text-center">
        <AnimatePresence>
          <motion.div
            key="check"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 360, damping: 18 }}
            className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-success-soft)]"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.15, 1] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="absolute inset-0 rounded-full ring-2 ring-[var(--color-success)]/30"
            />
            <CheckCircleIcon className="h-14 w-14 text-[var(--color-success)]" />
          </motion.div>
        </AnimatePresence>

        <motion.h1
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="font-display mt-6 text-[24px] font-extrabold tracking-tight"
        >
          On its way to you 🔥
        </motion.h1>
        <motion.p
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 max-w-sm text-[14px] text-[var(--color-ink-muted)]"
        >
          Your order has been placed. We&apos;ve notified the kitchen and you&apos;ll
          get an update when the rider is on the move.
        </motion.p>

        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 w-full max-w-md rounded-2xl bg-white p-4 text-left ring-1 ring-[var(--color-line)]"
        >
          <Row k="Order ID" v={orderId} />
          <Row k="Store" v={receipt.storeName} />
          <Row k="Deliver to" v={receipt.deliverySummary} />
          <Row k="Status" v="Confirmed" tone="success" />
          <Row k="Estimated delivery" v="25–40 mins" />
        </motion.div>

        {/* Ordered items */}
        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-4 w-full max-w-md rounded-2xl bg-white p-4 text-left ring-1 ring-[var(--color-line)]"
        >
          <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-[var(--color-ink-soft)]">
            Your order
          </h3>
          <ul className="mt-3 space-y-3">
            {receipt.items.map((it, idx) => (
              <li
                key={idx}
                className="flex items-start justify-between gap-3 text-[13.5px]"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-ink)]">
                    {it.qty} × {it.name}
                  </p>
                  {it.options.length > 0 && (
                    <p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">
                      {it.options.join(" · ")}
                    </p>
                  )}
                </div>
                <span className="whitespace-nowrap font-bold text-[var(--color-ink)]">
                  {formatPrice(it.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1 border-t border-dashed border-[var(--color-line)] pt-3">
            <Row k="Subtotal" v={formatPrice(receipt.subtotal)} />
            {receipt.discount > 0 && (
              <Row
                k="Discount"
                v={`− ${formatPrice(receipt.discount)}`}
                tone="success"
              />
            )}
            <Row k="Delivery fee" v={formatPrice(receipt.deliveryFee)} />
            <Row k="Service fee" v={formatPrice(receipt.serviceFee)} />
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-[var(--color-line)] pt-3">
            <span className="text-[14px] font-extrabold text-[var(--color-ink)]">
              Total paid
            </span>
            <span className="font-display text-[16px] font-extrabold text-[var(--color-primary)]">
              {formatPrice(receipt.total)}
            </span>
          </div>
        </motion.div>

        <div className="mt-8 flex w-full max-w-md flex-col gap-2">
          <Link href="/orders" className="block">
            <Button size="lg" fullWidth>
              Track my order
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button size="lg" fullWidth variant="ghost">
              Back to home
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

function Row({
  k,
  v,
  tone,
}: {
  k: string;
  v: string;
  tone?: "success";
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed border-[var(--color-line)] py-2 last:border-b-0">
      <span className="shrink-0 text-[12.5px] text-[var(--color-ink-muted)]">
        {k}
      </span>
      <span
        className={cn(
          "min-w-0 break-words text-right text-[13px] font-bold",
          tone === "success"
            ? "text-[var(--color-success)]"
            : "text-[var(--color-ink)]"
        )}
      >
        {v}
      </span>
    </div>
  );
}
