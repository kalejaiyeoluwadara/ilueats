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

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown | FormData;
  /** Bearer token to use instead of the browser session (e.g. from a server component). */
  token?: string;
  query?: Record<string, string | number | boolean | undefined>;
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
  const token =
    options.token ??
    (typeof window !== "undefined"
      ? (await getSession())?.accessToken
      : undefined);

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: isFormData
      ? (options.body as FormData)
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
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
