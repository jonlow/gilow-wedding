import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AuthUser } from "../auth-actions";

interface UserInfoCardProps {
  user: AuthUser;
}

export function UserInfoCard({ user }: UserInfoCardProps) {
  const formattedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome, {user.displayName}!</CardTitle>
        <CardDescription>
          You are successfully logged in to the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm">User ID</p>
            <p className="text-sm" title={user.id}>
              {user.id}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Username</p>
            <p className="text-sm">{user.username}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Display Name</p>
            <p className="text-sm">{user.displayName}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Role</p>
            <p className="text-sm capitalize">{user.role}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground text-sm">Account Created</p>
            <p className="text-sm">{formattedDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
