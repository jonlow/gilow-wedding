import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_RSVP_DEADLINE,
  formatRsvpDeadlineForInvite,
  getGuestRsvpDeadline,
} from "./rsvp-deadline.ts";

test("uses the default RSVP deadline when a guest has no custom deadline", () => {
  assert.equal(getGuestRsvpDeadline(undefined), DEFAULT_RSVP_DEADLINE);
  assert.equal(formatRsvpDeadlineForInvite(undefined), "20.05.26");
});

test("formats a custom ISO RSVP deadline for the public invite", () => {
  assert.equal(getGuestRsvpDeadline("2026-08-14"), "2026-08-14");
  assert.equal(formatRsvpDeadlineForInvite("2026-08-14"), "14.08.26");
});
