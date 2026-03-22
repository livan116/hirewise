"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";

export default function NewJobPage() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "upload">("details");
  const [jobId, setJobId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [jdText, setJdText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, string>>(
    {},
  );
  const [error, setError] = useState("");

  // Step 1: Save job details
  async function handleSaveJob() {
    if (!title.trim() || !jdText.trim()) {
      setError("Please fill in both fields");
      return;
    }
    setError("");

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, jd_text: jdText }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create job");
      return;
    }

    setJobId(data.job.id);
    setStep("upload");
  }

  // File drop handler
  const onDrop = useCallback(
    (accepted: File[]) => {
      const newFiles = accepted.slice(0, 50 - files.length);
      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 50,
  });

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // Step 2: Upload all files
  async function handleStartScreening() {
    if (files.length === 0 || !jobId) return;
    setUploading(true);

    // Upload files sequentially to avoid overwhelming the server
    for (const file of files) {
      setUploadProgress((prev) => ({ ...prev, [file.name]: "uploading" }));

      const formData = new FormData();
      formData.append("file", file);
      formData.append("jobId", jobId);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setUploadProgress((prev) => ({ ...prev, [file.name]: "done" }));
      } else {
        setUploadProgress((prev) => ({ ...prev, [file.name]: "error" }));
      }
    }

    // All uploaded — go to results
    router.push(`/jobs/${jobId}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← Back to dashboard
          </a>
          <h1 className="text-xl font-semibold text-gray-900 mt-4">
            {step === "details" ? "Create a new job" : "Upload resumes"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === "details"
              ? "Add the job title and paste the full job description"
              : `Upload up to 50 resumes for "${title}"`}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className={`flex items-center gap-2 text-sm font-medium ${step === "details" ? "text-gray-900" : "text-gray-400"}`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "details" ? "bg-gray-900 text-white" : "bg-green-500 text-white"}`}
            >
              {step === "upload" ? "✓" : "1"}
            </span>
            Job details
          </div>
          <div className="h-px w-8 bg-gray-200" />
          <div
            className={`flex items-center gap-2 text-sm font-medium ${step === "upload" ? "text-gray-900" : "text-gray-400"}`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "upload" ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-400"}`}
            >
              2
            </span>
            Upload resumes
          </div>
        </div>

        {/* Step 1: Job details */}
        {step === "details" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Job title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Job description
              </label>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the full job description here. The more detail, the better the AI screening will be."
                rows={12}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleSaveJob}
              className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Continue to upload →
            </button>
          </div>
        )}

        {/* Step 2: File upload */}
        {step === "upload" && (
          <div className="space-y-4">
            {/* Drop zone */}
            {!uploading && (
              <div
                {...getRootProps()}
                className={`bg-white rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <input {...getInputProps()} />
                <p className="text-sm font-medium text-gray-700">
                  {isDragActive
                    ? "Drop files here"
                    : "Drag & drop resumes here"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  or click to browse — PDF and DOCX, up to 50 files, 10MB each
                </p>
              </div>
            )}

            {/* File list */}
            {files.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {files.length} file{files.length !== 1 ? "s" : ""} selected
                  </span>
                  {!uploading && (
                    <span className="text-xs text-gray-400">
                      {50 - files.length} slots remaining
                    </span>
                  )}
                </div>

                {files.map((file, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                        {file.name.split(".").pop()?.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-700 truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {(file.size / 1024).toFixed(0)}KB
                      </span>
                    </div>

                    {uploading ? (
                      <span
                        className={`text-xs font-medium shrink-0 ${
                          uploadProgress[file.name] === "done"
                            ? "text-green-500"
                            : uploadProgress[file.name] === "error"
                              ? "text-red-500"
                              : uploadProgress[file.name] === "uploading"
                                ? "text-blue-500"
                                : "text-gray-400"
                        }`}
                      >
                        {uploadProgress[file.name] === "done"
                          ? "✓ Uploaded"
                          : uploadProgress[file.name] === "error"
                            ? "✗ Failed"
                            : uploadProgress[file.name] === "uploading"
                              ? "Uploading..."
                              : "Queued"}
                      </span>
                    ) : (
                      <button
                        onClick={() => removeFile(index)}
                        className="text-gray-300 hover:text-red-400 transition-colors shrink-0 ml-3"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            {!uploading && (
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("details")}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleStartScreening}
                  disabled={files.length === 0}
                  className="flex-2 flex-grow bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Start screening{" "}
                  {files.length > 0 ? `${files.length} resumes` : ""}
                </button>
              </div>
            )}

            {uploading && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-blue-700">
                  Uploading resumes...
                </p>
                <p className="text-xs text-blue-500 mt-0.5">
                  {
                    Object.values(uploadProgress).filter((s) => s === "done")
                      .length
                  }{" "}
                  of {files.length} uploaded
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
