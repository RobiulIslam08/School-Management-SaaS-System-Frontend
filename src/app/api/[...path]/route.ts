import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const HOP_BY_HOP = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

const MAX_REDIRECTS = 5;

function backendOrigin(): string {
  return (process.env.API_PROXY_URL ?? "http://localhost:4000").replace(/\/$/, "");
}

function copyRequestHeaders(req: NextRequest): Headers {
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase()) && key.toLowerCase() !== "accept-encoding") {
      headers.set(key, value);
    }
  });
  headers.set("accept-encoding", "identity");
  return headers;
}

function buildResponse(upstream: Response, body: ArrayBuffer): NextResponse {
  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    // Never leak Location — browsers would follow to api.* and hit CORS.
    if (lower === "set-cookie" || lower === "location" || HOP_BY_HOP.has(lower)) return;
    out.append(key, value);
  });
  out.set("Cache-Control", "no-store");
  out.delete("content-encoding");
  out.delete("content-length");

  const cookies = typeof upstream.headers.getSetCookie === "function" ? upstream.headers.getSetCookie() : [];
  for (const cookie of cookies) {
    out.append("Set-Cookie", cookie);
  }

  return new NextResponse(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out,
  });
}

async function fetchUpstream(
  url: string,
  init: RequestInit,
  allowedOrigin: string,
): Promise<Response | NextResponse> {
  let current = url;
  let method = init.method ?? "GET";
  let body = init.body;
  const headers = new Headers(init.headers);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let upstream: Response;
    try {
      upstream = await fetch(current, {
        method,
        headers,
        body: method === "GET" || method === "HEAD" ? undefined : body,
        redirect: "manual",
      });
    } catch {
      return NextResponse.json(
        { success: false, data: null, message: "API server is unreachable. Check API_PROXY_URL and that the backend is running.", errors: null },
        { status: 502 },
      );
    }

    if (upstream.status < 300 || upstream.status >= 400) {
      return upstream;
    }

    const location = upstream.headers.get("location");
    if (!location) {
      return NextResponse.json(
        { success: false, data: null, message: "API server returned a redirect without Location.", errors: null },
        { status: 502 },
      );
    }

    let nextUrl: URL;
    try {
      nextUrl = new URL(location, current);
    } catch {
      return NextResponse.json(
        { success: false, data: null, message: "API server returned an invalid redirect.", errors: null },
        { status: 502 },
      );
    }

    // Only follow redirects that stay on the configured backend origin (http↔https / trailing slash).
    if (nextUrl.origin !== allowedOrigin) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "API_PROXY_URL redirected to another host. Use the internal Docker service URL (e.g. http://backend:4000), not the public api domain.",
          errors: null,
        },
        { status: 502 },
      );
    }

    current = nextUrl.toString();
    // 303 / 302 with body → GET without body for safety
    if (upstream.status === 303 || ((upstream.status === 301 || upstream.status === 302) && method !== "GET" && method !== "HEAD")) {
      method = "GET";
      body = undefined;
    }
  }

  return NextResponse.json(
    { success: false, data: null, message: "API server redirect loop. Check API_PROXY_URL.", errors: null },
    { status: 502 },
  );
}

async function proxy(req: NextRequest, context: { params: Promise<{ path: string[] }> }): Promise<NextResponse> {
  const { path } = await context.params;
  const origin = backendOrigin();
  const target = `${origin}/api/${path.join("/")}${req.nextUrl.search}`;
  const method = req.method;
  const hasBody = method !== "GET" && method !== "HEAD";
  const headers = copyRequestHeaders(req);

  let allowedOrigin: string;
  try {
    allowedOrigin = new URL(origin).origin;
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: "API_PROXY_URL is invalid.", errors: null },
      { status: 502 },
    );
  }

  const result = await fetchUpstream(
    target,
    {
      method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
    },
    allowedOrigin,
  );

  if (result instanceof NextResponse) return result;

  const body = await result.arrayBuffer();
  // If upstream still 3xx somehow, never pass Location to the browser.
  if (result.status >= 300 && result.status < 400) {
    return NextResponse.json(
      { success: false, data: null, message: "API server redirected; check API_PROXY_URL.", errors: null },
      { status: 502 },
    );
  }
  return buildResponse(result, body);
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
