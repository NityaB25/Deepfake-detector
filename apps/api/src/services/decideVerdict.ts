export function decideVerdict(a: number, b: number) {
  const hi = Number(process.env.VERDICT_HI ?? 0.7);
  const lo = Number(process.env.VERDICT_LO ?? 0.3);
  if (a < 0 || a == null) {
  if (b >= hi) return "Fake";
  if (b <= lo) return "Real";
  return "Inconclusive";
}

  if (a >= hi && b >= hi) return "Fake";
  if (a <= lo && b <= lo) return "Real";
  return "Inconclusive";
}
