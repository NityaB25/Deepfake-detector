"use client";

import { useState } from "react";
import { Search, Link as LinkIcon, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { AnalysisResult, LoadingCard } from "../../../components/Card"

export default function ScanPage() {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleScan = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!validateUrl(url)) {
      setError("Please enter a valid URL");
      return;
    }

    setError(null);
    setScanning(true);
    setPreview(url);

    try {
      // Replace with your actual API call
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error("Scan failed");

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setScanning(false);
    }
  };

  const resetScan = () => {
    setUrl("");
    setResult(null);
    setError(null);
    setPreview(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !scanning) {
      handleScan();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Quick Scan
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Scan any public image or video URL for deepfake detection
          </p>
        </div>

        {!result ? (
          <div className="space-y-6">
            {/* Scan Input */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8">
              <div className="space-y-6">
                {/* URL Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Media URL
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="https://example.com/image.jpg"
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Enter a direct link to an image or video file
                  </p>
                </div>

                {/* Preview */}
                {preview && !scanning && !result && (
                  <div className="relative rounded-xl overflow-hidden bg-gray-800">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-64 object-contain"
                      onError={() => setError("Failed to load image preview")}
                    />
                  </div>
                )}

                {/* Scan Button */}
                <button
                  onClick={handleScan}
                  disabled={scanning || !url.trim()}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>Start Scan</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {scanning && (
              <LoadingCard message="Scanning media with AI models..." />
            )}

            {/* Example URLs */}
            <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center">
                <ExternalLink className="w-4 h-4 mr-2" />
                Example URLs to try
              </h3>
              <div className="space-y-2">
                {[
                  "https://example.com/sample-image.jpg",
                  "https://example.com/test-video.mp4",
                  "https://example.com/portrait.png",
                ].map((exampleUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setUrl(exampleUrl)}
                    className="w-full text-left px-4 py-3 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700 hover:border-gray-600 rounded-lg text-sm text-gray-400 hover:text-gray-300 transition-all duration-200 font-mono"
                  >
                    {exampleUrl}
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start space-x-3 text-sm text-gray-500 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p>
                The URL must be publicly accessible. Private or protected URLs cannot be scanned.
                Supported formats: JPEG, PNG, MP4, MOV
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <AnalysisResult
              title="Scan Complete"
              ourScore={result.ourScore}
              apiScore={result.apiScore}
              verdict={result.verdict}
            >
              <div className="space-y-4">
                {/* Source URL */}
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-2">Scanned URL</p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 break-all flex items-center"
                  >
                    {url}
                    <ExternalLink className="w-3 h-3 ml-2 flex-shrink-0" />
                  </a>
                </div>

                {/* Action Button */}
                <div className="flex justify-center">
                  <button
                    onClick={resetScan}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg shadow-purple-600/30"
                  >
                    Scan Another URL
                  </button>
                </div>
              </div>
            </AnalysisResult>
          </div>
        )}
      </div>
    </div>
  );
}
