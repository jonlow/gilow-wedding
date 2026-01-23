import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero section with red background column */}
      <div className="relative">
        {/* Red column background - centered, max 1200px, extends down behind the image overlap */}
        <div className="absolute inset-x-0 top-0 bottom-0 flex justify-center pointer-events-none">
          <div className="w-full max-w-[1200px] bg-red" />
        </div>

        {/* Content container */}
        <div className="relative">
          {/* Text content - constrained to red column */}
          <div className="mx-auto max-w-[1200px] px-8 pt-12 text-center">
            <p className="text-lg font-bold text-black">Hi Name</p>
            <h1 className="heading-1 mt-6 text-black uppercase leading-tight">
              Bel &amp; Jon
              <br />
              are getting
              <br />
              married!
            </h1>
          </div>

          {/* Full-bleed image - breaks out to full viewport width, max 1920px centered */}
          {/* Scales down with viewport, but stops shrinking at ~300px height (min-w-[1286px]) */}
          <div className="relative left-1/2 right-1/2 -mx-[50vw] mt-8 w-screen flex justify-center overflow-hidden">
            <Image
              src="/APNG/people.png"
              alt="Wedding celebration illustration"
              width={1920}
              height={448}
              className="w-full min-w-[1286px] max-w-[1920px] object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* Content below the hero */}
      <div className="mx-auto max-w-[1200px] px-8 py-12 text-center">
        <p className="text-lg">and we&apos;d love you to be there</p>
      </div>
    </div>
  );
}
