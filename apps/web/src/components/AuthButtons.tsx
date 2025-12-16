"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  if (loading) return <span className="text-sm text-gray-400">…</span>;

  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        className="rounded bg-gray-800 px-3 py-2 text-sm text-white hover:bg-black"
      >
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {session.user?.image && (
        <img src={session.user.image} alt="avatar" className="h-7 w-7 rounded-full border" />
      )}
      <span className="max-w-[160px] truncate text-sm">
        {session.user?.name || session.user?.email}
      </span>
      <button
        onClick={() => signOut()}
        className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
      >
        Sign out
      </button>
    </div>
  );
}
