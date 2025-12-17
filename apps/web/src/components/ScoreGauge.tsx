"use client";
type Props = { value: number; label: string; className?: string };
export function ScoreGauge({ value, label, className = "" }: Props) {
  const safe = typeof value === "number" && value >= 0 ? value : 0;
const pct = Math.round(safe * 100);

  const r = 52, c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg viewBox="0 0 140 140" className="h-36 w-36">
        <circle cx="70" cy="70" r={r} stroke="#e5e7eb" strokeWidth="12" fill="none" />
        <circle
          cx="70" cy="70" r={r} stroke="#2563eb" strokeWidth="12" fill="none"
          strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="76" textAnchor="middle" className="fill-slate-900 text-xl font-semibold">{pct}%</text>
      </svg>
      <div className="mt-2 text-sm text-slate-600">{label}</div>
    </div>
  );
}
