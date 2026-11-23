import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { datasetService } from '../../services';
import { DatasetPreview } from '../../types';
import {
  UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle,
  FileCheck, ArrowRight, Table, AlertTriangle
} from 'lucide-react';

export const DatasetUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<DatasetPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setPreview(null);
    }
  };

  const handleUploadAndPreview = async () => {
    if (!file) {
      setError('Please select a CSV or Excel file.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const previewData = await datasetService.upload(file);
      setPreview(previewData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload and validate dataset.');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    setImporting(true);
    setError(null);
    try {
      const res = await datasetService.importData(preview.file_id, true);
      setImportSuccess(res.message);
      setTimeout(() => {
        navigate('/samples');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Dataset Upload & Ingestion
        </h1>
        <p className="text-xs text-slate-500">
          Upload multi-sample batch files in CSV or Excel format (.csv, .xlsx, .xls) for automated validation and database import.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {importSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{importSuccess} Redirecting to sample records...</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center space-y-4 shadow-sm hover:border-teal-500 transition-colors">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
          <UploadCloud className="h-7 w-7" />
        </div>
        <div>
          <label className="cursor-pointer">
            <span className="text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline">
              Choose a water quality file
            </span>
            <span className="text-xs text-slate-500"> or drag and drop here</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <div className="text-[11px] text-slate-400 mt-1">
            Accepted formats: CSV, XLSX, XLS (up to 10 MB)
          </div>
        </div>

        {file && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <FileSpreadsheet className="h-4 w-4 text-teal-600" />
            <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={handleUploadAndPreview}
            disabled={!file || uploading}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors shadow-md shadow-teal-500/20 disabled:opacity-50"
          >
            {uploading ? 'Analyzing Dataset...' : 'Upload & Preview Dataset'}
          </button>
        </div>
      </div>

      {/* Preview Section */}
      {preview && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-teal-600" /> Dataset Preprocessing Summary
              </h2>
              <p className="text-xs text-slate-500">
                File: <span className="font-mono font-medium">{preview.filename}</span> &bull; {preview.row_count} rows &bull; {preview.column_count} columns
              </p>
            </div>

            <button
              onClick={handleConfirmImport}
              disabled={importing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-colors disabled:opacity-50"
            >
              {importing ? 'Importing & Analyzing...' : 'Confirm Import into Database'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Preprocessing Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-semibold text-slate-400 uppercase">Original Rows</div>
              <div className="text-lg font-bold text-slate-800 dark:text-white">{preview.preprocessing_summary.original_row_count}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-semibold text-slate-400 uppercase">Cleaned Rows</div>
              <div className="text-lg font-bold text-teal-600">{preview.preprocessing_summary.cleaned_row_count}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-semibold text-slate-400 uppercase">Duplicates Removed</div>
              <div className="text-lg font-bold text-amber-600">{preview.preprocessing_summary.duplicate_rows_removed}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-semibold text-slate-400 uppercase">Missing Imputed</div>
              <div className="text-lg font-bold text-sky-600">{preview.preprocessing_summary.missing_values_handled}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-semibold text-slate-400 uppercase">Invalid Cleaned</div>
              <div className="text-lg font-bold text-rose-600">{preview.preprocessing_summary.invalid_values_identified}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-semibold text-slate-400 uppercase">Outliers Flagged</div>
              <div className="text-lg font-bold text-purple-600">{preview.preprocessing_summary.outliers_detected}</div>
            </div>
          </div>

          {/* Validation Warnings if any */}
          {preview.validation_errors.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Schema Notice:
              </div>
              <ul className="list-disc pl-5">
                {preview.validation_errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Table className="h-4 w-4" /> First 10 Processed Sample Rows
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                  <tr>
                    {preview.columns.slice(0, 10).map((col) => (
                      <th key={col} className="p-2.5 font-medium">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {preview.preview_rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      {preview.columns.slice(0, 10).map((col) => (
                        <td key={col} className="p-2.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {String(row[col] ?? 'N/A')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
