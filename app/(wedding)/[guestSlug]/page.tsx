import { ConvexHttpClient } from "convex/browser";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { WeddingPageContent } from "../WeddingPageContent";

const getGuestBySlug = (guestSlug: string) =>
  unstable_cache(
    async () => {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (!convexUrl) {
        throw new Error("NEXT_PUBLIC_CONVEX_URL is not set.");
      }
      const client = new ConvexHttpClient(convexUrl);
      return client.query(api.guests.getGuestBySlug, { slug: guestSlug });
    },
    ["guest-by-slug", guestSlug],
    { revalidate: 600 },
  )();

export const revalidate = 600;

type GuestPageProps = {
  params: Promise<{
    guestSlug: string;
  }>;
};

export default async function GuestPage({ params }: GuestPageProps) {
  const { guestSlug } = await params;
  const guest = await getGuestBySlug(guestSlug);

  if (!guest) {
    notFound();
  }

  return <WeddingPageContent guestName={guest.name} guestSlug={guest.slug} />;
}
