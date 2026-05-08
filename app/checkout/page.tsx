"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  MapPinIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useAddresses } from "@/hooks/useAddresses";
import { useToast } from "@/hooks/useToast";
import { getStoreBySlug } from "@/data/mockData";
import { cn, formatPrice, shortId } from "@/lib/utils";

type PayMethod = "card" | "transfer" | "cash";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, count, storeSlug, clearCart } = useCart();
  const { user, ready: authReady } = useAuth();
  const { addresses, defaultAddress, ready: addrReady } = useAddresses();
  const { success } = useToast();

  const store = storeSlug ? getStoreBySlug(storeSlug) : undefined;
  const deliveryFee = store?.deliveryFee ?? 0;
  const total = subtotal + deliveryFee;

  const [step, setStep] = useState<"form" | "paying" | "done">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
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
    setAddress((a) => (a.trim() === "" ? defaultAddress.addressLine : a));
    setPhone((p) =>
      p.trim() === "" && defaultAddress.phone ? defaultAddress.phone : p
    );
  }, [addrReady, defaultAddress]);

  const canSubmit = useMemo(() => {
    return name.trim().length > 1 && phone.trim().length >= 7 && address.trim().length > 4;
  }, [name, phone, address]);

  const submit = async () => {
    if (!canSubmit) return;
    setStep("paying");
    // Simulate payment / order placement
    await new Promise((r) => setTimeout(r, 2200));
    const id = `ILU-${shortId().toUpperCase()}`;
    setOrderId(id);
    setStep("done");
    clearCart();
    success("Order placed!", `Order ${id} is on its way.`);
  };

  if (step === "done") {
    return <SuccessView orderId={orderId} total={total} />;
  }

  return (
    <div className="min-h-screen pb-36">
      <Navbar variant="page" title="Checkout" showSearch={false} />

      <main className="mx-auto max-w-2xl space-y-5 px-4 pt-4">
        {/* Delivery details */}
        <section className="rounded-2xl bg-white p-4 ring-1 ring-[var(--color-line)]">
          <SectionHeader
            icon={<MapPinIcon className="h-4 w-4" />}
            title="Delivery details"
          />
          <div className="mt-3 space-y-3">
            {addrReady && addresses.length > 0 && (
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
            <Field
              label="Delivery address"
              value={address}
              onChange={setAddress}
              placeholder="House no, street, landmark, Ilisan"
              multiline
            />
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
              active={method === "card"}
              icon={<CreditCardIcon className="h-5 w-5" />}
              title="Card"
              subtitle="Pay with debit / credit card"
              onClick={() => setMethod("card")}
            />
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
                    <p className="line-clamp-1 text-[12px] text-[var(--color-ink-muted)]">
                      {it.selectedOptions.map((o) => o.name).join(" · ")}
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

        <CartSummary subtotal={subtotal} deliveryFee={deliveryFee} />
      </main>

      {/* Sticky pay footer */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-line)] bg-white px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="leading-tight">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
              You pay
            </p>
            <p className="text-[18px] font-extrabold tracking-tight text-[var(--color-ink)]">
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
          className="mt-6 text-[24px] font-extrabold tracking-tight"
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
