import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";
const CARTO = "https://*.cartocdn.com https://cartocdn.com";

// Content-Security-Policy. Next.js injects inline bootstrap scripts, so 'unsafe-inline' is required for scripts
// until nonces are wired in; everything else is restricted to the origins the app actually uses.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${CARTO}`,
  "font-src 'self' data:",
  `connect-src 'self' ${CARTO} https://photon.komoot.io${dev ? " ws: http://localhost:*" : ""}`,
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // public/_headers covers static files such as /sw.js, which bypass this function on Workers
    ];
  },
};

export default nextConfig;
