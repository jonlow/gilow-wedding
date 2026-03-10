"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { LOCAL_DEVELOPMENT_REQUEST_SOURCE } from "@/lib/request-ip";
import { ResetGuestLogDialog } from "./ResetGuestLogDialog";

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
  city?: string;
  country?: string;
};

export function GuestAuditSheet({
  open,
  onOpenChange,
  token,
  guest,
}: GuestAuditSheetProps) {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
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
  const clearGuestAuditEvents = useMutation(api.guests.clearGuestAuditEvents);
  const hasAuditEvents = (auditEvents?.length ?? 0) > 0;

  const handleResetConfirm = async () => {
    if (!guest) {
      return;
    }

    try {
      setIsResetting(true);
      const result = await clearGuestAuditEvents({
        token,
        guestId: guest._id,
      });
      setResetDialogOpen(false);
      toast.success(
        result.deletedCount === 1
          ? `Removed 1 audit event for ${guest.name}.`
          : `Removed ${result.deletedCount} audit events for ${guest.name}.`,
      );
    } catch (error) {
      console.error("Failed to reset guest audit log:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reset guest audit log",
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
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
            {guest ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="destructive"
                  size="xs"
                  onClick={() => setResetDialogOpen(true)}
                  disabled={
                    !hasAuditEvents || auditEvents === undefined || isResetting
                  }
                >
                  {isResetting ? "Resetting..." : "Reset log"}
                </Button>
              </div>
            ) : null}
            {!guest ? (
              <p className="text-muted-foreground text-sm">
                No guest selected.
              </p>
            ) : auditEvents === undefined ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-muted/40 rounded-md border px-3 py-2"
                >
                  <Skeleton className="mb-2 h-4 w-2/3" />
                  <Skeleton className="mb-2 h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))
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

      <ResetGuestLogDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        guestName={guest?.name}
        isResetting={isResetting}
        onConfirm={handleResetConfirm}
      />
    </>
  );
}

function GuestAuditEventCard({ event }: { event: GuestAuditEvent }) {
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
      {event.city || event.country ? (
        <p className="text-muted-foreground text-xs">
          {[event.city, event.country].filter(Boolean).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
