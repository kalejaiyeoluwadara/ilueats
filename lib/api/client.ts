import { getSession } from "next-auth/react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Message to show when a failure isn't an ApiError (network drop, parse error)
 * and so carries nothing worth quoting. ErrorState's title already names what
 * didn't load, so this says what to do about it rather than restating it.
 */
export const LOAD_FAILED_FALLBACK = "Check your connection and try again.";

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown | FormData;
  /** Bearer token to use instead of the browser session (e.g. from a server component). */
  token?: string;
  query?: Record<string, string | number | boolean | undefined>;
  /**
   * Set false for endpoints the API serves without a guard. `getSession()` is an
   * uncached network round-trip to /api/auth/session, so requiring it on a public
   * read doubles that read's latency for no benefit.
   */
  auth?: boolean;
  /** Seconds to cache the response for when called during a server render. */
  revalidate?: number;
  /** Aborts the request — e.g. to drop a stale response that a newer one supersedes. */
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: ApiFetchOptions["query"]) {
  const url = new URL(path.replace(/^\//, ""), `${API_BASE_URL}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Shared fetch wrapper for the IluEats Nest API — attaches the session's JWT and normalizes errors. */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const needsAuth = options.auth ?? true;

  const token =
    options.token ??
    (needsAuth && typeof window !== "undefined"
      ? (await getSession())?.accessToken
      : undefined);

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    signal: options.signal,
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: isFormData
      ? (options.body as FormData)
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
    ...(options.revalidate !== undefined && {
      next: { revalidate: options.revalidate },
    }),
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : undefined;

  if (!res.ok) {
    const rawMessage = data?.message;
    const message =
      (Array.isArray(rawMessage) ? rawMessage[0] : rawMessage) ??
      `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}
