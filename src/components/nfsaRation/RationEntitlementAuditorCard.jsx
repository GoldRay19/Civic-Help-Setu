import { useState, useMemo } from 'react';
import {
  calculateEntitlement,
  auditWeighmentAndCost,
  NFSA_CARD_TYPES
} from '../../services/nfsaRationService';
import { ShieldCheck, AlertTriangle, Scale, CheckCircle2, ShoppingBag } from 'lucide-react';

export default function RationEntitlementAuditorCard({ onSaveAudit }) {
  const [cardType, setCardType] = useState('PHH');
  const [familyMembers, setFamilyMembers] = useState(4);
  const [scheme, setScheme] = useState('PMGKAY_FREE');
  const [actualDeliveredKg, setActualDeliveredKg] = useState('18');
  const [actualChargedRupees, setActualChargedRupees] = useState('50');

  const entitlement = useMemo(() => {
    return calculateEntitlement({
      cardType,
      familyMembers,
      scheme
    });
  }, [cardType, familyMembers, scheme]);

  const audit = useMemo(() => {
    return auditWeighmentAndCost({
      entitlement,
      actualDeliveredKg: parseFloat(actualDeliveredKg) || 0,
      actualChargedRupees: parseFloat(actualChargedRupees) || 0
    });
  }, [entitlement, actualDeliveredKg, actualChargedRupees]);

  const handleSave = () => {
    if (onSaveAudit) {
      onSaveAudit({
        cardType,
        familyMembers,
        scheme,
        entitlement,
        audit,
        date: new Date().toISOString()
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
              <Scale className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              NFSA Quota Entitlement & Weighment Auditor
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Audits statutory grain quotas under Section 3(1) of NFSA 2013 and checks for illegal short-weighing or price overcharging.
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-full">
          Section 3 & Schedule I
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="nfsa-card-type-select" className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
            Ration Card Category
          </label>
          <select
            id="nfsa-card-type-select"
            value={cardType}
            onChange={(e) => setCardType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-100"
          >
            {Object.values(NFSA_CARD_TYPES).map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="nfsa-family-members-input" className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
            Family Members (On Card)
          </label>
          <input
            id="nfsa-family-members-input"
            type="number"
            min="1"
            max="25"
            value={familyMembers}
            disabled={cardType === 'AAY'}
            onChange={(e) => setFamilyMembers(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 disabled:opacity-50"
          />
          {cardType === 'AAY' && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block">
              AAY cards receive a flat 35 kg/month quota regardless of member count.
            </span>
          )}
        </div>

        <div>
          <label htmlFor="nfsa-scheme-type-select" className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
            Pricing Scheme
          </label>
          <select
            id="nfsa-scheme-type-select"
            value={scheme}
            onChange={(e) => setScheme(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-100"
          >
            <option value="PMGKAY_FREE">PMGKAY (100% Free Foodgrains - ₹0/kg)</option>
            <option value="NFSA_STATUTORY">NFSA Central Issue Price (Rice ₹3, Wheat ₹2)</option>
          </select>
        </div>
      </div>

      {/* Statutory Entitlement Summary Box */}
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Statutory Entitlement Breakdown
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">Total Quota</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {entitlement.totalGrainKg} kg
            </div>
            <span className="text-[11px] text-slate-400">per month</span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">Rice (~60%)</span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {entitlement.riceKg} kg
            </div>
            <span className="text-[11px] text-slate-400">₹{entitlement.riceRate}/kg</span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">Wheat (~40%)</span>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {entitlement.wheatKg} kg
            </div>
            <span className="text-[11px] text-slate-400">₹{entitlement.wheatRate}/kg</span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">Statutory Price</span>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              ₹{entitlement.statutoryCost}
            </div>
            <span className="text-[11px] text-slate-400">{scheme === 'PMGKAY_FREE' ? 'Free (Govt scheme)' : 'CIP capped'}</span>
          </div>
        </div>
      </div>

      {/* Actual Distribution Audit Inputs */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-indigo-500" />
          Actual Distribution at Fair Price Shop
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nfsa-actual-delivered-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Actual Grain Handed Over (kg)
            </label>
            <input
              id="nfsa-actual-delivered-input"
              type="number"
              step="0.5"
              min="0"
              value={actualDeliveredKg}
              onChange={(e) => setActualDeliveredKg(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100"
              placeholder="e.g. 18"
            />
          </div>

          <div>
            <label htmlFor="nfsa-actual-charged-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Actual Amount Paid to Dealer (₹)
            </label>
            <input
              id="nfsa-actual-charged-input"
              type="number"
              step="1"
              min="0"
              value={actualChargedRupees}
              onChange={(e) => setActualChargedRupees(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100"
              placeholder="e.g. 50"
            />
          </div>
        </div>
      </div>

      {/* Audit Verdict Banner */}
      {audit.isCompliant ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <h5 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              Statutory Quota Distribution Compliant
            </h5>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
              Full statutory entitlement of {entitlement.totalGrainKg} kg delivered at the statutory price of ₹{entitlement.statutoryCost}.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Statutory Violations Detected
              </h5>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                Distribution at the Fair Price Shop breaches Section 3 of NFSA 2013 and Clause 10 of the TPDS (Control) Order 2015.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            {audit.hasWeighmentDeficit && (
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-rose-300 dark:border-rose-900">
                <span className="font-semibold text-rose-800 dark:text-rose-300">
                  Short-Weighing / Cut in Quantity:
                </span>
                <p className="text-slate-700 dark:text-slate-300 mt-1">
                  Deficit of <strong className="text-rose-600">{audit.deficitKg} kg</strong> ({audit.deficitPercentage}% deficit from statutory {entitlement.totalGrainKg} kg).
                </p>
              </div>
            )}
            {audit.hasOvercharging && (
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-rose-300 dark:border-rose-900">
                <span className="font-semibold text-rose-800 dark:text-rose-300">
                  Illegal Price Overcharge / Extortion:
                </span>
                <p className="text-slate-700 dark:text-slate-300 mt-1">
                  Charged <strong className="text-rose-600">₹{audit.actualChargedRupees}</strong> (Illegal excess: ₹{audit.overchargeRupees} over statutory ₹{audit.expectedCost}).
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          Record Audit in Vault
        </button>
      </div>
    </div>
  );
}

