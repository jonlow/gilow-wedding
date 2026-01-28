import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Bel & Jon Wedding",
  description: "Manage your wedding guests and RSVPs",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
