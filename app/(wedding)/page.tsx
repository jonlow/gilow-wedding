import Image from "next/image";

export default function Home() {
  return (
    <div className="wedding-content min-h-screen overflow-x-hidden bg-white">
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 flex justify-center">
          <div className="bg-red w-full max-w-300" />
        </div>

        <div className="relative">
          <div className="relative mx-auto max-w-300 px-4 pt-18 text-center md:px-12">
            <h1 className="heading-1 mt-10 text-black uppercase">
              Bel &amp; Jon
              <br />
              are getting
              <br />
              married!
            </h1>
          </div>

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

      <div className="mx-auto max-w-300 px-8 py-10 text-center">
        <p>Check your email for your personal invitation!</p>
      </div>
    </div>
  );
}
