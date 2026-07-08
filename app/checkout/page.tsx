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
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useAddresses } from "@/hooks/useAddresses";
import { useToast } from "@/hooks/useToast";
import { useCatalog } from "@/context/CatalogContext";
import { useOrders } from "@/context/OrdersContext";
import { pickupLandmarks } from "@/data/mockData";
import { createOrder as createBackendOrder } from "@/lib/api/orders";
import { initializePayment, verifyPayment } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/client";
import { openPaystackPopup } from "@/lib/paystack";
import {
  cn,
  formatCartOption,
  formatCartOptionWithPrice,
  formatPrice,
} from "@/lib/utils";

type PayMethod = "card" | "transfer" | "cash";
type DeliveryMode = "door" | "landmark";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, count, storeSlug, storeName, clearCart } = useCart();
  const { user, ready: authReady } = useAuth();
  const { data: session } = useSession();
  const { addresses, defaultAddress, ready: addrReady } = useAddresses();
  const { success, error: toastError } = useToast();
  const { stores } = useCatalog();
  const { placeOrder } = useOrders();

  const store = useMemo(
    () => (storeSlug ? stores.find((s) => s.slug === storeSlug) : undefined),
    [storeSlug, stores]
  );
  const deliveryFee = store?.deliveryFee ?? 0;
  // Platform & handling — 5% of the basket, ₦100 floor / ₦500 cap (demo pricing).
  const serviceFee =
    subtotal > 0
      ? Math.min(500, Math.max(100, Math.round((subtotal * 0.05) / 50) * 50))
      : 0;
  const total = subtotal + deliveryFee + serviceFee;

  const [step, setStep] = useState<"form" | "paying" | "done">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("door");
  const [landmarkId, setLandmarkId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<PayMethod>("card");
  const [orderId, setOrderId] = useState<string>("");

  // Redirect to cart if there's nothing to checkout
  useEffect(() => {
    if (count === 0 && step === "form") {
      router.replace("/cart");
    }
  }, [count, step, router]);

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
    const contactOk =
      name.trim().length > 1 && phone.trim().length >= 7;
    if (!contactOk) return false;
    if (deliveryMode === "door") {
      return address.trim().length > 4;
    }
    return landmarkId !== null;
  }, [name, phone, address, deliveryMode, landmarkId]);

  const paymentLabels: Record<PayMethod, string> = {
    card: "Card (demo)",
    transfer: "Bank transfer (verified)",
    cash: "Pay on delivery",
  };

  const recordLocalOrder = (finalPaymentLabel: string) => {
    const landmark = pickupLandmarks.find((l) => l.id === landmarkId);
    return placeOrder({
      customer: name.trim(),
      customerPhone: phone.trim(),
      deliveryMode,
      deliveryAddress:
        deliveryMode === "door"
          ? address.trim()
          : `Landmark — ${landmark?.label ?? "meet-up point"}`,
      deliveryNote: notes.trim() || undefined,
      storeId: store?.id,
      store: storeName ?? store?.name ?? "Store",
      storeAddress: store?.location ?? "Ilisan-Remo",
      paymentLabel: finalPaymentLabel,
      deliveryFee,
      serviceFee,
      total,
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

  // Signed-in users hit the real Nest backend: create the order there, then
  // charge it through Paystack. Guests keep the local mock flow below.
  const submitViaBackend = async () => {
    if (!store || !session?.accessToken) return;
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
        contactName: name.trim(),
        contactPhone: phone.trim(),
        notes: notes.trim() || undefined,
        paymentMethod: method,
      });

      if (backendOrder.paymentRequired) {
        const payment = await initializePayment(backendOrder.orderId);
        openPaystackPopup({
          key: payment.publicKey,
          email: session.user.email ?? "",
          amount: Math.round(total * 100),
          ref: payment.reference,
          accessCode: payment.accessCode,
          onSuccess: async (reference) => {
            try {
              await verifyPayment(reference);
              recordLocalOrder(paymentLabels[method]);
              setOrderId(backendOrder.orderId);
              setStep("done");
              clearCart();
              success("Payment received!", `Order ${backendOrder.orderId} is on its way.`);
            } catch (err) {
              toastError(
                "Payment could not be verified",
                err instanceof ApiError ? err.message : "Please contact support with your reference.",
              );
              setStep("form");
            }
          },
          onClose: () => {
            setStep("form");
          },
        });
      } else {
        recordLocalOrder(paymentLabels[method]);
        setOrderId(backendOrder.orderId);
        setStep("done");
        clearCart();
        success("Order placed!", `Order ${backendOrder.orderId} is on its way.`);
      }
    } catch (err) {
      toastError(
        "Could not place order",
        err instanceof ApiError ? err.message : "Something went wrong. Try again.",
      );
      setStep("form");
    }
  };

  const submitLocalDemo = async () => {
    setStep("paying");
    // Simulate payment, then record the order where admin & rider can see it
    await new Promise((r) => setTimeout(r, 2200));
    const order = recordLocalOrder(paymentLabels[method]);
    setOrderId(order.id);
    setStep("done");
    clearCart();
    success("Order placed!", `Order ${order.id} is on its way.`);
  };

  const submit = async () => {
    if (!canSubmit) return;
    if (session?.accessToken) {
      await submitViaBackend();
    } else {
      await submitLocalDemo();
    }
  };

  if (step === "done") {
    return <SuccessView orderId={orderId} total={total} />;
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
                  {pickupLandmarks.map((lm) => {
                    const selected = landmarkId === lm.id;
                    return (
                      <button
                        key={lm.id}
                        type="button"
                        onClick={() => setLandmarkId(lm.id)}
                        className={cn(
                          "rounded-full px-3 py-2 text-left text-[12px] font-semibold leading-snug ring-1 transition-colors",
                          selected
                            ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-[var(--color-primary)]/35"
                            : "bg-[var(--color-bg)] text-[var(--color-ink)] ring-[var(--color-line)] hover:bg-black/[0.03]"
                        )}
                      >
                        {lm.label}
                      </button>
                    );
                  })}
                </div>
                {landmarkId && (
                  <p className="mt-2 text-[12px] text-[var(--color-ink-muted)]">
                    {
                      pickupLandmarks.find((l) => l.id === landmarkId)
                        ?.detail
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
            subtitle="Simulated for demo — no real charge."
          />
          <div className="mt-3 grid gap-2">
            <PaymentOption
              active={method === "transfer"}
              icon={<DevicePhoneMobileIcon className="h-5 w-5" />}
              title="Bank transfer"
              subtitle="Get a one-time account number"
              onClick={() => setMethod("transfer")}
            />
            <PaymentOption
              active={method === "cash"}
              icon={<BanknotesIcon className="h-5 w-5" />}
              title="Cash on delivery"
              subtitle="Pay the rider when your order arrives"
              onClick={() => setMethod("cash")}
            />
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
        />

        {/* Desktop inline pay */}
        <div className="hidden lg:flex lg:items-center lg:gap-3 lg:rounded-2xl lg:bg-white lg:p-4 lg:ring-1 lg:ring-[var(--color-line)]">
          <div className="leading-tight">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
              You pay
            </p>
            <p className="font-display text-[18px] font-extrabold tracking-tight text-[var(--color-ink)]">
              {formatPrice(total)}
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
            {step === "paying"
              ? "Placing order…"
              : method === "cash"
              ? "Place order"
              : "Pay & place order"}
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
              {formatPrice(total)}
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
            {step === "paying"
              ? "Placing order…"
              : method === "cash"
              ? "Place order"
              : "Pay & place order"}
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
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 transition-colors",
        active
          ? "ring-2 ring-[var(--color-primary)] bg-[var(--color-primary-soft)]"
          : "ring-[var(--color-line)] hover:bg-black/[0.02]"
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

function SuccessView({ orderId, total }: { orderId: string; total: number }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
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
          className="mt-6 w-full max-w-sm rounded-2xl bg-white p-4 text-left ring-1 ring-[var(--color-line)]"
        >
          <Row k="Order ID" v={orderId} />
          <Row k="Total paid" v={formatPrice(total)} />
          <Row k="Status" v="Confirmed" tone="success" />
          <Row k="Estimated delivery" v="25–40 mins" />
        </motion.div>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-2">
          <Link href="/" className="block">
            <Button size="lg" fullWidth>
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
    <div className="flex items-center justify-between border-b border-dashed border-[var(--color-line)] py-2 last:border-b-0">
      <span className="text-[12.5px] text-[var(--color-ink-muted)]">{k}</span>
      <span
        className={cn(
          "text-[13px] font-bold",
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
