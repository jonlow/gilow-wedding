import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* Hero section with red background column */}
      <div className="relative">
        {/* Red column background - centered, max 1200px, extends down behind the image overlap */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 flex justify-center">
          <div className="bg-red w-full max-w-150" />
        </div>

        {/* Content container */}
        <div className="relative">
          {/* Text content - constrained to red column */}
          <div className="relative mx-auto max-w-150 px-2 pt-9 text-center md:px-6">
            <p className="font-bold text-black">Hi Name</p>
            <h1 className="heading-1 mt-5 text-black uppercase">
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
              className="absolute -right-6 bottom-[-5%] h-auto w-[99px] lg:-right-10 lg:bottom-[10%] lg:w-[147px]"
            />
          </div>

          {/* Peopl */}
          <div className="relative right-1/2 left-1/2 -mx-[50vw] flex w-screen justify-center overflow-hidden">
            <Image
              src="/APNG/people.png"
              alt="Wedding celebration illustration"
              width={1920}
              height={448}
              className="w-full min-w-[1286px] object-contain md:min-w-[1920px]"
              priority
            />
          </div>
        </div>
      </div>

      {/* Content below the hero */}
      <div className="mx-auto max-w-150 px-4 py-5 text-center">
        <p>and we&apos;d love you to be there</p>
      </div>

      <div className="bg-yellow relative mx-auto mb-9 max-w-150 px-2 pt-9 pb-6 text-center md:px-6 md:pb-6">
        <p className="mx-auto max-w-[700px]">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi pretium
          magna eget elit tincidunt consectetur.
        </p>
        <p className="mx-auto max-w-[700px]">
          Cras in est sodales, blandit nisl eu, suscipit purus. Nulla sit amet
          semper lectus, vitae auctor enim.
        </p>
        <p className="heading-3">SAT, 21ST NOV 2026</p>
      </div>

      <div className="bg-blue relative mx-auto max-w-150 px-2 pt-9 text-center md:px-6">
        asdf
      </div>
    </div>
  );
}
