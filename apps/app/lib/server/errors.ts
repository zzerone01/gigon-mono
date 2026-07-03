import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Success envelope — every endpoint except pin/verify. */
export function ok(data: unknown): Response {
  return Response.json({ data });
}

/** Escape hatch for pin/verify's legacy `{ok:...}` contract (always 200). */
export function raw(json: unknown): Response {
  return Response.json(json);
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

type RouteContext = { params: Promise<Record<string, string>> };
type Handler = (req: Request, ctx: RouteContext) => Promise<Response>;

/** Wrap a route handler with the error contract: `{ error: { code, message } }`. */
export function withErrors(handler: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) {
        return Response.json(
          { error: { code: e.code, message: e.message } },
          { status: e.status },
        );
      }
      if (e instanceof ZodError) {
        const first = e.issues[0];
        const message = first
          ? `${first.path.join(".") || "body"}: ${first.message}`
          : "invalid input";
        return Response.json(
          { error: { code: "invalid_input", message } },
          { status: 400 },
        );
      }
      console.error("[api] unhandled error", e);
      return Response.json(
        { error: { code: "internal", message: "internal error" } },
        { status: 500 },
      );
    }
  };
}
