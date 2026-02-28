type Json = Record<string, unknown>;

const json = (body: Json, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export async function router(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/health") {
    return json({ ok: true, service: "veda-be", status: "healthy" });
  }

  if (url.pathname === "/ready") {
    return json({ ok: true, service: "veda-be", status: "ready" });
  }

  if (url.pathname === "/api/version") {
    return json({ name: "veda-be", version: "0.1.0" });
  }

  return json({ error: "not_found" }, 404);
}
