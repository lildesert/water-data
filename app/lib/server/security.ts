const rateWindow = new Map<string, { count: number; resetAt: number }>();

function getOrigin(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function firstHeaderValue(value: string | null) {
  if (!value) return null;
  return value.split(",")[0]?.trim() ?? null;
}

export function enforceSameOrigin(request: Request) {
  const url = new URL(request.url);
  const origin = firstHeaderValue(request.headers.get("origin"));
  const referer = firstHeaderValue(request.headers.get("referer"));
  const candidate = getOrigin(origin) ?? getOrigin(referer);

  if (!candidate) {
    return;
  }

  const allowedOrigins = new Set<string>([url.origin]);
  const appBaseOrigin = getOrigin(process.env.APP_BASE_URL ?? null);
  if (appBaseOrigin) {
    allowedOrigins.add(appBaseOrigin);
  }

  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  if (forwardedHost && forwardedProto) {
    const forwardedOrigin = getOrigin(`${forwardedProto}://${forwardedHost}`);
    if (forwardedOrigin) {
      allowedOrigins.add(forwardedOrigin);
    }
  }

  const host = firstHeaderValue(request.headers.get("host"));
  if (host && forwardedProto) {
    const hostOrigin = getOrigin(`${forwardedProto}://${host}`);
    if (hostOrigin) {
      allowedOrigins.add(hostOrigin);
    }
  }

  if (!allowedOrigins.has(candidate)) {
    console.warn("Blocked same-origin check", {
      candidate,
      requestOrigin: url.origin,
      forwardedHost,
      forwardedProto,
      appBaseOrigin,
    });
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
