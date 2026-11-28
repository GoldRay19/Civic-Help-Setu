import { useMemo } from 'react';
import {
  Scale,
  Gavel,
  AlertOctagon,
  Building2,
} from 'lucide-react';
import {
  CHALLAN_DEFECT_TYPES,
  analyzeChallanDefects,
} from '../../services/trafficChallanService.js';

export default function ChallanDefectAnalyzerCard({
  selectedDefects = [],
  fineAmount = 0,
  onChange,
  readOnly = false,
}) {
  const analysis = useMemo(() => {
    return analyzeChallanDefects(selectedDefects, { fineAmount });
  }, [selectedDefects, fineAmount]);

  const handleToggleDefect = (dKey) => {
    if (readOnly || !onChange) return;
    const exists = selectedDefects.includes(dKey);
    const updated = exists
      ? selectedDefects.filter((k) => k !== dKey)
      : [...selectedDefects, dKey];
    onChange({ selectedDefects: updated });
  };

  const getStrengthStyle = (str) => {
    switch (str) {
      case 'STRONG':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'MODERATE':
        return 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
        <span className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
          <Scale className="w-5 h-5" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Challan Evidentiary Defects &amp; Grounds of Contest Analyzer
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Identify patent fatal infirmities under Section 208 and Legal Metrology standards
          </p>
        </div>
      </div>

      {/* Defect Checklist */}
      <div className="mt-5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
          Select Patent Evidentiary Defects
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {Object.entries(CHALLAN_DEFECT_TYPES).map(([key, item]) => {
            const isChecked = selectedDefects.includes(item.id);
            return (
              <div
                key={key}
                onClick={() => handleToggleDefect(item.id)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                  isChecked
                    ? 'bg-amber-50/50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800'
                    : 'bg-slate-50/50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 hover:border-slate-300'
                } ${readOnly ? 'cursor-default' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  readOnly
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 pointer-events-none"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {item.label}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.severity === 'FATAL'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                    {item.description}
                  </p>
                  <div className="mt-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                    Ground: {item.statutoryGround}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analysis Outcome Bar */}
      <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700">
          {/* Contest Strength */}
          <div className="pr-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Legal Contest Strength
            </span>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStrengthStyle(
                  analysis.contestStrength
                )}`}
              >
                {analysis.contestStrength} CONTEST
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({analysis.fatalDefectsCount} Fatal Defects)
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
              Based on Section 208 precedent &amp; Legal Metrology norms
            </span>
          </div>

          {/* Recommended Forum */}
          <div className="pt-3 md:pt-0 md:px-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Building2 className="w-3.5 h-3.5" />
              Recommended Contest Forum
            </span>
            <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
              {analysis.forum}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {analysis.recommendedAction}
            </span>
          </div>

          {/* Compounding Exposure */}
          <div className="pt-3 md:pt-0 md:pl-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Gavel className="w-3.5 h-3.5 text-amber-500" />
              Compounding Fine Exposure
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              ₹{analysis.compoundingAmount.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5 font-medium">
              Saved upon successful unconditional dismissal under Sec 208
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <AlertOctagon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>
            Electing court trial under Section 208 places the burden of proving camera calibration and
            tamper-proof chain of custody strictly on the prosecution.
          </span>
        </div>
      </div>
    </div>
  );
}
