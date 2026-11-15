import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { bins } from "../../data/bins";

type Reading = {
  fillLevel: number;
  fullSince: string | null;
};

type Store = Record<string, Reading>;

const filePath = path.join(
  process.cwd(),
  "data",
  "live-bins.json"
);

async function readStore(): Promise<Store> {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

export async function GET() {
  const store = await readStore();

  const result = bins.map((bin) => ({
    ...bin,
    ...(store[bin.id] ?? {}),
  }));

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const binId = body.bin_id;
    const fill = Number(body.fill_percent);

    if (
      typeof binId !== "string" ||
      !bins.some((bin) => bin.id === binId) ||
      body.fill_percent === null ||
      body.fill_percent === undefined ||
      !Number.isFinite(fill) ||
      fill < 0 ||
      fill > 100
    ) {
      return NextResponse.json(
        { error: "Invalid bin ID or fill percentage" },
        { status: 400 }
      );
    }

    const store = await readStore();
    const previous = store[binId];

    const fullSince =
      fill >= 95
        ? previous?.fullSince ?? new Date().toISOString()
        : null;

    store[binId] = {
      fillLevel: Math.round(fill),
      fullSince,
    };

    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(store, null, 2));

    return NextResponse.json({
      success: true,
      bin_id: binId,
      ...store[binId],
    });
  } catch (error) {
    console.error("Bin update failed:", error);
    return NextResponse.json(
      { error: "Unable to process update" },
      { status: 500 }
    );
  }
}