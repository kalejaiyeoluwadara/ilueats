"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MagnifyingGlassIcon,
  NoSymbolIcon,
  TrashIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ErrorState, EmptyState } from "@/components/ui/EmptyState";
import {
  getAdminUsers,
  getAdminUserTransactions,
  setAdminUserBlocked,
  deleteAdminUser,
} from "@/lib/api/admin";
import type { AdminUser, UserRole, UserStatus } from "@/lib/api/admin";
import type { WalletTransaction } from "@/lib/api/wallet";
import { ApiError } from "@/lib/api/client";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { cn, formatPrice } from "@/lib/utils";

const ROLE_FILTERS: { label: string; value: UserRole | "all" }[] = [
  { label: "All roles", value: "all" },
  { label: "Customers", value: "customer" },
  { label: "Riders", value: "rider" },
  { label: "Admins", value: "admin" },
];

const STATUS_FILTERS: { label: string; value: UserStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Blocked", value: "blocked" },
];

const PAGE_SIZE = 20;

const ROLE_LABEL: Record<UserRole, string> = {
  customer: "Customer",
  rider: "Rider",
  admin: "Admin",
};

const dateFmt = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [role, setRole] = useState<UserRole | "all">("all");
  const [status, setStatus] = useState<UserStatus | "all">("all");
  const [page, setPage] = useState(1);

  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminUsers({
        q: q.trim() || undefined,
        role: role === "all" ? undefined : role,
        status: status === "all" ? undefined : status,
        page,
        pageSize: PAGE_SIZE,
      });
      setUsers(res.items);
      setTotalItems(res.totalItems);
      setPageCount(res.pageCount);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [q, role, status, page]);

  // Debounce the search box; filters/page changes apply immediately.
  useEffect(() => {
    const t = setTimeout(fetchUsers, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchUsers, q]);

  // Reset to page 1 whenever the query or filters change.
  useEffect(() => {
    setPage(1);
  }, [q, role, status]);

  const onToggleBlock = async (u: AdminUser) => {
    setBusyId(u.id);
    try {
      const updated = await setAdminUserBlocked(u.id, !u.isBlocked);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
      setDetailUser((prev) => (prev?.id === u.id ? updated : prev));
      success(
        updated.isBlocked ? "User blocked" : "User unblocked",
        updated.isBlocked
          ? `${u.name} can no longer sign in.`
          : `${u.name} can sign in again.`
      );
    } catch (err) {
      toastError(
        "Couldn't update user",
        err instanceof ApiError ? err.message : "Something went wrong."
      );
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await deleteAdminUser(deleteUser.id);
      setUsers((prev) => prev.filter((x) => x.id !== deleteUser.id));
      setTotalItems((n) => Math.max(0, n - 1));
      setDetailUser((prev) => (prev?.id === deleteUser.id ? null : prev));
      success("User deleted", `${deleteUser.name} was permanently removed.`);
      setDeleteUser(null);
    } catch (err) {
      toastError(
        "Couldn't delete user",
        err instanceof ApiError ? err.message : "Something went wrong."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-ink)] sm:text-[26px]">
          Users
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
          Search accounts, review wallet activity, and block or remove users.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-ink-soft)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email or phone"
            className="h-11 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] pl-10 pr-3.5 text-[13.5px] font-semibold text-[var(--color-ink)] outline-none transition placeholder:font-medium placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-primary)]/40 focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={role}
            onChange={(v) => setRole(v as UserRole | "all")}
            options={ROLE_FILTERS}
          />
          <Select
            value={status}
            onChange={(v) => setStatus(v as UserStatus | "all")}
            options={STATUS_FILTERS}
          />
        </div>
      </div>

      <div className="rounded-[1.25rem] bg-[var(--color-surface)] shadow-crisp ring-1 ring-[var(--color-line)]">
        {error ? (
          <div className="p-4">
            <ErrorState message={error} onRetry={fetchUsers} />
          </div>
        ) : !loading && users.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<UsersIcon className="h-6 w-6" />}
              title="No users found"
              description={
                q || role !== "all" || status !== "all"
                  ? "Try a different search or clear the filters."
                  : "Users will show up here as people sign up."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                  <th className="px-4 py-3 font-bold">User</th>
                  <th className="px-4 py-3 font-bold">Contact</th>
                  <th className="px-4 py-3 font-bold">Role</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Joined</th>
                  <th className="w-24 px-2 py-3 text-center font-bold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {loading ? (
                  <tr>
                    <td
                      className="px-4 py-10 text-center text-[13px] font-medium text-[var(--color-ink-muted)]"
                      colSpan={6}
                    >
                      Loading users…
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === me?.id;
                    return (
                      <tr
                        key={u.id}
                        className="cursor-pointer bg-white transition hover:bg-[var(--color-bg)]/50"
                        onClick={() => setDetailUser(u)}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f96e22] to-[#c43e04] font-display text-[13px] font-extrabold text-white">
                              {u.name.charAt(0).toUpperCase() || "?"}
                            </span>
                            <span className="font-semibold text-[var(--color-ink)]">
                              {u.name || "Unnamed"}
                              {isSelf ? (
                                <span className="ml-1.5 text-[11px] font-bold text-[var(--color-ink-soft)]">
                                  (you)
                                </span>
                              ) : null}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-[var(--color-ink-muted)]">
                          <p>{u.email}</p>
                          {u.phone ? (
                            <p className="font-mono text-[12px] text-[var(--color-ink-soft)]">
                              {u.phone}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3.5">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge blocked={u.isBlocked} />
                        </td>
                        <td className="px-4 py-3.5 text-[var(--color-ink-muted)]">
                          {dateFmt.format(new Date(u.createdAt))}
                        </td>
                        <td
                          className="px-2 py-3.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              disabled={isSelf || busyId === u.id}
                              onClick={() => onToggleBlock(u)}
                              className={cn(
                                "inline-flex h-9 w-9 items-center justify-center rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35",
                                "text-[var(--color-ink-muted)] hover:bg-black/[0.05] hover:text-[var(--color-ink)]",
                                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                              )}
                              aria-label={
                                u.isBlocked
                                  ? `Unblock ${u.name}`
                                  : `Block ${u.name}`
                              }
                              title={
                                isSelf
                                  ? "You can't block your own account"
                                  : u.isBlocked
                                    ? "Unblock user"
                                    : "Block user"
                              }
                            >
                              <NoSymbolIcon className="h-4.5 w-4.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => setDeleteUser(u)}
                              className={cn(
                                "inline-flex h-9 w-9 items-center justify-center rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-red-500/35",
                                "text-[var(--color-ink-muted)] hover:bg-red-500/10 hover:text-red-600",
                                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                              )}
                              aria-label={`Delete ${u.name}`}
                              title={
                                isSelf
                                  ? "You can't delete your own account"
                                  : "Delete user"
                              }
                            >
                              <TrashIcon className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!error && (loading || users.length > 0) ? (
        <div className="flex items-center justify-between text-[12.5px] text-[var(--color-ink-muted)]">
          <span>
            {totalItems} {totalItems === 1 ? "user" : "users"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="tabular-nums">
              Page {page} of {pageCount}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pageCount || loading}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <UserDetailModal
        user={detailUser}
        isSelf={detailUser?.id === me?.id}
        busy={busyId === detailUser?.id}
        onClose={() => setDetailUser(null)}
        onToggleBlock={onToggleBlock}
        onDelete={(u) => setDeleteUser(u)}
      />

      <Modal
        open={!!deleteUser}
        onClose={() => !deleting && setDeleteUser(null)}
        variant="dialog"
        className="sm:max-w-sm"
        title={deleteUser ? `Delete ${deleteUser.name}?` : undefined}
        description="This permanently removes the account and can't be undone."
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              size="md"
              onClick={() => setDeleteUser(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              fullWidth
              size="md"
              loading={deleting}
              onClick={onDelete}
            >
              Delete user
            </Button>
          </div>
        }
      >
        <p className="text-[13.5px] text-[var(--color-ink-muted)]">
          {deleteUser?.email}
        </p>
      </Modal>
    </div>
  );
}

function UserDetailModal({
  user,
  isSelf,
  busy,
  onClose,
  onToggleBlock,
  onDelete,
}: {
  user: AdminUser | null;
  isSelf: boolean;
  busy: boolean;
  onClose: () => void;
  onToggleBlock: (u: AdminUser) => void;
  onDelete: (u: AdminUser) => void;
}) {
  const [txns, setTxns] = useState<WalletTransaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [txnError, setTxnError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoadingTxns(true);
    setTxnError(null);
    setTxns([]);
    getAdminUserTransactions(user.id, { pageSize: 10 })
      .then((res) => {
        if (active) setTxns(res.items);
      })
      .catch((err) => {
        if (active)
          setTxnError(
            err instanceof ApiError ? err.message : "Failed to load activity."
          );
      })
      .finally(() => {
        if (active) setLoadingTxns(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      variant="sheet"
      className="sm:max-w-lg"
      title={user?.name || "User"}
      description={user?.email}
    >
      {user ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <RoleBadge role={user.role} />
            <StatusBadge blocked={user.isBlocked} />
          </div>

          <dl className="grid grid-cols-2 gap-3 text-[13px]">
            <Detail label="Phone" value={user.phone || "—"} mono={!!user.phone} />
            <Detail label="Addresses" value={String(user.addressCount)} />
            <Detail
              label="Joined"
              value={dateFmt.format(new Date(user.createdAt))}
            />
            <Detail
              label="Blocked"
              value={
                user.blockedAt
                  ? dateFmt.format(new Date(user.blockedAt))
                  : "—"
              }
            />
          </dl>

          <div>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Recent wallet activity
            </h3>
            {txnError ? (
              <p className="text-[13px] text-red-600">
                {txnError}
              </p>
            ) : loadingTxns ? (
              <p className="text-[13px] text-[var(--color-ink-muted)]">
                Loading activity…
              </p>
            ) : txns.length === 0 ? (
              <p className="text-[13px] text-[var(--color-ink-muted)]">
                No wallet transactions yet.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
                {txns.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px]"
                  >
                    <div>
                      <p className="font-semibold capitalize text-[var(--color-ink)]">
                        {t.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-[11.5px] text-[var(--color-ink-soft)]">
                        {dateFmt.format(new Date(t.createdAt))} · {t.status}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "font-bold tabular-nums",
                        t.amount < 0
                          ? "text-[var(--color-ink)]"
                          : "text-[var(--color-success)]"
                      )}
                    >
                      {t.amount < 0 ? "" : "+"}
                      {formatPrice(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              fullWidth
              size="md"
              disabled={isSelf || busy}
              loading={busy}
              onClick={() => onToggleBlock(user)}
            >
              {user.isBlocked ? "Unblock user" : "Block user"}
            </Button>
            <Button
              type="button"
              variant="danger"
              fullWidth
              size="md"
              disabled={isSelf}
              onClick={() => onDelete(user)}
            >
              Delete
            </Button>
          </div>
          {isSelf ? (
            <p className="text-center text-[11.5px] text-[var(--color-ink-soft)]">
              You can&apos;t block or delete your own account.
            </p>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 font-semibold text-[var(--color-ink)]",
          mono && "font-mono text-[12.5px]"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset",
        role === "admin"
          ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-[var(--color-primary)]/20"
          : role === "rider"
            ? "bg-sky-500/10 text-sky-700 ring-sky-200/80"
            : "bg-[var(--color-bg)] text-[var(--color-ink-soft)] ring-[var(--color-line)]"
      )}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}

function StatusBadge({ blocked }: { blocked: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset",
        blocked
          ? "bg-red-500/10 text-red-600 ring-red-200/80"
          : "bg-[var(--color-success-soft)] text-[var(--color-success)] ring-emerald-200/80"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          blocked ? "bg-red-600" : "bg-[var(--color-success)]"
        )}
      />
      {blocked ? "Blocked" : "Active"}
    </span>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-[13px] font-semibold text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]/40 focus:ring-2 focus:ring-[var(--color-primary)]/20"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
