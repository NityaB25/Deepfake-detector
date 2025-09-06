import { fetch } from "undici";
import crypto from "crypto";
import { ExternalCache } from "../models/ExternalCache";

type Input = { fileUrl: string; fileType: "image" | "video" };
export type DetectResult = { score: number; provider: string; latencyMs: number };

function ttlDate(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
function cacheKey(provider: string, input: Input) {
  // keep key short but unique per URL
  const h = crypto.createHash("sha256").update(input.fileUrl).digest("hex");
  return `${provider}|${input.fileType}|${h}`;
}

export async function detect(input: Input): Promise<DetectResult> {
  const provider = process.env.EXTERNAL_API_PROVIDER || "MOCK";
  const enabled = String(process.env.EXTERNAL_ENABLED ?? "true") === "true";
  const t0 = Date.now();

  // allow turning external off or using mock
  if (!enabled || provider === "MOCK") {
    return {
      score: 0.5,
      provider: enabled ? provider : "DISABLED",
      latencyMs: Date.now() - t0,
    };
  }

  // 1) try cache
  const key = cacheKey(provider, input);
  try {
    const hit = await ExternalCache.findOne({ key }).lean();
    if (hit && typeof hit.apiScore === "number") {
      return { score: hit.apiScore, provider: `${provider}:CACHE`, latencyMs: 1 };
    }
  } catch {
    // ignore cache read errors
  }

  // 2) provider impls
  if (provider === "SIGHTENGINE") {
    const user = process.env.EXTERNAL_API_USER;
    const secret = process.env.EXTERNAL_API_SECRET;
    if (!user || !secret) throw new Error("Sightengine keys missing");

    const base = "https://api.sightengine.com/1.0";
    const url = new URL(
      input.fileType === "image" ? `${base}/check.json` : `${base}/video/check-sync.json`
    );
    url.searchParams.set("models", "deepfake");
    url.searchParams.set(input.fileType === "image" ? "url" : "stream_url", input.fileUrl);
    url.searchParams.set("api_user", user);
    url.searchParams.set("api_secret", secret);

    const controller = new AbortController();
    const timeoutMs = Number(process.env.EXTERNAL_TIMEOUT_MS ?? 60_000);
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, { method: "GET", signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Sightengine HTTP ${res.status}`);
    const data: any = await res.json();

    // --- compute a guaranteed numeric score (type-safe narrowing) ---
    let scoreCandidate: unknown = data?.type?.deepfake ?? data?.data?.deepfake;

    if (typeof scoreCandidate !== "number" && Array.isArray(data?.data?.frames)) {
      const vals = data.data.frames
        .map((f: any) => f?.type?.deepfake)
        .filter((v: unknown): v is number => typeof v === "number");
      if (vals.length) scoreCandidate = Math.max(...vals);
    }

    if (typeof scoreCandidate !== "number") {
      throw new Error("Sightengine deepfake score missing");
    }

    const score: number = scoreCandidate;
    // ----------------------------------------------------------------

    // 3) write-through cache with TTL
    const hours = Number(process.env.EXTERNAL_CACHE_TTL_HOURS ?? 24);
    try {
      await ExternalCache.findOneAndUpdate(
        { key },
        {
          key,
          provider,
          fileType: input.fileType,
          fileUrl: input.fileUrl,
          apiScore: score,
          fetchedAt: new Date(),
          expireAt: ttlDate(hours),
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
    } catch {
      // ignore cache write errors
    }

    return { score, provider: "SIGHTENGINE", latencyMs: Date.now() - t0 };
  }

  // 3) fallback mock for unknown providers
  return { score: 0.5, provider, latencyMs: Date.now() - t0 };
}
