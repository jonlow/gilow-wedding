"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthToken } from "./hooks/useAuthToken";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { GuestForm, type GuestFormValues } from "./GuestForm";

interface EditGuestSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: {
    _id: Id<"guests">;
    name: string;
    email: string;
    slug: string;
    attending?: boolean;
    inviteSent: boolean;
    plusOne?: string;
    messages?: string[];
  } | null;
}

function toAttendingValue(attending: GuestFormValues["attending"]) {
  if (attending === "yes") return true;
  if (attending === "no") return false;
  return undefined;
}

function fromAttendingValue(attending?: boolean): GuestFormValues["attending"] {
  if (attending === true) return "yes";
  if (attending === false) return "no";
  return "pending";
}

function toMessagesArray(messages?: string) {
  const parsed = (messages ?? "")
    .split(/\r?\n/)
    .map((message) => message.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : undefined;
}

export function EditGuestSheet({
  open,
  onOpenChange,
  guest,
}: EditGuestSheetProps) {
  const token = useAuthToken();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<GuestFormValues | null>(
    null,
  );
  const [duplicates, setDuplicates] = useState<{
    slug?: boolean;
    email?: boolean;
  } | null>(null);
  const [isForceSubmitting, setIsForceSubmitting] = useState(false);
  const updateGuest = useMutation(api.guests.updateGuest);

  if (!guest) return null;

  const handleSubmit = async (values: GuestFormValues) => {
    try {
      const plusOne = values.plusOne?.trim() || undefined;
      const result = await updateGuest({
        token,
        guestId: guest._id,
        name: values.name,
        email: values.email,
        slug: values.slug,
        plusOne,
        attending: toAttendingValue(values.attending),
        inviteSent: values.inviteSent,
        messages: toMessagesArray(values.messages),
        force: false,
      });

      if (result.status === "duplicate") {
        setPendingValues(values);
        setDuplicates(result.duplicates ?? null);
        setConfirmOpen(true);
        return;
      }

      if (result.status === "updated") {
        toast.success(`${values.name} was updated.`);
      }
      onOpenChange(false);
      setPendingValues(null);
      setDuplicates(null);
    } catch (error) {
      console.error("Failed to update guest:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update guest",
      );
    }
  };

  const confirmUpdate = async () => {
    if (!pendingValues) return;
    try {
      setIsForceSubmitting(true);
      const plusOne = pendingValues.plusOne?.trim() || undefined;
      const result = await updateGuest({
        token,
        guestId: guest._id,
        name: pendingValues.name,
        email: pendingValues.email,
        slug: pendingValues.slug,
        plusOne,
        attending: toAttendingValue(pendingValues.attending),
        inviteSent: pendingValues.inviteSent,
        messages: toMessagesArray(pendingValues.messages),
        force: true,
      });

      if (result.status === "updated") {
        toast.success(`${pendingValues.name} was updated.`);
        onOpenChange(false);
        setConfirmOpen(false);
        setPendingValues(null);
        setDuplicates(null);
      }
    } catch (error) {
      console.error("Failed to update guest:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update guest",
      );
    } finally {
      setIsForceSubmitting(false);
    }
  };

  const duplicateFields = [
    duplicates?.email ? "email" : undefined,
    duplicates?.slug ? "slug" : undefined,
  ].filter(Boolean);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Edit Guest</SheetTitle>
            <SheetDescription>
              Update the details for {guest.name}.
            </SheetDescription>
          </SheetHeader>
          <GuestForm
            key={guest._id}
            defaultValues={{
              name: guest.name,
              email: guest.email,
              slug: guest.slug,
              plusOne: guest.plusOne ?? "",
              attending: fromAttendingValue(guest.attending),
              inviteSent: guest.inviteSent,
              messages: guest.messages?.join("\n") ?? "",
            }}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
            submittingLabel="Saving..."
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate detected</AlertDialogTitle>
            <AlertDialogDescription>
              Another guest already exists with the same{" "}
              {duplicateFields.map((field, i) => (
                <span key={field}>
                  {i > 0 && " and "}
                  <strong className="font-semibold">{field}</strong>
                </span>
              ))}
              . Do you want to save these changes anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUpdate}
              disabled={isForceSubmitting}
            >
              {isForceSubmitting ? "Saving..." : "Save anyway"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
