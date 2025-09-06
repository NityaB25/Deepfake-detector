import { v2 as cloudinary } from "cloudinary";

const required = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

for (const k of required) {
  if (!process.env[k]) {
    // don't throw at module import time; just leave a hint
    console.warn(`[cloudinary] missing env: ${k}`);
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function signUpload(opts?: {
  folder?: string;
  public_id?: string;
  resource_type?: "image" | "video" | "auto";
}) {
  const folder = opts?.folder || process.env.CLOUDINARY_FOLDER || "deepfake-detector";
  const timestamp = Math.floor(Date.now() / 1000);

  // Only sign what Cloudinary expects (exclude file/api_key/etc.)
  const toSign: Record<string, string | number> = { timestamp, folder };
  if (opts?.public_id) toSign.public_id = opts.public_id;

  const signature = cloudinary.utils.api_sign_request(
    toSign,
    process.env.CLOUDINARY_API_SECRET as string
  );

  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
    timestamp,
    signature,
    resource_type: opts?.resource_type || "auto",
  };
}
