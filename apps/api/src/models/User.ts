import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    image: { type: String },
    provider: { type: String, default: "google" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const User = model("User", UserSchema);
