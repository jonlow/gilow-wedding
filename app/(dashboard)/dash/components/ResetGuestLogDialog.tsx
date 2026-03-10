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

interface ResetGuestLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestName: string | undefined;
  isResetting: boolean;
  onConfirm: () => void;
}

export function ResetGuestLogDialog({
  open,
  onOpenChange,
  guestName,
  isResetting,
  onConfirm,
}: ResetGuestLogDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset guest audit log</AlertDialogTitle>
          <AlertDialogDescription>
            Clear every audit event for{" "}
            <strong className="font-semibold">{guestName}</strong>? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isResetting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isResetting ? "Resetting..." : "Reset log"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
