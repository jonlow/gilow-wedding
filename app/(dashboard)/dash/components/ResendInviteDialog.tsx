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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestName: string | undefined;
  isSending: boolean;
  onConfirm: () => void;
}

export function ResendInviteDialog({
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
          <AlertDialogTitle>Resend invite?</AlertDialogTitle>
          <AlertDialogDescription>
            <strong className="font-semibold">{guestName}</strong> is already
            marked as invited. Do you want to send the invite again?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isSending}>
            {isSending ? "Sending..." : "Resend invite"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
