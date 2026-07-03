/**
 * Tiny fetch client for the GigOn write API. Framework-agnostic: web passes
 * baseUrl "" (same-origin, cookies ride along), mobile passes the absolute
 * app origin and always attaches the Supabase access token as a Bearer.
 */

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export type ApiClient = ReturnType<typeof createApiClient>;

export function createApiClient(opts: {
  /** "" on web (same-origin) · e.g. "https://app.gigon.io" on mobile. */
  baseUrl: string;
  /** Latest Supabase access token, or null (web can rely on cookies). */
  getToken: () => Promise<string | null>;
}) {
  async function send(path: string, body: unknown): Promise<Response> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = await opts.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(opts.baseUrl + path, {
      method: "POST",
      headers,
      body: JSON.stringify(body ?? {}),
    });
  }

  /**
   * POST `path`, return the `data` payload (or the raw JSON for endpoints
   * like pin/verify that answer without the `{ data }` envelope).
   * Throws ApiClientError with the server's message — UIs toast `.message`.
   */
  async function post<T = unknown>(path: string, body?: unknown): Promise<T> {
    let res = await send(path, body);
    if (res.status === 401) {
      // supabase-js refreshes tokens in the background; retry once fresh.
      res = await send(path, body);
    }
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      // non-JSON body (proxy HTML, gateway error) — fall through
    }
    if (!res.ok) {
      const err = (json as { error?: { code?: string; message?: string } } | null)?.error;
      throw new ApiClientError(
        err?.code ?? "internal",
        err?.message ?? `request failed (${res.status})`,
        res.status,
      );
    }
    if (json && typeof json === "object" && "data" in (json as Record<string, unknown>)) {
      return (json as { data: T }).data;
    }
    return json as T;
  }

  return { post };
}
