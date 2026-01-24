"use client";

import { useState, useTransition, useRef } from "react";
import { submitRsvp } from "./actions";

export function RsvpForm() {
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (isSubmitted) {
    return (
      <div className="pb-8 text-center">
        <p className="heading-3">Thank you!</p>
        <p>Your RSVP has been submitted.</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(formRef.current!);
    setIsSubmitted(true);
    startTransition(async () => {
      await submitRsvp(formData);
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <p className="mb-8">
        RSVP here by checking a box then pressing &quot;SUBMIT&quot;
      </p>

      <div className="mb-8 flex items-center justify-center gap-8 md:gap-12">
        <label className="group flex cursor-pointer items-center gap-3">
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

        <label className="group flex cursor-pointer items-center gap-3">
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
          <span className="heading-2 relative text-3xl leading-none md:top-[-6px] md:text-7xl">
            NO
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-black px-10 py-3 text-lg font-bold tracking-wider text-white uppercase transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50 md:text-2xl"
      >
        SUBMIT
      </button>

      <p className="mt-10">
        Questions? Send them to{" "}
        <a href="mailto:questions@bel&jon.com" className="font-bold">
          questions@bel&amp;jon.com
        </a>
      </p>
    </form>
  );
}
