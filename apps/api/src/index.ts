import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import pino from "pino";
import pinoHttp from "pino-http";
import mongoose from "mongoose";
import { router as apiRouter } from "./routes";
import { authOptional } from "./middleware/auth";



const app = express();
const log = pino({ level: process.env.LOG_LEVEL || "info" });



app.use(helmet());
app.use(cors({
  origin: (process.env.WEB_ORIGIN as string) || "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: "20mb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(authOptional);

app.use("/api", apiRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    log.info("Mongo connected");
    const port = Number(process.env.PORT) || 4000;
    app.listen(port, () => log.info({ port }, "API listening"));
  } catch (err) {
    log.error(err, "Failed to start");
    process.exit(1);
  }
}
start();