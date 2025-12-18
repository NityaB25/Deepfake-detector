export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <h1 className="text-3xl font-bold">How Deepfake Detection Works</h1>

      {/* Overview */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Overview</h2>
        <p className="text-gray-600">
          This app analyzes images and videos to estimate the likelihood that
          the content is AI-generated or manipulated (deepfake).
        </p>
        <p className="text-gray-600">
          To improve accuracy and reliability, we combine results from:
        </p>
        <ul className="list-disc pl-6 text-gray-600">
          <li>Our own machine learning model</li>
          <li>A trusted external detection API</li>
        </ul>
      </section>

      {/* Scores */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">What the Scores Mean</h2>

        <p className="text-gray-600">
          Both scores are shown as a percentage from <strong>0% to 100%</strong>.
        </p>

        <ul className="list-disc pl-6 text-gray-600">
          <li><strong>0%</strong> → Very likely real</li>
          <li><strong>100%</strong> → Very likely fake</li>
        </ul>

        <p className="text-gray-600">
          These scores represent probabilities, not absolute certainty.
        </p>
      </section>

      {/* Our Model */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How Our Model Calculates the Score</h2>

        <p className="text-gray-600">
          Our internal model is a deep learning image classifier trained to
          detect visual artifacts commonly found in deepfakes.
        </p>

        <ol className="list-decimal pl-6 text-gray-600 space-y-2">
          <li>The image or video is resized and normalized</li>
          <li>For videos, several frames are sampled</li>
          <li>Each frame is passed through the neural network</li>
          <li>The model outputs a probability score</li>
          <li>For videos, frame scores are averaged</li>
        </ol>

        <p className="text-gray-600">
          The final number represents the model’s confidence that the content is fake.
        </p>
      </section>

      {/* External API */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">External API Score</h2>

        <p className="text-gray-600">
          We also use an external detection service that applies its own
          proprietary algorithms and datasets.
        </p>

        <p className="text-gray-600">
          This provides an independent assessment to cross-check results.
        </p>
      </section>

      {/* Verdict */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Final Verdict</h2>

        <p className="text-gray-600">
          The verdict is determined by combining both scores:
        </p>

        <ul className="list-disc pl-6 text-gray-600">
          <li><strong>Real</strong> → Both scores are low</li>
          <li><strong>Fake</strong> → Both scores are high</li>
          <li><strong>Inconclusive</strong> → Scores disagree or are borderline</li>
        </ul>

        <p className="text-gray-600">
          When results are inconclusive, we recommend manual verification.
        </p>
      </section>

      {/* Transparency */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Important Note</h2>
        <p className="text-gray-600">
          No detection system is perfect. This tool is designed to assist
          decision-making, not replace human judgment.
        </p>
      </section>
    </div>
  );
}
