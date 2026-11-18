import type { Metadata } from "next";
import Link from "next/link";
import ClearDataButton from "@/components/ui/ClearDataButton";

export const metadata: Metadata = { title: "Privacy notice", description: "What GlideWay does and doesn't do with your location and data." };

const UPDATED = "19 November 2026";

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-xl font-semibold text-gray-100">{children}</h2>;
}

export default function Privacy() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14 text-gray-300">
      <Link href="/" className="text-lg font-bold tracking-tight text-gray-100">Glide<span className="text-emerald-400">Way</span></Link>
      <h1 className="mt-8 text-3xl font-bold text-gray-50 sm:text-4xl">Privacy notice</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated {UPDATED}</p>

      <p className="mt-6 leading-relaxed">GlideWay is a route planner and navigation app for Gujarat. It has no accounts, no ads and no analytics, and it sets no cookies. This page explains what happens to your data. It is a plain-language summary, not legal advice.</p>

      <H>The short version</H>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed">
        <li>Your live GPS position is used <strong>in your browser</strong> to show you on the map and to guide you. It is never uploaded or stored by GlideWay.</li>
        <li>To calculate a route, the <strong>start, stop and destination coordinates</strong> are sent to our routing service. They are not linked to you.</li>
        <li>Saved places, trip history and settings stay <strong>on your device</strong> and you can delete them at any time.</li>
      </ul>

      <H>What we process, and why</H>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <thead><tr className="border-b border-white/10 text-gray-400"><th className="py-2 pr-4 font-medium">Data</th><th className="py-2 pr-4 font-medium">Why</th><th className="py-2 font-medium">Where it goes</th></tr></thead>
          <tbody className="divide-y divide-white/5">
            <tr><td className="py-2.5 pr-4 align-top">Live location (GPS)</td><td className="py-2.5 pr-4 align-top">Set your start point, show your position, guide you, detect when you leave the route</td><td className="py-2.5 align-top">Stays in your browser. Only when you reroute is your current coordinate sent as a route start.</td></tr>
            <tr><td className="py-2.5 pr-4 align-top">Route coordinates</td><td className="py-2.5 pr-4 align-top">Calculate and score routes</td><td className="py-2.5 align-top">Our Cloudflare Worker and the routing engine (OSRM). Results are cached for about 10 minutes against coordinates rounded to roughly 11 m, with no user identifier.</td></tr>
            <tr><td className="py-2.5 pr-4 align-top">Search text</td><td className="py-2.5 pr-4 align-top">Find places as you type</td><td className="py-2.5 align-top">Sent to the Photon geocoder (komoot.io) with your search words and, to rank results, the start point&apos;s coordinates.</td></tr>
            <tr><td className="py-2.5 pr-4 align-top">Map tile requests</td><td className="py-2.5 pr-4 align-top">Draw the map</td><td className="py-2.5 align-top">Fetched from CARTO&apos;s map servers, which can see your IP address and the area you view.</td></tr>
            <tr><td className="py-2.5 pr-4 align-top">Technical logs</td><td className="py-2.5 pr-4 align-top">Security and reliability</td><td className="py-2.5 align-top">Cloudflare, our host, handles requests and may log IP address and request details under its own policy.</td></tr>
          </tbody>
        </table>
      </div>

      <H>Stored on your device</H>
      <p className="mt-3 leading-relaxed">GlideWay keeps the following in your browser&apos;s local storage: your theme choice, your location-consent answer, places you save (Home, Work, favourites) and your trip history (the start, stop and end places, mode, distance, time and date, for up to 50 trips). The service worker also keeps copies of the app, map tiles and your latest routes so the app works offline. None of this is sent to us.</p>
      <div className="mt-4"><ClearDataButton /></div>
      <p className="mt-3 text-sm text-gray-500">To also remove offline copies, clear this site&apos;s data in your browser settings or uninstall the app.</p>

      <H>Your location permission</H>
      <p className="mt-3 leading-relaxed">We ask before your browser shows its own location prompt. You can say no and still plan routes by typing places. You can withdraw permission at any time in your browser or device settings. Navigation needs location while it runs. Browsers may pause location updates when the screen is off, which is why GlideWay asks your device to keep the screen awake during navigation.</p>

      <H>Accuracy of road data</H>
      <p className="mt-3 leading-relaxed">Lighting, surface quality, signals, lane layouts and speed limits come from OpenStreetMap, which is community-maintained and incomplete in places. Where a limit is not tagged, GlideWay shows a &quot;typical&quot; value for the road type and labels it as an estimate. Always follow road signs and local law.</p>

      <H>Sharing, retention and children</H>
      <p className="mt-3 leading-relaxed">We do not sell data or share it for advertising. Because we hold no accounts or user profiles, we have no personal records to retain or export beyond what is on your device. GlideWay is not directed at children.</p>

      <H>Changes and contact</H>
      <p className="mt-3 leading-relaxed">We will update this page and its date if our practices change, for example if analytics or accounts are ever added. Questions or concerns: open an issue at <a className="text-emerald-400 underline underline-offset-2" href="https://github.com/parthd575/glideway/issues" rel="noreferrer">github.com/parthd575/glideway</a>.</p>

      <div className="mt-12 border-t border-white/10 pt-6 text-sm"><Link href="/app" className="text-emerald-400 hover:underline">Open the app</Link></div>
    </main>
  );
}
