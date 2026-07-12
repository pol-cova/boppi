import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://boppi.vercel.app"),
  title: {
    default: "Boppi — little moments, one tiny song",
    template: "%s · Boppi",
  },
  description: "One photo, one little caption, one tiny song with your favorite people.",
  applicationName: "Boppi",
  keywords: ["shared music", "friends", "daily photo", "private group", "collaborative song", "memory"],
  authors: [{ name: "Boppi" }],
  creator: "Boppi",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Boppi",
    title: "Boppi — little moments, one tiny song",
    description: "Turn the little things you loved today into a tiny song with your people.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Boppi — little moments, one tiny song" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Boppi — little moments, one tiny song",
    description: "One photo, one little caption, one tiny song with your favorite people.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
