import { buildWeddingUpdateEmail } from "@/lib/email-templates/wedding-update";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response(null, { status: 404 });
  }

  const url = new URL(request.url);
  // Optional sample names let us preview the same personalisation as delivery.
  const name = url.searchParams.get("name");
  const email = buildWeddingUpdateEmail({
    origin: url.origin,
    guest: name
      ? {
          name,
          slug: url.searchParams.get("slug") ?? "preview-invite",
          plusOne: url.searchParams.get("plusOne") ?? undefined,
          kids: url.searchParams.get("kids") ?? undefined,
        }
      : undefined,
  });
  return new Response(email.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
