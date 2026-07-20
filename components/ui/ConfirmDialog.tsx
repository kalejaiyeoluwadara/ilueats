"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

/**
 * Reusable confirmation dialog — the in-app replacement for `window.confirm`,
 * which we never use (it's unstyled, blocks the thread, and looks nothing like
 * the product). Pair it with a piece of state holding what's being confirmed:
 *
 *   const [toRemove, setToRemove] = useState<Address | null>(null);
 *   <ConfirmDialog open={!!toRemove} ... onConfirm={() => remove(toRemove)} />
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm button as a destructive (red) action. */
  destructive?: boolean;
  /** Show a spinner + block the confirm button while an async action runs. */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      variant="dialog"
      title={title}
      showClose={false}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "danger" : "primary"}
            size="md"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {message && (
        <p className="text-[14px] leading-relaxed text-[var(--color-ink-muted)]">
          {message}
        </p>
      )}
    </Modal>
  );
}
