"use client";

import { useState, useTransition, useRef } from "react";
import { submitRsvp } from "./actions";

interface RsvpFormProps {
  guestSlug: string;
}

export function RsvpForm({ guestSlug }: RsvpFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (isSubmitted) {
    return (
      <div className="pb-16 text-center">
        <p className="heading-3">Thank you!</p>
        <p>Your RSVP has been submitted.</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(formRef.current!);
    setError(null);
    startTransition(async () => {
      try {
        await submitRsvp(formData);
        setIsSubmitted(true);
      } catch (submitError) {
        console.error("Failed to submit RSVP:", submitError);
        setError("Could not submit RSVP. Please try again.");
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <input type="hidden" name="guestSlug" value={guestSlug} />
      <p className="mb-16">
        RSVP here by checking a box then pressing &quot;SUBMIT&quot;
      </p>

      <div className="mb-16 flex items-center justify-center gap-16 md:gap-24">
        <label className="group flex cursor-pointer items-center gap-6">
          <span className="relative">
            <input
              type="radio"
              name="response"
              value="yes"
              defaultChecked
              tabIndex={0}
              className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <span className="checkbox-custom peer-focus-visible:ring-2 peer-focus-visible:ring-black peer-focus-visible:ring-offset-2" />
          </span>
          <span className="heading-2 relative text-3xl leading-none md:top-[-6px] md:text-7xl">
            YES
          </span>
        </label>

        <label className="group flex cursor-pointer items-center gap-6">
          <span className="relative">
            <input
              type="radio"
              name="response"
              value="no"
              tabIndex={0}
              className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <span className="checkbox-custom peer-focus-visible:ring-2 peer-focus-visible:ring-black peer-focus-visible:ring-offset-2" />
          </span>
          <span className="flex items-center gap-2">
            <span className="heading-2 relative text-3xl leading-none md:top-[-6px] md:text-7xl">
              NO
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none relative -top-[2px] inline-flex w-8 items-center justify-center text-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 md:w-12 md:text-4xl"
            >
              😢
            </span>
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-black px-20 py-6 pb-[26px] text-2xl font-bold text-white uppercase transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50 md:text-[34px]"
      >
        SUBMIT
      </button>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <p className="mt-20">
        Questions? Send them to{" "}
        <a href="mailto:howdy@belandjon.com" className="font-bold">
          howdy@belandjon.com
        </a>
      </p>
    </form>
  );
}
