import { NextResponse } from "next/server";
import { PUBLIC_SITE_URL } from "@/lib/utils";

/** Server-side bump of the public site Next Data Cache after CMS/Settings saves. Works without REVALIDATE_SECRET env. */
export async function POST() {
  const secret = process.env.REVALIDATE_SECRET ?? "";
  // Prefer Docker-internal URL on Dokploy; public HTTPS often hairpins/fails from the container.
  const base = (process.env.PUBLIC_REVALIDATE_URL || PUBLIC_SITE_URL).replace(/\/$/, "");
  if (!base) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  const headers: Record<string, string> = {};
  if (secret) headers["x-revalidate-secret"] = secret;
  try {
    const response = await fetch(`${base}/api/revalidate`, {
      method: "POST",
      headers,
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ ok: false, status: response.status, target: base }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, target: base }, { status: 502 });
  }
}
