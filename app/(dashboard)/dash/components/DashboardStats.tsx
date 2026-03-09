"use client";

import { useState } from "react";
import { ArrowUpRight, CheckCircle2, Clock3, Mail } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Guest = {
  _id: string;
  attending?: boolean;
  inviteSent: boolean;
  name: string;
};

type AuditEvent = {
  _id: string;
  guestId: string;
  guestName: string;
  eventLabel: string;
  eventAt: number;
  ipAddress?: string;
};

interface DashboardStatsProps {
  guests: Guest[];
  auditEvents: AuditEvent[] | undefined;
}

export function DashboardStats({
  guests,
  auditEvents,
}: DashboardStatsProps) {
  const [renderedAt] = useState(() => Date.now());
  const totalGuests = guests.length;
  const invitesSent = guests.filter((guest) => guest.inviteSent).length;
  const responsesReceived = guests.filter(
    (guest) => guest.attending !== undefined,
  ).length;
  const attendingCount = guests.filter((guest) => guest.attending === true).length;
  const declinedCount = guests.filter((guest) => guest.attending === false).length;
  const pendingResponses = guests.filter(
    (guest) => guest.inviteSent && guest.attending === undefined,
  ).length;
  const recentActivityCount =
    auditEvents?.filter(
      (event) => renderedAt - event.eventAt <= 7 * 24 * 60 * 60 * 1000,
    ).length ?? 0;
  const latestEvent = auditEvents?.[0];

  const responseRate =
    totalGuests === 0 ? 0 : Math.round((responsesReceived / totalGuests) * 100);
  const inviteRate =
    totalGuests === 0 ? 0 : Math.round((invitesSent / totalGuests) * 100);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Guests"
        value={totalGuests.toLocaleString()}
        badge={`${inviteRate}% invited`}
        summary={`${invitesSent} of ${totalGuests} guests have been sent invites.`}
        detail={
          pendingResponses > 0
            ? `${pendingResponses} invited guests still have not responded.`
            : "Everyone invited has responded."
        }
      />

      <StatCard
        title="RSVP Responses"
        value={responsesReceived.toLocaleString()}
        badge={`${responseRate}% replied`}
        summary="Responses received from guests."
        detail={
          pendingResponses > 0
            ? `${pendingResponses} invited guests are still pending.`
            : "No outstanding RSVP responses right now."
        }
      />

      <StatCard
        title="Attending"
        value={attendingCount.toLocaleString()}
        badge={`${declinedCount} declined`}
        summary="Confirmed attendees so far."
        detail={
          declinedCount > 0
            ? `${declinedCount} guests have declined the invite.`
            : "No declines have been recorded."
        }
      />

      <StatCard
        title="Recent Activity"
        value={recentActivityCount.toLocaleString()}
        badge="Last 7 days"
        summary={
          latestEvent
            ? `${latestEvent.guestName}: ${latestEvent.eventLabel}`
            : "No guest activity has been logged yet."
        }
        detail={
          latestEvent
            ? `Latest event logged ${formatRelativeTime(latestEvent.eventAt, renderedAt)}.`
            : "Activity will appear here once guests interact with invites or RSVP."
        }
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  badge: string;
  summary: string;
  detail: string;
}

function StatCard({ title, value, badge, summary, detail }: StatCardProps) {
  return (
    <Card className="justify-between">
      <CardHeader>
        <CardDescription className="text-sm">{title}</CardDescription>
        <CardAction>
          <div className="text-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium">
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            {badge}
          </div>
        </CardAction>
        <CardTitle className="text-4xl font-semibold tracking-tight">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-base font-medium">{summary}</p>
      </CardContent>
      <CardFooter className="text-muted-foreground flex items-start gap-2 text-sm">
        <span className="mt-0.5">
          {title === "Total Guests" ? (
            <Mail className="h-4 w-4" aria-hidden="true" />
          ) : title === "RSVP Responses" ? (
            <Clock3 className="h-4 w-4" aria-hidden="true" />
          ) : title === "Attending" ? (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
        <span>{detail}</span>
      </CardFooter>
    </Card>
  );
}

function formatRelativeTime(timestamp: number, currentTime: number) {
  const diff = currentTime - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) {
    const minutes = Math.max(1, Math.floor(diff / minute));
    return `${minutes}m ago`;
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)}h ago`;
  }

  return `${Math.floor(diff / day)}d ago`;
}
