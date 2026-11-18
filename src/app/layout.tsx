import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import PwaRegister from "@/components/pwa/PwaRegister";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://glideway.vercel.app"),
  title: "GlideWay — Stop taking dark, pothole-filled shortcuts",
  description:
    "Context-aware navigation. Choose Fastest, Signal-Free, Better Roads or Night-Safe routes instead of saving 60 seconds on a dark gali.",
  openGraph: {
    title: "GlideWay — Route by how it feels, not just how fast",
    description: "4 routes. Fewer red lights, smoother roads, well-lit streets after 9 PM.",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  applicationName: "GlideWay",
  appleWebApp: { capable: true, title: "GlideWay", statusBarStyle: "black-translucent" as const },
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192" }], apple: "/icons/apple-touch-icon.png" },
  twitter: { card: "summary_large_image", title: "GlideWay", description: "Context-aware navigation for commuters." },
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
