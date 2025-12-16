import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import jwt from "jsonwebtoken";

import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.email = user.email ?? undefined;
        token.name = user.name ?? undefined;
        token.picture = user.image ?? undefined;



        token.backendToken = jwt.sign(
          {
            email: user.email,
            name: user.name,
            picture: user.image,
          },
          process.env.JWT_SECRET!,
          { expiresIn: "7d" }
        );
      }
      return token;
    },

    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }) {
      session.user = {
        email: token.email as string,
        name: token.name as string,
        image: token.picture as string,
      };

      session.backendToken = token.backendToken as string;

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
