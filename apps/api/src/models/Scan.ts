import { model, Schema } from "mongoose";

export const Scan = model("Scan", new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  cookieOwnerHash: String,
  fileUrl: String,
  fileType: { type: String, enum: ["image", "video"] },
  ourScore: { type: Number, min: 0, max: 1, default: null },
apiScore: { type: Number, min: 0, max: 1, default: null },

  verdict: { type: String, enum: ["Real","Fake","Inconclusive"] },
  modelMeta: Schema.Types.Mixed,
  providerMeta: Schema.Types.Mixed
}, { timestamps: { createdAt: true, updatedAt: false } }));
