type ViewEvent = {
  guestId: string;
  eventLabel: string;
  eventAt: number;
  ipAddress?: string;
};

// Ignore Jon's home visits when calculating guest activity, including old logs.
const EXCLUDED_VIEW_IP = "119.17.136.209";

function isGuestView(event: ViewEvent) {
  const ip = event.ipAddress?.trim().replace(/^::ffff:/i, "");
  return event.eventLabel === "Invite page viewed" && ip !== EXCLUDED_VIEW_IP;
}

export function getViewCountByGuest(events: ViewEvent[]) {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (isGuestView(event)) counts.set(event.guestId, (counts.get(event.guestId) ?? 0) + 1);
  }
  return counts;
}

export function getLastViewedByGuest(events: ViewEvent[]) {
  const lastViewed = new Map<string, number>();
  for (const event of events) {
    if (!isGuestView(event)) continue;
    const previous = lastViewed.get(event.guestId);
    if (previous === undefined || event.eventAt > previous) {
      lastViewed.set(event.guestId, event.eventAt);
    }
  }
  return lastViewed;
}

export function compareLastViewed(
  a: number | null,
  b: number | null,
  direction: "asc" | "desc",
) {
  // Guests without a qualifying view stay last in either direction.
  if (a === null) return b === null ? 0 : 1;
  if (b === null) return -1;
  return direction === "asc" ? a - b : b - a;
}

const lastViewedFormatter = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function formatLastViewed(timestamp: number) {
  return lastViewedFormatter.format(timestamp);
}
