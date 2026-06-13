# Wedding Guest Management

This context covers the guest-facing invite and RSVP experience, plus the dashboard language used to manage wedding guests.

## Language

**Guest**:
A person or household invited to the wedding through a guest-specific invite link.

**Invite link**:
A unique public link that opens the invite page for one Guest.
_Avoid_: invite slug

**RSVP deadline**:
The date shown to a Guest as the requested date to submit their RSVP.
_Avoid_: invite wave, invite stage

## Relationships

- A **Guest** has exactly one **Invite link**.
- A **Guest** has one **RSVP deadline** shown on their invite page.
- Multiple **Guests** may share the same **RSVP deadline**.
- An **RSVP deadline** is display-only and does not prevent late RSVP submissions.

## Example dialogue

> **Dev:** "Do we need to model second-round invitations as a separate concept?"
> **Domain expert:** "No — set the **RSVP deadline** on each **Guest** and manage rounds manually."

## Flagged ambiguities

- "invite stage" and "first/second/third round" are operational planning labels, not domain concepts in the app for now; use **RSVP deadline** when deciding what appears on a **Guest** invite page.
