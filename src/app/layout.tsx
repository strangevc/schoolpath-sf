import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SchoolPath SF: SFUSD application planning",
  description:
    "Plan your SFUSD Transitional Kindergarten or Kindergarten application using four years of published placement data. Build a ranking informed by your family's attendance area, sibling priority, and CTIP1 eligibility.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
