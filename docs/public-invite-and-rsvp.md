# Public Invite And RSVP Flow

This document covers the public guest-facing side of the app.

## Routes

- `/`
  - Public landing page.
- `/:guestSlug`
  - Guest-specific wedding invite page.
  - File: `app/(wedding)/[guestSlug]/page.tsx`

## Page load flow

1. Next.js receives the guest slug.
2. `getGuestBySlug` is queried from Convex using `ConvexHttpClient`.
3. If no guest exists for the slug, the route returns `notFound()`.
4. If found, `WeddingPageContent` renders the invite page and the RSVP form.

## Invite page view logging

The invite page logs a view when the page mounts in the browser.

Files involved:

- `app/(wedding)/WeddingPageContent.tsx`
- `app/(wedding)/InvitePageViewTracker.tsx`
- `app/api/invite-view/route.ts`
- `convex/guests.ts` -> `logInvitePageViewed`

Flow:

1. `InvitePageViewTracker` runs in the client.
2. It posts the guest slug to `/api/invite-view`.
3. The route validates `X-Requested-With: XMLHttpRequest`.
4. The route extracts an IP/source marker from request headers.
5. Convex writes a `guestAuditEvents` row with label `Invite page viewed`.

## RSVP submission flow

Files involved:

- `app/(wedding)/rsvp-form.tsx`
- `app/(wedding)/actions.ts`
- `convex/guests.ts` -> `submitGuestRsvp`

Flow:

1. The form posts through the `submitRsvp` server action.
2. The server action validates `response` and `guestSlug`.
3. It extracts request IP/source information from headers.
4. It calls `api.guests.submitGuestRsvp`.
5. Convex updates `guests.attending`.
6. Convex appends an audit event labeled `RSVP submitted`.
7. The server action expires the cached guest page data and revalidates the
   guest route so the next load reflects the saved RSVP immediately.

## RSVP states

In the dashboard, RSVP is interpreted as:

- `attending === true` -> `Yes`
- `attending === false` -> `No`
- `attending === undefined` -> `Pending`

On the public invite page:

- `attending !== undefined` -> render the thank-you submitted state on load
- `attending === undefined` -> render the RSVP form
- when reopening the form from the thank-you state, the saved RSVP choice is
  preselected

## Guest page content

The wedding page is largely static presentation with guest personalization:

- guest name
- optional plus-one name
- RSVP submission
- invite page view tracking

The content lives primarily in `app/(wedding)/WeddingPageContent.tsx` and `app/wedding-content.css`.

## Caching

- `app/(wedding)/[guestSlug]/page.tsx` sets `revalidate = 600`.
- Guest lookup is also wrapped in `unstable_cache` and tagged per guest page.
- Changes to guest name/plus-one/slug may take up to 10 minutes to naturally refresh on the public page unless the cache is otherwise invalidated.
- RSVP submission explicitly invalidates the cached guest page so a reload sees
  the saved RSVP right away.

## Public RSVP UX

- Guests with an existing RSVP load directly into the thank-you state.
- Submitting the form switches to the thank-you state immediately before the
  server responds.
- If the save fails, the UI returns to the form, keeps the selected response,
  and shows an inline error.
- The thank-you state includes a smaller "Click here to change your RSVP"
  control that reopens the form with the saved response selected.

## Local development behavior

- On localhost, there is no meaningful public client IP for the app to capture.
- The request IP helper stores a local-development marker instead of persisting `::1`.
- In the audit log, these newer local events show as `Source: Local development`.
