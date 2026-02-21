import Image from "next/image";
import { RsvpForm } from "./rsvp-form";

type WeddingPageContentProps = {
  guestName: string;
  guestSlug: string;
  plusOneName?: string;
};

export function WeddingPageContent({
  guestName,
  guestSlug,
  plusOneName,
}: WeddingPageContentProps) {
  const plusOneDisplayName = plusOneName?.trim();

  return (
    <div className="wedding-content min-h-screen overflow-x-hidden bg-white">
      {/* Hero section with red background column */}
      <div className="relative">
        {/* Red column background - centered, max 1200px, extends down behind the image overlap */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 flex justify-center">
          <div className="bg-red w-full max-w-300" />
        </div>

        {/* Content container */}
        <div className="relative">
          {/* Text content - constrained to red column */}
          <div className="relative mx-auto max-w-300 px-4 pt-18 text-center md:px-12">
            <p className="font-bold text-black">
              Hi {guestName}
              {plusOneDisplayName ? ` & ${plusOneDisplayName}` : ""}
            </p>
            <h1 className="heading-1 mt-10 text-black uppercase">
              Bel &amp; Jon
              <br />
              are getting
              <br />
              married!
            </h1>
            <Image
              src="/APNG/cloud1.png"
              alt="Cloud"
              unoptimized
              width={147}
              height={103}
              preload
              className="absolute bottom-[65%] -left-12 h-auto w-[99px] lg:bottom-[60%] lg:-left-20 lg:w-[147px]"
            />
          </div>

          {/* Peopl */}
          <div className="relative right-1/2 left-1/2 -mx-[50vw] flex w-screen justify-center overflow-hidden">
            <Image
              src="/APNG/people.png"
              unoptimized
              alt="Wedding celebration illustration"
              width={1920}
              height={448}
              className="w-full min-w-[1286px] object-contain md:min-w-[1920px]"
              preload={true}
            />
          </div>
        </div>
      </div>

      {/* Content below the hero */}
      <div className="mx-auto max-w-300 px-8 py-10 text-center">
        <p>and we&apos;d love you to be there</p>
      </div>

      <div className="prose-narrow bg-yellow relative mx-auto mb-12.5 max-w-300 px-4 pt-18 pb-12 text-center md:mb-17.5 md:px-12 md:pb-12">
        <Image
          src="/APNG/cloud1.png"
          alt="Cloud"
          unoptimized
          width={147}
          height={103}
          preload
          className="absolute top-[-5%] -right-12 h-auto w-[99px] lg:top-[10%] lg:-right-20 lg:w-[147px]"
        />
        <p>
          We’re gathering our favourite people for a relaxed backyard wedding
          filled with family, food, music and celebration.
        </p>
        <p className="heading-3">SAT, 21ST NOV 2026</p>
        <p>
          It will begin with a traditional Lao ceremony, followed by an
          afternoon and evening of eating, drinking and celebrating together.
        </p>
        <p>Dress comfortably the celebration will be mostly outdoors. </p>
        <p>
          No gifts! As part of the ceremony you will be invited to offer a
          blessing. Some may choose to include a small monetary gift as part of
          this tradition.
        </p>

        <Image
          src="/APNG/cloud4.png"
          alt="Cloud"
          unoptimized
          width={100}
          height={46}
          priority
          className="lg:bottom[10%] absolute bottom-[10%] -left-4 h-auto w-15 lg:-left-12 lg:w-[100px]"
        />
      </div>

      <div className="prose-narrow bg-blue relative mx-auto mb-12.5 max-w-300 px-4 pt-18 pb-12 text-center md:mb-17.5 md:px-12 md:pb-12">
        <p className="heading-3">IT STARTS AT 12PM UNTIL LATE</p>

        <p>4 Archer Place Mill Park 3082 VIC</p>
        <p>
          If you need help with travel arrangements, please contact us and we’ll
          help you out.
        </p>

        <Image
          src="/APNG/cloud3.png"
          alt="Cloud"
          unoptimized
          width={168}
          height={88}
          priority
          className="absolute -right-12 bottom-[10%] h-auto w-[120px] lg:-right-20 lg:bottom-[15%] lg:w-[168px]"
        />
      </div>

      <div className="prose-narrow bg-green relative mx-auto max-w-300 px-4 pt-18 pb-15 text-center text-black md:px-12 md:pb-17">
        <p>Please let us know you can make it by</p>
        <p className="heading-3">20.05.26</p>
      </div>

      {/* RSVP Section */}
      <div className="prose-narrow relative mx-auto max-w-300 px-4 pt-18 text-center text-black md:px-12">
        <RsvpForm guestSlug={guestSlug} />
        <Image
          src="/APNG/cheers.png"
          alt="Cheers celebration illustration"
          width={714}
          height={316}
          className="mx-auto mt-6 w-full max-w-[714px] object-contain"
        />
      </div>
    </div>
  );
}
