"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import Nav from "@/components/Nav";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-black">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
        <div className="absolute inset-0 opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]"></div>
      </div>

      {/* App Content */}
      <div className="relative z-10">
        <Nav user={session?.user} />
        <main className="pt-24">{children}</main>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-sm text-gray-400">
            © 2024 Deepfake Detector. All rights reserved.
          </span>
          <div className="flex gap-6 text-sm text-gray-400">
            <a className="hover:text-white">Privacy</a>
            <a className="hover:text-white">Terms</a>
            <a className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
