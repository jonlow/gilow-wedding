"use client";

import { useState } from "react";
import { ScrollText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AuditEvent = {
  _id: string;
  guestId: string;
  guestName: string;
  eventLabel: string;
  eventAt: number;
  ipAddress?: string;
  city?: string;
  country?: string;
};

interface ActivityLogSidebarProps {
  auditEvents: AuditEvent[] | undefined;
}

export function ActivityLogSidebar({ auditEvents }: ActivityLogSidebarProps) {
  const [renderedAt] = useState(() => Date.now());

  return (
    <Card className="h-fit lg:sticky lg:top-8">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4" aria-hidden="true" />
          <CardTitle>Activity Log</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-2">
            {auditEvents === undefined ? (
              Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-muted/40 rounded-md border px-3 py-2"
                >
                  <Skeleton className="mb-2 h-4 w-3/5" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ))
            ) : auditEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No activity yet.</p>
            ) : (
              auditEvents.map((event) => (
                <Tooltip key={event._id}>
                  <TooltipTrigger asChild>
                    <div className="bg-muted/40 hover:bg-muted/60 cursor-default rounded-md border px-3 py-2 transition-colors">
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <p className="truncate text-sm font-medium">
                          {event.guestName}
                        </p>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground shrink-0 text-xs">
                              {formatRelativeTime(event.eventAt, renderedAt)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {formatAustralianDateTime(event.eventAt)}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {event.eventLabel}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <div className="space-y-1">
                      <p>
                        {event.ipAddress
                          ? `IP: ${event.ipAddress}`
                          : "IP unavailable"}
                      </p>
                      <p>
                        {event.city
                          ? `City: ${event.city}`
                          : "City unavailable"}
                      </p>
                      <p>
                        {event.country
                          ? `Country: ${getCountryFlag(event.country)} ${event.country}`
                          : "Country unavailable"}
                      </p>
                    </div>
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

function getCountryFlag(countryCode: string) {
  const normalizedCode = countryCode.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalizedCode)) {
    return "";
  }

  return String.fromCodePoint(
    ...normalizedCode.split("").map((char) => 127397 + char.charCodeAt(0)),
  );
}

function formatRelativeTime(timestamp: number, currentTime: number) {
  const diff = Math.max(0, currentTime - timestamp);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < minute) {
    return "just now";
  }

  if (diff < hour) {
    return `${Math.floor(diff / minute)}m ago`;
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)}h ago`;
  }

  if (diff < week) {
    const days = Math.floor(diff / day);
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }

  if (diff < month) {
    const weeks = Math.floor(diff / week);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }

  if (diff < year) {
    const months = Math.floor(diff / month);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }

  const years = Math.floor(diff / year);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

function formatAustralianDateTime(timestamp: number) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Melbourne",
  }).format(new Date(timestamp));
}
