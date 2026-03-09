# Guest Audit Logging Guide

This guide explains how guest audit logging works in this app, and how developers/agents can use it.

## What this feature does

Each guest can have a timeline of events.

An event stores:

- `guestId` – the guest the event belongs to
- `eventLabel` – human-readable description of what happened
- `eventAt` – timestamp (milliseconds since epoch)
- `ipAddress` (optional) – source IP when location/context is useful

Events are stored in the `guestAuditEvents` Convex table.

## Automatic events (already logged by the app)

The app automatically writes guest audit events when:

- a guest is created (`Guest created`)
- a guest is updated (`Guest details updated`)
- an invite is sent (`Invite sent`)
- invite page is viewed (`Invite page viewed`)
- RSVP is submitted (`RSVP submitted`)
- a guest is deleted (`Guest deleted`)

When RSVP is submitted from the public invite page, the app attempts to include the requester IP address automatically when available from request headers.

Invite page views are logged via a lightweight XHR endpoint (`POST /api/invite-view`) that only accepts `XMLHttpRequest`-tagged POST requests and rejects browser GET navigation to reduce easy manual spam.

## Convex functions available

### 1) List guest audit events

Function: `api.guests.listGuestAuditEvents`

- **Auth required**: yes (`token`)
- **Args**:
  - `token: string`
  - `guestId: Id<"guests">`
- **Returns**: array of events, newest first

Example:

```ts
const events = await client.query(api.guests.listGuestAuditEvents, {
  token,
  guestId,
});
```

### 2) Add a custom audit event

Function: `api.guests.addGuestAuditEvent`

- **Auth required**: yes (`token`)
- **Args**:
  - `token: string`
  - `guestId: Id<"guests">`
  - `eventLabel: string`
  - `ipAddress?: string`
- **Validation**:
  - trims `eventLabel`
  - throws if empty
  - trims optional `ipAddress`; omitted if empty

Example:

```ts
await client.mutation(api.guests.addGuestAuditEvent, {
  token,
  guestId,
  eventLabel: "Invite page viewed",
  ipAddress: "203.0.113.42",
});
```

## Dashboard usage

In the dashboard Guest List:

1. Open a guest row actions menu (three dots).
2. Click **View log**.
3. The audit sheet opens and shows event labels with timestamps.

## IP address logging recommendations

- Use `ipAddress` only for analytics/security-relevant events (for example `Invite page viewed`).
- Skip `ipAddress` for admin-triggered events where source location is not useful (for example `Invite sent`).
- If a request passes through proxies/CDN, capture a trusted forwarded IP in your server layer before calling Convex.

## Suggested event labels for future tracking

For consistency, use short past-tense labels, for example:

- `Invite page viewed`
- `Reminder email sent`
- `RSVP reminder SMS sent`
- `Dietary requirements updated`
- `Plus one confirmed`

## Developer notes

- Query sort order is newest-first, so recent actions appear at the top.
- If you add new guest-related workflows, consider writing an audit event in the same mutation/action.
- Keep labels human-readable; this log is intended for dashboard viewing.
