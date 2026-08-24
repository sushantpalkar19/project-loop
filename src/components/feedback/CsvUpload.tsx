"use client";

import { useState, useRef } from "react";

interface RowError {
  row: number;
  errors: string[];
  data: Record<string, string>;
}

interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: RowError[];
}

interface CsvUploadProps {
  onImportComplete: () => void;
}

export default function CsvUpload({ onImportComplete }: CsvUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
    }
  }

  function handleClear() {
    setSelectedFile(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/feedback/csv", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      setResult(data.result);
      onImportComplete();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Import from CSV
      </h3>

      {/* Format Guidance */}
      <div className="mb-4 bg-gray-50 rounded-md p-4">
        <p className="text-sm text-gray-700 font-medium mb-2">
          Expected CSV format:
        </p>
        <code className="text-xs text-gray-600 block">
          content,channel,customer_label,created_at
        </code>
        <code className="text-xs text-gray-500 block mt-1">
          &quot;Great product!&quot;,email,CUST-001,2024-01-15
        </code>
        <p className="text-xs text-gray-500 mt-2">
          • <strong>content</strong> and <strong>channel</strong> are required
          <br />
          • <strong>customer_label</strong> and <strong>created_at</strong> are
          optional
          <br />• Channels: email, survey, social, api, manual, chat
        </p>
      </div>

      {/* File Input */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {selectedFile && (
          <>
            <button
              onClick={handleUpload}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Importing..." : "Upload"}
            </button>
            <button
              onClick={handleClear}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {/* Selected File Info */}
      {selectedFile && !loading && !result && (
        <div className="mt-3 text-sm text-gray-600">
          Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}{" "}
          KB)
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Importing feedback...
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-4 space-y-3">
          {/* Summary */}
          <div
            className={`px-4 py-3 rounded text-sm ${
              result.errorCount === 0
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-yellow-50 border border-yellow-200 text-yellow-700"
            }`}
          >
            <p className="font-medium">
              Import Complete
            </p>
            <p className="mt-1">
              ✓ {result.successCount} imported
              {result.errorCount > 0 && (
                <> · ✗ {result.errorCount} failed</>
              )}
            </p>
          </div>

          {/* Row Errors */}
          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded overflow-hidden">
              <div className="px-4 py-2 bg-red-100 text-red-800 text-sm font-medium">
                Row Validation Errors
              </div>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-red-800">
                        Row
                      </th>
                      <th className="px-4 py-2 text-left text-red-800">
                        Errors
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {result.errors.map((err) => (
                      <tr key={err.row}>
                        <td className="px-4 py-2 text-red-700 font-medium">
                          {err.row}
                        </td>
                        <td className="px-4 py-2 text-red-600">
                          {err.errors.join("; ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
