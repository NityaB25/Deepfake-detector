import jwt from "jsonwebtoken";
import { User } from "../models/User";

/**
 * Optional auth: if Authorization: Bearer <token> is present,
 * verify it and attach req.user = { id, email, name }.
 * If anything fails, we just proceed as guest.
 */
export async function authOptional(req: any, _res: any, next: any) {
  try {
    const h = req.headers.authorization;
    if (!h || !h.startsWith("Bearer ")) return next();

    const token = h.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // upsert user by email (or sub), then attach to req
    let user = await User.findOne({ email: payload.email }).lean();
    if (!user) {
      const created = await User.create({
        name: payload.name,
        email: payload.email,
        image: payload.picture,
        provider: "google",
      });
      user = created.toObject();
    }

    req.user = { id: String(user._id), email: user.email, name: user.name };
    return next();
  } catch {
    return next();
  }
}
