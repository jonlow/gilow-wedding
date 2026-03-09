# Auth And Email

This document covers dashboard authentication and outbound invite email behavior.

## Dashboard authentication

Main files:

- `app/(dashboard)/dash/auth-actions.ts`
- `convex/auth.ts`
- `convex/lib/auth.ts`
- `proxy.ts`

## How auth works

1. A dashboard user submits the login form.
2. `auth-actions.ts` calls `api.auth.login`.
3. Convex validates username/password against `dashUsers`.
4. Convex creates a `dashSessions` row with a random token and 24-hour expiry.
5. Next.js stores the token in the HTTP-only `dash_session` cookie.
6. Future dashboard requests validate that cookie via `api.auth.validateSession`.

## Auth constraints and caveats

- Session duration is 24 hours.
- Expired sessions are treated as invalid.
- The current password implementation is intentionally simple and not production-grade.
- `convex/auth.ts` uses a demo-style hash function, not bcrypt/argon2.
- `proxy.ts` only adds a convenience header for `/dash` routes; it is not the primary auth enforcement layer.

## Dashboard seed/admin utilities

`convex/auth.ts` includes internal helpers:

- `seedDemoUser`
- `createDemoUser`
- `updateAdminCredentials`

These exist for setup/migration tasks and are not used by the runtime UI.

## Email providers

Main file:

- `lib/email.ts`

Supported providers:

- `mailpit`
- `resend`

Selection logic:

- if `EMAIL_PROVIDER` is explicitly set to `mailpit` or `resend`, that value is used
- otherwise:
  - development defaults to `mailpit`
  - non-development defaults to `resend`

## Required environment variables

For Convex:

- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CONVEX_SITE_URL`

For Resend:

- `RESEND_API_KEY`

For Mailpit:

- `MAILPIT_HOST`
- `MAILPIT_PORT`
- optionally `MAILPIT_USER`
- optionally `MAILPIT_PASS`

## Invite email route

Main file:

- `app/api/test-email/route.ts`

Despite the route name, this is the live dashboard invite-sending endpoint.

Behavior:

- `GET` sends a preview/test email payload
- `POST` sends a guest-specific invite email
- `POST` also marks the guest as invited in Convex after a successful send
- invite emails are sent with the display name `Bel & Jon` from `howdy@belandjon.com`

## Email content

The invitation template is defined in:

- `lib/email-templates/invitation.ts`

The route builds a button link from:

- `payload.buttonLink`, if provided
- otherwise `request.url` origin + normalized guest slug
