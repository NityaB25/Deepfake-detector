export function decideVerdict(a: number | null, b: number | null) {
  // If one score is missing, fall back to the other
  if (a == null && b == null) return "Inconclusive";

  if (a == null) {
    if (b!=null && b >= 0.8) return "Fake";
    if (b!=null && b <= 0.2) return "Real";
    return "Inconclusive";
  }

  if (b == null) {
    if (a >= 0.8) return "Fake";
    if (a <= 0.2) return "Real";
    return "Inconclusive";
  }

  // ✅ Strong agreement cases
  if (a >= 0.8 && b >= 0.8) return "Fake";
  if (a <= 0.2 && b <= 0.2) return "Real";

  // ❓ Everything else
  return "Inconclusive";
}
