import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bel & Jon Wedding",
  description: "Join us for our special day!",
};

export default function WeddingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* TypeKit font for wedding pages only */}
      <link rel="stylesheet" href="https://use.typekit.net/jdm6ytx.css" />
      {children}
    </>
  );
}
