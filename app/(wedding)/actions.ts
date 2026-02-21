"use server";

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

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
  const result = await client.mutation(api.guests.submitGuestRsvp, {
    slug: guestSlug,
    response,
  });

  return { success: result.ok, attending: result.attending };
}
