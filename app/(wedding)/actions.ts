"use server";

import { ConvexHttpClient } from "convex/browser";
import { headers } from "next/headers";
import { api } from "@/convex/_generated/api";
import { getRequestIpAddress } from "@/lib/request-ip";

export async function submitRsvp(formData: FormData) {
  const response = formData.get("response");
  const guestSlug = formData.get("guestSlug");

  if (response !== "yes" && response !== "no") {
    throw new Error("Invalid RSVP response");
  }
  if (typeof guestSlug !== "string" || guestSlug.length === 0) {
    throw new Error("Invalid guest slug");
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set.");
  }

  const client = new ConvexHttpClient(convexUrl);
  const requestHeaders = await headers();
  const ipAddress = getRequestIpAddress(requestHeaders);

  const result = await client.mutation(api.guests.submitGuestRsvp, {
    slug: guestSlug,
    response,
    ipAddress,
  });

  return { success: result.ok, attending: result.attending };
}
