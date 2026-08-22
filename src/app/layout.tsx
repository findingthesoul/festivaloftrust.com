import type { Metadata } from "next";
import "./globals.css";

const title = "Festival of Trust";
const description =
  "Festival of Trust — Cape Town, 25 September 2026. A gathering about trust: how we build it, lose it, and rebuild it together.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.festivaloftrust.com"),
  title,
  description,
  openGraph: {
    title,
    description,
    url: "https://www.festivaloftrust.com",
    siteName: title,
    locale: "en_GB",
    type: "website",
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
