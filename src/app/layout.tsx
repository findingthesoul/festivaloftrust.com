import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://www.festivaloftrust.com"),
  title: "Festival of Trust",
  description:
    "A gathering about trust — how we build it, lose it, and rebuild it together.",
  openGraph: {
    title: "Festival of Trust",
    description:
      "A gathering about trust — how we build it, lose it, and rebuild it together.",
    url: "https://www.festivaloftrust.com",
    siteName: "Festival of Trust",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Festival of Trust",
    description:
      "A gathering about trust — how we build it, lose it, and rebuild it together.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
