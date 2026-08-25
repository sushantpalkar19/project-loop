"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, Trash2, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [isDragging, setIsDragging] = useState(false);

  function handleFileSelect(file: File | undefined) {
    if (file && file.name.endsWith(".csv")) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
    } else if (file) {
      setError("Please select a valid .csv file");
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
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-5 animate-in fade-in duration-150">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Bulk Import Feedback CSV
          </h3>
        </div>
      </div>

      {/* CSV Schema Guidance Box */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Info className="w-4 h-4 text-indigo-600" />
          <span>Expected CSV File Format:</span>
        </div>
        <div className="font-mono text-[11px] bg-slate-900 text-slate-200 p-2.5 rounded-lg overflow-x-auto space-y-0.5">
          <div className="text-indigo-300">content,channel,customer_label,created_at</div>
          <div className="text-slate-400">&quot;Great feature update!&quot;,email,CUST-001,2024-01-15</div>
        </div>
        <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
          <p>• <strong>content</strong> & <strong>channel</strong> are required fields.</p>
          <p>• Supported Channels: email, survey, social, api, manual, chat.</p>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          handleFileSelect(file);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 ${
          isDragging
            ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]"
            : selectedFile
            ? "border-emerald-400 bg-emerald-50/30"
            : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 border border-indigo-100">
          <Upload className="w-6 h-6" />
        </div>

        {selectedFile ? (
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              {selectedFile.name}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-800">
              Drag & drop your CSV file here, or{" "}
              <span className="text-indigo-600 font-bold underline">browse</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Supports .csv files up to 10MB
            </p>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      {selectedFile && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            onClick={handleClear}
            variant="outline"
            size="sm"
            disabled={loading}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Clear File
          </Button>
          <Button
            onClick={handleUpload}
            isLoading={loading}
            variant="primary"
            size="md"
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Start Bulk Import
          </Button>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-center gap-2 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Summary */}
      {result && (
        <div className="space-y-4 pt-2">
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
              result.errorCount === 0
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {result.errorCount === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <span className="font-bold block">
                  Import Process Completed ({result.totalRows} rows processed)
                </span>
                <span className="text-[11px]">
                  ✓ {result.successCount} imported successfully
                  {result.errorCount > 0 && <> · ✗ {result.errorCount} rows failed</>}
                </span>
              </div>
            </div>
          </div>

          {/* Row Errors Table */}
          {result.errors.length > 0 && (
            <div className="rounded-xl border border-rose-200 overflow-hidden bg-rose-50/40">
              <div className="px-4 py-2 bg-rose-100/70 border-b border-rose-200 text-rose-900 text-xs font-bold">
                Row Validation Error Report
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-rose-50 text-rose-800 font-semibold border-b border-rose-100">
                    <tr>
                      <th className="px-4 py-2 w-16">Row</th>
                      <th className="px-4 py-2">Validation Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 text-rose-700 font-mono text-[11px]">
                    {result.errors.map((err) => (
                      <tr key={err.row}>
                        <td className="px-4 py-2 font-bold">{err.row}</td>
                        <td className="px-4 py-2">{err.errors.join("; ")}</td>
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
