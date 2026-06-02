import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { NavBar } from "@/components/nav-bar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TI Annotation Workbench — RLHF Preference Data Collection",
  description:
    "A configurable platform for collecting human preference annotations to train reward models — supports Anthropic-style binary comparisons and Meta-style multi-dimensional preference ratings.",
  openGraph: {
    title: "TI Annotation Workbench — RLHF Preference Data Collection",
    description:
      "A configurable platform for collecting human preference annotations to train reward models — supports Anthropic-style binary comparisons and Meta-style multi-dimensional preference ratings.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
          <NavBar />
          <main className="flex-1">{children}</main>
          <Toaster richColors position="bottom-right" />
        </body>
    </html>
  );
}
