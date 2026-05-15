import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SchoolPath SF — Build a smart SFUSD ranking",
  description:
    "Build your TK or Kindergarten school ranking with personalized odds and plain-English coaching. Less random, less stressful.",
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
