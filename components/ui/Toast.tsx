/**
 * The toast component & viewport are co-located inside the ToastContext
 * so the provider can render them as a portal-like global region.
 *
 * This file simply re-exports the public surface so consumers can do:
 *   import { useToast } from "@/components/ui/Toast";
 */
export { useToast } from "@/hooks/useToast";
export type { ToastMessage, ToastVariant } from "@/types";
