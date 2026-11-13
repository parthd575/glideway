import Link from "next/link";
import HeroSection from "@/components/landing/HeroSection";
import RouteShowcase from "@/components/landing/RouteShowcase";
import ProblemContrast from "@/components/landing/ProblemContrast";
import TechFlow from "@/components/landing/TechFlow";

export default function Home() {
  return (
    <main>
      <nav className="absolute inset-x-0 top-0 z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl font-bold tracking-tight">Glide<span className="text-emerald-400">Way</span></Link>
        <Link href="/app" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/5">Launch app</Link>
      </nav>
      <HeroSection />
      <RouteShowcase />
      <ProblemContrast />
      <TechFlow />
      <section className="px-6 py-24 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Your next commute, your call.</h2>
        <Link href="/app?demo=1" className="mt-8 inline-block rounded-xl bg-emerald-500 px-7 py-3.5 font-semibold text-black hover:bg-emerald-400">Try Demo: SG Highway → Airport</Link>
      </section>
      <footer className="border-t border-white/5 py-8 text-center text-xs text-gray-500">GlideWay · Map data © OpenStreetMap contributors · Routing by OSRM</footer>
    </main>
  );
}
