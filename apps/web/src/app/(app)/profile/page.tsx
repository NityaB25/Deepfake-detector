"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { API_URL } from "@/lib/api";

/* ---------- types ---------- */
interface Scan {
  createdAt: string;
  verdict: "Real" | "Fake" | "Inconclusive";
  ourScore: number;
  apiScore: number;
}

interface Stats {
  total: number;
  real: number;
  fake: number;
  inconclusive: number;
}

/* ---------- component ---------- */
export default function ProfilePage() {
  const { data: session, status } = useSession();

  const [stats, setStats] = useState<Stats | null>(null);
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const [error, setError] = useState<string | null>(null);

  /* ---------- FETCH PROFILE ---------- */
  useEffect(() => {
    if (status === "loading") return;

    if (status !== "authenticated") {
      setError("Please sign in to view your profile");
      return;
    }

    const backendToken = (session as any)?.backendToken;
    if (!backendToken) {
      setError("Backend token missing");
      return;
    }

    console.log("✅ Backend token:", backendToken);

    async function fetchProfile() {
      try {
        const res = await fetch(`${API_URL}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${backendToken}`,
          },
        });

        if (!res.ok) {
          throw new Error(`API failed: ${res.status}`);
        }

        const data = await res.json();
        console.log("✅ Profile data:", data);

        setStats(data.stats);
        setRecentScans(data.recent);
      } catch (err: any) {
        console.error("❌ Profile fetch error:", err);
        setError(err.message || "Failed to load profile");
      }
    }

    fetchProfile();
  }, [status, session]);

  /* ---------- STATES ---------- */
  if (status === "loading") {
    return <div className="pt-32 text-center text-gray-400">Loading session…</div>;
  }

  if (error) {
    return <div className="pt-32 text-center text-red-400">{error}</div>;
  }

  if (!stats) {
    return <div className="pt-32 text-center text-gray-400">Loading profile…</div>;
  }

  /* ---------- CHART DATA ---------- */
  const chartData = [...recentScans]
    .slice(0, 20)
    .reverse()
    .map((s, i) => ({ index: i + 1, score: s.ourScore }));

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-10">Profile</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <Stat label="Total" value={stats.total} icon={<TrendingUp />} />
          <Stat label="Real" value={stats.real} icon={<CheckCircle />} />
          <Stat label="Fake" value={stats.fake} icon={<XCircle />} />
          <Stat label="Inconclusive" value={stats.inconclusive} icon={<AlertCircle />} />
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-xl mb-10">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis dataKey="index" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line dataKey="score" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent scans */}
        <div className="space-y-4">
          {recentScans.map((s, i) => (
            <div
              key={i}
              className="bg-gray-800 p-4 rounded-xl flex justify-between"
            >
              <div>
                <div className="text-gray-400 text-sm">
                  {new Date(s.createdAt).toLocaleString()}
                </div>
                <div className="mt-1">{s.verdict}</div>
              </div>
              <div className="flex gap-6">
                <Score label="Our" value={Math.round((1 - s.ourScore) * 100)} />
                <Score label="API" value={s.apiScore} />
              </div>
            </div>
          ))}
        </div>

        {recentScans.length === 0 && (
          <div className="text-gray-400 text-center mt-10">
            No scans yet.
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */
function Stat({ label, value, icon }: any) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl">
      <div className="flex justify-between text-gray-400">
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

function Score({ label, value }: any) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-bold">{value}%</div>
    </div>
  );
}
