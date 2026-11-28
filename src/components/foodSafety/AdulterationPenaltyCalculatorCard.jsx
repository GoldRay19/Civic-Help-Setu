import { useMemo } from 'react';
import {
  Scale,
  HeartPulse,
  Banknote,
  AlertCircle,
  FileBadge,
  Stethoscope,
} from 'lucide-react';
import {
  VIOLATION_CATEGORIES,
  INJURY_TIERS,
  calculateAdulterationLiability,
} from '../../services/foodSafetyService.js';

export default function AdulterationPenaltyCalculatorCard({
  selectedViolations = [],
  injuryTier = 'NONE',
  actualMedicalBills = 0,
  daysHospitalized = 0,
  lostWages = 0,
  onChange,
  readOnly = false,
}) {
  const calculations = useMemo(() => {
    return calculateAdulterationLiability({
      selectedViolations,
      injuryTier,
      actualMedicalBills,
      daysHospitalized,
      lostWages,
    });
  }, [selectedViolations, injuryTier, actualMedicalBills, daysHospitalized, lostWages]);

  const handleViolationToggle = (vKey) => {
    if (readOnly || !onChange) return;
    const exists = selectedViolations.includes(vKey);
    const updated = exists
      ? selectedViolations.filter((k) => k !== vKey)
      : [...selectedViolations, vKey];
    onChange({ selectedViolations: updated });
  };

  const handleFieldChange = (field, value) => {
    if (readOnly || !onChange) return;
    onChange({ [field]: value });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
        <span className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
          <Scale className="w-5 h-5" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Adulteration Statutory Penalty & Section 65 Compensation Calculator
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            FSSA 2006 statutory fine exposure and consumer bodily injury compensation
          </p>
        </div>
      </div>

      {/* Violations checklist */}
      <div className="mt-5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
          1. Select Established / Alleged Statutory Violations
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {Object.entries(VIOLATION_CATEGORIES).map(([key, item]) => {
            const isChecked = selectedViolations.includes(item.id);
            return (
              <div
                key={key}
                onClick={() => handleViolationToggle(item.id)}
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {item.section}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      Up to ₹{(item.maxPenalty / 100000).toFixed(1)}L
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Consumer Injury & Damages Section */}
      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
          2. Consumer Bodily Harm & Hospitalization Tier (Section 65)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
          {Object.values(INJURY_TIERS).map((tier) => {
            const isSelected = injuryTier === tier.id;
            return (
              <div
                key={tier.id}
                onClick={() => handleFieldChange('injuryTier', tier.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all text-center ${
                  isSelected
                    ? 'bg-rose-50 border-rose-400 text-rose-900 dark:bg-rose-950/30 dark:border-rose-700 dark:text-rose-200 shadow-sm'
                    : 'bg-slate-50/60 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                } ${readOnly ? 'cursor-default' : ''}`}
              >
                <div className="text-xs font-bold">{tier.label.split('(')[0]}</div>
                <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1">
                  {tier.statutoryCompensation > 0
                    ? `Min/Cap ₹${(tier.statutoryCompensation / 100000).toFixed(1)} Lakh`
                    : '₹0 (No Injury)'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {tier.section}
                </div>
              </div>
            );
          })}
        </div>

        {/* Financial Expenditure Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Actual Medical / Hospital Bills (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">₹</span>
              <input
                type="number"
                min="0"
                disabled={readOnly}
                value={actualMedicalBills || ''}
                onChange={(e) => handleFieldChange('actualMedicalBills', e.target.value)}
                placeholder="e.g. 15000"
                className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Hospitalization Duration (Days)
            </label>
            <div className="relative">
              <Stethoscope className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="number"
                min="0"
                disabled={readOnly}
                value={daysHospitalized || ''}
                onChange={(e) => handleFieldChange('daysHospitalized', e.target.value)}
                placeholder="e.g. 3"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Lost Wages / Convalescence Loss (₹)
            </label>
            <div className="relative">
              <Banknote className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="number"
                min="0"
                disabled={readOnly}
                value={lostWages || ''}
                onChange={(e) => handleFieldChange('lostWages', e.target.value)}
                placeholder="e.g. 5000"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statutory Calculation Summary Card */}
      <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700">
          {/* Statutory Penal Exposure */}
          <div className="pr-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Max Statutory Penalties (FBO)
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              ₹{calculations.totalMaxPenaltyLiability.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Payable into State Government Exchequer upon conviction
            </span>
          </div>

          {/* Consumer Compensation */}
          <div className="pt-3 md:pt-0 md:px-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <HeartPulse className="w-3.5 h-3.5" />
              Section 65 Consumer Compensation
            </span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{calculations.recommendedTotalCompensation.toLocaleString('en-IN')}
            </div>
            {calculations.interimReliefMandatory && (
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block mt-0.5 font-medium">
                Includes mandatory interim relief of ₹
                {calculations.interimReliefAmount.toLocaleString('en-IN')} within 30 days
              </span>
            )}
          </div>

          {/* Competent Adjudicating Forum */}
          <div className="pt-3 md:pt-0 md:pl-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <FileBadge className="w-3.5 h-3.5 text-blue-500" />
              Competent Forum
            </span>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
              {calculations.primaryForum}
            </div>
            {calculations.hasCriminalCharge && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                Cognizable Offence (Sec 59)
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>
            Section 65(1) mandates compensation directly to the victim. Failure of FBO to pay compensation
            within the specified timeline leads to cancellation of license under Section 65(3).
          </span>
        </div>
      </div>
    </div>
  );
}
