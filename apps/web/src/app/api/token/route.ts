import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route"; // reuse your NextAuth config
import jwt from "jsonwebtoken";

export async function GET() {
  // Type the result so TS knows it has an optional `user`
  const session = (await getServerSession(authOptions as any)) as Session | null;

  // Safely read fields (all optional on the Session type)
  const email = session?.user?.email ?? null;
  const name = session?.user?.name ?? null;
  const image = session?.user?.image ?? null;

  // If not signed in, return 204 No Content
  if (!email) {
    return new NextResponse(null, { status: 204 });
  }

  // Mint a short-lived JWT the API can verify
  const token = jwt.sign(
    { email, name, picture: image },
    process.env.API_JWT_SECRET as string,
    { expiresIn: "1h" }
  );

  return NextResponse.json({ token });
}


