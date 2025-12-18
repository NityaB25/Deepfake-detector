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
function sha256(v: string) {
  return crypto.createHash("sha256").update(String(v)).digest("hex");
}

function cookieOwnerHash(req: any) {
  const raw =
    req.signedCookies?.g ??
    req.ip + (req.headers["user-agent"] || "");
  return sha256(raw);
}

function ensureGuestCookie(req: any, res: any) {
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
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
    });
  }
}

/* -------------------------------- routes ------------------------------ */

/**
 * POST /api/scan
 */
router.post("/scan", async (req, res) => {
  const parsed = ScanReq.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid-body" });
  }

  ensureGuestCookie(req, res);

  const { fileUrl, fileType } = parsed.data;

  const [ml, ext] = await Promise.allSettled([
    predict({ url: fileUrl, type: fileType }),
    detect({ fileUrl, fileType }),
  ]);

  const ourScore =
    ml.status === "fulfilled" && Number.isFinite(ml.value.score)
      ? Math.min(1, Math.max(0, ml.value.score))
      : null;

  const apiScore =
    ext.status === "fulfilled" && Number.isFinite(ext.value.score)
      ? Math.min(1, Math.max(0, ext.value.score))
      : null;

  if (ourScore === null && apiScore === null) {
    return res.status(502).json({ error: "both-detectors-failed" });
  }

  const verdict = decideVerdict(
    ourScore ?? apiScore ?? 0,
    apiScore ?? ourScore ?? 0
  );

  const userId = (req as any).user?.id;

  const doc = await Scan.create({
    userId: userId ?? null,
    cookieOwnerHash: userId ? null : cookieOwnerHash(req),
    fileUrl,
    fileType,
    ourScore,
    apiScore,
    verdict,
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
    verdict,
    createdAt: doc.createdAt,
  });
});

/**
 * GET /api/scans
 * 🔒 LOGGED IN → ONLY userId
 * 👤 GUEST → ONLY cookieOwnerHash
 */
router.get("/scans", async (req, res) => {
  const userId = (req as any).user?.id as string | undefined;

  const page = Math.max(1, Number(req.query.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize ?? 10)));

  const filter = userId
    ? { userId }
    : { cookieOwnerHash: cookieOwnerHash(req) };

  const [total, items] = await Promise.all([
    Scan.countDocuments(filter),
    Scan.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
  ]);

  res.json({ items, total, page, pageSize });
});

/**
 * GET /api/scan/:id
 */
router.get("/scan/:id", async (req, res) => {
  const scan = await Scan.findById(req.params.id).lean();
  if (!scan) return res.status(404).json({ error: "not-found" });

  const userId = (req as any).user?.id;

  const owns =
    (userId && String(scan.userId) === userId) ||
    (!userId &&
      scan.cookieOwnerHash === cookieOwnerHash(req));

  if (!owns) return res.status(403).json({ error: "forbidden" });

  res.json(scan);
});

/**
 * GET /api/user/profile
 */
router.get("/user/profile", async (req, res) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "auth-required" });

  const [total, real, fake, inconclusive, recent] =
    await Promise.all([
      Scan.countDocuments({ userId }),
      Scan.countDocuments({ userId, verdict: "Real" }),
      Scan.countDocuments({ userId, verdict: "Fake" }),
      Scan.countDocuments({ userId, verdict: "Inconclusive" }),
      Scan.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

  res.json({
    user: (req as any).user,
    stats: { total, real, fake, inconclusive },
    recent: recent.map((s) => ({
      id: String(s._id),
      createdAt: s.createdAt,
      verdict: s.verdict,
      ourScore: s.ourScore ?? null,
      apiScore: s.apiScore ?? null,
    })),
  });
});

/**
 * GET /api/upload/sign
 */
router.get("/upload/sign", async (_req, res) => {
  try {
    res.json(signUpload());
  } catch (e: any) {
    res.status(500).json({ error: "sign-error", message: e?.message });
  }
});
