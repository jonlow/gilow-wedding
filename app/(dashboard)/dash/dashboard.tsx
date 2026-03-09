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
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Signing out..." : "Sign Out"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="grid gap-6">
          <DashboardStats
            guests={isLoggingOut ? cachedGuests : guests}
            auditEvents={auditEvents}
          />
          <GuestTable guests={isLoggingOut ? cachedGuests : guests} />
        </div>

        <ActivityLogSidebar auditEvents={auditEvents} />
      </div>
    </div>
  );
}
