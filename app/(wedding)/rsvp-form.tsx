"use client";

import { useState, useTransition } from "react";
import { submitRsvp } from "./actions";

type RsvpResponse = "yes" | "no";

interface RsvpFormProps {
  guestSlug: string;
  initialSubmitted: boolean;
  initialResponse: RsvpResponse | null;
}

export function RsvpForm({
  guestSlug,
  initialSubmitted,
  initialResponse,
}: RsvpFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(initialSubmitted);
  const [selectedResponse, setSelectedResponse] = useState<RsvpResponse>(
    initialResponse ?? "yes",
  );
  const [error, setError] = useState<string | null>(null);

  if (isSubmitted) {
    return (
      <div className="pb-16 text-center">
        <p className="heading-3">Thank you!</p>
        <p>Your RSVP has been submitted.</p>
        <p className="mt-4 text-xs">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsSubmitted(false);
            }}
            disabled={isPending}
            className="cursor-pointer underline transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            Click here
          </button>
          {" "}to change your RSVP
        </p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submittedResponse = selectedResponse;
    const formData = new FormData();
    formData.set("guestSlug", guestSlug);
    formData.set("response", submittedResponse);
    setError(null);
    setIsSubmitted(true);
    startTransition(async () => {
      try {
        await submitRsvp(formData);
        setSelectedResponse(submittedResponse);
      } catch (submitError) {
        console.error("Failed to submit RSVP:", submitError);
        setIsSubmitted(false);
        setSelectedResponse(submittedResponse);
        setError("Could not submit RSVP. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="guestSlug" value={guestSlug} />
      <p className="mb-16">
        RSVP here by checking a box then pressing &quot;SUBMIT&quot;
      </p>

      <div className="mb-16 flex items-center justify-center gap-8 md:gap-24">
        <label className="group flex w-[132px] cursor-pointer items-center justify-center gap-4 md:w-[220px] md:gap-6">
          <span className="relative">
            <input
              type="radio"
              name="response"
              value="yes"
              checked={selectedResponse === "yes"}
              onChange={() => setSelectedResponse("yes")}
              tabIndex={0}
              className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <span className="checkbox-custom peer-focus-visible:ring-2 peer-focus-visible:ring-black peer-focus-visible:ring-offset-2" />
          </span>
          <span className="heading-2 relative text-3xl leading-none md:top-[-6px] md:text-7xl">
            YES
          </span>
        </label>

        <label className="group flex w-[132px] cursor-pointer items-center justify-center gap-4 md:w-[220px] md:gap-6">
          <span className="relative">
            <input
              type="radio"
              name="response"
              value="no"
              checked={selectedResponse === "no"}
              onChange={() => setSelectedResponse("no")}
              tabIndex={0}
              className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <span className="checkbox-custom peer-focus-visible:ring-2 peer-focus-visible:ring-black peer-focus-visible:ring-offset-2" />
          </span>
          <span className="relative flex items-center">
            <span className="heading-2 relative text-3xl leading-none md:top-[-6px] md:text-7xl">
              NO
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-full top-1/2 ml-2 inline-flex -translate-y-1/2 items-center justify-center text-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 md:ml-3 md:text-4xl"
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
