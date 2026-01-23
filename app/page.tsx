import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* Hero section with red background column */}
      <div className="relative">
        {/* Red column background - centered, max 1200px, extends down behind the image overlap */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 flex justify-center">
          <div className="bg-red w-full max-w-[1200px]" />
        </div>

        {/* Content container */}
        <div className="relative">
          {/* Text content - constrained to red column */}
          <div className="relative mx-auto max-w-[1200px] px-2 pt-9 text-center md:px-6">
            <p className="font-bold text-black">Hi Name</p>
            <h1 className="heading-1 mt-6 text-black uppercase">
              Bel &amp; Jon
              <br />
              are getting
              <br />
              married!
            </h1>
            <Image
              src="/APNG/cloud1.png"
              alt="Cloud"
              width={147}
              height={103}
              priority
              className="absolute -right-6 bottom-[-5%] h-auto w-[99px] xl:-right-10 xl:bottom-[10%] xl:w-[147px]"
            />
          </div>

          <div className="relative right-1/2 left-1/2 -mx-[50vw] flex w-screen justify-center overflow-hidden">
            <Image
              src="/APNG/people.png"
              alt="Wedding celebration illustration"
              width={1920}
              height={448}
              className="w-full max-w-[1920px] min-w-[1286px] object-contain"
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
