import { useMemo } from 'react';
import {
  Clock,
  AlertTriangle,
  Receipt,
  FileBadge,
} from 'lucide-react';
import {
  TAT_CHANNELS,
  calculateTatCompensation,
} from '../../services/rbiOmbudsmanService.js';

export default function TatCompensationCalculatorCard({
  channelId = 'ATM_CASH_FAILED',
  transactionDate = '',
  resolutionDate = '',
  transactionAmount = 0,
  onChange,
  readOnly = false,
}) {
  const comp = useMemo(() => {
    return calculateTatCompensation({
      channelId,
      transactionDate,
      resolutionDate,
      transactionAmount,
    });
  }, [channelId, transactionDate, resolutionDate, transactionAmount]);

  const handleFieldChange = (field, val) => {
    if (readOnly || !onChange) return;
    onChange({ [field]: val });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
        <span className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
          <Clock className="w-5 h-5" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Harmonised TAT &amp; Delay Compensation Calculator
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Statutory ₹100/day for failed digital transactions &amp; ₹5,000/day for delayed property documents
          </p>
        </div>
      </div>

      {/* Channel Selector */}
      <div className="mt-5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
          Select Transaction Channel / Service Deficiency
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {Object.entries(TAT_CHANNELS).map(([key, item]) => {
            const isSelected = channelId === item.id;
            return (
              <div
                key={key}
                onClick={() => handleFieldChange('channelId', item.id)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-blue-50/50 border-blue-400 dark:bg-blue-950/30 dark:border-blue-700 shadow-sm'
                    : 'bg-slate-50/50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 hover:border-slate-300'
                } ${readOnly ? 'cursor-default' : ''}`}
              >
                <input
                  type="radio"
                  checked={isSelected}
                  readOnly
                  className="mt-0.5 text-blue-600 focus:ring-blue-500 pointer-events-none"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {item.label}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 whitespace-nowrap">
                      TAT: T+{item.tatDays}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                    Penalty: ₹{item.penaltyPerDay.toLocaleString('en-IN')}/day • {item.tatRule}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date & Amount Inputs */}
      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Transaction / Loan Closure Date
          </label>
          <input
            type="date"
            disabled={readOnly}
            value={transactionDate || ''}
            onChange={(e) => handleFieldChange('transactionDate', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Reversal / Actual Resolution Date (Leave empty if pending)
          </label>
          <input
            type="date"
            disabled={readOnly}
            value={resolutionDate || ''}
            onChange={(e) => handleFieldChange('resolutionDate', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Disputed Principal Amount (₹)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">₹</span>
            <input
              type="number"
              min="0"
              disabled={readOnly}
              value={transactionAmount || ''}
              onChange={(e) => handleFieldChange('transactionAmount', Number(e.target.value) || 0)}
              placeholder="e.g. 10000"
              className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Outcome Breakdown Bar */}
      <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700">
          <div className="pr-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Elapsed / Delay Days
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {comp.delayDays} Days Delay
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Total {comp.elapsedDays} days elapsed (Allowed: {comp.allowableTatDays} days)
            </span>
          </div>

          <div className="pt-3 md:pt-0 md:px-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Statutory Penalty Rate
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              ₹{comp.penaltyRatePerDay.toLocaleString('en-IN')}/day
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Mandated by RBI Circular
            </span>
          </div>

          <div className="pt-3 md:pt-0 md:px-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Receipt className="w-3.5 h-3.5" />
              Statutory Delay Compensation
            </span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{comp.statutoryCompensation.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block mt-0.5 font-medium">
              Payable automatically by bank
            </span>
          </div>

          <div className="pt-3 md:pt-0 md:pl-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <FileBadge className="w-3.5 h-3.5 text-blue-500" />
              Total Entitlement Due
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              ₹{comp.totalAmountPayable.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Principal (₹{comp.principalAmount.toLocaleString('en-IN')}) + Penalty
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
