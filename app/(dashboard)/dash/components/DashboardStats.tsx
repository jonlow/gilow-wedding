"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, CheckCircle2, Clock3, Mail, Users } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getGuestHouseholdSize,
  getListedKidsCount,
  hasPlusOne,
} from "@/lib/guest-headcount";

type Guest = {
  _id: string;
  attending?: boolean;
  inviteSent: boolean;
  name: string;
  plusOne?: string;
  kids?: string;
};

interface DashboardStatsProps {
  guests: Guest[];
}

export function DashboardStats({ guests }: DashboardStatsProps) {
  const totalGuests = guests.length;
  const totalHeadcount = guests.reduce(
    (sum, guest) => sum + getGuestHouseholdSize(guest),
    0,
  );
  const invitesSent = guests.filter((guest) => guest.inviteSent).length;
  const responsesReceived = guests.filter(
    (guest) => guest.attending !== undefined,
  ).length;
  const attendingGuestRecords = guests.filter(
    (guest) => guest.attending === true,
  ).length;
  const attendingHeadcount = guests
    .filter((guest) => guest.attending === true)
    .reduce((sum, guest) => sum + getGuestHouseholdSize(guest), 0);
  const declinedHeadcount = guests
    .filter((guest) => guest.attending === false)
    .reduce((sum, guest) => sum + getGuestHouseholdSize(guest), 0);
  const pendingResponses = guests.filter(
    (guest) => guest.inviteSent && guest.attending === undefined,
  ).length;
  const pendingHeadcount = guests
    .filter((guest) => guest.inviteSent && guest.attending === undefined)
    .reduce((sum, guest) => sum + getGuestHouseholdSize(guest), 0);
  const plusOneCount = guests.filter((guest) => hasPlusOne(guest.plusOne)).length;
  const kidsCount = guests.reduce(
    (sum, guest) => sum + getListedKidsCount(guest.kids),
    0,
  );

  const responseRate =
    totalGuests === 0 ? 0 : Math.round((responsesReceived / totalGuests) * 100);
  const inviteRate =
    totalGuests === 0 ? 0 : Math.round((invitesSent / totalGuests) * 100);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Guest Records"
        value={totalGuests.toLocaleString()}
        badge={`${inviteRate}% invited`}
        summary={`${invitesSent} of ${totalGuests} guest records have been sent invites.`}
        detail={
          totalHeadcount > 0
            ? `Those records currently represent ${totalHeadcount} potential attendees.`
            : "No guest records have been added yet."
        }
        icon={<Mail className="h-4 w-4" aria-hidden="true" />}
      />

      <StatCard
        title="Potential Headcount"
        value={totalHeadcount.toLocaleString()}
        badge="Incl. plus-ones + kids"
        summary="Total people represented across all guest households."
        detail={
          plusOneCount > 0 || kidsCount > 0
            ? `${plusOneCount} plus-ones and ${kidsCount} listed kids are included in this estimate.`
            : "No plus-ones or kids are currently listed."
        }
        icon={<Users className="h-4 w-4" aria-hidden="true" />}
      />

      <StatCard
        title="RSVP Responses"
        value={responsesReceived.toLocaleString()}
        badge={`${responseRate}% replied`}
        summary="Responses received from guest records."
        detail={
          pendingResponses > 0
            ? `${pendingResponses} invited guest records are still pending.`
            : "No outstanding RSVP responses right now."
        }
        icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
      />

      <StatCard
        title="Confirmed Attending"
        value={attendingHeadcount.toLocaleString()}
        badge={`${attendingGuestRecords} RSVP yes`}
        summary="People currently expected to attend."
        detail={
          pendingHeadcount > 0
            ? `${pendingHeadcount} more people are still waiting on an RSVP, and ${declinedHeadcount} have declined.`
            : declinedHeadcount > 0
              ? `${declinedHeadcount} people have declined so far.`
              : "No pending or declined attendees right now."
        }
        icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
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
  icon: ReactNode;
}

function StatCard({ title, value, badge, summary, detail, icon }: StatCardProps) {
  return (
    <Card className="justify-between border-stone-200/80 bg-white/80 shadow-[0_16px_50px_rgba(24,24,27,0.06)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5">
      <CardHeader className="border-b border-stone-100/80 pb-5">
        <CardDescription className="text-sm font-medium text-stone-500">
          {title}
        </CardDescription>
        <CardAction>
          <div className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50/90 px-2.5 py-1 text-xs font-medium text-stone-700">
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            {badge}
          </div>
        </CardAction>
        <CardTitle className="text-4xl font-semibold tracking-tight text-stone-950">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-base font-medium text-stone-800">{summary}</p>
      </CardContent>
      <CardFooter className="flex items-start gap-2 text-sm text-stone-500">
        <span className="mt-0.5">{icon}</span>
        <span>{detail}</span>
      </CardFooter>
    </Card>
  );
}
