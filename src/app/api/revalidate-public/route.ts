import { NextResponse } from "next/server";
import { PUBLIC_SITE_URL } from "@/lib/utils";

/** Server-side bump of the public site Next Data Cache after CMS saves. */
export async function POST() {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  try {
    const response = await fetch(`${PUBLIC_SITE_URL.replace(/\/$/, "")}/api/revalidate`, {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ ok: false, status: response.status }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
