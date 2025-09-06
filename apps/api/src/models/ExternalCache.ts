import { Schema, model } from "mongoose";

const ExternalCacheSchema = new Schema({
  key: { type: String, unique: true, index: true }, // provider|type|sha256(url)
  provider: String,
  fileType: { type: String, enum: ["image", "video"] },
  fileUrl: String,
  apiScore: Number,
  fetchedAt: { type: Date, default: () => new Date() },
  // TTL index: Mongo deletes when expireAt < now
  expireAt: { type: Date, index: { expires: 0 } }
});

export const ExternalCache = model("ExternalCache", ExternalCacheSchema);
