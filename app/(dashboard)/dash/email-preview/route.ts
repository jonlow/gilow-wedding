import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  defaultWeddingUpdateDraft,
  weddingUpdateEmail,
} from "@/lib/email-templates/wedding-update";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response(null, { status: 404 });
  }

  const headers = {
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
  };
  const url = new URL(request.url);
  if (url.searchParams.get("image") === "map") {
    const image = await readFile(
      path.join(process.cwd(), "assets/email/wedding-map.png"),
    );
    return new Response(image, {
      headers: { ...headers, "Content-Type": "image/png" },
    });
  }

  url.search = "?image=map";
  const { html } = weddingUpdateEmail({
    ...defaultWeddingUpdateDraft,
    imageUrl: url.href,
  });
  return new Response(html, {
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
  });
}
