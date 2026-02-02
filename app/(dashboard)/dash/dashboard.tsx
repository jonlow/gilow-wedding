"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePreloadedQuery } from "convex/react";
import type { Preloaded } from "convex/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logout, type AuthUser } from "./auth-actions";
import { api } from "@/convex/_generated/api";
import { AuthProvider } from "./hooks/useAuthToken";
import { UserInfoCard, GuestTable } from "./components";

interface DashboardProps {
  user: AuthUser;
  preloadedGuests: Preloaded<typeof api.guests.listGuests>;
  token: string;
}

export function Dashboard({ user, preloadedGuests, token }: DashboardProps) {
  return (
    <AuthProvider token={token}>
      <DashboardContent user={user} preloadedGuests={preloadedGuests} />
    </AuthProvider>
  );
}

interface DashboardContentProps {
  user: AuthUser;
  preloadedGuests: Preloaded<typeof api.guests.listGuests>;
}

function DashboardContent({ user, preloadedGuests }: DashboardContentProps) {
  const guests = usePreloadedQuery(preloadedGuests);
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [cachedGuests, setCachedGuests] = useState(guests);

  useEffect(() => {
    if (!isLoggingOut) {
      setCachedGuests(guests);
    }
  }, [guests, isLoggingOut]);

  const handleLogout = async () => {
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

      <div className="grid gap-6">
        <UserInfoCard user={user} />

        <GuestTable guests={isLoggingOut ? cachedGuests : guests} />
      </div>
    </div>
  );
}
