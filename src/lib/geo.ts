import type { LngLat } from "./types";

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversine(a: LngLat, b: LngLat): number {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Resample a polyline at roughly even spacing (metres). */
export function sampleLine(line: LngLat[], stepM: number): LngLat[] {
  if (line.length === 0) return [];
  const out: LngLat[] = [line[0]];
  let carry = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const seg = haversine(a, b);
    if (seg === 0) continue;
    let d = stepM - carry;
    while (d <= seg) {
      const t = d / seg;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      d += stepM;
    }
    carry = seg - (d - stepM);
  }
  const last = line[line.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

/** Distance in metres from point p to segment a-b (local equirectangular projection). */
export function distToSegment(p: LngLat, a: LngLat, b: LngLat): number {
  const k = Math.cos(rad(p[1]));
  const px = p[0] * k * 111320, py = p[1] * 110540;
  const ax = a[0] * k * 111320, ay = a[1] * 110540;
  const bx = b[0] * k * 111320, by = b[1] * 110540;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export interface Seg<T> { a: LngLat; b: LngLat; data: T }

/** Simple spatial hash over segments for nearest lookups. */
export class SegGrid<T> {
  private cells = new Map<string, Seg<T>[]>();
  constructor(private cell = 0.002) {}
  private key(x: number, y: number) { return `${Math.floor(x / this.cell)}:${Math.floor(y / this.cell)}`; }
  add(seg: Seg<T>) {
    const x0 = Math.floor(Math.min(seg.a[0], seg.b[0]) / this.cell), x1 = Math.floor(Math.max(seg.a[0], seg.b[0]) / this.cell);
    const y0 = Math.floor(Math.min(seg.a[1], seg.b[1]) / this.cell), y1 = Math.floor(Math.max(seg.a[1], seg.b[1]) / this.cell);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      const k = `${x}:${y}`;
      const arr = this.cells.get(k);
      if (arr) arr.push(seg); else this.cells.set(k, [seg]);
    }
  }
  nearest(p: LngLat, maxM: number): { seg: Seg<T>; dist: number } | null {
    const cx = Math.floor(p[0] / this.cell), cy = Math.floor(p[1] / this.cell);
    let best: { seg: Seg<T>; dist: number } | null = null;
    for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) {
      const arr = this.cells.get(`${x}:${y}`);
      if (!arr) continue;
      for (const seg of arr) {
        const d = distToSegment(p, seg.a, seg.b);
        if (d <= maxM && (!best || d < best.dist)) best = { seg, dist: d };
      }
    }
    return best;
  }
}

export function bbox(lines: LngLat[][], padDeg = 0.003): [number, number, number, number] {
  let w = 180, s = 90, e = -180, n = -90;
  for (const l of lines) for (const [x, y] of l) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
  return [s - padDeg, w - padDeg, n + padDeg, e + padDeg];
}

export function bearing(a: LngLat, b: LngLat): number {
  const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]));
  const x = Math.cos(rad(a[1])) * Math.sin(rad(b[1])) - Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Cumulative distance (m) from the start of the line to each vertex. */
export function cumulative(line: LngLat[]): number[] {
  const out = [0];
  for (let i = 1; i < line.length; i++) out.push(out[i - 1] + haversine(line[i - 1], line[i]));
  return out;
}

export interface Snap { distM: number; progressM: number; point: LngLat; index: number }

/** Project p onto the line. `from` limits the search to vertices >= that index so progress cannot jump backwards on loops. */
export function snapToLine(p: LngLat, line: LngLat[], cum: number[], from = 0, window = 400): Snap | null {
  if (line.length < 2) return null;
  const k = Math.cos(rad(p[1]));
  const px = p[0] * k * 111320, py = p[1] * 110540;
  let best: Snap | null = null;
  const end = Math.min(line.length - 1, from + window);
  for (let i = Math.max(1, from + 1); i <= end; i++) {
    const a = line[i - 1], b = line[i];
    const ax = a[0] * k * 111320, ay = a[1] * 110540, bx = b[0] * k * 111320, by = b[1] * 110540;
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    if (!best || d < best.distM) best = { distM: d, progressM: cum[i - 1] + t * (cum[i] - cum[i - 1]), point: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], index: i - 1 };
  }
  return best;
}

/** Point at a given distance along the line. */
export function pointAt(line: LngLat[], cum: number[], m: number): { point: LngLat; bearing: number } {
  if (m <= 0) return { point: line[0], bearing: bearing(line[0], line[1] ?? line[0]) };
  for (let i = 1; i < line.length; i++) {
    if (cum[i] >= m) {
      const t = (m - cum[i - 1]) / Math.max(cum[i] - cum[i - 1], 1e-9);
      const a = line[i - 1], b = line[i];
      return { point: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], bearing: bearing(a, b) };
    }
  }
  const n = line.length;
  return { point: line[n - 1], bearing: bearing(line[Math.max(0, n - 2)], line[n - 1]) };
}
