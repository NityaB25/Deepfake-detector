import { model, Schema } from "mongoose";

export const Scan = model("Scan", new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  cookieOwnerHash: String,
  fileUrl: String,
  fileType: { type: String, enum: ["image", "video"] },
  ourScore: Number,
  apiScore: Number,
  verdict: { type: String, enum: ["Real","Fake","Inconclusive"] },
  modelMeta: Schema.Types.Mixed,
  providerMeta: Schema.Types.Mixed
}, { timestamps: { createdAt: true, updatedAt: false } }));
