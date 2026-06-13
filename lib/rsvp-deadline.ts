export const DEFAULT_RSVP_DEADLINE = "2026-05-20";

export function getGuestRsvpDeadline(rsvpDeadline?: string) {
  const normalizedDeadline = rsvpDeadline?.trim();
  return normalizedDeadline || DEFAULT_RSVP_DEADLINE;
}

export function formatRsvpDeadlineForInvite(rsvpDeadline?: string) {
  const deadline = getGuestRsvpDeadline(rsvpDeadline);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(deadline);

  if (!match) {
    return deadline;
  }

  const [, year, month, day] = match;
  return `${day}.${month}.${year.slice(-2)}`;
}
