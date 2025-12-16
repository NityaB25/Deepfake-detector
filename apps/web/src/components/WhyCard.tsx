import { Card, CardBody, CardHeader } from "./Card";

const HI = Number(process.env.NEXT_PUBLIC_VERDICT_HI ?? 0.7);
const LO = Number(process.env.NEXT_PUBLIC_VERDICT_LO ?? 0.3);

export function WhyCard({
  ourScore, apiScore, verdict,
}: { ourScore: number; apiScore: number; verdict: "Real"|"Fake"|"Inconclusive" }) {
  return (
    <Card>
      <CardHeader>Why this verdict?</CardHeader>
      <CardBody>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>We combine <b>Our model</b> and an <b>External API</b>.</li>
          <li><b>Thresholds</b>: Fake ≥ {Math.round(HI*100)}%, Real ≤ {Math.round(LO*100)}%, otherwise Inconclusive.</li>
          <li>Scores: <b>Our</b> {Math.round(ourScore*100)}% · <b>API</b> {Math.round(apiScore*100)}%.</li>
          <li>Limitations: lighting, compression, occlusion, dataset bias may affect results.</li>
        </ul>
      </CardBody>
    </Card>
  );
}
