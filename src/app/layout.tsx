import React from "react";
import type { Metadata } from "next";
import "../index.css";

export const metadata: Metadata = {
  title: "Rumah CahayaQu - Sistem Informasi & Bimbingan Belajar",
  description: "An all-in-one digital platform for tutoring centers featuring interactive growth tracking, attendance, billing, and seamless parent-teacher communication.",
  openGraph: {
    title: "Rumah CahayaQu - Sistem Informasi & Bimbingan Belajar",
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
