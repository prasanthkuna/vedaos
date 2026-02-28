import { APIError } from "encore.dev/api";

type BridgeInput = {
  handler: (req: Request) => Promise<Response>;
  method: "GET" | "POST" | "PATCH";
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
};

const buildUrl = (path: string, query?: Record<string, string | number | boolean | undefined>) => {
  const u = new URL(`http://encore.local${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) u.searchParams.set(k, String(v));
    }
  }
  return u.toString();
};

const statusToError = (status: number, message: string): APIError => {
  if (status === 400 || status === 422) return APIError.invalidArgument(message);
  if (status === 404) return APIError.notFound(message);
  if (status === 401) return APIError.unauthenticated(message);
  if (status === 403) return APIError.permissionDenied(message);
  if (status >= 500) return APIError.internal(message);
  return APIError.aborted(message);
};

export const bridge = async <T>({ handler, method, path, body, query }: BridgeInput): Promise<T> => {
  const req = new Request(buildUrl(path, query), {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const res = await handler(req);
  const payload = (await res.json()) as unknown;

  if (res.status >= 400) {
    const errBody = payload as { error?: string; details?: unknown };
    throw statusToError(res.status, errBody.error ?? "request_failed");
  }

  return payload as T;
};
