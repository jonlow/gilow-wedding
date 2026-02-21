"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { GuestForm, type GuestFormValues } from "./GuestForm";

interface AddGuestSheetContentProps {
  onClose: () => void;
}

function toAttendingValue(attending: GuestFormValues["attending"]) {
  if (attending === "yes") return true;
  if (attending === "no") return false;
  return undefined;
}

function toMessagesArray(messages?: string) {
  const parsed = (messages ?? "")
    .split(/\r?\n/)
    .map((message) => message.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : undefined;
}

export function AddGuestSheetContent({ onClose }: AddGuestSheetContentProps) {
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
  const addGuest = useMutation(api.guests.addGuest);

  async function onSubmit(values: GuestFormValues) {
    try {
      const plusOne = values.plusOne?.trim() || undefined;
      const result = await addGuest({
        token,
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

      onClose();
      setPendingValues(null);
      setDuplicates(null);
    } catch (error) {
      console.error("Failed to add guest:", error);
    }
  }

  const confirmCreate = async () => {
    if (!pendingValues) return;
    try {
      setIsForceSubmitting(true);
      const plusOne = pendingValues.plusOne?.trim() || undefined;
      const result = await addGuest({
        token,
        name: pendingValues.name,
        email: pendingValues.email,
        slug: pendingValues.slug,
        plusOne,
        attending: toAttendingValue(pendingValues.attending),
        inviteSent: pendingValues.inviteSent,
        messages: toMessagesArray(pendingValues.messages),
        force: true,
      });

      if (result.status === "created") {
        onClose();
        setConfirmOpen(false);
        setPendingValues(null);
        setDuplicates(null);
      }
    } catch (error) {
      console.error("Failed to add guest:", error);
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
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Add New Guest</SheetTitle>
          <SheetDescription>
            Add a new guest to your wedding guest list.
          </SheetDescription>
        </SheetHeader>
        <GuestForm
          onSubmit={onSubmit}
          submitLabel="Create Guest"
          submittingLabel="Creating..."
        />
      </SheetContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate detected</AlertDialogTitle>
            <AlertDialogDescription>
              A guest already exists with the same{" "}
              {duplicateFields.map((field, i) => (
                <span key={field}>
                  {i > 0 && " and "}
                  <strong className="font-semibold">{field}</strong>
                </span>
              ))}
              . Do you want to create this guest anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConfirmOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCreate}
              disabled={isForceSubmitting}
            >
              {isForceSubmitting ? "Creating..." : "Create anyway"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
