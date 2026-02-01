"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
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
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  slug: z.string().min(1, {
    message: "Slug is required.",
  }),
  plusOne: z.string().optional(),
});

interface AddGuestSheetProps {
  token: string;
}

export default function AddGuestSheet({ token }: AddGuestSheetProps) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<z.infer<
    typeof formSchema
  > | null>(null);
  const [duplicates, setDuplicates] = useState<{
    slug?: boolean;
    email?: boolean;
  } | null>(null);
  const [isForceSubmitting, setIsForceSubmitting] = useState(false);
  const addGuest = useMutation(api.guests.addGuest);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      slug: "",
      plusOne: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const result = await addGuest({
        token,
        name: values.name,
        email: values.email,
        slug: values.slug,
        plusOne: values.plusOne || undefined,
        force: false,
      });

      if (result.status === "duplicate") {
        setPendingValues(values);
        setDuplicates(result.duplicates ?? null);
        setConfirmOpen(true);
        return;
      }

      // Reset form and close sheet
      form.reset();
      setOpen(false);
      setPendingValues(null);
      setDuplicates(null);
    } catch (error) {
      console.error("Failed to add guest:", error);
      // You could add error handling UI here
    }
  }

  const confirmCreate = async () => {
    if (!pendingValues) return;
    try {
      setIsForceSubmitting(true);
      const result = await addGuest({
        token,
        name: pendingValues.name,
        email: pendingValues.email,
        slug: pendingValues.slug,
        plusOne: pendingValues.plusOne || undefined,
        force: true,
      });

      if (result.status === "created") {
        form.reset();
        setOpen(false);
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
  const duplicateLabel = duplicateFields.length
    ? duplicateFields.join(" and ")
    : "details";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Guest
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Add New Guest</SheetTitle>
          <SheetDescription>
            Add a new guest to your wedding guest list.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col"
          >
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormDescription>
                      The full name of the guest.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The guest's email address.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="john-doe" {...field} />
                    </FormControl>
                    <FormDescription>
                      A unique identifier for the guest (lowercase, hyphenated).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plusOne"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plus One (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormDescription>
                      Name of the guest's plus one, if applicable.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter className="flex-col gap-3 pt-6 sm:flex-col">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create Guest"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
            </SheetFooter>
          </form>
        </Form>
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
    </Sheet>
  );
}
