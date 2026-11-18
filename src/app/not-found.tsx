import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-black px-6 text-center text-white">
      <div>
        <p className="caption-3 text-[#9B9B9B]">Error 404</p>
        <h1 className="heading-2 mx-auto mt-4 max-w-[680px]">This road does not lead anywhere</h1>
        <p className="body-3 mx-auto mt-4 max-w-[680px] text-lg text-[#9B9B9B]">The page you asked for does not exist or has moved. Head back and plan a route instead.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="lp-interactive rounded-lg border border-[#313131] px-3 py-2 button-md text-white hover:bg-[#181818]">Back to home</Link>
          <Link href="/app?demo=1" className="lp-interactive rounded-lg bg-white px-3 py-2 button-md text-black hover:bg-[#9B9B9B]">Try the demo route</Link>
        </div>
      </div>
    </main>
  );
}
