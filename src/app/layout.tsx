import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { Chrome } from "@/components/Chrome";
import "./globals.css";

const title = "Festival of Trust";
const description =
  "A grassroots movement that finds trust where it already lives, celebrates it in the open, and helps build it where it is missing. Grow trust, one pocket at a time.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.festivaloftrust.com"),
  title: { default: title, template: `%s — ${title}` },
  description,
  // Self-referencing canonical on every page that does not set its own.
  alternates: { canonical: "./" },
  openGraph: {
    title,
    description,
    url: "https://www.festivaloftrust.com",
    siteName: title,
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/photos/cape-town-close-up.jpg",
        width: 1200,
        height: 900,
        alt: "A child in bright pink sunglasses, standing close among others at a festival.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/photos/cape-town-close-up.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-scroll-behavior tells Next the smooth scrolling is deliberate, so
    // route transitions can disable it while they jump.
    <html
      lang="en"
      className="h-full scroll-smooth antialiased"
      data-scroll-behavior="smooth"
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <Chrome nav={<SiteNav />} footer={<SiteFooter />}>
          {children}
        </Chrome>
      </body>
    </html>
  );
}
