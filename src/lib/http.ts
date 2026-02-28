import { ZodSchema } from "zod";
import { ApiError } from "./errors";

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

export const parseJson = async <T>(req: Request, schema: ZodSchema<T>): Promise<T> => {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    throw new ApiError(400, "invalid_json");
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(422, "validation_error", parsed.error.flatten());
  }

  return parsed.data;
};

export const parseQuery = <T>(url: URL, schema: ZodSchema<T>): T => {
  const source: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    source[key] = value;
  });

  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    throw new ApiError(422, "validation_error", parsed.error.flatten());
  }

  return parsed.data;
};

export const withErrorBoundary = async (fn: () => Promise<Response>): Promise<Response> => {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ApiError) {
      return json({ error: error.message, details: error.details ?? null }, error.status);
    }

    return json({ error: "internal_error" }, 500);
  }
};
