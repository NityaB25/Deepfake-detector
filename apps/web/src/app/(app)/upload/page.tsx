"use client";

import { useState, useCallback } from "react";
import { Upload, X, AlertCircle } from "lucide-react";
import { AnalysisResult, LoadingCard } from "../../../components/Card";
import { API_URL } from "@/lib/api";
import { useSession } from "next-auth/react";

export default function UploadPage() {
  const { data: session } = useSession();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  /* ---------------- Drag & Drop ---------------- */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  }, []);

  /* ---------------- File Selection ---------------- */
  const handleFileSelect = (f: File) => {
    setError(null);

    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "video/mp4",
      "video/quicktime",
    ];

    if (!allowed.includes(f.type)) {
      setError("Upload JPEG, PNG, MP4 or MOV only");
      return;
    }

    if (f.size > 50 * 1024 * 1024) {
      setError("File must be under 50MB");
      return;
    }

    setFile(f);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  };

  /* ---------------- Upload + Scan ---------------- */
  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      /* 1️⃣ Get Cloudinary signature */
      const sigRes = await fetch(`${API_URL}/api/upload/sign`, {
        credentials: "include",
      });

      if (!sigRes.ok) throw new Error("Failed to get upload signature");
      const sig = await sigRes.json();

      /* 2️⃣ Upload directly to Cloudinary */
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", sig.timestamp);
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
        { method: "POST", body: form }
      );

      if (!cloudRes.ok) throw new Error("Cloudinary upload failed");
      const uploaded = await cloudRes.json();

      setUploading(false);
      setAnalyzing(true);

      /* 3️⃣ Send URL to backend scan (AUTH FIXED) */
      const scanRes = await fetch(`${API_URL}/api/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session && (session as any).backendToken
            ? { Authorization: `Bearer ${(session as any).backendToken}` }
            : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          fileUrl: uploaded.secure_url,
          fileType: file.type.startsWith("video") ? "video" : "image",
        }),
      });

      if (!scanRes.ok) throw new Error("Scan failed");
      const scan = await scanRes.json();

      setResult(scan);
      console.log(scan);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {!result ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative bg-gray-900/50 border-2 border-dashed rounded-3xl p-12 ${
              dragActive ? "border-blue-500" : "border-gray-700"
            }`}
          >
            {!preview ? (
              <label className="cursor-pointer block text-center">
                <Upload className="w-12 h-12 text-white mx-auto mb-4" />
                <input type="file" hidden onChange={handleFileInput} />
                <p className="text-gray-400">Click or drop file</p>
              </label>
            ) : (
              <>
                <button
                  onClick={resetUpload}
                  className="absolute top-4 right-4"
                >
                  <X className="text-red-500" />
                </button>

                {file?.type.startsWith("image") ? (
                  <img
                    src={preview}
                    className="rounded-xl mx-auto max-h-[400px]"
                  />
                ) : (
                  <video
                    src={preview}
                    controls
                    className="rounded-xl mx-auto max-h-[400px]"
                  />
                )}

                <button
                  onClick={handleUpload}
                  disabled={uploading || analyzing}
                  className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl disabled:opacity-50"
                >
                  {uploading
                    ? "Uploading..."
                    : analyzing
                    ? "Analyzing..."
                    : "Upload & Analyze"}
                </button>
              </>
            )}

            {error && (
              <div className="mt-4 text-red-400 flex gap-2 items-center">
                <AlertCircle /> {error}
              </div>
            )}

            {(uploading || analyzing) && (
              <LoadingCard
                message={uploading ? "Uploading…" : "Analyzing…"}
              />
            )}
          </div>
        ) : (
          <AnalysisResult
            title="Analysis Complete"
            
              
              ourScore={result.ourScore}
              apiScore={result.apiScore}

            verdict={result.verdict}
           
          >
            <button
              onClick={resetUpload}
              className="mt-6 bg-blue-600 px-6 py-3 rounded-xl"
            >
              Analyze Another
            </button>
          </AnalysisResult>
        )}
      </div>
    </div>
  );
}
