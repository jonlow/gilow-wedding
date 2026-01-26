"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";

interface User {
  id: Id<"dashUsers">;
  username: string;
  displayName: string;
  role: string;
  createdAt: number;
}

interface DashboardProps {
  user: User;
  onLogout: () => Promise<void>;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const formattedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button variant="outline" onClick={onLogout}>
            Sign Out
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
                <p className="text-muted-foreground text-sm font-medium">
                  User ID
                </p>
                <p className="font-mono text-sm">{user.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm font-medium">
                  Username
                </p>
                <p>{user.username}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm font-medium">
                  Display Name
                </p>
                <p>{user.displayName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm font-medium">
                  Role
                </p>
                <p className="capitalize">{user.role}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-muted-foreground text-sm font-medium">
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
