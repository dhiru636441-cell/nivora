import React, { useState } from 'react';
import { datasetService } from '../../lib/dataset-service';
import { DataQualityReport, ImportExecutionReport } from '../../lib/types';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Database,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface ExcelImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export const ExcelImporterModal: React.FC<ExcelImporterModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(datasetService.getQualityReport());
  const [executionReport, setExecutionReport] = useState<ImportExecutionReport | null>(datasetService.getImportReport());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrorMessage('Please select a valid Excel spreadsheet (.xlsx or .xls).');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleExecuteImport = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const report = await datasetService.importWorkbook(selectedFile);
      setExecutionReport(report);
      setQualityReport(datasetService.getQualityReport());
      onImportComplete?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error executing workbook import.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-cyan-400 tracking-wider">Dataset Ingestion Pipeline</span>
              <h3 className="font-serif text-lg font-bold text-white">Import Nivora Excel Dataset</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload Drop Zone */}
          <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 text-center bg-slate-950/40 transition-colors">
            <input
              type="file"
              id="excel-file-input"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="excel-file-input" className="cursor-pointer block space-y-2">
              <Upload className="w-8 h-8 mx-auto text-cyan-400" />
              <p className="text-sm font-semibold text-white">
                {selectedFile ? selectedFile.name : 'Select or drop Nivora_Duplicates(2).xlsx here'}
              </p>
              <p className="text-xs text-slate-400">
                Supports official 49-column schema (transactions, stays, guests, feedback, AI actions)
              </p>
              {selectedFile && (
                <span className="inline-block px-3 py-1 bg-cyan-950 text-cyan-300 text-xs rounded-full border border-cyan-800">
                  Ready to Validate: {(selectedFile.size / 1024).toFixed(0)} KB
                </span>
              )}
            </label>
          </div>

          {/* Execution Report (if import ran) */}
          {executionReport && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Idempotent Batch Import Executed Successfully</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Rows Read:</span>
                  <span className="font-mono font-bold text-white tabular-nums">{executionReport.total_rows_read}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Inserted:</span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">{executionReport.rows_inserted}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Exact Dups Skipped:</span>
                  <span className="font-mono font-bold text-amber-400 tabular-nums">{executionReport.exact_duplicate_rows_skipped}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Execution Time:</span>
                  <span className="font-mono font-bold text-cyan-300 tabular-nums">{executionReport.execution_duration_ms} ms</span>
                </div>
              </div>
            </div>
          )}

          {/* Current Database Quality Summary */}
          {qualityReport && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Database Quality & Anomaly Report
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-[11px] text-slate-400">Total Records</p>
                  <p className="font-mono text-base font-bold text-white mt-0.5 tabular-nums">
                    {qualityReport.total_rows_read}
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-[11px] text-slate-400">Exact Duplicates</p>
                  <p className="font-mono text-base font-bold text-amber-400 mt-0.5 tabular-nums">
                    {qualityReport.exact_duplicates_detected}
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-[11px] text-slate-400">Business Conflicts</p>
                  <p className="font-mono text-base font-bold text-cyan-400 mt-0.5 tabular-nums">
                    {qualityReport.business_conflicts_detected}
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-[11px] text-slate-400">Clean Operational Rows</p>
                  <p className="font-mono text-base font-bold text-emerald-400 mt-0.5 tabular-nums">
                    {qualityReport.valid_records}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                * Note: Historical repeated bookings are deliberately preserved as multi-transaction records. Idempotent import ensures rerunning does not create copies.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Non-destructive idempotent loading</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={!selectedFile || isProcessing}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing Workbook...' : 'Start Controlled Batch Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
