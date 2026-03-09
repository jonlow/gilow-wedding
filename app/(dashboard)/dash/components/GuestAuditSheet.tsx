"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LOCAL_DEVELOPMENT_REQUEST_SOURCE } from "@/lib/request-ip";

type GuestAuditSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  guest: {
    _id: Id<"guests">;
    name: string;
  } | null;
};

type GuestAuditEvent = {
  _id: string;
  eventLabel: string;
  eventAt: number;
  ipAddress?: string;
};

export function GuestAuditSheet({
  open,
  onOpenChange,
  token,
  guest,
}: GuestAuditSheetProps) {
  const queryArgs = useMemo(() => {
    if (!guest || !token) {
      return "skip" as const;
    }

    return {
      token,
      guestId: guest._id,
    };
  }, [guest, token]);

  const auditEvents = useQuery(api.guests.listGuestAuditEvents, queryArgs);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Guest audit log</SheetTitle>
          <SheetDescription>
            {guest
              ? `All logged events for ${guest.name}.`
              : "Select a guest to view events."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 overflow-y-auto px-4 pb-6">
          {!guest ? (
            <p className="text-muted-foreground text-sm">No guest selected.</p>
          ) : auditEvents === undefined ? (
            <p className="text-muted-foreground text-sm">Loading events…</p>
          ) : auditEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No audit events yet for this guest.
            </p>
          ) : (
            auditEvents.map((event) => (
              <GuestAuditEventCard key={event._id} event={event} />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function GuestAuditEventCard({
  event,
}: {
  event: GuestAuditEvent;
}) {
  const isLocalDevelopmentEvent =
    event.ipAddress === LOCAL_DEVELOPMENT_REQUEST_SOURCE;

  return (
    <div className="bg-muted/40 rounded-md border px-3 py-2">
      <p className="text-sm font-medium">{event.eventLabel}</p>
      <p className="text-muted-foreground text-xs">
        {new Date(event.eventAt).toLocaleString()}
      </p>
      {isLocalDevelopmentEvent ? (
        <p className="text-muted-foreground text-xs">
          Source: Local development
        </p>
      ) : event.ipAddress ? (
        <p className="text-muted-foreground text-xs">IP: {event.ipAddress}</p>
      ) : null}
    </div>
  );
}
