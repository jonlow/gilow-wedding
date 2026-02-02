"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { SheetFooter, SheetClose } from "@/components/ui/sheet";
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

// Form validation schema - exported for reuse
export const guestFormSchema = z.object({
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

export type GuestFormValues = z.infer<typeof guestFormSchema>;

interface GuestFormProps {
  defaultValues?: GuestFormValues;
  onSubmit: (values: GuestFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
}

export function GuestForm({
  defaultValues = { name: "", email: "", slug: "", plusOne: "" },
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Save",
  submittingLabel = "Saving...",
}: GuestFormProps) {
  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestFormSchema),
    defaultValues,
  });

  const handleSubmit = async (values: GuestFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
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
                <FormDescription>The full name of the guest.</FormDescription>
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
                <FormDescription>The guest's email address.</FormDescription>
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
          <Button
            type="submit"
            disabled={isSubmitting || form.formState.isSubmitting}
          >
            {isSubmitting || form.formState.isSubmitting
              ? submittingLabel
              : submitLabel}
          </Button>
          <SheetClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                onCancel?.();
              }}
            >
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </form>
    </Form>
  );
}
