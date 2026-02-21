# Convex Functions

This file documents Convex endpoint functions in this project (`query`, `mutation`, and `internalMutation`).

## `convex/auth.ts`

### Public

- `login` (`mutation`)
  - Args: `{ username: string, password: string }`
  - Returns: success + session token + user info, or error.
  - Purpose: Authenticates a dashboard user and creates a session.

- `logout` (`mutation`)
  - Args: `{ token: string }`
  - Returns: `null`
  - Purpose: Invalidates a dashboard session token.

- `validateSession` (`query`)
  - Args: `{ token: string }`
  - Returns: session validity and user info when valid.
  - Purpose: Checks whether a session is active and unexpired.

### Internal

- `seedDemoUser` (`internalMutation`)
  - Args: `{}`
  - Returns: `null`
  - Purpose: Ensures the demo admin user exists.

- `createDemoUser` (`internalMutation`)
  - Args: `{}`
  - Returns: `string`
  - Purpose: Creates demo admin user if missing.

- `updateAdminCredentials` (`internalMutation`)
  - Args: `{}`
  - Returns: `string`
  - Purpose: Migrates/remediates admin credentials.

## `convex/guests.ts`

### Public

- `listGuests` (`query`)
  - Args: `{ token: string }`
  - Returns: list of guest records (or empty list if unauthorized).
  - Purpose: Dashboard guest listing.

- `getGuestBySlug` (`query`)
  - Args: `{ slug: string }`
  - Returns: guest summary or `null`.
  - Purpose: Public guest lookup for RSVP page.

- `submitGuestRsvp` (`mutation`)
  - Args: `{ slug: string, response: "yes" | "no" }`
  - Returns: `{ ok: boolean, attending: boolean }`
  - Purpose: Submits RSVP response for a guest.

- `addGuest` (`mutation`)
  - Args: `{ token, name, email, slug, plusOne?, force? }`
  - Returns: created/duplicate status with duplicate info.
  - Purpose: Adds a guest from dashboard.

- `updateGuest` (`mutation`)
  - Args: `{ token, guestId, name, email, slug, plusOne?, force? }`
  - Returns: updated/duplicate status with duplicate info.
  - Purpose: Updates a guest from dashboard.

- `deleteGuest` (`mutation`)
  - Args: `{ token: string, guestId }`
  - Returns: `null`
  - Purpose: Deletes a guest from dashboard.

### Internal

- `resetAllGuestRsvpsForTesting` (`internalMutation`)
  - Args: `{}`
  - Returns: `{ ok: boolean, totalGuests: number, resetCount: number }`
  - Purpose: Clears `attending` RSVP values for all guests (testing helper).
