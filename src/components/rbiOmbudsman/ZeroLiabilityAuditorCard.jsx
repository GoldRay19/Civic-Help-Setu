import { useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Landmark,
  Banknote,
  HelpCircle,
} from 'lucide-react';
import {
  calculateZeroLiability,
} from '../../services/rbiOmbudsmanService.js';

export default function ZeroLiabilityAuditorCard({
  reportingDays = 0,
  transactionAmount = 0,
  accountType = 'SAVINGS_CURRENT',
  onChange,
  readOnly = false,
}) {
  const calculation = useMemo(() => {
    return calculateZeroLiability({
      reportingDays,
      transactionAmount,
      accountType,
    });
  }, [reportingDays, transactionAmount, accountType]);

  const handleFieldChange = (field, val) => {
    if (readOnly || !onChange) return;
    onChange({ [field]: val });
  };

  const getTierBadgeStyle = (tier) => {
    switch (tier) {
      case 'ZERO_CUSTOMER_LIABILITY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'LIMITED_CUSTOMER_LIABILITY':
        return 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                RBI Zero Liability &amp; Customer Protection Auditor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Statutory limits under Master Direction DBR.No.Leg.BC.78/09.07.005/2017-18
              </p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${getTierBadgeStyle(
              calculation.liabilityTier
            )}`}
          >
            {calculation.liabilityTier === 'ZERO_CUSTOMER_LIABILITY' ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )}
            <span>{calculation.tierLabel}</span>
          </div>
        </div>
      </div>

      {/* Input Parameters Form */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Unauthorized Debit Amount (₹)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">₹</span>
            <input
              type="number"
              min="0"
              disabled={readOnly}
              value={transactionAmount || ''}
              onChange={(e) => handleFieldChange('transactionAmount', Number(e.target.value) || 0)}
              placeholder="e.g. 48500"
              className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Working Days to Report to Bank
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="number"
              min="0"
              max="60"
              disabled={readOnly}
              value={reportingDays || ''}
              onChange={(e) => handleFieldChange('reportingDays', Number(e.target.value) || 0)}
              placeholder="e.g. 2"
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {reportingDays <= 3 ? '✓ Within 3 working days (Zero Liability)' : 'Exceeds 3 working days'}
          </span>
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Account / Card Type
          </label>
          <select
            disabled={readOnly}
            value={accountType}
            onChange={(e) => handleFieldChange('accountType', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="SAVINGS_CURRENT">Savings / Current / Overdraft Account (Max ₹10,000 cap)</option>
            <option value="BSBD">Basic Savings Bank Deposit (BSBD) Account (Max ₹5,000 cap)</option>
            <option value="CREDIT_CARD_ABOVE_5L">Credit Card with Limit &gt; ₹5 Lakh (Max ₹25,000 cap)</option>
          </select>
        </div>
      </div>

      {/* Outcome Calculation Grid */}
      <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700">
          <div className="pr-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Customer Liability
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              ₹{calculation.customerLiability.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {calculation.customerLiability === 0
                ? 'Complete statutory immunity under RBI Circular'
                : 'Capped liability under 4-7 days rule'}
            </span>
          </div>

          <div className="pt-3 md:pt-0 md:px-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Banknote className="w-3.5 h-3.5" />
              Bank Refund Mandated
            </span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{calculation.bankLiability.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block mt-0.5 font-medium">
              Mandatory credit payable to customer
            </span>
          </div>

          <div className="pt-3 md:pt-0 md:pl-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Landmark className="w-3.5 h-3.5 text-blue-500" />
              Shadow Credit Timeline
            </span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
              {calculation.shadowCreditMandatory ? 'Within 10 Working Days' : 'Subject to Investigation'}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Bank must credit without waiting for insurance claim
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>
            Under paragraph 9 of the circular, the burden of proving customer negligence or credential sharing
            lies strictly on the bank. In the absence of proof, the customer has zero liability.
          </span>
        </div>
      </div>
    </div>
  );
}
