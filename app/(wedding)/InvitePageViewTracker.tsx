"use client";

import { useEffect } from "react";

type InvitePageViewTrackerProps = {
  guestSlug: string;
};

export function InvitePageViewTracker({ guestSlug }: InvitePageViewTrackerProps) {
  useEffect(() => {
    const normalizedSlug = guestSlug.replace(/^\/+/, "");
    if (!normalizedSlug) {
      return;
    }

    const sessionStorageKey = `invite-viewed:${normalizedSlug}`;

    if (window.sessionStorage.getItem(sessionStorageKey) === "1") {
      return;
    }

    window.sessionStorage.setItem(sessionStorageKey, "1");

    const controller = new AbortController();

    void fetch("/api/invite-view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({ slug: normalizedSlug }),
      keepalive: true,
      signal: controller.signal,
    }).catch(() => {
      // Intentionally ignore logging failures.
    });

    return () => controller.abort();
  }, [guestSlug]);

  return null;
}
