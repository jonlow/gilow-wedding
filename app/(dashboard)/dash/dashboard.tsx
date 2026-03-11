"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePreloadedQuery, useQuery } from "convex/react";
import type { Preloaded } from "convex/react";
import { ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { logout, type AuthUser } from "./auth-actions";
import { api } from "@/convex/_generated/api";
import { AuthProvider } from "./hooks/useAuthToken";
import { DashboardStats, GuestTable } from "./components";
import {
  ActivityLogList,
  ActivityLogSidebar,
  getAuditEventsVersion,
} from "./components/ActivityLogSidebar";

interface DashboardProps {
  user: AuthUser;
  preloadedGuests: Preloaded<typeof api.guests.listGuests>;
  token: string;
}

export function Dashboard({ preloadedGuests, token }: DashboardProps) {
  return (
    <AuthProvider token={token}>
      <DashboardContent preloadedGuests={preloadedGuests} token={token} />
    </AuthProvider>
  );
}

interface DashboardContentProps {
  preloadedGuests: Preloaded<typeof api.guests.listGuests>;
  token: string;
}

function DashboardContent({ preloadedGuests, token }: DashboardContentProps) {
  const guests = usePreloadedQuery(preloadedGuests);
  const auditEvents = useQuery(api.guests.listLatestGuestAuditEvents, { token });
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileActivityLogOpen, setMobileActivityLogOpen] = useState(false);
  const [cachedGuests, setCachedGuests] = useState(guests);

  const handleLogout = async () => {
    setCachedGuests(guests);
    setIsLoggingOut(true);
    await logout();
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(229,208,155,0.28),_transparent_32%),linear-gradient(180deg,_#fcfaf6_0%,_#f7f4ee_100%)]">
      <div className="mx-auto max-w-[1760px] px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        <div className="mb-8 flex flex-col gap-4 border-b border-stone-200/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
              Wedding Operations
            </p>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
                Dashboard
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-stone-600">
                Track RSVPs, manage invites, and keep guest follow-up tidy from
                one place.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-stone-300/80 bg-white/70 shadow-sm backdrop-blur-sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_19rem] lg:items-start xl:grid-cols-[minmax(0,1.6fr)_20rem] xl:gap-10">
          <div className="grid gap-6">
            <DashboardStats
              guests={isLoggingOut ? cachedGuests : guests}
            />
            <GuestTable guests={isLoggingOut ? cachedGuests : guests} />
          </div>

          <div className="hidden lg:block">
            <ActivityLogSidebar auditEvents={auditEvents} />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 lg:hidden">
        <Button
          type="button"
          size="sm"
          className="h-11 rounded-full bg-stone-950 px-4 text-white shadow-[0_16px_30px_rgba(24,24,27,0.22)] hover:bg-stone-800"
          onClick={() => setMobileActivityLogOpen(true)}
        >
          <ScrollText className="mr-2 h-4 w-4" />
          Activity
          {auditEvents && auditEvents.length > 0 ? (
            <span className="ml-2 rounded-full bg-white/14 px-2 py-0.5 text-[11px] font-semibold text-white">
              {Math.min(auditEvents.length, 99)}
            </span>
          ) : null}
        </Button>
      </div>

      <Sheet open={mobileActivityLogOpen} onOpenChange={setMobileActivityLogOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[82vh] rounded-t-[28px] border-stone-200 bg-[#fcfaf6] px-0 pb-0"
        >
          <SheetHeader className="border-b border-stone-200/80 px-5 pb-4 pt-5 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
              Audit Trail
            </p>
            <SheetTitle className="flex items-center gap-2 text-stone-950">
              <ScrollText className="h-4 w-4 text-stone-700" aria-hidden="true" />
              Activity Log
            </SheetTitle>
            <SheetDescription>
              Latest guest invite and RSVP activity.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-5 pt-4">
            <ActivityLogList
              key={getAuditEventsVersion(auditEvents)}
              auditEvents={auditEvents}
              maxHeightClassName="max-h-[calc(82vh-7rem)]"
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
