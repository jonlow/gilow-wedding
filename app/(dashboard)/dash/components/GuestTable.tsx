"use client";

import { useState, useEffect, useRef } from "react";
import { MoreHorizontal, Mail, Copy, Check, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useMutation } from "convex/react";
import { toast } from "sonner";
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
import { EditGuestSheet } from "../EditGuestSheet";
import { DeleteGuestDialog } from "./DeleteGuestDialog";
import { ResendInviteDialog } from "./ResendInviteDialog";
import { BulkGuestImport } from "./BulkGuestImport";

const AddGuestSheet = dynamic(() => import("../AddGuestSheet"), {
  ssr: false,
  loading: () => (
    <Button disabled>
      <Plus className="mr-2 h-4 w-4" />
      Add Guest
    </Button>
  ),
});

type Guest = {
  _id: Id<"guests">;
  _creationTime: number;
  attending?: boolean;
  inviteSent: boolean;
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
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [guestToResend, setGuestToResend] = useState<Guest | null>(null);
  const [sendingInviteGuestId, setSendingInviteGuestId] =
    useState<Id<"guests"> | null>(null);
  const [activeTab, setActiveTab] = useState<"guests" | "import">("guests");
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

  const handleResendDialogOpenChange = (open: boolean) => {
    setResendDialogOpen(open);
    if (!open) {
      setGuestToResend(null);
    }
  };

  const confirmDelete = async () => {
    if (!guestToDelete) return;
    const deletedGuestName = guestToDelete.name;
    try {
      setIsDeleting(true);
      await deleteGuest({ token, guestId: guestToDelete.id });
      setSelectedGuests((prev) => prev.filter((id) => id !== guestToDelete.id));
      setDeleteDialogOpen(false);
      setGuestToDelete(null);
      toast.success(`${deletedGuestName} was deleted.`);
    } catch (error) {
      console.error("Failed to delete guest:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete guest",
      );
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

  const sendInvite = async (guest: Guest) => {
    if (sendingInviteGuestId) return;

    try {
      setSendingInviteGuestId(guest._id);
      const normalizedSlug = guest.slug.replace(/^\/+/, "");
      const buttonLink = `${window.location.origin}/${normalizedSlug}`;

      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          guestId: guest._id,
          name: guest.name,
          email: guest.email,
          slug: guest.slug,
          plusOne: guest.plusOne,
          buttonLink,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error || "Failed to send invite");
      }

      toast.success(`Invite sent to ${guest.name}.`);
    } catch (error) {
      console.error("Failed to send invite:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send invite",
      );
    } finally {
      setSendingInviteGuestId(null);
    }
  };

  const handleSendInvite = (guest: Guest) => {
    if (sendingInviteGuestId) return;

    if (guest.inviteSent) {
      setGuestToResend(guest);
      setResendDialogOpen(true);
      return;
    }

    void sendInvite(guest);
  };

  const confirmResendInvite = () => {
    if (!guestToResend) return;

    const guest = guestToResend;
    setResendDialogOpen(false);
    setGuestToResend(null);
    void sendInvite(guest);
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
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={activeTab === "guests" ? "default" : "outline"}
              onClick={() => setActiveTab("guests")}
            >
              Guest table
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "import" ? "default" : "outline"}
              onClick={() => setActiveTab("import")}
            >
              Bulk import CSV
            </Button>
          </div>

          {activeTab === "guests" ? (
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
                  <TableHead>Invite Sent</TableHead>
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
                    <TableCell>{guest.inviteSent ? "Yes" : "No"}</TableCell>
                    <TableCell>{guest.plusOne?.trim() || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-1">
                        <span>{guest.slug}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            handleCopyGuestUrl(guest.slug, guest._id)
                          }
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
                              onClick={() => handleSendInvite(guest)}
                              disabled={sendingInviteGuestId === guest._id}
                            >
                              {sendingInviteGuestId === guest._id
                                ? "Sending invite..."
                                : "Send invite"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditClick(guest)}
                            >
                              Edit guest
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

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
          ) : (
            <BulkGuestImport />
          )}
        </CardContent>
      </Card>

      <ResendInviteDialog
        open={resendDialogOpen && mounted}
        onOpenChange={handleResendDialogOpenChange}
        guestName={guestToResend?.name}
        isSending={Boolean(sendingInviteGuestId)}
        onConfirm={confirmResendInvite}
      />

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
