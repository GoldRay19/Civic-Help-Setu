import { useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  SCHEDULE_4_CRITERIA,
  auditSchedule4Hygiene,
} from '../../services/foodSafetyService.js';

export default function Schedule4AuditorCard({
  checks = {},
  onChange,
  readOnly = false,
}) {
  const auditResult = useMemo(() => auditSchedule4Hygiene(checks), [checks]);

  const handleToggle = (id) => {
    if (readOnly || !onChange) return;
    const next = { ...checks, [id]: !checks[id] };
    onChange(next);
  };

  const getBadgeStyle = (badge) => {
    switch (badge) {
      case 'A+':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'A':
        return 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
      case 'B':
        return 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 animate-pulse';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                FSSAI Schedule 4 Sanitary & Hygiene Auditor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Statutory audit against Part II & IV of Licensing & Registration Regulations, 2011
              </p>
            </div>
          </div>
        </div>

        {/* Rating summary pill */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Compliance Score
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {auditResult.score}%
            </div>
          </div>
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${getBadgeStyle(
              auditResult.ratingBadge
            )}`}
          >
            {auditResult.ratingBadge === 'CRITICAL_RISK' ? (
              <ShieldAlert className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>{auditResult.ratingBadge}</span>
          </div>
        </div>
      </div>

      {auditResult.criticalFailures > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div>
            <span className="font-bold">Critical Non-Compliance Detected:</span>{' '}
            {auditResult.criticalFailures} essential sanitary standard(s) failed. In commercial kitchens,
            this constitutes grounds for immediate Improvement Notice under Section 32 and license suspension.
          </div>
        </div>
      )}

      {/* Checklist items */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {SCHEDULE_4_CRITERIA.map((criterion) => {
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

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span>
          Compliance requires passing all mandatory sanitary criteria and achieving at least 75% overall score.
        </span>
      </div>
    </div>
  );
}
