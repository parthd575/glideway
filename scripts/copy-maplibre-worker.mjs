// maplibre-gl v6 ships its web worker as separate ES modules. Serving them from /public
// avoids bundler worker-URL resolution problems under Next.js.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
const src = "node_modules/maplibre-gl/dist";
if (existsSync(src)) {
  mkdirSync("public/maplibre", { recursive: true });
  for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) copyFileSync(`${src}/${f}`, `public/maplibre/${f}`);
}
