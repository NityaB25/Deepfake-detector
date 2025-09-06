import { request } from "undici";

const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

type In = { url: string; type: "image" | "video" };

export async function predict(input: In): Promise<{
  score: number;
  modelVersion: string;
  runtimeMs: number;
}> {
  const t0 = Date.now();
  const { body, statusCode } = await request(`${ML_URL}/predict`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: input.url, type: input.type }),
  });

  if (statusCode < 200 || statusCode >= 300) {
    const errTxt = await body.text();
    throw new Error(`ml ${statusCode}: ${errTxt}`);
  }

  const data = (await body.json()) as any;

  const score = Number(data?.score);
  if (!Number.isFinite(score)) {
    throw new Error(`invalid-ml-score ${JSON.stringify(data)}`);
  }

  const modelVersion = String(data?.modelVersion ?? "unknown");
  const runtimeMs =
    typeof data?.runtimeMs === "number" ? data.runtimeMs : Date.now() - t0;

  return { score, modelVersion, runtimeMs };
}
