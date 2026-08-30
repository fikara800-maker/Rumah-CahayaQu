import React from "react";
import type { Metadata } from "next";
import "../index.css";

export const metadata: Metadata = {
  title: "Remix Remix Remix Remix Rumah CahayaQu",
  description: "An all-in-one digital platform for tutoring centers featuring interactive growth tracking, attendance, billing, and seamless parent-teacher communication.",
  openGraph: {
    title: "Remix Remix Remix Remix Rumah CahayaQu",
    description: "An all-in-one digital platform for tutoring centers featuring interactive growth tracking, attendance, billing, and seamless parent-teacher communication.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  );
}
