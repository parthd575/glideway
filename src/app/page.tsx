import Link from "next/link";
import { ArrowRight, ArrowsSplit, BookmarkSimple, Check, CircleHalf, Database, Gauge, Lightbulb, Lightning, MapPinLine, NavigationArrow, RoadHorizon, Scales, ShieldCheck, TrafficSignal, WifiSlash, X } from "@phosphor-icons/react/dist/ssr";
import LandingNav from "@/components/landing/LandingNav";
import Reveal from "@/components/landing/Reveal";
import TaglineReveal from "@/components/landing/TaglineReveal";
import Faq, { type FaqItem } from "@/components/landing/Faq";

const DEMO = "/app?demo=1";

const FAQ: FaqItem[] = [
  { q: "Which areas does GlideWay cover?", a: "Gujarat only for now, including Diu and Daman. If a start point, stop or destination is outside Gujarat, the app tells you instead of guessing." },
  { q: "Do I need an account or to pay?", a: "No account is needed to plan routes or navigate, and the app has no payment step." },
  { q: "How does GlideWay choose the four routes?", a: "For each trip it asks the routing engine for several possible paths, then scores each one on traffic signals, road surface and street lighting. The Fastest route is the quickest path. The others favour fewer signals, smoother roads or better lit streets, and GlideWay prefers a different path for each when it is nearly as good." },
  { q: "How accurate are the lighting, surface and speed limit data?", a: "They come from OpenStreetMap, which volunteers maintain, so coverage is patchy in places. Where a road has no tag, GlideWay estimates from the road type and says so. Speed limits shown as typical are estimates, not posted limits. Always follow road signs." },
  { q: "Does it use live traffic?", a: "No. Travel times are based on typical road speeds, not live traffic. GlideWay is built to help you choose the kind of road, not to predict congestion." },
  { q: "Does GlideWay track my location?", a: "Your live position is used in your browser to guide you and is not stored on our servers. To calculate a route, the start, stop and destination coordinates are sent to the routing service without any user identifier. Saved places and trip history stay on your device. The privacy notice has the full detail." },
  { q: "Does it work offline?", a: "Once installed, the app opens without a connection and keeps recent map tiles and your latest route. Planning a new route needs a connection." },
  { q: "How does night mode work?", a: "Between 9 PM and 5 AM, night mode turns on by itself. It adds an amber tint and recommends the Night safe route. You can switch it off, and you can choose a light or dark map separately." },
  { q: "Can I add stops, and can I install it?", a: "You can add up to three stops, and each leg is scored on its own. To install, use the install button in your browser, or on iPhone choose Share, then Add to Home Screen." },
];

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const MODES = [
  { Icon: Lightning, color: "#8B5CF6", title: "Fastest", body: "The lowest travel time. It is always shown, so you can see what every other route costs you in minutes." },
  { Icon: TrafficSignal, color: "#10B981", title: "Signal free", body: "The fewest traffic signals along the path. Fewer stops and a calmer drive." },
  { Icon: RoadHorizon, color: "#3B82F6", title: "Smoother roads", body: "Prefers paved, well kept roads and steers around badly surfaced stretches." },
  { Icon: Lightbulb, color: "#F59E0B", title: "Night safe", body: "Favours well lit roads. Turns on by itself after 9 PM and recommends this route." },
];

const STEPS = [
  { Icon: MapPinLine, title: "Pick your trip", body: "Type a place or tap the location button. Add up to three stops, and save Home and Work so you can skip typing next time." },
  { Icon: Scales, title: "Compare four routes", body: "See time, distance, signals, smoothness and lighting for each, then read the turn by turn list before you leave." },
  { Icon: NavigationArrow, title: "Drive with guidance", body: "Voice prompts, lane arrows where the map has them, speed limits, and a new route if you miss a turn." },
];

const FEATURES = [
  { Icon: ArrowsSplit, title: "Lane guidance", body: "Lane arrows appear before a turn wherever OpenStreetMap has lane data." },
  { Icon: Gauge, title: "Speed limits", body: "Posted limits where they are mapped, and labelled typical values where they are not." },
  { Icon: BookmarkSimple, title: "Saved places and trips", body: "Home, Work, favourites and past trips, kept on your device." },
  { Icon: WifiSlash, title: "Works offline", body: "Install it like an app. Your latest route and nearby map tiles stay available without a signal." },
  { Icon: CircleHalf, title: "Light, dark and night", body: "Pick a light or dark map, or let it go dark and amber after 9 PM." },
  { Icon: ShieldCheck, title: "Private by design", body: "No account. Your live location stays in your browser." },
];

