# System Overview

This project is a Next.js App Router app backed by Convex for data, auth state, and business logic.

## High-level areas

- Public wedding site:
  - `/` is the public home page.
  - `/:guestSlug` renders a guest-specific invite page.
  - Guests RSVP from the public page through a server action.
- Dashboard:
  - `/dash` shows either the login form or the authenticated dashboard.
  - Dashboard users manage guests, send invites, bulk import CSVs, and inspect audit history.
- Data layer:
  - Convex stores guests, guest audit events, dashboard users, and dashboard sessions.

## Main tables

Defined in `convex/schema.ts`:

- `guests`
  - guest profile data, RSVP state, invite state, plus-one, optional messages
- `guestAuditEvents`
  - append-only guest timeline events, optionally including `ipAddress`
- `dashUsers`
  - dashboard login users
- `dashSessions`
  - dashboard session tokens with expiry timestamps

## Main code paths

- Public invite page
  - `app/(wedding)/[guestSlug]/page.tsx`
  - Loads guest data from Convex and renders `WeddingPageContent`.
- Public RSVP
  - `app/(wedding)/rsvp-form.tsx`
  - `app/(wedding)/actions.ts`
  - `convex/guests.ts` -> `submitGuestRsvp`
- Invite page view logging
  - `app/(wedding)/InvitePageViewTracker.tsx`
  - `app/api/invite-view/route.ts`
  - `convex/guests.ts` -> `logInvitePageViewed`
- Dashboard auth
  - `app/(dashboard)/dash/auth-actions.ts`
  - `convex/auth.ts`
  - `proxy.ts`
- Dashboard guest management
  - `app/(dashboard)/dash/dashboard.tsx`
  - `app/(dashboard)/dash/components/GuestTable.tsx`
  - `convex/guests.ts`
- Email sending
  - `app/api/test-email/route.ts`
  - `lib/email.ts`
  - `lib/email-templates/invitation.ts`

## Rendering and data fetching notes

- Guest invite pages use `unstable_cache` and `revalidate = 600`, so guest page data is cached for 10 minutes.
- The dashboard preloads the guest list server-side with `preloadQuery` and hydrates it client-side with `usePreloadedQuery`.
- The dashboard auth token is stored in an HTTP-only cookie named `dash_session`.

## Operational notes

- The public invite-view logger rejects normal browser GET requests and only accepts `POST /api/invite-view` with `X-Requested-With: XMLHttpRequest`.
- Invite emails are sent through `/api/test-email`; despite the route name, this is the current invite-sending path used by the dashboard.
- Local development IPs are intentionally labeled as local development rather than shown as `::1`.
- There is a testing-only Convex utility `resetGuestStateForTesting` in `convex/guests.ts` that clears guest RSVP state, invite-sent state, and audit events in the dev deployment.
