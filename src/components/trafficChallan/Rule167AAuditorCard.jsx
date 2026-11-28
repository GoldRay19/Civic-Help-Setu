import { useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Video,
} from 'lucide-react';
import {
  RULE_167A_CRITERIA,
  auditRule167ACompliance,
} from '../../services/trafficChallanService.js';

export default function Rule167AAuditorCard({
  checks = {},
  daysToService = 0,
  onChange,
  readOnly = false,
}) {
  const auditResult = useMemo(() => {
    return auditRule167ACompliance(checks, daysToService);
  }, [checks, daysToService]);

  const handleToggle = (id) => {
    if (readOnly || !onChange) return;
    const next = { ...checks, [id]: !checks[id] };
    onChange({ rule167AChecks: next });
  };

  const handleDaysChange = (val) => {
    if (readOnly || !onChange) return;
    onChange({ daysToService: Math.max(0, Number(val) || 0) });
  };

  const getBadgeStyle = (status) => {
    switch (status) {
      case 'COMPLIANT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'VULNERABLE':
        return 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 animate-pulse';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              <Video className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Rule 167A Electronic Monitoring Compliance Auditor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Statutory evidentiary standards under Central Motor Vehicles (Seventeenth Amendment) Rules, 2021
              </p>
            </div>
          </div>
        </div>

        {/* Rating summary pill */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Admissibility Score
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {auditResult.score}%
            </div>
          </div>
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${getBadgeStyle(
              auditResult.complianceStatus
            )}`}
          >
            {auditResult.complianceStatus === 'FATALLY_DEFECTIVE' ? (
              <ShieldAlert className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>{auditResult.statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Critical Defect Banner */}
      {auditResult.criticalFailures > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div>
            <span className="font-bold">Evidentiary Inadmissibility:</span>{' '}
            {auditResult.criticalFailures} fatal defect(s) detected. Under Rule 167A(2), an electronic challan
            lacking verified camera calibration, clear plate identification, or served past 15 days is liable
            to be dismissed by the Virtual Court without compounding.
          </div>
        </div>
      )}

      {/* Days to Service Input */}
      <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold">Statutory 15-Day Service Rule (Rule 167A(4)):</span>
          <span className="text-slate-500 dark:text-slate-400">
            Days elapsed between alleged violation and receipt of electronic notice:
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            disabled={readOnly}
            value={daysToService || ''}
            onChange={(e) => handleDaysChange(e.target.value)}
            placeholder="e.g. 18"
            className="w-20 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
          <span className="text-[11px] text-slate-500 font-medium">Days</span>
          {auditResult.isDelayedService && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              Delayed &gt; 15 Days
            </span>
          )}
        </div>
      </div>

      {/* Criteria Checklist */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {RULE_167A_CRITERIA.map((criterion) => {
          const isChecked = Boolean(checks[criterion.id]);
          return (
            <div
              key={criterion.id}
              onClick={() => handleToggle(criterion.id)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer select-none flex items-start gap-3 ${
                isChecked
                  ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
                  : 'bg-slate-50/60 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 hover:border-slate-300'
              } ${readOnly ? 'cursor-default' : ''}`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isChecked ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {criterion.title}
                  </span>
                  {criterion.critical && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                      Mandatory
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {criterion.description}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                  <span className="font-medium text-slate-500 dark:text-slate-400">
                    {criterion.category}
                  </span>
                  <span>•</span>
                  <span>Weight: {criterion.statutoryWeight} pts</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
