export function VerdictBadge({ verdict }: { verdict: "Real" | "Fake" | "Inconclusive" }) {
  const map = {
    Real: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Fake: "bg-rose-100 text-rose-800 border-rose-200",
    Inconclusive: "bg-amber-100 text-amber-800 border-amber-200",
  } as const;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${map[verdict]}`}>
      <span className="h-2 w-2 rounded-full bg-current/70" />
      {verdict}
    </span>
  );
}
