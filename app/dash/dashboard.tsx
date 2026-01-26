"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logout, type AuthUser } from "./auth-actions";

interface DashboardProps {
  user: AuthUser;
}

export function Dashboard({ user }: DashboardProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const formattedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.refresh();
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user.displayName}!</CardTitle>
            <CardDescription>
              You are successfully logged in to the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-muted-foreground font-medium">User ID</p>
                <p className="font-mono">{user.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-medium">Username</p>
                <p>{user.username}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-medium">
                  Display Name
                </p>
                <p>{user.displayName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-medium">Role</p>
                <p className="capitalize">{user.role}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-muted-foreground font-medium">
                  Account Created
                </p>
                <p>{formattedDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>
              Overview of your wedding dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is where you can add more dashboard functionality in the
              future, such as guest management, RSVP tracking, etc.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
