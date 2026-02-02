"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>
              Overview of your wedding dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              This is where you can add more dashboard functionality in the
              future, such as guest management, RSVP tracking, etc.
            </p>
          </CardContent>
        </Card>

        <GuestTable guests={guests} />
      </div>
    </div>
  );
}
