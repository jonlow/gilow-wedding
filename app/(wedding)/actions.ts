"use server";

import { ConvexHttpClient } from "convex/browser";
import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";
import { api } from "@/convex/_generated/api";
import { getRequestIpAddress, getRequestLocation } from "@/lib/request-ip";
import { sendRsvpSlackNotification } from "@/lib/rsvp-slack";

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
  const location = getRequestLocation(requestHeaders);
  const guest = await client.query(api.guests.getGuestBySlug, { slug: guestSlug });

  if (!guest) {
    throw new Error("Guest not found");
  }

  const result = await client.mutation(api.guests.submitGuestRsvp, {
    slug: guestSlug,
    response,
    ipAddress,
    ...location,
  });

  if (result.ok) {
    after(async () => {
      await sendRsvpSlackNotification({
        name: guest.name,
        plusOne: guest.plusOne,
        kids: guest.kids,
        attending: result.attending,
      });
    });
    updateTag(`guest-page:${guestSlug}`);
    revalidatePath(`/${guestSlug}`);
  }

  return { success: result.ok, attending: result.attending };
}
