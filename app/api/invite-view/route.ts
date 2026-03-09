import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getRequestIpAddress, getRequestLocation } from "@/lib/request-ip";

export const runtime = "nodejs";

type InviteViewPayload = {
  slug?: string;
};

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(request: Request) {
  try {
    const requestedWith = request.headers.get("x-requested-with");
    if (requestedWith !== "XMLHttpRequest") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const payload = (await request.json()) as InviteViewPayload;
    const slug = payload.slug?.trim().replace(/^\/+/, "");
    if (!slug) {
      return NextResponse.json({ ok: true });
    }

    await fetchMutation(api.guests.logInvitePageViewed, {
      slug,
      ipAddress: getRequestIpAddress(request.headers),
      ...getRequestLocation(request.headers),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
