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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#F7F3EA] dark:bg-[#181D18] border border-[#C7A36A]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#C7A36A]/20 flex items-center justify-between bg-[#12382D] text-[#F7F3EA]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0D2820] border border-[#C7A36A]/40 flex items-center justify-center text-[#C7A36A]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#C7A36A] tracking-wider">Dataset Ingestion Pipeline</span>
              <h3 className="font-serif text-lg font-bold text-white">Import Nivora Excel Dataset</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#A9B8A4] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#242722] dark:text-[#F7F3EA]">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload Drop Zone */}
          <div className="border-2 border-dashed border-[#C7A36A]/40 hover:border-[#12382D] dark:hover:border-[#C7A36A] rounded-2xl p-6 text-center bg-white dark:bg-[#1E231E] transition-colors">
            <input
              type="file"
              id="excel-file-input"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="excel-file-input" className="cursor-pointer block space-y-2">
              <Upload className="w-8 h-8 mx-auto text-[#C7A36A]" />
              <p className="text-sm font-semibold text-[#12382D] dark:text-[#F7F3EA]">
                {selectedFile ? selectedFile.name : 'Select or drop Nivora_Duplicates(2).xlsx here'}
              </p>
              <p className="text-xs text-[#A9B8A4]">
                Supports official 49-column schema (transactions, stays, guests, feedback, AI actions)
              </p>
              {selectedFile && (
                <span className="inline-block px-3 py-1 bg-[#12382D] text-[#C7A36A] text-xs rounded-full border border-[#C7A36A]/30">
                  Ready to Validate: {(selectedFile.size / 1024).toFixed(0)} KB
                </span>
              )}
            </label>
          </div>

          {/* Execution Report (if import ran) */}
          {executionReport && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Idempotent Batch Import Executed Successfully</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[#A9B8A4] block text-[11px]">Rows Read:</span>
                  <span className="font-mono font-bold text-[#12382D] dark:text-[#F7F3EA]">{executionReport.total_rows_read}</span>
                </div>
                <div>
                  <span className="text-[#A9B8A4] block text-[11px]">Inserted:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{executionReport.rows_inserted}</span>
                </div>
                <div>
                  <span className="text-[#A9B8A4] block text-[11px]">Exact Dups Skipped:</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{executionReport.exact_duplicate_rows_skipped}</span>
                </div>
                <div>
                  <span className="text-[#A9B8A4] block text-[11px]">Execution Time:</span>
                  <span className="font-mono font-bold text-[#C7A36A]">{executionReport.execution_duration_ms} ms</span>
                </div>
              </div>
            </div>
          )}

          {/* Current Database Quality Summary */}
          {qualityReport && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A9B8A4]">
                Database Quality & Anomaly Report
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-[#1E231E] p-3 rounded-xl border border-[#C7A36A]/25">
                  <p className="text-[11px] text-[#A9B8A4]">Total Records</p>
                  <p className="font-serif text-lg font-bold text-[#12382D] dark:text-[#F7F3EA] mt-0.5">
                    {qualityReport.total_rows_read.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-[#1E231E] p-3 rounded-xl border border-[#C7A36A]/25">
                  <p className="text-[11px] text-[#A9B8A4]">Exact Duplicates</p>
                  <p className="font-serif text-lg font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                    {qualityReport.exact_duplicates_detected}
                  </p>
                </div>
                <div className="bg-white dark:bg-[#1E231E] p-3 rounded-xl border border-[#C7A36A]/25">
                  <p className="text-[11px] text-[#A9B8A4]">Business Conflicts</p>
                  <p className="font-serif text-lg font-bold text-[#C7A36A] mt-0.5">
                    {qualityReport.business_conflicts_detected}
                  </p>
                </div>
                <div className="bg-white dark:bg-[#1E231E] p-3 rounded-xl border border-[#C7A36A]/25">
                  <p className="text-[11px] text-[#A9B8A4]">Clean Operational Rows</p>
                  <p className="font-serif text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {qualityReport.valid_records.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-[#A9B8A4]">
                * Note: Historical repeated bookings are deliberately preserved as multi-transaction records. Idempotent import ensures rerunning does not create copies.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#C7A36A]/20 flex items-center justify-between bg-[#F7F3EA] dark:bg-[#141714]">
          <div className="flex items-center gap-1.5 text-xs text-[#A9B8A4]">
            <ShieldCheck className="w-4 h-4 text-[#C7A36A]" />
            <span>Non-destructive idempotent loading</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#A9B8A4] hover:text-[#12382D] dark:hover:text-[#F7F3EA] transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={!selectedFile || isProcessing}
              className="px-5 py-2.5 bg-[#12382D] hover:bg-[#0D2820] disabled:opacity-40 text-white font-medium text-xs rounded-xl transition-all shadow-xs cursor-pointer"
            >
              {isProcessing ? 'Processing Workbook...' : 'Start Controlled Batch Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
