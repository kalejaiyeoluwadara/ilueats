"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyIcon, PlusIcon, TruckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ErrorState, EmptyState } from "@/components/ui/EmptyState";
import {
  getAdminRiders,
  createRider,
  setRiderPassword,
} from "@/lib/api/orders";
import type { AdminRider, CreateRiderInput } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

const EMPTY_FORM: CreateRiderInput = {
  name: "",
  email: "",
  password: "",
  phone: "",
  vehicleType: "",
  plateNumber: "",
};

export default function AdminRidersPage() {
  const { success, error: toastError } = useToast();

  const [riders, setRiders] = useState<AdminRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateRiderInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [passwordRider, setPasswordRider] = useState<AdminRider | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRiders(await getAdminRiders());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load riders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  const setField = (key: keyof CreateRiderInput) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createRider({
        ...form,
        vehicleType: form.vehicleType || undefined,
        plateNumber: form.plateNumber || undefined,
      });
      setRiders((prev) => [created, ...prev]);
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      success(
        "Rider account created",
        `${created.name} can now sign in at /rider/login with the password you set.`
      );
    } catch (err) {
      toastError(
        "Couldn't create rider",
        err instanceof ApiError ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  };

  const onResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordRider) return;
    setResettingPassword(true);
    try {
      await setRiderPassword(passwordRider.riderId, newPassword);
      success(
        "Password updated",
        `${passwordRider.name} can sign in with the new password now.`
      );
      setPasswordRider(null);
      setNewPassword("");
    } catch (err) {
      toastError(
        "Couldn't update password",
        err instanceof ApiError ? err.message : "Something went wrong."
      );
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)] sm:text-[26px]">
            Riders
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
            Create rider accounts and see who&apos;s online for deliveries.
          </p>
        </div>
        <Button
          size="md"
          onClick={() => setCreateOpen(true)}
          rightIcon={<PlusIcon className="h-4 w-4" />}
        >
          New rider
        </Button>
      </div>

      <div className="rounded-[1.25rem] bg-[var(--color-surface)] shadow-crisp ring-1 ring-[var(--color-line)]">
        {error ? (
          <div className="p-4">
            <ErrorState
              variant="inline"
              title="Riders didn't load"
              message={error}
              onRetry={fetchRiders}
            />
          </div>
        ) : !loading && riders.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<TruckIcon className="h-6 w-6" />}
              title="No riders yet"
              description="Create your first rider account — they'll sign in at /rider/login with the email and password you set."
              action={
                <Button size="md" onClick={() => setCreateOpen(true)}>
                  Create rider
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                  <th className="px-4 py-3 font-bold">Rider</th>
                  <th className="px-4 py-3 font-bold">Contact</th>
                  <th className="px-4 py-3 font-bold">Vehicle</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="w-14 px-2 py-3 text-center font-bold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {loading ? (
                  <tr>
                    <td
                      className="px-4 py-10 text-center text-[13px] font-medium text-[var(--color-ink-muted)]"
                      colSpan={5}
                    >
                      Loading riders…
                    </td>
                  </tr>
                ) : (
                  riders.map((r) => (
                    <tr
                      key={r.riderId}
                      className="bg-white transition hover:bg-[var(--color-bg)]/50"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f96e22] to-[#c43e04] font-display text-[13px] font-extrabold text-white">
                            {r.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="font-semibold text-[var(--color-ink)]">
                            {r.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[var(--color-ink-muted)]">
                        <p>{r.email}</p>
                        {r.phone ? (
                          <p className="font-mono text-[12px] text-[var(--color-ink-soft)]">
                            {r.phone}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 text-[var(--color-ink-muted)]">
                        {r.vehicleType || "—"}
                        {r.plateNumber ? (
                          <span className="ml-1.5 font-mono text-[12px] text-[var(--color-ink-soft)]">
                            {r.plateNumber}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset",
                            r.isOnline
                              ? "bg-[var(--color-success-soft)] text-[var(--color-success)] ring-emerald-200/80"
                              : "bg-[var(--color-bg)] text-[var(--color-ink-soft)] ring-[var(--color-line)]"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              r.isOnline
                                ? "bg-[var(--color-success)]"
                                : "bg-[var(--color-ink-soft)]"
                            )}
                          />
                          {r.isOnline ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td className="px-2 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordRider(r);
                            setNewPassword("");
                          }}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-ink-muted)] outline-none ring-[var(--color-ink)]/0 transition hover:bg-black/[0.05] hover:text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35"
                          aria-label={`Reset password for ${r.name}`}
                          title="Reset password"
                        >
                          <KeyIcon className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => !saving && setCreateOpen(false)}
        variant="sheet"
        className="sm:max-w-lg"
        title="New rider account"
        description="The rider signs in at /rider/login with this email and password."
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              size="md"
              onClick={() => setCreateOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-rider-form"
              variant="primary"
              fullWidth
              size="md"
              loading={saving}
            >
              Create rider
            </Button>
          </div>
        }
      >
        <form id="create-rider-form" className="space-y-4" onSubmit={onCreate}>
          <Field
            label="Full name"
            required
            value={form.name}
            onChange={setField("name")}
            placeholder="Adé Bakare"
          />
          <Field
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={setField("email")}
            placeholder="ade@ilueats.com"
          />
          <Field
            label="Phone"
            type="tel"
            required
            value={form.phone}
            onChange={setField("phone")}
            placeholder="0803 123 4567"
          />
          <Field
            label="Temporary password"
            required
            minLength={8}
            value={form.password}
            onChange={setField("password")}
            placeholder="At least 8 characters"
            hint="Share it with the rider privately — they use it to sign in."
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Vehicle (optional)"
              value={form.vehicleType ?? ""}
              onChange={setField("vehicleType")}
              placeholder="Bike"
            />
            <Field
              label="Plate no. (optional)"
              value={form.plateNumber ?? ""}
              onChange={setField("plateNumber")}
              placeholder="ABJ-123-XY"
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={!!passwordRider}
        onClose={() => !resettingPassword && setPasswordRider(null)}
        variant="sheet"
        className="sm:max-w-sm"
        title={passwordRider ? `Reset password · ${passwordRider.name}` : undefined}
        description="They'll need this new password next time they sign in at /rider/login."
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              size="md"
              onClick={() => setPasswordRider(null)}
              disabled={resettingPassword}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="reset-rider-password-form"
              variant="primary"
              fullWidth
              size="md"
              loading={resettingPassword}
            >
              Update password
            </Button>
          </div>
        }
      >
        <form
          id="reset-rider-password-form"
          className="space-y-4"
          onSubmit={onResetPassword}
        >
          <Field
            label="New password"
            type="text"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            hint="Share it with the rider privately."
          />
        </form>
      </Modal>
    </div>
  );
}

function Field({
  label,
  hint,
  ...inputProps
}: {
  label: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[12px] font-bold text-[var(--color-ink)]">
        {label}
      </span>
      <input
        {...inputProps}
        className="mt-1.5 h-11 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3.5 text-[13.5px] font-semibold text-[var(--color-ink)] outline-none transition placeholder:font-medium placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-primary)]/40 focus:ring-2 focus:ring-[var(--color-primary)]/20"
      />
      {hint ? (
        <span className="mt-1 block text-[11.5px] text-[var(--color-ink-soft)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
