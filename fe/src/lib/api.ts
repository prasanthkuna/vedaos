import { env } from "../config/env";

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
  const response = await fetch(buildUrl(args.path, args.query), {
    method: args.method,
    headers: {
      "Content-Type": "application/json",
      ...(args.token ? { Authorization: `Bearer ${args.token}` } : {}),
    },
    ...(args.body ? { body: JSON.stringify(args.body) } : {}),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const code = payload?.code ?? response.status;
    const message = payload?.message ?? payload?.error ?? "request_failed";
    throw new Error(`${code}: ${message}`);
  }

  return payload as TResponse;
};
