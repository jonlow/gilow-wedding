# Dashboard Guest Management

This document describes the authenticated dashboard and the guest-management tools available there.

## Dashboard entry point

- Route: `/dash`
- Main files:
  - `app/(dashboard)/dash/page.tsx`
  - `app/(dashboard)/dash/dashboard.tsx`
  - `app/(dashboard)/dash/components/GuestTable.tsx`

`/dash` renders the login form when there is no valid `dash_session` cookie. Otherwise it preloads the guest list and renders the dashboard.

## Guest table capabilities

The guest table is the center of the dashboard UI.

Current actions supported from the table:

- add guest
- edit guest
- delete guest
- send invite
- resend invite
- copy guest invite URL
- open guest audit log
- switch to bulk CSV import mode

The guest table also has row selection UI and an `Email Invite` button for selected rows, but that selected-row bulk email action is not currently wired to any backend behavior.

## Guest CRUD Convex functions

Implemented in `convex/guests.ts`:

- `listGuests`
  - requires dashboard auth token
  - returns guests for the dashboard
- `addGuest`
  - checks uniqueness on `slug` and `email`
  - supports `force` to override duplicate warnings
  - logs `Guest created`
- `updateGuest`
  - checks uniqueness if `slug` or `email` changed
  - supports `force` to override duplicate warnings
  - logs `Guest details updated`
- `deleteGuest`
  - logs `Guest deleted`
  - then deletes the guest row

## Invite sending

Files involved:

- `app/(dashboard)/dash/components/GuestTable.tsx`
- `app/(dashboard)/dash/components/ResendInviteDialog.tsx`
- `app/api/send-email/route.ts`
- `convex/guests.ts` -> `markInviteSent`

Flow:

1. A dashboard user clicks `Send invite`.
2. The dashboard posts guest data to `/api/send-email`.
3. The API route sends the email.
4. If email sending succeeds, the route calls `markInviteSent`.
5. Convex patches `inviteSent: true` and logs `Invite sent`.

Important detail:

- `markInviteSent` only runs after the email send call completes successfully.
- A failed email send should not mark the guest as invited.

## Bulk guest import

Files involved:

- `app/(dashboard)/dash/components/BulkGuestImport.tsx`
- `convex/guests.ts` -> `bulkImportGuests`

CSV rules enforced by the UI:

- required columns are exactly, in this order:
  - `name`
  - `plus one`
  - `slug`
  - `email`
- extra columns are rejected
- required values must be present per row
- email is normalized to lowercase

Import behavior in Convex:

- skips rows with existing guest email in the database
- skips duplicate emails within the uploaded CSV
- skips duplicate slugs already in the database
- skips invalid rows
- inserts valid rows with `inviteSent: false`

## Audit log access

The guest audit sheet is opened from the guest row actions menu.

Files involved:

- `app/(dashboard)/dash/components/GuestAuditSheet.tsx`
- `convex/guests.ts` -> `listGuestAuditEvents`

The sheet queries audit events newest-first and displays:

- event label
- event timestamp
- source IP or local-development marker when present

## Testing utility

`convex/guests.ts` includes `resetGuestStateForTesting`, an internal mutation that:

- clears all guest RSVP values
- resets all `inviteSent` values to `false`
- deletes every `guestAuditEvents` row

This is intended for development/testing resets, not normal product flows.
