"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";

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
  attending: z.enum(["pending", "yes", "no"]),
  inviteSent: z.boolean(),
  messages: z.string().optional(),
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
  defaultValues = {
    name: "",
    email: "",
    slug: "",
    plusOne: "",
    attending: "pending",
    inviteSent: false,
    messages: "",
  },
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
                <FormDescription>The guest&apos;s email address.</FormDescription>
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
                  Name of the guest&apos;s plus one, if applicable.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="attending"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RSVP Status</FormLabel>
                <FormControl>
                  <select
                    className="border-input bg-background ring-offset-background focus-visible:ring-ring focus-visible:ring-offset-background h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  >
                    <option value="pending">No response</option>
                    <option value="yes">Attending</option>
                    <option value="no">Not attending</option>
                  </select>
                </FormControl>
                <FormDescription>
                  Current RSVP status for this guest.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="inviteSent"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-3 rounded-md border p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel>Invite sent</FormLabel>
                    <FormDescription>
                      Mark whether this guest has already been invited.
                    </FormDescription>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="messages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Messages (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="One message per line"
                    rows={4}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormDescription>
                  Notes from this guest. Use one line per message.
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
