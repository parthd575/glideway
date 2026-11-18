import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import PwaRegister from "@/components/pwa/PwaRegister";

/** Canonical origin for OpenGraph and sitemap URLs. Override with NEXT_PUBLIC_SITE_URL once a custom domain is attached. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://glideway-web.techguidebro.workers.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "GlideWay: four routes for every trip in Gujarat",
  description:
    "Compare the fastest, fewest signals, smoothest and best lit route for any trip in Gujarat, then navigate turn by turn. No account needed.",
  openGraph: {
    title: "GlideWay: get there on roads you trust",
    description: "Four routes for every trip in Gujarat. Fewer signals, smoother roads and well lit streets after dark.",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  applicationName: "GlideWay",
  appleWebApp: { capable: true, title: "GlideWay", statusBarStyle: "black-translucent" as const },
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192" }], apple: "/icons/apple-touch-icon.png" },
  twitter: { card: "summary_large_image", title: "GlideWay", description: "Four routes for every trip in Gujarat, with turn by turn navigation." },
};

export const viewport = { themeColor: "#090D16", viewportFit: "cover" as const };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
