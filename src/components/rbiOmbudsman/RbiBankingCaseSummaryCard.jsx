import { useState, useEffect } from 'react';
import {
  Landmark,
  ShieldCheck,
  ShieldAlert,
  Edit3,
  Download,
  Trash2,
  FileText,
  Calendar,
  AlertCircle,
  CreditCard,
  FileSignature,
} from 'lucide-react';
import {
  OFFICIAL_STATUS_DISCLAIMER,
  verifyBankingIntegrity,
} from '../../services/rbiOmbudsmanStorage.js';
import {
  OMBUDSMAN_STATUS_OPTIONS,
} from '../../services/rbiOmbudsmanService.js';

export default function RbiBankingCaseSummaryCard({
  caseData,
  onStatusChange,
  onEditCase,
  onDeleteCase,
  onExportJson,
  onExportMarkdown,
  onOpenDrafter,
}) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [integrityValid, setIntegrityValid] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (caseData) {
      verifyBankingIntegrity(caseData).then((res) => {
        if (isMounted) setIntegrityValid(res);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [caseData]);

  if (!caseData) return null;

  const currentStatus =
    OMBUDSMAN_STATUS_OPTIONS.find((opt) => opt.value === caseData.status) ||
    OMBUDSMAN_STATUS_OPTIONS[0];

  const getStatusBadgeStyle = (val) => {
    switch (val) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300';
      case 'BRANCH_COMPLAINT_FILED':
        return 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300';
      case 'PNO_ESCALATED':
        return 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300';
      case 'CMS_OMBUDSMAN_FILED':
        return 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 font-bold';
      case 'AWARD_PASSED_SETTLED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 mt-1">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {caseData.bankName || 'Regulated Bank / Entity'}
              </h2>
              {/* Integrity Seal Badge */}
              <div
                title={
                  integrityValid
                    ? 'SHA-256 local evidentiary digest verified'
                    : 'Unsealed or locally modified record'
                }
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  integrityValid
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                }`}
              >
                {integrityValid ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Sealed</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Seal Pending</span>
                  </>
                )}
              </div>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Account/Card: {caseData.accountNumber || 'N/A'}
              </span>
              <span>• Branch: {caseData.branchName || 'Digital'}</span>
              <span>• Complainant: {caseData.complainantName || 'Self'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenDrafter?.(caseData)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
          >
            <FileSignature className="w-3.5 h-3.5" />
            <span>Draft PNO / Ombudsman Petition</span>
          </button>

          <button
            onClick={() => onEditCase?.(caseData)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => onExportJson?.(caseData)}
            title="Export Evidence JSON"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => onExportMarkdown?.(caseData)}
            title="Export Markdown Summary"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDeleteCase?.(caseData.id)}
            title="Delete Record"
            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of Case Particulars */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-emerald-500" /> Deficiency Category
          </div>
          <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1 leading-snug">
            {caseData.disputeType || 'Unauthorized Debit / TAT Failure'}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5" /> Disputed Amount
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            ₹{Number(caseData.transactionAmount || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            Zero Liability Eligible
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Transaction Date
          </div>
          <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
            {caseData.transactionDate || 'Unspecified'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Reported in: {caseData.reportingDays || 0} working days
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="text-slate-400 dark:text-slate-500 font-medium">
            PNO Ticket / Escalation
          </div>
          <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
            {caseData.pnoRefNumber || 'Pre-escalation stage'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Clause 11 CMS Jurisdiction
          </div>
        </div>
      </div>

      {/* Lifecycle Status Row */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Complaint Lifecycle Stage:
          </span>
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${getStatusBadgeStyle(
                currentStatus.value
              )}`}
            >
              <span>{currentStatus.label}</span>
            </button>

            {showStatusDropdown && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 z-20 py-1">
                {OMBUDSMAN_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onStatusChange?.(caseData.id, opt.value);
                      setShowStatusDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between ${
                      opt.value === currentStatus.value
                        ? 'font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500">
          Last Updated: {caseData.updatedAt ? new Date(caseData.updatedAt).toLocaleDateString() : 'N/A'}
        </div>
      </div>

      {/* Incident details notes if present */}
      {caseData.incidentDetails && (
        <div className="mt-3 p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200">
          <span className="font-semibold">Case Particulars:</span> {caseData.incidentDetails}
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
        {OFFICIAL_STATUS_DISCLAIMER}
      </div>
    </div>
  );
}
