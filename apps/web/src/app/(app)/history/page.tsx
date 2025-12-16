"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import React from "react";

import {
  History as HistoryIcon,
  Filter,
  Calendar,
  TrendingUp,
  FileImage,
  FileVideo,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { EmptyState, VerdictBadge } from "../../../components/Card";
import { API_URL } from "@/lib/api";

/* ---------------- types ---------------- */

interface HistoryItem {
  id: string;
  createdAt: string;
  fileType: "image" | "video";
  verdict: "Real" | "Fake" | "Inconclusive";
  ourScore: number;
  apiScore: number;
  fileUrl: string;
}

/* ---------------- component ---------------- */

export default function HistoryPage() {
  const { data: session, status } = useSession();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] =
    useState<"all" | "Real" | "Fake" | "Inconclusive">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- fetch scans ---------------- */
  useEffect(() => {
    if (status !== "authenticated") return;

    const backendToken = (session as any)?.backendToken;
    if (!backendToken) {
      setError("Missing backend token");
      setLoading(false);
      return;
    }

    async function loadHistory() {
      try {
        const res = await fetch(`${API_URL}/api/scans`, {
          headers: {
            Authorization: `Bearer ${backendToken}`,
          },
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch history (${res.status})`);
        }

        const data = await res.json();

        setHistory(
          data.items.map((s: any) => ({
            id: s._id,
            createdAt: s.createdAt,
            verdict: s.verdict,
            ourScore: s.ourScore,
            apiScore: s.apiScore,
            fileType: s.fileType,
            fileUrl: s.fileUrl,
          }))
        );
      } catch (err: any) {
        setError(err.message || "Failed to load history");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [status, session]);

  /* ---------------- guards ---------------- */

  if (status === "loading" || loading) {
    return (
      <div className="pt-32 text-center text-gray-400">
        Loading history…
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="pt-32 text-center text-gray-400">
        Please sign in to view your history
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-32 text-center text-red-400">
        {error}
      </div>
    );
  }

  /* ---------------- derived data ---------------- */

  const filteredHistory = history
    .filter((i) => filter === "all" || i.verdict === filter)
    .sort((a, b) =>
      sortBy === "newest"
        ? +new Date(b.createdAt) - +new Date(a.createdAt)
        : +new Date(a.createdAt) - +new Date(b.createdAt)
    );

  const stats = {
    total: history.length,
    real: history.filter((i) => i.verdict === "Real").length,
    fake: history.filter((i) => i.verdict === "Fake").length,
    inconclusive: history.filter((i) => i.verdict === "Inconclusive").length,
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-10 text-white">History</h1>

        {history.length === 0 ? (
          <EmptyState
            icon={HistoryIcon}
            title="No scans yet"
            description="Upload a file or scan a URL to see your history here"
          />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Stat label="Total" value={stats.total} icon={<TrendingUp />} />
              <Stat label="Real" value={stats.real} icon={<CheckCircle />} />
              <Stat label="Fake" value={stats.fake} icon={<XCircle />} />
              <Stat
                label="Unsure"
                value={stats.inconclusive}
                icon={<AlertCircle />}
              />
            </div>

            {/* Filters */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8 flex justify-between">
              <div className="flex gap-2">
                {["all", "Real", "Fake", "Inconclusive"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setFilter(v as any)}
                    className={`px-4 py-2 rounded ${
                      filter === v
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-800 text-gray-300 px-3 py-2 rounded"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>

            {/* List */}
            <div className="space-y-4">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 flex gap-6"
                >
                  <div className="w-20 h-20 flex items-center justify-center bg-gray-800 rounded">
                    {item.fileType === "image" ? (
                      <FileImage className="text-gray-400" />
                    ) : (
                      <FileVideo className="text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400 text-sm">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                      <VerdictBadge verdict={item.verdict} size="sm" />
                    </div>

                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 text-sm flex items-center gap-1"
                    >
                      View media <ExternalLink size={12} />
                    </a>

                    <div className="flex gap-6 mt-4">
                      <Score label="Our" value={Math.round(1-item.ourScore)*100} />
                      <Score label="API" value={item.apiScore} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredHistory.length === 0 && (
              <div className="text-center text-gray-400 py-10">
                No scans match this filter
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800/40 p-4 rounded-xl">
      <div className="flex justify-between text-gray-400">
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-white font-bold">{value}%</div>
    </div>
  );
}
