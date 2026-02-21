"use client";

import { useState, useEffect, useRef } from "react";
import { MoreHorizontal, Mail, Copy, Check } from "lucide-react";
import { useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useAuthToken } from "../hooks/useAuthToken";
import AddGuestSheet from "../AddGuestSheet";
import { EditGuestSheet } from "../EditGuestSheet";
import { DeleteGuestDialog } from "./DeleteGuestDialog";

type Guest = {
  _id: Id<"guests">;
  _creationTime: number;
  attending?: boolean;
  name: string;
  email: string;
  slug: string;
  plusOne?: string;
  messages?: string[];
};

interface GuestTableProps {
  guests: Guest[];
}

export function GuestTable({ guests }: GuestTableProps) {
  const token = useAuthToken();
  const [selectedGuests, setSelectedGuests] = useState<Array<Id<"guests">>>([]);
  const [mounted, setMounted] = useState(false);
  const [copiedGuestId, setCopiedGuestId] = useState<Id<"guests"> | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<{
    id: Id<"guests">;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [guestToEdit, setGuestToEdit] = useState<Guest | null>(null);
  const copiedResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deleteGuest = useMutation(api.guests.deleteGuest);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (copiedResetTimeout.current) {
        clearTimeout(copiedResetTimeout.current);
      }
    };
  }, []);

  const handleDeleteClick = (id: Id<"guests">, name: string) => {
    setGuestToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (guest: Guest) => {
    setGuestToEdit(guest);
    setEditSheetOpen(true);
  };

  const confirmDelete = async () => {
    if (!guestToDelete) return;
    try {
      setIsDeleting(true);
      await deleteGuest({ token, guestId: guestToDelete.id });
      setSelectedGuests((prev) => prev.filter((id) => id !== guestToDelete.id));
      setDeleteDialogOpen(false);
      setGuestToDelete(null);
    } catch (error) {
      console.error("Failed to delete guest:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isAllSelected =
    guests.length > 0 && selectedGuests.length === guests.length;
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

  const handleCopyGuestUrl = async (slug: string, guestId: Id<"guests">) => {
    const normalizedSlug = slug.replace(/^\/+/, "");
    const guestUrl = `${window.location.origin}/${normalizedSlug}`;

    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopiedGuestId(guestId);

      if (copiedResetTimeout.current) {
        clearTimeout(copiedResetTimeout.current);
      }

      copiedResetTimeout.current = setTimeout(() => {
        setCopiedGuestId(null);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy guest URL:", error);
    }
  };

  return (
    <>
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
              <AddGuestSheet />
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
                <TableHead>RSVP</TableHead>
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
                    selectedGuests.includes(guest._id) ? "selected" : undefined
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
                  <TableCell>
                    {guest.attending === true
                      ? "Yes"
                      : guest.attending === false
                        ? "No"
                        : "No response"}
                  </TableCell>
                  <TableCell>{guest.plusOne?.trim() || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">
                    <div className="flex items-center gap-1">
                      <span>{guest.slug}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyGuestUrl(guest.slug, guest._id)}
                        aria-label={
                          copiedGuestId === guest._id
                            ? `Copied link for ${guest.name}`
                            : `Copy guest link for ${guest.name}`
                        }
                        title={
                          copiedGuestId === guest._id
                            ? "Copied"
                            : "Copy guest link"
                        }
                        disabled={!mounted}
                      >
                        {copiedGuestId === guest._id ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span className="sr-only">
                          {copiedGuestId === guest._id
                            ? "Copied guest link"
                            : "Copy guest link"}
                        </span>
                      </Button>
                    </div>
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
                          <DropdownMenuItem
                            onClick={() => handleEditClick(guest)}
                          >
                            Edit guest
                          </DropdownMenuItem>
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
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled>
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

      <DeleteGuestDialog
        open={deleteDialogOpen && mounted}
        onOpenChange={setDeleteDialogOpen}
        guestName={guestToDelete?.name}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
      />

      <EditGuestSheet
        open={editSheetOpen && mounted}
        onOpenChange={setEditSheetOpen}
        guest={guestToEdit}
      />
    </>
  );
}
