import { Suspense } from "react";
import AppClient from "./AppClient";

export const metadata = { title: "GlideWay — Route planner" };

export default function Page() {
  return (
    <Suspense fallback={<div className="grid h-screen place-items-center text-gray-500">Loading map…</div>}>
      <AppClient />
    </Suspense>
  );
}
