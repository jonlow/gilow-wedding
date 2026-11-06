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

interface ResendInviteDialogProps {
  emailKind?: "invite" | "update";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestName: string | undefined;
  isSending: boolean;
  onConfirm: () => void;
}

export function ResendInviteDialog({
  emailKind = "invite",
  open,
  onOpenChange,
  guestName,
  isSending,
  onConfirm,
}: ResendInviteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resend {emailKind}?</AlertDialogTitle>
          <AlertDialogDescription>
            <strong className="font-semibold">{guestName}</strong> has already
            been sent an {emailKind}. Do you want to send it again?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isSending}>
            {isSending ? "Sending..." : `Resend ${emailKind}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
