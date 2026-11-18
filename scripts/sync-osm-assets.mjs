// Copies the prebuilt OSM tiles into public/osm so they deploy as static assets and the Worker can read them
// through its ASSETS binding. Skipped when no tiles have been built.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";

const src = process.argv[2] ?? "data/osm-tiles";
const dest = "public/osm";
if (!existsSync(src) || readdirSync(src).length === 0) {
  console.log(`[osm] no tiles in ${src}; production will fall back to Overpass (run scripts/build-osm-data.sh first)`);
  process.exit(0);
}
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`[osm] ${readdirSync(dest).length} tiles -> ${dest}`);
