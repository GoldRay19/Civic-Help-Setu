import { useState, useEffect } from 'react';
import {
  Car,
  ShieldCheck,
  ShieldAlert,
  Edit3,
  Download,
  Trash2,
  FileText,
  MapPin,
  Calendar,
  AlertTriangle,
  Gavel,
  FileSignature,
} from 'lucide-react';
import {
  OFFICIAL_STATUS_DISCLAIMER,
  verifyChallanIntegrity,
} from '../../services/trafficChallanStorage.js';
import {
  CHALLAN_STATUS_OPTIONS,
} from '../../services/trafficChallanService.js';

export default function TrafficChallanSummaryCard({
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
      verifyChallanIntegrity(caseData).then((res) => {
        if (isMounted) setIntegrityValid(res);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [caseData]);

  if (!caseData) return null;

  const currentStatus =
    CHALLAN_STATUS_OPTIONS.find((opt) => opt.value === caseData.status) ||
    CHALLAN_STATUS_OPTIONS[0];

  const getStatusBadgeStyle = (val) => {
    switch (val) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300';
      case 'POLICE_GRIEVANCE_FILED':
        return 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300';
      case 'VIRTUAL_COURT_CONTESTED':
        return 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 font-bold';
      case 'MAGISTRATE_SUMMONS':
        return 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300';
      case 'DISMISSED_CANCELLED':
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
          <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 mt-1">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Vehicle: {caseData.vehicleNumber || 'Unspecified Plate'}
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
                    <span>Evidentiary Seal Verified</span>
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
                Challan No: {caseData.challanNumber || 'N/A'}
              </span>
              <span>• Class: {caseData.vehicleClass || 'Light Motor Vehicle'}</span>
              <span>• Owner: {caseData.ownerName || 'Self'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenDrafter?.(caseData)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
          >
            <FileSignature className="w-3.5 h-3.5" />
            <span>Draft Contest Petition</span>
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

      {/* Grid of Challan Details */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Alleged Offence
          </div>
          <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1 leading-snug">
            {caseData.allegedOffence || 'Violation details pending'}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Location / Junction
          </div>
          <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
            {caseData.location || 'Location unspecified'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Jurisdiction: Virtual Court / Traffic Branch
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Date &amp; Time of Capture
          </div>
          <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
            {caseData.challanDate || 'N/A'} {caseData.challanTime ? `@ ${caseData.challanTime}` : ''}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Service Lag: {caseData.daysToService ? `${caseData.daysToService} days` : 'Within 15 days'}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
            <Gavel className="w-3.5 h-3.5" /> Compounding Demand
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            ₹{Number(caseData.fineAmount || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
            Sec 208 Contest Available
          </div>
        </div>
      </div>

      {/* Lifecycle Status Row */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Contest Lifecycle Stage:
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
                {CHALLAN_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onStatusChange?.(caseData.id, opt.value);
                      setShowStatusDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between ${
                      opt.value === currentStatus.value
                        ? 'font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
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

      {/* Exculpatory alibi or notes */}
      {caseData.alibiDetails && (
        <div className="mt-3 p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200">
          <span className="font-semibold">Electronic Alibi Proof:</span> {caseData.alibiDetails}
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
        {OFFICIAL_STATUS_DISCLAIMER}
      </div>
    </div>
  );
}
