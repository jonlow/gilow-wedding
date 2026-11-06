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

The **Last Viewed** column shows the latest recorded invitation-page view in
Melbourne time. Click its heading to sort newest first, then oldest first;
guests without a qualifying view show `—` and stay last in both directions.
The column can also be hidden through **View**.

Views from Jon's home IP (`119.17.136.209`) are excluded from this timestamp,
including historical logs and IPv4-mapped IPv6 equivalents. The audit logs are preserved. **Invite Viewed** shows the qualifying view count
inside its pill and supports sorting most/fewest views first. Its status and
filters also exclude these home-IP views. Views without a recorded IP
still count because their source cannot be identified.

The guest table also has row selection UI and an `Email Invite` button for selected rows, but that selected-row bulk email action is not currently wired to any backend behavior.

## Guest CRUD Convex functions

Implemented in `convex/guests.ts`:

- `listGuests`
  - requires dashboard auth token
  - returns guests for the dashboard
- `addGuest`
  - checks uniqueness on `slug` and `email` when an email is provided
  - supports `force` to override duplicate warnings
  - logs `Guest created`
- `updateGuest`
  - checks uniqueness if `slug` changed or a provided `email` changed
  - supports `force` to override duplicate warnings
  - logs `Guest details updated`
- `deleteGuest`
  - logs `Guest deleted`
  - then deletes the guest row

The add/edit guest form supports a guest-specific RSVP deadline. This deadline
is shown on that guest's public invite page only; it is not used for dashboard
filtering, CSV import, or RSVP submission enforcement.

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
- Guests without any email recipients do not show the `Send invite` action in the dashboard.

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
- email is still required for CSV import

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

## Drinks entry

The dashboard's **Drinks** view is for quick entry per adult: the main guest and
one named plus one. It never creates entries from the Kids field. Confirmed
guests are shown by default; All guests and name/partner search are available.

- Drag the slider to a score from 0–10 directly in the row. Not set means unknown; 0 means no
  alcohol. Clear returns the score to unknown. Scores 1–3 are light, 4–6 moderate, 7–8 heavy and 9–10 very heavy.
- Select any combination of beer, white wine, sparkling, light red, red,
  Aperol and whisky. Setting a score to 0 clears preferences.
- Changes save automatically, with per-person saving/error feedback and Retry.
  Rapid edits for the same person are saved in order. Enter in a score moves
  to the next adult. Sign-out is disabled while saves are pending or failed.
- **Copy to partner** replaces the partner's score and preferences with the
  main guest's current entry, including any edits still being saved.
- **Incomplete only** shows households missing a score or, for drinkers, drink
  preferences. The household stays visible while it has keyboard focus.
- Household counts and averages are derived from individual scores. Unknown
  adults are shown separately; averages include only scores above zero.

Private profiles are stored in `guestDrinks`, indexed by `guestId`, with `main`
and `partner` profiles. Each profile has an optional `score` and a `preferences`
array. They are available through authenticated `drinks.list` and
`drinks.savePerson`, not through public invitation queries. A score measures
expected drinking level, not a literal number of drinks. Agents estimating
purchases should use confirmed households, account for unknown/incomplete
entries, and establish event duration, serving options and existing stock.

Partner writes must supply `expectedPartner`, matching the trimmed Plus One
value. Changing that value clears the old profile and rejects stale writes.
Deleting a guest removes their drinks record too.
