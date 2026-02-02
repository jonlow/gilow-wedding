"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { AddGuestSheetContent } from "./AddGuestSheetContent";

export default function AddGuestSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Guest
        </Button>
      </SheetTrigger>
      <AddGuestSheetContent onClose={() => setOpen(false)} />
    </Sheet>
  );
}
