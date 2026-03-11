"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePreloadedQuery, useQuery } from "convex/react";
import type { Preloaded } from "convex/react";
import { Button } from "@/components/ui/button";
import { logout, type AuthUser } from "./auth-actions";
import { api } from "@/convex/_generated/api";
import { AuthProvider } from "./hooks/useAuthToken";
import { ActivityLogSidebar, DashboardStats, GuestTable } from "./components";

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

          <ActivityLogSidebar auditEvents={auditEvents} />
        </div>
      </div>
    </div>
  );
}
