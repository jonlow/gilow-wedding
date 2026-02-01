"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { MoreHorizontal, Mail } from "lucide-react";
import { usePreloadedQuery, useMutation } from "convex/react";
import type { Preloaded } from "convex/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { logout, type AuthUser } from "./auth-actions";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import AddGuestSheet from "./AddGuestSheet";

interface DashboardProps {
  user: AuthUser;
  preloadedGuests: Preloaded<typeof api.guests.listGuests>;
  token: string;
}

export function Dashboard({ user, preloadedGuests, token }: DashboardProps) {
  const guests = usePreloadedQuery(preloadedGuests);
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedGuests, setSelectedGuests] = useState<Array<Id<"guests">>>([]);
  const [mounted, setMounted] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<{
    id: Id<"guests">;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteGuest = useMutation(api.guests.deleteGuest);

  // Prevent hydration errors by only rendering Radix UI components after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDeleteClick = (id: Id<"guests">, name: string) => {
    setGuestToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!guestToDelete) return;
    try {
      setIsDeleting(true);
      await deleteGuest({ token, guestId: guestToDelete.id });
      // Remove from selection if selected
      setSelectedGuests((prev) => prev.filter((id) => id !== guestToDelete.id));
      setDeleteDialogOpen(false);
      setGuestToDelete(null);
    } catch (error) {
      console.error("Failed to delete guest:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isAllSelected = selectedGuests.length === guests.length;
  const isSomeSelected = selectedGuests.length > 0 && !isAllSelected;

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(guests.map((g) => g._id));
    }
  };

  const toggleGuest = (id: Id<"guests">) => {
    setSelectedGuests((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id],
    );
  };

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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Guest List</CardTitle>
                <CardDescription>
                  Manage your wedding guests and their RSVPs
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedGuests.length > 0 && (
                  <>
                    <span className="text-muted-foreground text-sm">
                      {selectedGuests.length} selected
                    </span>
                    <Button size="sm">
                      <Mail className="mr-2 h-4 w-4" />
                      Email Invite
                    </Button>
                  </>
                )}
                {mounted && <AddGuestSheet token={token} />}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12.5">
                    <Checkbox
                      checked={
                        isAllSelected || (isSomeSelected && "indeterminate")
                      }
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plus One</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead className="w-12.5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guests.map((guest) => (
                  <TableRow
                    key={guest._id}
                    data-state={
                      selectedGuests.includes(guest._id)
                        ? "selected"
                        : undefined
                    }
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedGuests.includes(guest._id)}
                        onCheckedChange={() => toggleGuest(guest._id)}
                        aria-label={`Select ${guest.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{guest.name}</TableCell>
                    <TableCell>{guest.email}</TableCell>
                    <TableCell>{guest.plusOne?.trim() || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {guest.slug}
                    </TableCell>
                    <TableCell>{guest.messages?.length ?? 0}</TableCell>
                    <TableCell>
                      {mounted ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() =>
                                navigator.clipboard.writeText(guest.email)
                              }
                            >
                              Copy email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View details</DropdownMenuItem>
                            <DropdownMenuItem>Edit guest</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                handleDeleteClick(guest._id, guest.name)
                              }
                            >
                              Delete guest
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {mounted && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete guest</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <strong className="font-semibold">{guestToDelete?.name}</strong>
                ? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