const SOURCES = [
  { name: "OpenStreetMap", role: "Roads, signals, lighting, surface, lane and speed limit tags" },
  { name: "OSRM", role: "Route calculation and turn by turn steps" },
  { name: "CARTO", role: "Basemap tiles" },
  { name: "Cloudflare", role: "Hosting and caching" },
];

const cta = "lp-interactive inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 button-md text-black hover:bg-[#9B9B9B]";
const card = "rounded-2xl border border-[#313131] bg-[#181818] p-6";

function Phone({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <figure className={`rounded-3xl border border-[#313131] bg-[#181818] p-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={780} height={1688} loading="eager" className="block h-auto w-full rounded-2xl" />
    </figure>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <a href="#main" className="lp-interactive sr-only rounded-lg bg-white px-3 py-2 button-sm text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]">Skip to content</a>
      <noscript><style>{".reveal{opacity:1;transform:none}"}</style></noscript>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <LandingNav />

      <main id="main">
        {/* Hero */}
        <section className="px-6 pb-24 pt-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 xl:grid-cols-[680px_1fr] xl:pt-12">
            <div className="rise-in">
              <p className="mb-6 text-6xl font-semibold text-white sm:text-7xl lg:text-8xl">Glide<span className="text-emerald-400">Way</span></p>
              <h1 className="heading-1 max-w-[680px] bg-linear-to-r from-white to-[#9B9B9B] bg-clip-text pb-1 text-transparent">
                Drive roads you&nbsp;trust, <br className="hidden sm:block" />not&nbsp;dark&nbsp;shortcuts
              </h1>
              <p className="body-3 mt-6 max-w-[680px] text-lg text-[#9B9B9B]">
                GlideWay compares four routes for every trip in Gujarat: fastest, fewest signals, smoothest roads and best lit streets. Pick one and get turn by turn directions.
              </p>
              <div className="mt-8 flex flex-col items-start gap-4">
                <Link href={DEMO} className={cta}>Try the demo route <ArrowRight size={18} weight="bold" aria-hidden /></Link>
                <p className="caption-1 text-[#9B9B9B]">Built on OpenStreetMap data. No account needed.</p>
              </div>
            </div>
            <div className="rise-in mx-auto grid w-full max-w-xl grid-cols-2 items-start gap-4 xl:mx-0" style={{ animationDelay: "120ms" }}>
              <Phone src="/landing/hero-navigation.jpg" alt="GlideWay navigation showing the next turn, lane arrows, speed limit and arrival time" />
              <Phone src="/landing/hero-routes.jpg" alt="GlideWay comparing four routes for a trip from Bopal to the airport: Fastest, Signal free, Better roads and Night safe, each with time, signals, smoothness and lighting" className="mt-12" />
            </div>
          </div>
        </section>

        {/* Problem and solution */}
        <section id="problem" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <h2 className="heading-2 max-w-[680px]">The fastest route is rarely the one you would choose</h2>
              <p className="body-3 mt-4 max-w-[680px] text-lg text-[#9B9B9B]">Most navigation apps optimise one number, arrival time. That can send you down a dark, broken road to save a minute. GlideWay shows what each choice costs and gives you the call.</p>
            </Reveal>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              <Reveal>
                <div className={`${card} h-full`}>
                  <h3 className="heading-6">A typical navigation app</h3>
                  <ul className="mt-6 flex flex-col gap-4">
                    {["Optimises arrival time and little else", "Routes you through unlit or badly surfaced streets without telling you", "Hides how many signals you will sit through"].map((t) => (
                      <li key={t} className="flex items-start gap-3 body-3 text-[#9B9B9B]"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#272727] text-red-400"><X size={14} weight="bold" aria-hidden /></span>{t}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <div className={`${card} h-full`}>
                  <h3 className="heading-6">GlideWay</h3>
                  <ul className="mt-6 flex flex-col gap-4">
                    {["Scores every route on time, signals, road surface and lighting", "Shows four routes side by side, with the difference in minutes", "Switches to a well lit option after 9 PM"].map((t) => (
                      <li key={t} className="flex items-start gap-3 body-3"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#272727] text-emerald-400"><Check size={14} weight="bold" aria-hidden /></span>{t}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Benefits: the four routes */}
        <section id="routes" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <h2 className="heading-2 max-w-[680px]">Four routes for every trip. You choose the feel.</h2>
              <p className="body-3 mt-4 max-w-[680px] text-lg text-[#9B9B9B]">Every route shows its time, distance, signal count, percent smooth and percent lit, so the trade off is never hidden.</p>
            </Reveal>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {MODES.map(({ Icon, color, title, body }, i) => (
                <Reveal key={title} delay={i * 80}>
                  <div className={`${card} h-full`}>
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#272727]" style={{ color }}><Icon size={24} weight="duotone" aria-hidden /></span>
                    <h3 className="heading-6 mt-6">{title}</h3>
                    <p className="body-6 mt-2 text-[#9B9B9B]">{body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Tagline reveal */}
        <section aria-label="Our promise" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <TaglineReveal lines={["Fast gets you there.", "Smooth, lit and calm", "is how you arrive."]} />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <Reveal><h2 className="heading-2 max-w-[680px]">From address to guidance in three steps</h2></Reveal>
            <ol className="mt-12 grid gap-4 md:grid-cols-3">
              {STEPS.map(({ Icon, title, body }, i) => (
                <li key={title}>
                  <Reveal delay={i * 100}>
                    <div className={`${card} h-full`}>
                      <div className="flex items-center justify-between">
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#272727] text-white"><Icon size={24} weight="duotone" aria-hidden /></span>
                        <span className="caption-3 text-[#9B9B9B]">Step {i + 1}</span>
                      </div>
                      <h3 className="heading-6 mt-6">{title}</h3>
                      <p className="body-6 mt-2 text-[#9B9B9B]">{body}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <h2 className="heading-2 max-w-[680px]">Everything you need on the road</h2>
              <p className="body-3 mt-4 max-w-[680px] text-lg text-[#9B9B9B]">The details that matter once you are driving, built into the same app you plan with.</p>
            </Reveal>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ Icon, title, body }, i) => (
                <Reveal key={title} delay={(i % 3) * 80}>
                  <div className={`${card} h-full`}>
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#272727] text-white"><Icon size={24} weight="duotone" aria-hidden /></span>
                    <h3 className="title-2 mt-6">{title}</h3>
                    <p className="body-6 mt-2 text-[#9B9B9B]">{body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Proof: open data, honest limits */}
        <section id="data" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <h2 className="heading-3 max-w-[680px]">Built on open data, with honest limits</h2>
              <p className="body-3 mt-4 max-w-[680px] text-lg text-[#9B9B9B]">GlideWay does not invent road quality. It reads it from open maps and tells you when it is guessing.</p>
            </Reveal>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SOURCES.map((s, i) => (
                <Reveal key={s.name} delay={i * 80}>
                  <div className={`${card} h-full`}>
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#272727] text-white"><Database size={24} weight="duotone" aria-hidden /></span>
                    <h3 className="title-2 mt-6">{s.name}</h3>
                    <p className="body-6 mt-2 text-[#9B9B9B]">{s.role}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={120}>
              <p className="mt-4 rounded-2xl border border-[#313131] bg-[#1F1F1F] p-6 body-5 text-[#9B9B9B]">OpenStreetMap is community maintained, so lighting, surface, lane and speed limit tags are patchy in places. Where data is missing, GlideWay estimates from the road type and labels the result. It does not use live traffic.</p>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_2fr]">
            <Reveal>
              <h2 className="heading-2">Questions, answered</h2>
              <p className="body-3 mt-4 text-lg text-[#9B9B9B]">Coverage, accuracy and privacy, in plain terms.</p>
            </Reveal>
            <Reveal delay={100}><Faq items={FAQ} /></Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-24">
          <Reveal>
            <div className="mx-auto max-w-7xl rounded-3xl border border-[#313131] bg-[#181818] px-6 py-16 text-center">
              <h2 className="heading-2 mx-auto max-w-[680px]">Your next trip, your choice of road</h2>
              <p className="body-3 mx-auto mt-4 max-w-[680px] text-lg text-[#9B9B9B]">Open the demo and compare four routes across Ahmedabad in a few seconds.</p>
              <div className="mt-8 flex flex-col items-center gap-4">
                <Link href={DEMO} className={cta}>Try the demo route <ArrowRight size={18} weight="bold" aria-hidden /></Link>
                <p className="caption-1 text-[#9B9B9B]">No account, no card, nothing to install. Your live location stays on your device.</p>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="lp-interactive title-2 rounded-lg text-white">Glide<span className="text-emerald-400">Way</span></Link>
            <p className="caption-5 mt-2 text-[#9B9B9B]">Map data © OpenStreetMap contributors. Basemap © CARTO. Routing by OSRM.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-6 body-5">
            <Link href="/privacy" className="lp-interactive rounded-lg text-[#9B9B9B] hover:text-white">Privacy notice</Link>
            <Link href="/app" className="lp-interactive rounded-lg text-[#9B9B9B] hover:text-white">Open the app</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
