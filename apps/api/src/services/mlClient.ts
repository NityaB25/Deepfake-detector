import { request } from "undici";

const ML_URL =
  process.env.ML_BASE_URL ?? "http://127.0.0.1:8000";

type In = {
  url: string;
  type: "image" | "video";
};

type MLResponse = {
  score: number;
  modelVersion?: string;
  runtimeMs?: number;
};

export async function predict(input: In): Promise<{
  score: number;
  modelVersion: string;
  runtimeMs: number;
}> {
  const t0 = Date.now();

  const { body, statusCode } = await request(`${ML_URL}/predict`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    bodyTimeout: 30_000,
  });

  if (statusCode < 200 || statusCode >= 300) {
    const errTxt = await body.text();
    throw new Error(`ml ${statusCode}: ${errTxt}`);
  }

  const data = (await body.json()) as MLResponse;

  if (typeof data.score !== "number" || !Number.isFinite(data.score)) {
    throw new Error(`invalid-ml-score ${JSON.stringify(data)}`);
  }

  return {
    score: data.score,
    modelVersion: data.modelVersion ?? "unknown",
    runtimeMs:
      typeof data.runtimeMs === "number"
        ? data.runtimeMs
        : Date.now() - t0,
  };
}
