/**
 * A redeploy replaces every content-hashed chunk, so a tab holding the previous
 * build asks for filenames that no longer exist. The only cure is to reload onto
 * the current build — but a reload that lands on a genuinely broken build would
 * loop forever, so each recovery is spent from a small session-scoped budget.
 */
const RELOAD_BUDGET_KEY = "ilueats:chunk-reloads";
const MAX_RELOADS = 2;

const CHUNK_ERROR_PATTERN =
  /Loading chunk .* failed|Loading CSS chunk .* failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;

export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;

  if (typeof error === "object") {
    const { name, message } = error as { name?: string; message?: string };
    if (name === "ChunkLoadError") return true;
    if (typeof message === "string" && CHUNK_ERROR_PATTERN.test(message)) {
      return true;
    }
  }

  return typeof error === "string" && CHUNK_ERROR_PATTERN.test(error);
}

/**
 * Reloads onto the current build if the budget allows. Returns whether a reload
 * was started, so callers can fall back to showing a real error instead.
 */
export function recoverFromChunkError(): boolean {
  if (typeof window === "undefined") return false;

  let spent = 0;
  try {
    spent = Number(sessionStorage.getItem(RELOAD_BUDGET_KEY)) || 0;
    if (spent >= MAX_RELOADS) return false;
    sessionStorage.setItem(RELOAD_BUDGET_KEY, String(spent + 1));
  } catch {
    // Private mode or blocked storage: one unbudgeted attempt beats a dead page.
  }

  window.location.reload();
  return true;
}

/** Called once we render successfully, so a later deploy gets a full budget. */
export function clearChunkErrorBudget(): void {
  try {
    sessionStorage.removeItem(RELOAD_BUDGET_KEY);
  } catch {
    // No budget to clear if storage is unavailable.
  }
}
