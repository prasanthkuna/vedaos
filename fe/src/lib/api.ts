import { env } from "../config/env";
import { getFreshToken } from "../auth/token-provider";

type HttpMethod = "GET" | "POST" | "PATCH";

const buildUrl = (path: string, query?: Record<string, string | number | undefined>) => {
  const url = new URL(path, env.apiBaseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
};

export const apiRequest = async <TResponse>(args: {
  path: string;
  method: HttpMethod;
  token?: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
}): Promise<TResponse> => {
  const freshToken = await getFreshToken();
  const authToken = freshToken ?? args.token;
  const response = await fetch(buildUrl(args.path, args.query), {
    method: args.method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    ...(args.body ? { body: JSON.stringify(args.body) } : {}),
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(`invalid_response: non_json_body (${args.path})`);
    }
  }

  if (!response.ok) {
    const errorPayload = payload as { code?: string | number; message?: string; error?: string } | null;
    const code = errorPayload?.code ?? response.status;
    const message = errorPayload?.message ?? errorPayload?.error ?? "request_failed";
    throw new Error(`${code}: ${message}`);
  }

  if (payload === null) {
    throw new Error(`invalid_response: empty_body (${args.path})`);
  }

  return payload as TResponse;
};
