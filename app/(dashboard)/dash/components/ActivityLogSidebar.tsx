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
import { cn } from "@/lib/utils";
import { getAuditEventAppearance } from "./audit-event-appearance";

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
    <Card className="h-fit border-stone-200/80 bg-white/82 shadow-[0_18px_60px_rgba(24,24,27,0.07)] backdrop-blur-sm lg:sticky lg:top-8">
      <CardHeader className="border-b border-stone-100/90 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
          Audit Trail
        </p>
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-stone-700" aria-hidden="true" />
          <CardTitle className="text-stone-950">Activity Log</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-2">
            {auditEvents === undefined ? (
              Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-stone-200/80 bg-stone-50/70 px-3 py-3"
                >
                  <Skeleton className="mb-2 h-4 w-3/5" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ))
            ) : auditEvents.length === 0 ? (
              <p className="text-sm text-stone-500">No activity yet.</p>
            ) : (
              auditEvents.map((event) => (
                <ActivityLogEventCard
                  key={event._id}
                  event={event}
                  renderedAt={renderedAt}
                />
              ))
            )}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

function ActivityLogEventCard({
  event,
  renderedAt,
}: {
  event: AuditEvent;
  renderedAt: number;
}) {
  const appearance = getAuditEventAppearance(event.eventLabel);

  return (
    <div
      className={cn(
        "cursor-default rounded-xl border border-stone-200/80 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(24,24,27,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_12px_28px_rgba(24,24,27,0.06)]",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="truncate text-sm font-medium text-stone-900">
          {event.guestName}
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="shrink-0 text-xs text-stone-500">
              {formatRelativeTime(event.eventAt, renderedAt)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            {formatAustralianDateTime(event.eventAt)}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "inline-flex min-w-0 items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
                appearance.pillClassName,
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  appearance.dotClassName,
                )}
              />
              <span className="truncate">{event.eventLabel}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="left">
            <div className="space-y-1">
              <p>{event.ipAddress ? `IP: ${event.ipAddress}` : "IP unavailable"}</p>
              <p>{event.city ? `City: ${event.city}` : "City unavailable"}</p>
              <p>
                {event.country
                  ? `Country: ${getCountryFlag(event.country)} ${event.country}`
                  : "Country unavailable"}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
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
