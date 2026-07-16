/**
 * The admin console. It runs as its own app on a separate subdomain, so links
 * into it must be absolute URLs rather than internal routes.
 */
export const ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3040";
