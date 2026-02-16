const rateWindow = new Map<string, { count: number; resetAt: number }>();

export function enforceSameOrigin(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  let refererOrigin: string | null = null;
  if (referer) {
    try {
      refererOrigin = new URL(referer).origin;
    } catch {
      refererOrigin = null;
    }
  }
  const candidate = origin || refererOrigin;
  if (candidate && candidate !== url.origin) {
    throw new Response("Invalid origin", { status: 403 });
  }
}

function getClientKey(request: Request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    return fwd.split(",")[0]!.trim();
  }
  return request.headers.get("fly-client-ip") || "unknown";
}

export function enforceRateLimit(
  request: Request,
  scope: string,
  maxRequests: number,
  windowMs: number,
) {
  const now = Date.now();
  const key = `${scope}:${getClientKey(request)}`;
  const current = rateWindow.get(key);

  if (!current || now > current.resetAt) {
    rateWindow.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= maxRequests) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    throw new Response("Too many requests", {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, retryAfter)) },
    });
  }

  current.count += 1;
  rateWindow.set(key, current);
}
