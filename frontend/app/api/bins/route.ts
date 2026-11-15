import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { bins, demoBin, type Bin } from "../../data/bins";

type Reading = Pick<Bin, "status" | "fullSince" | "fillLevel"> & {
  distanceCm: number | null;
  lastSeen: string;
};
type Store = Record<string, Reading>;
const filePath = path.join(process.cwd(), "data", "live-bins.json");
// Serialize writes within this local server process.
let pending: Promise<unknown> = Promise.resolve();

async function readStore(): Promise<Store> {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

export async function GET() {
  const store = await readStore();
  return NextResponse.json([
    ...bins,
    { ...demoBin, ...(store[demoBin.id] ?? {}) },
  ], { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object" || body.bin_id !== demoBin.id) {
    return NextResponse.json({ error: `Only ${demoBin.id} accepts sensor updates` }, { status: 400 });
  }
  const distance = body.distance_cm;
  const fill = body.fill_percent;
  const hasDistance = distance !== undefined;
  // Accept the teammate's percentage payload too, but never display percentages.
  if (hasDistance ? typeof distance !== "number" || !Number.isFinite(distance) || distance <= 0
    : typeof fill !== "number" || !Number.isFinite(fill) || fill < 0 || fill > 100) {
    return NextResponse.json({ error: "Send a positive distance_cm, or fill_percent between 0 and 100" }, { status: 400 });
  }
  const fullCm = Number(process.env.BIN_FULL_DISTANCE_CM ?? 10.16);
  const clearCm = Number(process.env.BIN_CLEAR_DISTANCE_CM ?? 15);
  if (!Number.isFinite(fullCm) || !Number.isFinite(clearCm) || fullCm <= 0 || clearCm <= fullCm) {
    return NextResponse.json({ error: "Invalid sensor threshold configuration" }, { status: 500 });
  }
  const emptyCm = Number(process.env.BIN_EMPTY_DISTANCE_CM ?? 22.86);
  if (!Number.isFinite(emptyCm) || emptyCm <= clearCm) {
    return NextResponse.json({ error: "Empty distance must exceed the clear threshold" }, { status: 500 });
  }
  const update = pending.then(async () => {
    const store = await readStore();
    const previous = store[demoBin.id];
    // Different enter/exit thresholds prevent small fluctuations from toggling status.
    const isFull = hasDistance
      ? distance <= fullCm || (previous?.status === "full" && distance < clearCm)
      : fill >= 95;
    const now = new Date().toISOString();
    const reading: Reading = {
      fillLevel: hasDistance
        ? Math.round(Math.max(0, Math.min(100, (emptyCm - distance) / (emptyCm - fullCm) * 100)))
        : Math.round(fill),
      status: isFull ? "full" : "not full",
      fullSince: isFull ? previous?.fullSince ?? now : null,
      distanceCm: hasDistance ? distance : null,
      lastSeen: now,
    };
    store[demoBin.id] = reading;
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(`${filePath}.tmp`, JSON.stringify(store, null, 2));
    await rename(`${filePath}.tmp`, filePath);
    return reading;
  });
  pending = update.catch(() => undefined);
  try {
    return NextResponse.json({ success: true, bin_id: demoBin.id, ...await update });
  } catch (error) {
    console.error("Bin update failed:", error);
    return NextResponse.json({ error: "Unable to store update" }, { status: 500 });
  }
}
