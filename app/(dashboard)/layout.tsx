import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Bel & Jon Wedding",
  description: "Manage your wedding guests and RSVPs",
};

const isLocalDevelopment = process.env.NODE_ENV === "development";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {isLocalDevelopment ? (
        <div className="border-b border-amber-300 bg-amber-100 px-4 py-3 text-center text-sm font-medium tracking-[0.18em] text-amber-950 uppercase">
          Local dashboard
        </div>
      ) : null}
      {children}
    </>
  );
}
