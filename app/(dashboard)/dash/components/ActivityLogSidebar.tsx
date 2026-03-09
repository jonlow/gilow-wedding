"use client";

import { useQuery } from "convex/react";
import { ScrollText } from "lucide-react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthToken } from "../hooks/useAuthToken";

export function ActivityLogSidebar() {
  const token = useAuthToken();
  const auditEvents = useQuery(api.guests.listLatestGuestAuditEvents, { token });

  return (
    <Card className="h-fit lg:sticky lg:top-8">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4" aria-hidden="true" />
          <CardTitle>Activity Log</CardTitle>
        </div>
        <CardDescription>Latest 200 audit events across all guests.</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-2">
          {auditEvents === undefined ? (
            <p className="text-muted-foreground text-sm">Loading activity…</p>
          ) : auditEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity yet.</p>
          ) : (
            auditEvents.map((event) => (
              <Tooltip key={event._id}>
                <TooltipTrigger asChild>
                  <div className="bg-muted/40 hover:bg-muted/60 cursor-default rounded-md border px-3 py-2 transition-colors">
                    <p className="truncate text-sm font-medium">{event.guestName}</p>
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {event.eventLabel}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {event.ipAddress ? `IP: ${event.ipAddress}` : "IP unavailable"}
                </TooltipContent>
              </Tooltip>
            ))
          )}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
