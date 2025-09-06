import { Router } from "express";
import crypto from "crypto";
import { z } from "zod";
import { Scan } from "./models/Scan";
import { predict } from "./services/mlClient";
import { detect } from "./services/externalDetector";
import { decideVerdict } from "./services/decideVerdict";
import { signUpload } from "./services/cloudinary";

export const router = Router();

/* ----------------------------- validation ----------------------------- */
const ScanReq = z.object({
  fileUrl: z.string().url(),
  fileType: z.enum(["image", "video"]),
});

/* ------------------------------- helpers ------------------------------ */
function cookieOwnerHash(req: any) {
  const raw = req.signedCookies?.g || (req.ip + (req.headers["user-agent"] || ""));
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}
function sha256(v: string) {
  return crypto.createHash("sha256").update(String(v)).digest("hex");
}
function possibleOwnerHashes(req: any) {
  const hashes = new Set<string>();
  const g = req.signedCookies?.g as string | undefined;
  if (g) {
    hashes.add(sha256(g));
    try {
      const parsed = JSON.parse(g);
      if (parsed?.id) hashes.add(sha256(parsed.id));
    } catch {}
  }
  const ipua = String(req.ip) + String(req.headers["user-agent"] || "");
  hashes.add(sha256(ipua));
  return [...hashes];
}

/* -------------------------------- routes ------------------------------ */

/**
 * POST /api/scan
 * Unlimited scans. If a Bearer token was verified by auth middleware,
 * we attach userId to the scan; otherwise we persist guest ownership via cookie hash.
 */
router.post("/scan", async (req, res) => {
  const parsed = ScanReq.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid-body" });

  // ensure a stable guest id cookie (no counting, just identity for history)
  let gid = crypto.randomUUID();
  try {
    const raw = req.signedCookies?.g;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id) gid = parsed.id;
    }
  } catch {}
  if (!req.signedCookies?.g) {
    res.cookie("g", JSON.stringify({ id: gid }), {
      httpOnly: true,
      signed: true,
      sameSite: "lax",
      maxAge: 31536000000, // 1y
    });
  }

  const { fileUrl, fileType } = parsed.data;

  const [ml, ext] = await Promise.allSettled([
    predict({ url: fileUrl, type: fileType }),
    detect({ fileUrl, fileType }),
  ]);

  const ourScore = ml.status === "fulfilled" ? ml.value.score : -1;
  const apiScore = ext.status === "fulfilled" ? ext.value.score : -1;

  if (ourScore < 0 && apiScore < 0) {
    return res.status(502).json({ error: "both-detectors-failed" });
  }

  const v = decideVerdict(
    ourScore < 0 ? apiScore : ourScore,
    apiScore < 0 ? ourScore : apiScore
  );

  const userId = (req as any).user?.id as string | undefined;

  const doc = await Scan.create({
    userId, // set if logged in
    cookieOwnerHash: cookieOwnerHash(req),
    fileUrl,
    fileType,
    ourScore,
    apiScore,
    verdict: v,
    modelMeta:
      ml.status === "fulfilled"
        ? { modelVersion: ml.value.modelVersion }
        : undefined,
    providerMeta:
      ext.status === "fulfilled"
        ? { name: ext.value.provider, latencyMs: ext.value.latencyMs }
        : undefined,
  });

  res.json({
    scanId: String(doc._id),
    ourScore,
    apiScore,
    verdict: v,
    createdAt: doc.createdAt,
  });
});

/**
 * GET /api/scans
 * If logged in: returns scans where userId matches OR guest-owned by this browser.
 * If guest: returns only this browser's scans.
 */
router.get("/scans", async (req, res) => {
  const hashes = possibleOwnerHashes(req);
  const page = Math.max(1, Number(req.query.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize ?? 10)));

  const userId = (req as any).user?.id as string | undefined;
  const filter: any = userId
    ? { $or: [{ userId }, { cookieOwnerHash: { $in: hashes } }] }
    : { cookieOwnerHash: { $in: hashes } };

  const total = await Scan.countDocuments(filter);
  const items = await Scan.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  res.json({ items, total, page, pageSize });
});

/**
 * GET /api/scan/:id
 * Allowed if owned by logged-in user OR by this guest (cookie/ip+ua hash).
 */
router.get("/scan/:id", async (req, res) => {
  const scan = await Scan.findById(req.params.id).lean();
  if (!scan) return res.status(404).json({ error: "not-found" });

  const userId = (req as any).user?.id as string | undefined;
  const hashes = possibleOwnerHashes(req);

  const owns =
    (userId && String(scan.userId) === userId) ||
    (scan.cookieOwnerHash && hashes.includes(scan.cookieOwnerHash)) ||
    false;

  if (!owns) return res.status(403).json({ error: "forbidden" });
  res.json(scan);
});

/**
 * GET /api/upload/sign
 * Returns a short-lived Cloudinary signature for direct browser uploads.
 */
router.get("/upload/sign", async (_req, res) => {
  try {
    const payload = signUpload();
    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ error: "sign-error", message: e?.message });
  }
});


// GET /api/user/profile  -> requires auth; returns user + simple stats
router.get("/user/profile", async (req, res) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) return res.status(401).json({ error: "auth-required" });

  const [total, real, fake, inconclusive, recent] = await Promise.all([
    Scan.countDocuments({ userId }),
    Scan.countDocuments({ userId, verdict: "Real" }),
    Scan.countDocuments({ userId, verdict: "Fake" }),
    Scan.countDocuments({ userId, verdict: "Inconclusive" }),
    Scan.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  res.json({
    user: (req as any).user, // { id, email, name }
    stats: { total, real, fake, inconclusive },
    recent: recent.map((s) => ({
      id: String(s._id),
      createdAt: s.createdAt,
      verdict: s.verdict,
      ourScore: s.ourScore,
      apiScore: s.apiScore,
    })),
  });
});
