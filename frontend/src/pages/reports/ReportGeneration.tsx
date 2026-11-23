import React, { useEffect, useState } from 'react';
import { reportService, sampleService } from '../../services';
import { WaterSample } from '../../types';
import { FileText, FileDown, CheckCircle2, Clock, Download, RefreshCw, AlertCircle } from 'lucide-react';

export const ReportGeneration: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [samples, setSamples] = useState<WaterSample[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<number | ''>('');
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [repRes, sampleRes] = await Promise.all([
        reportService.list(),
        sampleService.list({ limit: 100 })
      ]);
      setReports(repRes);
      setSamples(sampleRes);
      if (sampleRes.length > 0 && selectedSampleId === '') {
        setSelectedSampleId(sampleRes[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGeneratePdf = async () => {
    if (!selectedSampleId) return;
    setGenerating(true);
    setMessage(null);
    try {
      const res = await reportService.generate({
        report_type: 'sample_pdf',
        sample_id: Number(selectedSampleId)
      });
      setMessage('PDF report generated successfully!');
      loadData();
    } catch (err: any) {
      alert('Report generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateExcel = async () => {
    setGenerating(true);
    setMessage(null);
    try {
      const res = await reportService.generate({
        report_type: 'samples_excel',
        title: 'Full Water Quality Database Export'
      });
      setMessage('Excel workbook generated successfully!');
      loadData();
    } catch (err: any) {
      alert('Excel generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Analytical Report Generation & Exports
        </h1>
        <p className="text-xs text-slate-500">
          Generate publication-style PDF screening summaries using ReportLab and multi-sheet Excel workbooks using OpenPyXL.
        </p>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Generation Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Generator */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Individual Sample Screening PDF
              </h2>
              <p className="text-xs text-slate-500">ReportLab formatted document with parameters, WQI score, and advisories.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Sample to Report
            </label>
            <select
              value={selectedSampleId}
              onChange={(e) => setSelectedSampleId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            >
              {samples.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sample_id} &bull; {s.location_name} ({s.analysis?.predicted_category || 'Assessed'})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleGeneratePdf}
              disabled={generating || !selectedSampleId}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md shadow-teal-500/20 disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" />
              {generating ? 'Generating PDF...' : 'Generate & Archive PDF'}
            </button>
            {selectedSampleId && (
              <a
                href={reportService.getSamplePdfUrl(Number(selectedSampleId))}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1"
              >
                Direct Download &rarr;
              </a>
            )}
          </div>
        </div>

        {/* Excel Generator */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Multi-Sheet Excel Workbook
              </h2>
              <p className="text-xs text-slate-500">OpenPyXL workbook with Samples, Quality Tiers, Anomalies, and Alert History.</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Exports all current database water records into an Excel file (.xlsx) with auto-formatted column headers, styling, and multiple sheets.
          </p>

          <div className="pt-6 flex items-center gap-3">
            <button
              onClick={handleGenerateExcel}
              disabled={generating}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" />
              {generating ? 'Generating Workbook...' : 'Generate Excel Export'}
            </button>
            <a
              href={reportService.getDatasetExcelUrl()}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
            >
              Direct Download &rarr;
            </a>
          </div>
        </div>
      </div>

      {/* Generated Reports Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-500">
          Generated Document Archive ({reports.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4">Generated Date</th>
                <th className="py-3 px-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No generated reports archived yet. Use the buttons above to create reports.
                  </td>
                </tr>
              ) : (
                reports.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {r.report_id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {r.title}
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-500">
                      {r.report_type.includes('pdf') ? 'PDF' : 'Excel'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {(r.file_size_bytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {r.created_at ? new Date(r.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={r.download_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-teal-600 hover:underline font-semibold"
                      >
                        <FileDown className="h-3.5 w-3.5" /> Download
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
