import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

const title = "Festival of Trust";
const description =
  "A grassroots movement that finds trust where it already lives, celebrates it in the open, and helps build it where it is missing. Grow trust, one pocket at a time.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.festivaloftrust.com"),
  title: { default: title, template: `%s — ${title}` },
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
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <SiteNav />
        {children}
        <footer className="mx-auto w-full max-w-5xl border-t border-ink/15 px-6 py-10 text-sm sm:px-10">
          <a
            href="mailto:hello@festivaloftrust.com"
            className="text-green font-medium underline decoration-2 underline-offset-4 transition-opacity hover:opacity-70"
          >
            hello@festivaloftrust.com
          </a>
        </footer>
      </body>
    </html>
  );
}
